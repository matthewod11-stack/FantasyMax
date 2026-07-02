# League Password Operations

FantasyMax uses a shared league password (`LEAGUE_PASSWORD`) for member access — not per-user accounts.

## Rotate the password

1. Set a new value in Vercel/hosting env: `LEAGUE_PASSWORD`
2. Redeploy (or update env and restart)
3. Share the new password in your league group chat
4. Old `league_access` cookies remain valid until they expire (30 days) — members may need to re-enter at `/gate` after rotation if you want immediate lockout

## Rate limiting

`/api/gate/verify` allows 10 attempts per IP per 15 minutes to reduce brute-force risk.

## Commissioner vs members

- **Members:** password gate only → read dashboard
- **Commissioner:** same gate + `/admin` (Yahoo sync, imports, weekly email draft)

## Preseason Yahoo Sync Checklist

1. Confirm Vercel Production env includes `CRON_SECRET` and `SYNC_ENABLED=true`.
2. Never record, print, or commit the `CRON_SECRET` value.
3. Check the anonymous cron endpoint without an `Authorization` header:
   - Expected: `/api/cron/yahoo-sync` returns `401 Unauthorized`
   - Unexpected: redirect to `/gate`
4. After Yahoo reconnect and league key confirmation, run **Sync Now** from production Admin.
5. After Sync Now, open Admin → Weekly Email and confirm the digest is available for the current week.
