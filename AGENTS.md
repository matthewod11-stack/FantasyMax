## Learned User Preferences

- Validates and uses the app on production Vercel (modfantasyleague.com); local dev is not the primary test surface—changes go live only after commit/push deploy.
- In-season cadence: Tuesday morning ET Yahoo sync, then commissioner sends the weekly league email with a dashboard link for insights beyond Yahoo.
- Near-term access model: shareable URL + password gate, not per-member Supabase auth + RLS as the default launch path.
- Plans large features collaboratively (explore options, then narrow); wants durable audit/handoff notes saved under `docs/` for later sessions.
- Social/gamification should stay above board: virtual currency and props on synced stats; real-money settlement stays outside the app.
- Follow the single-feature-per-session rule in `CLAUDE.md` when executing roadmap work.

## Learned Workspace Facts

- FantasyMax is the league historical/social layer alongside Yahoo/ESPN, not a replacement fantasy platform.
- Password-gated shareable app uses `createAdminClient()` for reads; full invite-only member auth + RLS is intentional debt (see `docs/KNOWN_ISSUES.md`).
- Admin **Refresh Data** calls `/api/admin/refresh-views` (recompute cached stats only); **Sync Now** calls `/api/admin/sync-yahoo` (Yahoo import, credentials, weekly digest).
- Tuesday live sync: `vercel.json` cron → `/api/cron/yahoo-sync`; production needs `CRON_SECRET` and `SYNC_ENABLED=true` on Vercel (not only `.env.local`).
- Weekly ritual surfaces: `/?week=N` dashboard, **Admin → Weekly Email** for digest copy-paste after sync.
- Default Yahoo league key for this league: `461.l.175829`.
- Remote Supabase (`supabase db query --linked`) is the authoritative check for sync timestamps, `yahoo_credentials`, and `weekly_digests`.
