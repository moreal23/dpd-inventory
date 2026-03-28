import { encoder, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./config.js";
import { fromBase64Url, json, readCookie, timingSafeEqual, toBase64Url } from "./utils.js";

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 200000;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return [iterations, toBase64Url(salt), toBase64Url(new Uint8Array(bits))].join(":");
}

export async function verifyPassword(password, storedValue) {
  if (!storedValue) {
    return false;
  }

  const [iterationsText, saltText, hashText] = String(storedValue).split(":");
  const iterations = Number.parseInt(iterationsText, 10);
  if (!iterations || !saltText || !hashText) {
    return false;
  }

  const salt = fromBase64Url(saltText);
  const expected = fromBase64Url(hashText);
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    expected.length * 8,
  );

  return timingSafeEqual(new Uint8Array(bits), expected);
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function issueSession(env, userId) {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = toBase64Url(raw);
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare(
    `INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, datetime('now'), datetime('now', ?))`
  ).bind(userId, tokenHash, `+${SESSION_TTL_SECONDS} seconds`).run();
  return token;
}

function cookieSecureFlag(request) {
  try {
    const protocol = new URL(request.url).protocol;
    return protocol === "https:" ? " Secure" : "";
  } catch {
    return "";
  }
}

export function buildSessionCookie(token, request) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${cookieSecureFlag(request)} SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(request) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly;${cookieSecureFlag(request)} SameSite=Lax; Max-Age=0`;
}

export async function getSession(request, env) {
  const token = readCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, u.id, u.username, u.role, u.full_name, u.title, u.phone, u.badge_number, u.avatar_data
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at >= datetime('now')`
  ).bind(tokenHash).first();

  if (!row) {
    return null;
  }

  return {
    id: row.session_id,
    user: {
      id: row.id,
      username: row.username,
      role: row.role,
      full_name: row.full_name || "",
      title: row.title || "",
      phone: row.phone || "",
      badge_number: row.badge_number || "",
      avatar_data: row.avatar_data || "",
    },
  };
}

export async function requireUser(request, env) {
  const session = await getSession(request, env);
  if (!session) {
    return json({ error: "Authentication required." }, 401);
  }
  return session;
}

export async function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    return json({ error: "Admin only." }, 403);
  }
  return true;
}
