# Migration From Flask To Cloudflare-Native

## Scope

The original app stores data in a local SQLite file and keeps passwords in plaintext. The Cloudflare-native version intentionally changes that model.

## Data We Should Migrate

Safe to migrate directly:

- devices
- toner
- low stock alerts
- history

Do not migrate directly:

- technician passwords
- Flask sessions
- backup `.db` copies

## Recommended Migration Order

1. Create the D1 database.
2. Apply the new schema in `migrations/0001_initial.sql`.
3. Bootstrap the first admin account in the new UI.
4. Export legacy CSV files:
   - `python tools/export_legacy_data.py`
5. Import `devices.csv` through the new UI.
6. Load `toner.csv`, `history.csv`, and `low_stock_alerts.csv` with one-off SQL or a temporary import worker.
7. Recreate users manually with fresh passwords.
8. Validate inventory counts and deploy/return history totals.

## Why Users Are Recreated

The old app stores passwords in plaintext. This rewrite stores PBKDF2 password hashes, so copying passwords over as-is would preserve the old security problem.

## Suggested Validation Checklist

- Device total matches the legacy app
- In Stock count matches
- Deployed count matches
- Toner total matches
- Low stock thresholds match
- Recent history appears in correct order
- Admin-only views are hidden for technician accounts

## Cutover Strategy

Best low-risk path:

1. keep the Flask app as the current production fallback
2. build and populate the Cloudflare-native app
3. test with a small admin group
4. switch traffic only after counts and workflows match
5. retain the SQLite backups until the new system is fully trusted
