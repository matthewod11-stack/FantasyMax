# FantasyMax Assessment - July 2, 2026

Purpose: read-only assessment before deciding the next FantasyMax workstream for the 2026 fantasy football season. No app code was changed during this pass.

## Executive Read

FantasyMax is in a strong position as a private league history and social layer, not a replacement fantasy host. The working core is dashboard, H2H, seasons, records, hall of shame, writeups, weekly email, and Yahoo sync. The product risk is not lack of features; it is too many half-visible surfaces, stale operational state, and AI content that is not yet using the league's actual lore deeply enough.

The best next-level direction is to make the app the league's living newspaper, museum, and argument machine. That means fewer nav items, stronger weekly ritual, better use of historical writeups as retrieval/context, and more "receipts" around records, rivalries, trades, and collapses.

## Current State

- Local `main` matches `origin/main` at `7ce0bd4`, and Vercel production is deployed from that same commit.
- Production domains `modfantasyleague.com` and `fantasymax.vercel.app` both redirect to `/gate?redirect=%2F`.
- Vercel latest production deployment is ready, created May 20, 2026.
- Local verification on July 2, 2026:
  - `npm run test:run`: 136 passing, 0 failing.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
  - `npm run lint`: failed with 9 errors and 52 warnings.
- GitHub Actions is red on the latest commit because the lint job fails. Test and typecheck jobs succeeded in the latest CI run; build was skipped because lint failed.
- Production DB read showed latest season year `2025`, latest `last_sync_at` May 20, 2026, 1 Yahoo credential row, and 1 weekly digest row for 2025 Week 16.
- Vercel env inspection found production Supabase/Yahoo/app/password vars but did not show `CRON_SECRET` or `SYNC_ENABLED`. If that is current, Tuesday cron will return 401 or no-op until fixed.

## Content And AI Findings

- Historical commissioner writeups originate in `docs/alltimewriteups.md`.
- `scripts/parse-writeups.ts` produced 97 parsed writeups in `scripts/output/writeups.json`.
- Parsed writeups cover 2015-2024. The 2025 season has live/stat data and an AI review, but no imported commissioner writeups.
- Writeup classification is rough: 36 of 97 parsed items are `other`, and content length ranges from 104 to 18,522 characters. This is a signal for editorial segmentation and tagging, not just UI polish.
- H2H recaps exist for 91 rivalries and are displayed in H2H surfaces.
- Season AI reviews exist for 11 seasons and render in the writeups accordion and season pages.
- Important quality issue: `scripts/generate-ai-reviews.ts` fetches commissioner writeups and builds excerpts, but the final prompt does not include those excerpts. The reviews are therefore less grounded in league lore than they should be.
- Weekly digests are deterministic, not LLM-generated. They are useful for the Tuesday ritual, but there is only one remote row today, so this is not yet a durable week-by-week story archive.
- Trades are still a major missing story surface: sync/UI code exists, but remote Supabase currently has 0 trades.

## Product Read

Strongest current surfaces:
- Dashboard: good overview, weekly digest, stale sync alert, leaderboards, rivalries, highlights, latest season.
- H2H: clear two-panel structure and useful rivalry records.
- Records and Hall of Shame: strong fit for the league's social memory.
- Writeups: valuable raw material, but currently feels archive-first.
- Weekly Email admin flow: closest thing to a repeatable in-season ritual.

Weak or risky surfaces:
- Sidebar exposes many ideas at once: Awards, Trades, Draft Analyzer, Voting, Constitution, Degenerate Dollars, Timeline, and Commissioner tools.
- Some surfaces are empty or scaffold-like, which dilutes confidence.
- Admin surfaces are visible/unlocked for anyone with the shared league password in the current mode.
- Media page is mostly an upload form plus one legacy Vegas video. It could become a memory wall, but it is not there yet.
- Avatar assets exist, but dimensions/style are uneven. The avatars are useful enough for now, but not final brand-quality.

## Market Scan

The space is active, not empty.

- Yahoo now has native Weekly League Recaps delivered in league chat every Tuesday, plus league history and fantasy feed features.
- Sleeper remains the strongest social-first host with chat, reactions, league history, and weekly reports.
- League Legacy is the clearest direct comp: imports history across major platforms and offers records, league site, members, finances, and content.
- NextTeamUp, League Rewind, Recap My League, FF Wrapped, Fantasy Genius, Fantasy League Report, and similar products validate demand for weekly reports, AI recaps, power rankings, awards, luck charts, draft grades, roasts, and shareable graphics.
- Open-source projects like `fantasy-football-metrics-weekly-report`, `power_ranker`, `ffscrapr`, and ESPN/Sleeper API tools show strong building blocks, but setup remains too technical for normal commissioners.

Opportunity:
- Do not compete as a fantasy advice tool.
- Do not become a generic recap generator.
- Win by using this league's actual history, voice, rivalries, records, writeups, media, and rituals better than any generic platform can.

## Addition By Subtraction

Recommended default for league-member nav:
- Keep: Dashboard, Seasons, Managers, Head-to-Head, Records, Hall of Shame, Writeups.
- Consider keeping if populated before launch: Media, Trades.
- Hide until real: Draft Analyzer, Voting, Constitution, Degenerate Dollars, Timeline, Awards if it remains less useful than Records/Hall of Shame.
- Hide Commissioner section from non-commissioner users if the shared-password model stays.

This would make the first impression feel finished instead of experimental.

## Best Next Workstreams

1. Launch hardening sprint
   - Fix lint/CI.
   - Set/verify `CRON_SECRET` and `SYNC_ENABLED` in Vercel.
   - Confirm 2026 Yahoo league key and run production Sync Now.
   - Decide whether shared password can unlock `/admin`.

2. League Dispatch sprint
   - Turn Tuesday sync into a publishable weekly dispatch.
   - Store every weekly dispatch as a permanent story object.
   - Add commissioner edit/approve.
   - Link dashboard, email, and writeups around one published weekly story.

3. Lore retrieval and AI quality sprint
   - Tag writeups by member, rivalry, event, season, week, and recurring joke.
   - Regenerate season reviews using actual writeup excerpts and stat IDs.
   - Use structured AI output: facts, citations/receipts, narrative, jokes, confidence.
   - Expand `scripts/ai-eval.ts` beyond one fixture.

4. Trade and turning-point sprint
   - Import trades before the season if Yahoo data supports it.
   - Add trade winners/losers, regret index, championship impact, and trade trees.
   - Use trades in weekly dispatch and season arc pages.

5. Visual memory sprint
   - Decide between better AI avatars, real photos, or hybrid.
   - Turn Media into a curated memory wall instead of an upload utility.
   - Feature draft/Vegas/championship moments as part of season/member pages.

## Conversation Agenda

The next conversation should answer:

1. Is the launch priority reliability by Week 1, or a product reimagining before Week 1?
2. Should the product become "League Dispatch" first, or should we clean the app down to the strongest existing surfaces first?
3. How much edge should the AI voice have, and should commissioner edit/approve be mandatory?
4. Are admin tools trusted behind the shared password, or should we hide/admin-protect them before sharing with the league?
5. Are trades available from Yahoo for this league, and are they worth making the next narrative data import?

## Sources

Local evidence:
- `package.json`
- `.github/workflows/ci.yml`
- `.vercel/project.json`
- `vercel.json`
- `docs/PROGRESS.md`
- `docs/ROADMAP.md`
- `docs/KNOWN_ISSUES.md`
- `docs/AUDIT_2026-04-16.md`
- `docs/alltimewriteups.md`
- `scripts/output/writeups.json`
- `scripts/generate-ai-reviews.ts`
- `scripts/generate-h2h-recaps.ts`
- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/writeups/page.tsx`
- `src/app/(dashboard)/head-to-head/page.tsx`
- `src/app/(dashboard)/media/page.tsx`
- `src/app/api/cron/yahoo-sync/route.ts`
- `src/app/api/admin/sync-yahoo/route.ts`
- `src/lib/supabase/queries/weekly-digest.ts`

Market sources:
- Yahoo Weekly League Recaps: https://help.yahoo.com/kb/SLN37123.html
- Yahoo fantasy football: https://football.fantasysports.yahoo.com/
- Sleeper fantasy football: https://sleeper.com/fantasy-football
- Sleeper league history and weekly reports: https://support.sleeper.com/en/articles/3204499-league-history-and-weekly-reports
- League Legacy: https://leaguelegacy.io/
- NextTeamUp: https://www.nextteamup.com/fantasy
- League Rewind: https://leaguerewind.com/
- Recap My League: https://www.recapmyleague.com/
- FF Wrapped: https://ffwrapped.com/
- Fantasy Genius: https://www.fantasygenius.io/
- Fantasy football metrics weekly report: https://github.com/uberfastman/fantasy-football-metrics-weekly-report
- power_ranker: https://github.com/rynecarbone/power_ranker
- ffscrapr: https://ffscrapr.ffverse.com/
- Sleeper API docs: https://docs.sleeper.com/
