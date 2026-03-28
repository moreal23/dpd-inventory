import { DEVICE_TYPES } from "./config.js";
import { allRows } from "./utils.js";

export async function seedDefaults(env) {
  const statements = DEVICE_TYPES.map((type) =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO low_stock_alerts (device_type, threshold, created_at, updated_at)
       VALUES (?, 5, datetime('now'), datetime('now'))`
    ).bind(type),
  );
  await env.DB.batch(statements);
  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();
}

export async function userCount(env) {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS count FROM users`).first();
  return Number(row?.count || 0);
}

export async function appendAudit(env, actor, action, summary) {
  await env.DB.prepare(
    `INSERT INTO audit_log (actor_user_id, actor_username, action, summary, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).bind(actor.id, actor.username, action, summary).run();
}

export async function computeStats(env) {
  const deviceCounts = await allRows(env, `SELECT type, COUNT(*) AS count FROM devices GROUP BY type`);
  const statusCounts = await allRows(env, `SELECT status, COUNT(*) AS count FROM devices GROUP BY status`);
  const tonerCounts = await allRows(env, `SELECT status, COUNT(*) AS count FROM toner GROUP BY status`);
  const alertRows = await allRows(
    env,
    `SELECT a.device_type, a.threshold,
            COALESCE((SELECT COUNT(*) FROM devices d WHERE d.type = a.device_type AND d.status = 'In Stock'), 0) AS current_stock
     FROM low_stock_alerts a
     ORDER BY a.device_type`
  );

  const stats = {
    total: 0,
    instock: 0,
    deployed: 0,
    toner_total: 0,
    toner_instock: 0,
    alerts: [],
  };

  for (const type of DEVICE_TYPES) {
    stats[type.toLowerCase()] = 0;
  }

  for (const row of deviceCounts) {
    stats.total += Number(row.count || 0);
    stats[String(row.type || "").toLowerCase()] = Number(row.count || 0);
  }

  for (const row of statusCounts) {
    if (row.status === "In Stock") {
      stats.instock = Number(row.count || 0);
    }
    if (row.status === "Deployed") {
      stats.deployed = Number(row.count || 0);
    }
  }

  for (const row of tonerCounts) {
    stats.toner_total += Number(row.count || 0);
    if (row.status === "In Stock") {
      stats.toner_instock = Number(row.count || 0);
    }
  }

  stats.alerts = alertRows
    .map((row) => ({
      type: row.device_type,
      threshold: Number(row.threshold || 0),
      count: Number(row.current_stock || 0),
    }))
    .filter((row) => row.count <= row.threshold);

  return stats;
}
