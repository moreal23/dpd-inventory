import { TONER_STATUSES } from "./config.js";
import { appendAudit } from "./core.js";
import { allRows, allowValue, csvResponse, json, normalizeText, readJson } from "./utils.js";

export async function listToner(env) {
  const rows = await allRows(
    env,
    `SELECT id, serial, color, model, printer_asset, location, status, notes, updated_at
     FROM toner
     ORDER BY color ASC, status ASC, id DESC`
  );
  return json(rows);
}

export async function createToner(request, env, user) {
  const body = await readJson(request);
  const toner = normalizeTonerPayload(body);
  const error = validateToner(toner);
  if (error) {
    return json({ error }, 400);
  }

  const duplicate = await env.DB.prepare(`SELECT id FROM toner WHERE serial = ?`).bind(toner.serial).first();
  if (duplicate) {
    return json({ error: "Toner serial already exists." }, 409);
  }

  await env.DB.prepare(
    `INSERT INTO toner (
      serial, color, model, printer_asset, location, status, notes, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).bind(
    toner.serial,
    toner.color,
    toner.model,
    toner.printer_asset,
    toner.location,
    toner.status,
    toner.notes,
  ).run();

  await appendAudit(env, user, "TONER_CREATED", `${toner.serial} created`);
  return json({ success: true }, 201);
}

export async function updateToner(id, request, env, user) {
  const existing = await env.DB.prepare(`SELECT id FROM toner WHERE id = ?`).bind(id).first();
  if (!existing) {
    return json({ error: "Toner record not found." }, 404);
  }

  const body = await readJson(request);
  const toner = normalizeTonerPayload(body);
  const error = validateToner(toner);
  if (error) {
    return json({ error }, 400);
  }

  const duplicate = await env.DB.prepare(`SELECT id FROM toner WHERE serial = ? AND id <> ?`).bind(toner.serial, id).first();
  if (duplicate) {
    return json({ error: "Toner serial already exists." }, 409);
  }

  await env.DB.prepare(
    `UPDATE toner
     SET serial = ?, color = ?, model = ?, printer_asset = ?, location = ?, status = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    toner.serial,
    toner.color,
    toner.model,
    toner.printer_asset,
    toner.location,
    toner.status,
    toner.notes,
    id,
  ).run();

  await appendAudit(env, user, "TONER_UPDATED", `${toner.serial} updated`);
  return json({ success: true });
}

export async function deleteToner(id, env, user) {
  const record = await env.DB.prepare(`SELECT serial FROM toner WHERE id = ?`).bind(id).first();
  if (!record) {
    return json({ error: "Toner record not found." }, 404);
  }

  await env.DB.prepare(`DELETE FROM toner WHERE id = ?`).bind(id).run();
  await appendAudit(env, user, "TONER_DELETED", `${record.serial} deleted`);
  return json({ success: true });
}

export async function exportTonerCsv(env) {
  const rows = await allRows(
    env,
    `SELECT id, serial, color, model, printer_asset, location, status, notes, created_at, updated_at
     FROM toner
     ORDER BY id ASC`
  );

  return csvResponse("toner_export.csv", rows, [
    "id", "serial", "color", "model", "printer_asset", "location", "status", "notes", "created_at", "updated_at",
  ]);
}

function normalizeTonerPayload(payload) {
  return {
    serial: normalizeText(payload.serial),
    color: normalizeText(payload.color),
    model: normalizeText(payload.model),
    printer_asset: normalizeText(payload.printer_asset),
    location: normalizeText(payload.location),
    status: allowValue(normalizeText(payload.status), TONER_STATUSES, "In Stock"),
    notes: normalizeText(payload.notes),
  };
}

function validateToner(toner) {
  if (!toner.serial || !toner.color) {
    return "Serial and color are required.";
  }
  return null;
}
