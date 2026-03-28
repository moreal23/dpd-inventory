import { DEVICE_TYPES } from "./config.js";
import { appendAudit, computeStats } from "./core.js";
import { allRows, allowValue, clampInt, csvResponse, isoNow, json, normalizeHeader, normalizeText, parseCsv, readJson } from "./utils.js";

export async function getDashboard(env) {
  const stats = await computeStats(env);
  const recent = await allRows(
    env,
    `SELECT asset_tag, serial, action, assigned_to, technician, timestamp
     FROM history
     ORDER BY id DESC
     LIMIT 12`
  );
  return json({ stats, recent });
}

export async function getStats(env) {
  return json(await computeStats(env));
}

export async function listDevices(url, env) {
  const page = clampInt(url.searchParams.get("page"), 0, 0, 100000);
  const perPage = clampInt(url.searchParams.get("per_page"), 50, 1, 250);
  const search = normalizeText(url.searchParams.get("search"));
  const type = normalizeText(url.searchParams.get("type"));
  const status = normalizeText(url.searchParams.get("status"));
  const sort = allowValue(url.searchParams.get("sort"), [
    "id", "asset_tag", "serial", "type", "model", "status", "assigned_to", "department", "location", "updated_at",
  ], "updated_at");
  const direction = allowValue((url.searchParams.get("dir") || "DESC").toUpperCase(), ["ASC", "DESC"], "DESC");

  const where = [];
  const params = [];

  if (search) {
    where.push(`(
      asset_tag LIKE ? OR serial LIKE ? OR type LIKE ? OR model LIKE ? OR
      status LIKE ? OR assigned_to LIKE ? OR department LIKE ? OR location LIKE ? OR notes LIKE ?
    )`);
    const like = `%${search}%`;
    for (let i = 0; i < 9; i += 1) {
      params.push(like);
    }
  }

  if (type && DEVICE_TYPES.includes(type)) {
    where.push("type = ?");
    params.push(type);
  }

  if (status && ["In Stock", "Deployed"].includes(status)) {
    where.push("status = ?");
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS count FROM devices ${whereSql}`).bind(...params).first();
  const rows = await env.DB.prepare(
    `SELECT id, asset_tag, serial, type, model, status, assigned_to, department, location, notes, created_at, updated_at
     FROM devices
     ${whereSql}
     ORDER BY ${sort} ${direction}, id DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, perPage, page * perPage).all();

  return json({
    total: Number(totalRow?.count || 0),
    page,
    per_page: perPage,
    devices: rows.results || [],
  });
}

export async function createDevice(request, env, user) {
  const body = await readJson(request);
  const device = normalizeDevicePayload(body);
  const error = validateDevice(device);
  if (error) {
    return json({ error }, 400);
  }

  const duplicate = await env.DB.prepare(`SELECT id FROM devices WHERE asset_tag = ? OR serial = ?`).bind(device.asset_tag, device.serial).first();
  if (duplicate) {
    return json({ error: "Asset tag or serial already exists." }, 409);
  }

  await env.DB.prepare(
    `INSERT INTO devices (
      asset_tag, serial, type, model, status, assigned_to, department, notes, location, created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'In Stock', '', ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(
    device.asset_tag,
    device.serial,
    device.type,
    device.model,
    device.department,
    device.notes,
    device.location,
  ).run();

  await appendAudit(env, user, "DEVICE_CREATED", `${device.asset_tag} created`);
  return json({ success: true }, 201);
}

export async function updateDevice(id, request, env, user) {
  const existing = await env.DB.prepare(`SELECT id FROM devices WHERE id = ?`).bind(id).first();
  if (!existing) {
    return json({ error: "Device not found." }, 404);
  }

  const body = await readJson(request);
  const device = normalizeDevicePayload(body);
  const error = validateDevice(device);
  if (error) {
    return json({ error }, 400);
  }

  const duplicate = await env.DB.prepare(`SELECT id FROM devices WHERE (asset_tag = ? OR serial = ?) AND id <> ?`).bind(device.asset_tag, device.serial, id).first();
  if (duplicate) {
    return json({ error: "Asset tag or serial already exists." }, 409);
  }

  await env.DB.prepare(
    `UPDATE devices
     SET asset_tag = ?, serial = ?, type = ?, model = ?, department = ?, notes = ?, location = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    device.asset_tag,
    device.serial,
    device.type,
    device.model,
    device.department,
    device.notes,
    device.location,
    id,
  ).run();

  await appendAudit(env, user, "DEVICE_UPDATED", `${device.asset_tag} updated`);
  return json({ success: true });
}

export async function deleteDevice(id, env, user) {
  const device = await env.DB.prepare(`SELECT asset_tag FROM devices WHERE id = ?`).bind(id).first();
  if (!device) {
    return json({ error: "Device not found." }, 404);
  }

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM history WHERE asset_tag = ?`).bind(device.asset_tag),
    env.DB.prepare(`DELETE FROM devices WHERE id = ?`).bind(id),
  ]);

  await appendAudit(env, user, "DEVICE_DELETED", `${device.asset_tag} deleted`);
  return json({ success: true });
}

export async function getDeviceHistory(id, env) {
  const device = await env.DB.prepare(`SELECT asset_tag FROM devices WHERE id = ?`).bind(id).first();
  if (!device) {
    return json([]);
  }

  const rows = await allRows(
    env,
    `SELECT action, assigned_to, technician, timestamp
     FROM history
     WHERE asset_tag = ?
     ORDER BY id DESC`,
    [device.asset_tag],
  );

  return json(rows);
}

export async function deployDevice(request, env, user) {
  const body = await readJson(request);
  const code = normalizeText(body.code);
  const assignedTo = normalizeText(body.assigned_to);

  if (!code || !assignedTo) {
    return json({ error: "Asset tag or serial, plus assigned person, are required." }, 400);
  }

  const device = await env.DB.prepare(
    `SELECT id, asset_tag, serial, status
     FROM devices
     WHERE asset_tag = ? OR serial = ?`
  ).bind(code, code).first();

  if (!device) {
    return json({ error: `No device found for '${code}'.` }, 404);
  }
  if (device.status === "Deployed") {
    return json({ error: "Device is already deployed." }, 409);
  }

  const timestamp = isoNow();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE devices
       SET status = 'Deployed', assigned_to = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(assignedTo, device.id),
    env.DB.prepare(
      `INSERT INTO history (asset_tag, serial, action, assigned_to, technician, timestamp, actor_user_id)
       VALUES (?, ?, 'DEPLOYED', ?, ?, ?, ?)`
    ).bind(device.asset_tag, device.serial, assignedTo, user.username, timestamp, user.id),
  ]);

  return json({ success: true, asset_tag: device.asset_tag });
}

export async function returnDevice(request, env, user) {
  const body = await readJson(request);
  const code = normalizeText(body.code);

  if (!code) {
    return json({ error: "Asset tag or serial is required." }, 400);
  }

  const device = await env.DB.prepare(
    `SELECT id, asset_tag, serial, status
     FROM devices
     WHERE asset_tag = ? OR serial = ?`
  ).bind(code, code).first();

  if (!device) {
    return json({ error: `No device found for '${code}'.` }, 404);
  }
  if (device.status === "In Stock") {
    return json({ error: "Device is already in stock." }, 409);
  }

  const timestamp = isoNow();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE devices
       SET status = 'In Stock', assigned_to = '', updated_at = datetime('now')
       WHERE id = ?`
    ).bind(device.id),
    env.DB.prepare(
      `INSERT INTO history (asset_tag, serial, action, assigned_to, technician, timestamp, actor_user_id)
       VALUES (?, ?, 'RETURNED', '', ?, ?, ?)`
    ).bind(device.asset_tag, device.serial, user.username, timestamp, user.id),
  ]);

  return json({ success: true, asset_tag: device.asset_tag });
}

export async function importDevicesCsv(request, env, user) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: "Upload a CSV file under the field name 'file'." }, 400);
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (!rows.length) {
    return json({ error: "The CSV file is empty." }, 400);
  }

  const headers = rows[0].map((value) => normalizeHeader(value));
  const records = rows.slice(1).filter((row) => row.some((value) => normalizeText(value)));

  let added = 0;
  let skipped = 0;
  const errors = [];

  for (const rawRow of records) {
    const record = Object.fromEntries(headers.map((header, index) => [header, rawRow[index] ?? ""]));
    const device = normalizeDevicePayload(record);
    const error = validateDevice(device);

    if (error) {
      skipped += 1;
      if (errors.length < 5) {
        errors.push(error);
      }
      continue;
    }

    const duplicate = await env.DB.prepare(`SELECT id FROM devices WHERE asset_tag = ? OR serial = ?`).bind(device.asset_tag, device.serial).first();
    if (duplicate) {
      skipped += 1;
      continue;
    }

    await env.DB.prepare(
      `INSERT INTO devices (
        asset_tag, serial, type, model, status, assigned_to, department, notes, location, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 'In Stock', '', ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      device.asset_tag,
      device.serial,
      device.type,
      device.model,
      device.department,
      device.notes,
      device.location,
    ).run();

    added += 1;
  }

  await appendAudit(env, user, "CSV_IMPORT", `${added} devices imported`);
  return json({ success: true, added, skipped, errors });
}

export async function exportDevicesCsv(env) {
  const rows = await allRows(
    env,
    `SELECT id, asset_tag, serial, type, model, status, assigned_to, department, location, notes, created_at, updated_at
     FROM devices
     ORDER BY id ASC`
  );

  return csvResponse("devices_export.csv", rows, [
    "id", "asset_tag", "serial", "type", "model", "status", "assigned_to", "department", "location", "notes", "created_at", "updated_at",
  ]);
}

function normalizeDevicePayload(payload) {
  return {
    asset_tag: normalizeText(payload.asset_tag),
    serial: normalizeText(payload.serial),
    type: normalizeText(payload.type),
    model: normalizeText(payload.model),
    department: normalizeText(payload.department),
    notes: normalizeText(payload.notes),
    location: normalizeText(payload.location),
  };
}

function validateDevice(device) {
  if (!device.asset_tag || !device.serial || !device.type) {
    return "Asset tag, serial, and type are required.";
  }
  if (!DEVICE_TYPES.includes(device.type)) {
    return `Type must be one of: ${DEVICE_TYPES.join(", ")}.`;
  }
  return null;
}
