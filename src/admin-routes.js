import { DEVICE_TYPES } from "./config.js";
import { appendAudit } from "./core.js";
import { allRows, clampInt, json, normalizeText, readJson } from "./utils.js";
import { hashPassword } from "./auth.js";

export async function getHistory(url, env) {
  const limit = clampInt(url.searchParams.get("limit"), 100, 1, 500);
  const rows = await allRows(
    env,
    `SELECT asset_tag, serial, action, assigned_to, technician, timestamp
     FROM history
     ORDER BY id DESC
     LIMIT ?`,
    [limit],
  );
  return json(rows);
}

export async function getTechnicianReport(env) {
  const rows = await allRows(
    env,
    `SELECT technician,
            COUNT(*) AS total_actions,
            SUM(CASE WHEN action = 'DEPLOYED' THEN 1 ELSE 0 END) AS deployed,
            SUM(CASE WHEN action = 'RETURNED' THEN 1 ELSE 0 END) AS returned,
            MAX(timestamp) AS last_action
     FROM history
     GROUP BY technician
     ORDER BY total_actions DESC, technician ASC`
  );
  return json(rows);
}

export async function listAlerts(env) {
  const rows = await allRows(
    env,
    `SELECT a.id, a.device_type, a.threshold,
            COALESCE((SELECT COUNT(*) FROM devices d WHERE d.type = a.device_type AND d.status = 'In Stock'), 0) AS current_stock
     FROM low_stock_alerts a
     ORDER BY a.device_type`
  );

  return json(rows.map((row) => ({
    ...row,
    threshold: Number(row.threshold || 0),
    current_stock: Number(row.current_stock || 0),
    alert: Number(row.current_stock || 0) <= Number(row.threshold || 0),
  })));
}

export async function updateAlert(deviceType, request, env) {
  if (!DEVICE_TYPES.includes(deviceType)) {
    return json({ error: "Invalid device type." }, 400);
  }

  const body = await readJson(request);
  const threshold = clampInt(body.threshold, 5, 1, 9999);
  await env.DB.prepare(`UPDATE low_stock_alerts SET threshold = ?, updated_at = datetime('now') WHERE device_type = ?`).bind(threshold, deviceType).run();
  return json({ success: true });
}

export async function listUsers(env) {
  const rows = await allRows(
    env,
    `SELECT id, username, role, full_name, title, phone, badge_number, avatar_data, created_at, updated_at
     FROM users
     ORDER BY username ASC`
  );
  return json(rows);
}

export async function createUser(request, env, actor) {
  const body = await readJson(request);
  const username = normalizeText(body.username);
  const password = String(body.password || "").trim();
  const role = body.role === "admin" ? "admin" : "technician";

  if (!username || password.length < 10) {
    return json({ error: "Username is required and password must be at least 10 characters." }, 400);
  }

  const duplicate = await env.DB.prepare(`SELECT id FROM users WHERE username = ?`).bind(username).first();
  if (duplicate) {
    return json({ error: "Username already exists." }, 409);
  }

  await env.DB.prepare(
    `INSERT INTO users (username, password_hash, role, full_name, title, phone, badge_number, avatar_data, created_at, updated_at)
     VALUES (?, ?, ?, '', '', '', '', '', datetime('now'), datetime('now'))`
  ).bind(username, await hashPassword(password), role).run();

  await appendAudit(env, actor, "USER_CREATED", `${username} created`);
  return json({ success: true }, 201);
}

export async function changePassword(id, request, env, actor) {
  const body = await readJson(request);
  const password = String(body.password || "").trim();

  if (password.length < 10) {
    return json({ error: "Password must be at least 10 characters." }, 400);
  }

  const existing = await env.DB.prepare(`SELECT username FROM users WHERE id = ?`).bind(id).first();
  if (!existing) {
    return json({ error: "User not found." }, 404);
  }

  await env.DB.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).bind(await hashPassword(password), id).run();
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id).run();

  await appendAudit(env, actor, "PASSWORD_CHANGED", `${existing.username} password rotated`);
  return json({ success: true });
}

export async function deleteUser(id, env, actor) {
  const existing = await env.DB.prepare(`SELECT username FROM users WHERE id = ?`).bind(id).first();
  if (!existing) {
    return json({ error: "User not found." }, 404);
  }
  if (existing.username === actor.username) {
    return json({ error: "You cannot delete your own account." }, 400);
  }

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id),
  ]);

  await appendAudit(env, actor, "USER_DELETED", `${existing.username} deleted`);
  return json({ success: true });
}
