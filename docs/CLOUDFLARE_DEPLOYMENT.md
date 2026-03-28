# Cloudflare Deployment Notes

## Stack

- Cloudflare Workers
- Cloudflare D1
- Worker static assets from `public/`
- Optional Cloudflare Access in front of the app

## Setup Steps

1. Install Node.js and Wrangler.
2. Authenticate Wrangler:
   - `wrangler login`
3. Create a D1 database:
   - `wrangler d1 create dpd-it-inventory`
4. Copy the returned `database_id` into [wrangler.jsonc](C:\Users\monel\OneDrive\Desktop\DA\cloudflare-native\wrangler.jsonc).
5. Apply migrations locally:
   - `wrangler d1 migrations apply DB`
6. Deploy the Worker:
   - `wrangler deploy`

## Strong Recommendation

Before exposing the app broadly, use Cloudflare Access so only approved staff accounts can reach it.

## Production Checklist

- `database_id` updated in `wrangler.jsonc`
- first admin created through bootstrap flow
- D1 schema applied successfully
- device import tested with sample CSV
- admin and technician roles verified
- Cloudflare Access policy enabled if internal-only
- custom domain attached
- rollback plan documented

## Notes On Runtime Differences

This rewrite uses JavaScript Workers instead of Python Workers because the original Flask app is not a drop-in fit for the Cloudflare Worker runtime model. Using JavaScript here keeps the app aligned with Cloudflare's native request/response and D1 patterns.
