# DPD Inventory

Cloudflare-native inventory system for DPD IT, rebuilt from the older DA version with a React + Material UI frontend and a Cloudflare Worker + D1 backend.

## Highlights

- Real page routes for dashboard, inventory, deploy, return, toner, history, reports, import, alerts, users, and settings
- React frontend with Material UI, responsive layout, charts, profile settings, and avatar upload
- Excel and CSV import/export support for inventory workflows
- Low-stock dashboard alerts, deploy/return history, and technician reporting
- Secure auth flow with first-run admin bootstrap and hashed passwords

## Tech Stack

- Cloudflare Workers
- Cloudflare D1
- React
- Material UI
- React Router
- Recharts
- `xlsx`

## Project Structure

- `src/` Worker routes and app logic
- `src/client/` React frontend source
- `public/` built frontend assets served by the Worker
- `migrations/` D1 schema migrations
- `tools/` helper scripts for builds, migration, and demo seeding
- `docs/` project notes and migration references

## Local Setup

1. Install Node.js 20+ and Python 3.
2. From this folder run `npm install`.
3. Confirm the D1 binding in `wrangler.jsonc`.
4. Apply migrations:
   - `npm run db:apply`
5. Seed local demo data:
   - `npm run db:seed`
6. Start the local app:
   - `npm run dev`

## Demo Data

`npm run db:seed` repopulates the local D1 database with:

- 36 inventory items across laptops, desktops, monitors, TVs, docks, and printers
- 18 toner records across black, cyan, magenta, and yellow
- deploy/return history for charts and tables
- low-stock thresholds for dashboard alert testing

The seed script only targets the local D1 database under `.wrangler/` and preserves existing users and sessions.

## Deploy

1. Run `npm run build`.
2. Run `npm run deploy`.
3. Apply remote migrations when needed:
   - `npm run db:apply:remote`

## GitHub

This folder is intended to be the source of truth for the `moreal23/dpd-inventory` repository.

Typical publish flow:

1. `git init -b main`
2. `git remote add origin https://github.com/moreal23/dpd-inventory.git`
3. `git add .`
4. `git commit -m "Rebuild DPD inventory as Cloudflare-native app"`
5. `git push -u origin main --force`

Use `--force` only when you intentionally want to replace the old repository contents with this app.
