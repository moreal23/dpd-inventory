import { appendAudit } from "./core.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { json, normalizeText, readJson } from "./utils.js";

export async function getProfile(env, user) {
  const profile = await env.DB.prepare(
    `SELECT id, username, role, full_name, title, phone, badge_number, avatar_data, created_at, updated_at
     FROM users
     WHERE id = ?`
  ).bind(user.id).first();

  if (!profile) {
    return json({ error: "User not found." }, 404);
  }

  return json({ profile });
}

export async function updateProfile(request, env, user) {
  const body = await readJson(request);
  const fullName = normalizeText(body.full_name);
  const title = normalizeText(body.title);
  const phone = normalizeText(body.phone);
  const badgeNumber = normalizeText(body.badge_number);
  const avatarData = typeof body.avatar_data === "string" ? body.avatar_data.trim() : "";

  await env.DB.prepare(
    `UPDATE users
     SET full_name = ?, title = ?, phone = ?, badge_number = ?, avatar_data = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(fullName, title, phone, badgeNumber, avatarData, user.id).run();

  await appendAudit(env, user, "PROFILE_UPDATED", `${user.username} updated profile settings`);

  const updated = await env.DB.prepare(
    `SELECT id, username, role, full_name, title, phone, badge_number, avatar_data, created_at, updated_at
     FROM users
     WHERE id = ?`
  ).bind(user.id).first();

  return json({
    success: true,
    profile: updated,
    user: {
      id: updated.id,
      username: updated.username,
      role: updated.role,
      full_name: updated.full_name,
      title: updated.title,
      phone: updated.phone,
      badge_number: updated.badge_number,
      avatar_data: updated.avatar_data || "",
    },
  });
}

export async function changeOwnPassword(request, env, session) {
  const body = await readJson(request);
  const currentPassword = String(body.current_password || "").trim();
  const newPassword = String(body.new_password || "").trim();

  if (!currentPassword || !newPassword) {
    return json({ error: "Current password and new password are required." }, 400);
  }
  if (newPassword.length < 10) {
    return json({ error: "New password must be at least 10 characters." }, 400);
  }

  const existing = await env.DB.prepare(
    `SELECT username, password_hash
     FROM users
     WHERE id = ?`
  ).bind(session.user.id).first();

  if (!existing) {
    return json({ error: "User not found." }, 404);
  }
  if (!(await verifyPassword(currentPassword, existing.password_hash))) {
    return json({ error: "Current password is incorrect." }, 401);
  }

  await env.DB.prepare(
    `UPDATE users
     SET password_hash = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(await hashPassword(newPassword), session.user.id).run();

  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ? AND id <> ?`).bind(session.user.id, session.id).run();
  await appendAudit(env, session.user, "PASSWORD_CHANGED", `${existing.username} changed their own password`);
  return json({ success: true });
}
