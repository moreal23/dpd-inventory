import { buildSessionCookie, clearSessionCookie, getSession, hashPassword, issueSession, sha256Hex, verifyPassword } from "./auth.js";
import { userCount } from "./core.js";
import { json, normalizeText, readJson } from "./utils.js";

export async function getBootstrapStatus(env) {
  return json({ bootstrapRequired: (await userCount(env)) === 0 });
}

export async function bootstrapAdmin(request, env) {
  if ((await userCount(env)) > 0) {
    return json({ error: "Bootstrap already completed." }, 409);
  }

  const body = await readJson(request);
  const username = normalizeText(body.username);
  const password = String(body.password || "").trim();

  if (!username || password.length < 10) {
    return json({ error: "Username is required and password must be at least 10 characters." }, 400);
  }

  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    `INSERT INTO users (username, password_hash, role, full_name, title, phone, badge_number, avatar_data, created_at, updated_at)
     VALUES (?, ?, 'admin', '', '', '', '', '', datetime('now'), datetime('now'))`
  ).bind(username, passwordHash).run();

  return json({ success: true, message: "Initial admin created. You can now sign in." }, 201);
}

export async function login(request, env) {
  const body = await readJson(request);
  const username = normalizeText(body.username);
  const password = String(body.password || "").trim();

  if (!username || !password) {
    return json({ error: "Username and password are required." }, 400);
  }

  const user = await env.DB.prepare(
    `SELECT id, username, password_hash, role, full_name, title, phone, badge_number, avatar_data
     FROM users
     WHERE username = ?`
  ).bind(username).first();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json({ error: "Invalid username or password." }, 401);
  }

  const token = await issueSession(env, user.id);
  const headers = new Headers();
  headers.append("Set-Cookie", buildSessionCookie(token, request));
  return json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name || "",
      title: user.title || "",
      phone: user.phone || "",
      badge_number: user.badge_number || "",
      avatar_data: user.avatar_data || "",
    },
  }, 200, headers);
}

export async function logout(request, env) {
  const cookieHeader = request.headers.get("Cookie");
  const match = cookieHeader?.match(/(?:^|;\s*)dpd_session=([^;]+)/);
  if (match?.[1]) {
    const tokenHash = await sha256Hex(match[1]);
    await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
  }

  const headers = new Headers();
  headers.append("Set-Cookie", clearSessionCookie(request));
  return json({ success: true }, 200, headers);
}

export async function getSessionRoute(request, env) {
  const session = await getSession(request, env);
  return json({ authenticated: Boolean(session), user: session?.user ?? null });
}
