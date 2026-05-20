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
