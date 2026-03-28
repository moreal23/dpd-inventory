import { requireAdmin, requireUser } from "./auth.js";
import { seedDefaults } from "./core.js";
import {
  createDevice,
  deleteDevice,
  deployDevice,
  exportDevicesCsv,
  getDashboard,
  getDeviceHistory,
  getStats,
  importDevicesCsv,
  listDevices,
  returnDevice,
  updateDevice,
} from "./device-routes.js";
import { json, corsHeaders } from "./utils.js";
import {
  bootstrapAdmin,
  getBootstrapStatus,
  getSessionRoute,
  login,
  logout,
} from "./session-routes.js";
import {
  changeOwnPassword,
  getProfile,
  updateProfile,
} from "./profile-routes.js";
import {
  changePassword,
  createUser,
  deleteUser,
  getHistory,
  getTechnicianReport,
  listAlerts,
  listUsers,
  updateAlert,
} from "./admin-routes.js";
import {
  createToner,
  deleteToner,
  exportTonerCsv,
  listToner,
  updateToner,
} from "./toner-routes.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      if (url.pathname.startsWith("/api/")) {
        await seedDefaults(env);
        return await routeApi(request, env, url);
      }

      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404 || request.method !== "GET") {
          return assetResponse;
        }

        const accept = request.headers.get("Accept") || "";
        if (accept.includes("text/html")) {
          const fallbackUrl = new URL(request.url);
          fallbackUrl.pathname = "/index.html";
          return env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
        }

        return assetResponse;
      }

      return new Response("Cloudflare asset binding is missing.", { status: 500 });
    } catch (error) {
      console.error("Worker error", error);
      return json({ error: "Unexpected server error", detail: error?.message || String(error) }, 500);
    }
  },
};

async function routeApi(request, env, url) {
  const method = request.method.toUpperCase();
  const { pathname } = url;

  if (pathname === "/api/health" && method === "GET") return json({ ok: true, runtime: "cloudflare-workers", time: new Date().toISOString() });
  if (pathname === "/api/bootstrap/status" && method === "GET") return getBootstrapStatus(env);
  if (pathname === "/api/bootstrap" && method === "POST") return bootstrapAdmin(request, env);
  if (pathname === "/api/auth/login" && method === "POST") return login(request, env);
  if (pathname === "/api/auth/logout" && method === "POST") return logout(request, env);
  if (pathname === "/api/session" && method === "GET") return getSessionRoute(request, env);

  const session = await requireUser(request, env);
  if (session instanceof Response) {
    return session;
  }

  if (pathname === "/api/dashboard" && method === "GET") return getDashboard(env);
  if (pathname === "/api/stats" && method === "GET") return getStats(env);
  if (pathname === "/api/history" && method === "GET") return getHistory(url, env);
  if (pathname === "/api/reports/technicians" && method === "GET") return getTechnicianReport(env);
  if (pathname === "/api/profile" && method === "GET") return getProfile(env, session.user);
  if (pathname === "/api/profile" && method === "PUT") return updateProfile(request, env, session.user);
  if (pathname === "/api/profile/password" && method === "PUT") return changeOwnPassword(request, env, session);

  if (pathname === "/api/devices" && method === "GET") return listDevices(url, env);
  if (pathname === "/api/devices" && method === "POST") return createDevice(request, env, session.user);
  if (pathname === "/api/devices/deploy" && method === "POST") return deployDevice(request, env, session.user);
  if (pathname === "/api/devices/return" && method === "POST") return returnDevice(request, env, session.user);
  if (pathname === "/api/import/devices.csv" && method === "POST") return importDevicesCsv(request, env, session.user);
  if (pathname === "/api/export/devices.csv" && method === "GET") return exportDevicesCsv(env);

  const deviceMatch = pathname.match(/^\/api\/devices\/(\d+)$/);
  if (deviceMatch && method === "PUT") return updateDevice(Number(deviceMatch[1]), request, env, session.user);
  if (deviceMatch && method === "DELETE") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return deleteDevice(Number(deviceMatch[1]), env, session.user);
  }

  const deviceHistoryMatch = pathname.match(/^\/api\/devices\/(\d+)\/history$/);
  if (deviceHistoryMatch && method === "GET") return getDeviceHistory(Number(deviceHistoryMatch[1]), env);

  if (pathname === "/api/toner" && method === "GET") return listToner(env);
  if (pathname === "/api/toner" && method === "POST") return createToner(request, env, session.user);
  if (pathname === "/api/export/toner.csv" && method === "GET") return exportTonerCsv(env);

  const tonerMatch = pathname.match(/^\/api\/toner\/(\d+)$/);
  if (tonerMatch && method === "PUT") return updateToner(Number(tonerMatch[1]), request, env, session.user);
  if (tonerMatch && method === "DELETE") return deleteToner(Number(tonerMatch[1]), env, session.user);

  if (pathname === "/api/alerts" && method === "GET") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return listAlerts(env);
  }
  if (pathname === "/api/users" && method === "GET") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return listUsers(env);
  }
  if (pathname === "/api/users" && method === "POST") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return createUser(request, env, session.user);
  }

  const alertMatch = pathname.match(/^\/api\/alerts\/([^/]+)$/);
  if (alertMatch && method === "PUT") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return updateAlert(decodeURIComponent(alertMatch[1]), request, env);
  }

  const passwordMatch = pathname.match(/^\/api\/users\/(\d+)\/password$/);
  if (passwordMatch && method === "PUT") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return changePassword(Number(passwordMatch[1]), request, env, session.user);
  }

  const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
  if (userMatch && method === "DELETE") {
    const admin = await requireAdmin(session.user);
    if (admin instanceof Response) return admin;
    return deleteUser(Number(userMatch[1]), env, session.user);
  }

  return json({ error: `Route not found: ${method} ${pathname}` }, 404);
}
