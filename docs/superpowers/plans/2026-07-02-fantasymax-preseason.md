# FantasyMax 2026 Preseason Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Matt OD's League of Degenerates reliable, focused, and narratively alive before the 2026 fantasy football season.

**Status:** Completed and merged to `main` in July 2026. This document remains as the preseason implementation record; current completion evidence lives in `docs/PROGRESS.md`, `features.json`, and the production deployment history.

**Architecture:** Keep the existing Next.js/Supabase/Yahoo/Vercel architecture and the low-friction shared league password. Work in session-sized slices: production reliability, commissioner access, member-facing simplification, Tuesday League Dispatch, lore-grounded AI, trades, and memory/media polish. Defer public SaaS, multi-league onboarding, and paid-product thinking.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Postgres/Storage, Yahoo Fantasy API, Anthropic Claude, Vitest, ESLint, Vercel.

---

## Scope

This plan is only for this league and this deployed app. The north star is: every guy can open `modfantasyleague.com`, immediately understand what changed this week, argue from receipts, browse the league's history, and trust the data.

## Non-Goals

- Build a public multi-league product.
- Add paid subscriptions, payments, real-money settlement, or marketplace packaging.
- Replace Yahoo as the fantasy host.
- Rebuild the whole design system.
- Move to full Supabase member auth/RLS before the 2026 season unless the shared-password model becomes unacceptable.
- Add generic fantasy advice, start/sit recommendations, waiver tools, or draft rankings.

## Operating Rules

- Follow the single-feature-per-session rule from `CLAUDE.md`.
- Each session starts with `git status --short --branch`, then the relevant baseline command.
- Multi-file code changes require `npm run test:run`, `npm run typecheck`, and usually `npm run build`.
- Before any push/deploy, `npm run lint` must be green.
- Production validation matters more than local dev. After a committed/pushed product change, verify Vercel deployment and the production URL.
- Keep documentation current as work lands: update `docs/PROGRESS.md`, `docs/KNOWN_ISSUES.md`, and `features.json` where the change affects status.

## Recommended Order

1. Task 1: CI and lint green.
2. Task 2: Production sync readiness.
3. Task 3: Commissioner access boundary.
4. Task 4: Member-facing nav simplification.
5. Task 5: League Dispatch v1.
6. Task 6: Lore-grounded AI season reviews.
7. Task 7: Writeup organization and lore tags.
8. Task 8: Trade import and trade storytelling.
9. Task 9: Media and avatar polish.
10. Task 10: Season arc pages.

Tasks 1-4 are the preseason foundation. Tasks 5-8 are the core league-experience upgrades. Tasks 9-10 are high-value polish if the foundation is stable.

---

## Task 1: CI And Lint Green

**Goal:** Make GitHub Actions green again so future work has a trustworthy deployment gate.

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/admin/members/MembersClient.tsx`
- Modify: `src/components/features/governance/GovernancePlaceholder.tsx`
- Modify: `src/components/features/writeups/WriteupDetailDrawer.tsx`
- Modify: `src/components/features/writeups/WriteupsSkeleton.tsx`
- Modify: `src/lib/yahoo/sync.ts`
- Optional cleanup if still noisy: files reported by `npm run lint`

**Steps:**

- [ ] Run baseline lint.

  ```bash
  npm run lint
  ```

  Expected today: fails with 9 errors.

- [ ] Fix `prefer-const` errors.

  Change variables that are never reassigned from `let` to `const` in:
  - `src/app/(dashboard)/layout.tsx`
  - `src/lib/yahoo/sync.ts`

- [ ] Fix unescaped quote errors.

  Replace raw quote characters in JSX text with `&ldquo;` / `&rdquo;` or rewrite the copy in:
  - `src/app/admin/members/MembersClient.tsx`
  - `src/components/features/governance/GovernancePlaceholder.tsx`

- [ ] Fix `WriteupDetailDrawer` effect lint.

  Refactor `src/components/features/writeups/WriteupDetailDrawer.tsx` so loading state is not set synchronously in the effect body. The simplest acceptable shape is to derive loading from `writeupId && isOpen && !writeup`, or to move fetching into a server action pattern that does not require a direct `setIsLoading(true)` inside the effect body.

- [ ] Fix skeleton purity lint.

  Replace `Math.random()` in `src/components/features/writeups/WriteupsSkeleton.tsx` with a deterministic width list such as:

  ```ts
  const SKELETON_LINE_WIDTHS = ['92%', '78%', '88%', '66%'];
  ```

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

  Expected: lint exits 0; tests still report 136 passing unless tests are intentionally added.

- [ ] Update tracking docs.

  Add a short entry to `docs/PROGRESS.md` noting CI/lint cleanup and verification results. Update `features.json` only if CI/build status fields are present and stale.

- [ ] Commit.

  ```bash
  git add src docs features.json
  git commit -m "chore: restore green lint and CI baseline"
  ```

**Acceptance Criteria:**
- `npm run lint` exits 0.
- `npm run test:run` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- Latest GitHub Actions run on `main` is green after push.

---

## Task 2: Production Sync Readiness

**Goal:** Make the Tuesday Yahoo sync reliable before the 2026 season starts.

**Files:**
- Modify: `docs/PASSWORD_OPS.md`
- Modify: `docs/KNOWN_ISSUES.md`
- Modify: `docs/PROGRESS.md`
- Optional: `docs/SESSION_PROTOCOL.md`

**External Settings:**
- Vercel env: `CRON_SECRET`
- Vercel env: `SYNC_ENABLED=true`
- Vercel env: `NEXT_PUBLIC_APP_URL=https://modfantasyleague.com`
- Production league record: correct 2026 Yahoo league key when the 2026 Yahoo league exists

**Steps:**

- [ ] Confirm current Vercel env.

  ```bash
  vercel env ls
  ```

  Expected: Supabase, Yahoo, app URL, and league password are present. If `CRON_SECRET` or `SYNC_ENABLED` are missing, add them.

- [ ] Add missing cron env vars.

  ```bash
  vercel env add CRON_SECRET production
  vercel env add SYNC_ENABLED production
  ```

  Use a strong random value for `CRON_SECRET`; use `true` for `SYNC_ENABLED`.

- [ ] Confirm cron route rejects unauthenticated access.

  ```bash
  curl -i https://modfantasyleague.com/api/cron/yahoo-sync
  ```

  Expected: `401 Unauthorized`.

- [ ] Confirm the Yahoo league key path.

  Check the current production league key with a service-role read. Expected current known value is `461.l.175829` for the previous league. Before the 2026 season, confirm whether Yahoo created a new league key and update via Admin -> Import Yahoo / Sync Now if needed.

- [ ] Reconnect Yahoo on production if needed.

  Use production Admin -> Import Yahoo. Confirm `yahoo_credentials` has one updated row after reconnect.

- [ ] Run production Sync Now once.

  Use production Admin -> Sync Now, then confirm:
  - latest season has a fresh `last_sync_at`
  - teams and matchups are updated
  - `weekly_digests` has the latest prior-week row
  - Admin -> Weekly Email shows the digest

- [ ] Update docs.

  In `docs/PASSWORD_OPS.md`, add a "Preseason Yahoo Sync Checklist" with the exact production steps. In `docs/KNOWN_ISSUES.md`, mark the Vercel env issue resolved only after production evidence confirms it.

**Acceptance Criteria:**
- Vercel production has `CRON_SECRET`.
- Vercel production has `SYNC_ENABLED=true`.
- Unauthenticated cron route returns 401.
- Production Sync Now succeeds.
- Latest production `seasons.last_sync_at` is current after Sync Now.
- Admin -> Weekly Email displays a digest after sync.

---

## Task 3: Commissioner Access Boundary

**Goal:** Keep the shared league password for member read access, but prevent every league member from seeing or triggering admin tools.

**Recommendation:** Add a separate commissioner gate. Members keep `league_access`; commissioner gets an additional `commissioner_access` cookie.

**Files:**
- Create: `src/lib/auth/commissioner-access.ts`
- Create: `src/app/(auth)/admin-gate/page.tsx`
- Create: `src/app/api/admin/gate/verify/route.ts`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/app/api/admin/sync-yahoo/route.ts`
- Modify: `src/app/api/admin/refresh-views/route.ts`
- Modify: `src/app/api/import/yahoo/route.ts`
- Modify: `src/app/api/import/csv/route.ts`
- Modify: `src/app/api/auth/yahoo/route.ts`
- Modify: `docs/PASSWORD_OPS.md`

**Environment:**
- Add `COMMISSIONER_PASSWORD` to production Vercel env.

**Steps:**

- [ ] Add shared helper.

  `src/lib/auth/commissioner-access.ts` should expose:
  - `COMMISSIONER_COOKIE_NAME = 'commissioner_access'`
  - `hasCommissionerAccess(cookieStore)`
  - `setCommissionerAccessCookie(response)`

- [ ] Add `/admin-gate`.

  Build a simple page parallel to `/gate`, but with copy that clearly says it is for commissioner tools.

- [ ] Add `/api/admin/gate/verify`.

  Validate `COMMISSIONER_PASSWORD`, rate-limit attempts using `src/lib/rate-limit.ts`, and set `commissioner_access=granted` for 30 days.

- [ ] Protect admin layout.

  In `src/app/admin/layout.tsx`, allow admin pages when:
  - `BYPASS_AUTH=true`, or
  - `commissioner_access=granted`, or
  - a real Supabase user has `role='commissioner'`.

  If the user only has `league_access`, redirect to `/admin-gate`.

- [ ] Hide Commissioner nav for normal league access.

  In `src/app/(dashboard)/layout.tsx`, do not pass `userRole='commissioner'` to `Sidebar` just because the shared league password is valid. Only show commissioner nav when `commissioner_access=granted` or real auth says commissioner.

- [ ] Protect admin APIs.

  Replace `league_access` checks with commissioner checks for admin-only routes:
  - `src/app/api/admin/sync-yahoo/route.ts`
  - `src/app/api/admin/refresh-views/route.ts`
  - `src/app/api/import/yahoo/route.ts`
  - `src/app/api/import/csv/route.ts`
  - `src/app/api/auth/yahoo/route.ts`

- [ ] Verify manually.

  Use browser or curl:
  - With no cookies: `/` redirects to `/gate`.
  - With only `league_access`: `/` works, sidebar has no Commissioner section, `/admin` redirects to `/admin-gate`.
  - With `commissioner_access`: `/admin` works and admin APIs accept requests.

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

- [ ] Commit.

  ```bash
  git add src docs
  git commit -m "feat: separate commissioner access from league password"
  ```

**Acceptance Criteria:**
- League members can still use the app with one shared league password.
- Normal league members do not see Commissioner nav.
- Normal league members cannot access `/admin`.
- Admin APIs reject requests without commissioner access.
- Commissioner can still sync Yahoo and open Weekly Email.

---

## Task 4: Member-Facing Nav Simplification

**Goal:** Make the app feel finished by reducing visible member nav to strong, populated surfaces.

**Keep Visible For Members:**
- Dashboard
- Seasons
- Managers
- Head-to-Head
- Records
- Hall of Shame
- Writeups

**Conditionally Visible:**
- Media, after Task 9 makes it a curated memory wall.
- Trades, after Task 8 imports or documents actual trade data.

**Hide For Now:**
- Awards
- Draft Analyzer
- Voting
- Constitution
- Degenerate Dollars
- Timeline

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/command-palette-wrapper.tsx`
- Modify: `features.json`
- Modify: `docs/PROGRESS.md`

**Steps:**

- [ ] Remove weak surfaces from member nav.

  Keep pages routable for future direct QA, but remove them from the default member sidebar.

- [ ] Keep admin nav scoped to commissioner access.

  Do not show Commissioner links unless Task 3 has established commissioner access.

- [ ] Align command palette with visible navigation.

  Remove hidden surfaces from command palette quick actions unless the command is explicitly admin-only.

- [ ] Add a short documentation note.

  In `docs/PROGRESS.md`, record that the app is intentionally focused around strong league surfaces before the 2026 season.

- [ ] Run verification.

  ```bash
  npm run lint
  npm run typecheck
  npm run test:run
  npm run build
  ```

- [ ] Commit.

  ```bash
  git add src docs features.json
  git commit -m "refactor: focus member navigation for preseason launch"
  ```

**Acceptance Criteria:**
- Member sidebar has no empty/scaffold-feeling pages.
- Command palette does not route members to hidden/scaffold surfaces.
- Dashboard, Seasons, Managers, H2H, Records, Hall of Shame, and Writeups remain accessible.
- Admin users can still access admin routes.

---

## Task 5: League Dispatch V1

**Goal:** Turn Tuesday sync into a durable weekly story, not just a transient email draft.

**Files:**
- Modify: `src/lib/supabase/queries/weekly-digest.ts`
- Modify: `src/components/features/dashboard/WeekInReview.tsx`
- Modify: `src/components/admin/WeeklyEmailPanel.tsx`
- Modify: `src/app/admin/weekly/page.tsx`
- Create: `src/app/admin/weekly/actions.ts`
- Create: `supabase/migrations/<timestamp>_weekly_digest_publish.sql`
- Modify: `docs/PROGRESS.md`
- Modify: `features.json`

**Database Shape:**

Add columns to `weekly_digests`:
- `status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'))`
- `commissioner_note TEXT`
- `published_at TIMESTAMPTZ`
- `published_title TEXT`

**Steps:**

- [ ] Add migration for publish fields.

- [ ] Add server actions.

  `src/app/admin/weekly/actions.ts` should support:
  - update subject/body/title/note
  - publish digest
  - unpublish digest if a correction is needed

- [ ] Improve deterministic digest facts.

  Keep v1 modest. Add at least:
  - weekly high scorer
  - closest game
  - biggest margin
  - dashboard link
  - commissioner note

- [ ] Update Admin Weekly Email panel.

  Show editable subject/body/title/note and a clear Publish button. Preserve the copy-to-clipboard behavior.

- [ ] Update Dashboard WeekInReview.

  Prefer published digest content. If no published digest exists, show no dispatch rather than a half-finished draft.

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

- [ ] Production validation after deploy.

  Run production Sync Now, open Admin -> Weekly Email, edit/publish a digest, then open `/?week=N` and confirm the published dispatch appears.

- [ ] Commit.

  ```bash
  git add src supabase docs features.json
  git commit -m "feat: add publishable weekly league dispatch"
  ```

**Acceptance Criteria:**
- Weekly digest can be edited before publishing.
- Dashboard shows only published dispatches.
- Admin page can copy subject/body.
- Published weekly dispatch persists in `weekly_digests`.
- Production flow works after Sync Now.

---

## Task 6: Lore-Grounded AI Season Reviews

**Goal:** Regenerate season reviews using actual commissioner writeups and standings context, not just summary stats.

**Files:**
- Modify: `scripts/generate-ai-reviews.ts`
- Modify: `scripts/ai-eval.ts`
- Create: `tests/ai/golden/season-review.json`
- Optional modify: `src/lib/ai/prompts.ts`
- Modify: `docs/PROGRESS.md`

**Steps:**

- [ ] Fix the prompt.

  In `scripts/generate-ai-reviews.ts`, include both existing computed variables in the prompt:
  - `standingsTable`
  - `writeupExcerpts`

  The prompt should explicitly say:
  - use the provided facts and excerpts
  - do not invent trades, injuries, or quotes
  - cite one specific score or record if available
  - keep the commissioner-style edge but stay grounded

- [ ] Add a season-review golden fixture.

  `tests/ai/golden/season-review.json` should include at least one case with:
  - champion
  - last place
  - highest score
  - one writeup excerpt phrase

- [ ] Expand `scripts/ai-eval.ts`.

  It should validate that fixture facts exist in prompt inputs and can be used to check generated text when `ANTHROPIC_API_KEY` is present.

- [ ] Run dry-run prompt inspection.

  ```bash
  npx tsx scripts/generate-ai-reviews.ts --year=2024 --dry-run
  npm run ai:eval
  ```

  Expected: dry-run prompt visibly includes standings and writeup excerpts.

- [ ] Regenerate one season first.

  ```bash
  npx tsx scripts/generate-ai-reviews.ts --year=2024 --force
  ```

  Review the output in production-like UI before regenerating all seasons.

- [ ] Regenerate all seasons after review.

  ```bash
  npx tsx scripts/generate-ai-reviews.ts --force
  ```

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

- [ ] Commit code and docs.

  Generated database content should be documented in `docs/PROGRESS.md`; commit code changes separately from any SQL/data export if one is created.

**Acceptance Criteria:**
- Dry-run prompt includes actual writeup excerpts.
- Season reviews mention real league-specific context from historical writeups.
- No invented trades/injuries/claims are visible in sampled reviews.
- `npm run ai:eval` runs successfully.

---

## Task 7: Writeup Organization And Lore Tags

**Goal:** Make the historical writeups usable as league lore, not just a searchable archive.

**Files:**
- Modify: `scripts/parse-writeups.ts`
- Modify: `scripts/backfill-mentions.ts`
- Modify: `src/lib/mentions/detect-mentions.ts`
- Modify: `src/lib/supabase/queries/writeups.ts`
- Modify: `src/components/features/writeups/WriteupsBySeason.tsx`
- Modify: `src/components/features/writeups/SearchResultsList.tsx`
- Modify: `src/components/features/writeups/WriteupCard.tsx`
- Optional create migration: `supabase/migrations/<timestamp>_writeup_lore_tags.sql`

**Steps:**

- [ ] Improve parser classification.

  Re-run parse locally and reduce `other` classifications by adding concrete patterns for:
  - draft logistics
  - Vegas/draft-trip planning
  - playoff race updates
  - championship recaps
  - rule/league announcements
  - trade drama

- [ ] Improve generated titles.

  Prefer short human-readable titles over truncated first lines. Examples:
  - `2016 Week 7 Recap`
  - `2017 Trade Drama`
  - `2024 Vegas Draft Planning`
  - `2024 Championship Collapse`

- [ ] Add lore filters to UI.

  Add simple filters before adding complex new tables:
  - season
  - type
  - mentioned member
  - playoffs/draft/trade/championship

- [ ] Re-seed in a controlled way.

  Use dry-run first:

  ```bash
  npx tsx scripts/parse-writeups.ts --dry-run
  ```

  Then seed only after reviewing the JSON diff.

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

**Acceptance Criteria:**
- `other` writeup count drops meaningfully from 36.
- Top seasons show more useful labels.
- Users can browse by topic/member without knowing exact search terms.
- Historical archive still has 97 writeups unless duplicates or bad splits are intentionally corrected.

---

## Task 8: Trade Import And Trade Storytelling

**Goal:** Unlock the highest-drama missing data surface: trades.

**Files:**
- Modify: `src/lib/yahoo/client.ts`
- Modify: `src/lib/yahoo/sync.ts`
- Modify: `src/lib/supabase/queries/trades.ts`
- Modify: `src/components/features/trades/TradesTimeline.tsx`
- Modify: `src/app/(dashboard)/trades/page.tsx`
- Optional create: `scripts/audit-yahoo-trades.ts`
- Modify: `docs/KNOWN_ISSUES.md`
- Modify: `features.json`

**Steps:**

- [ ] Add a read-only trade diagnostic script.

  `scripts/audit-yahoo-trades.ts` should:
  - load Yahoo credentials
  - fetch league transactions for the configured league key
  - print count only plus sanitized transaction shape
  - not write to Supabase

- [ ] Run the diagnostic.

  ```bash
  npx tsx scripts/audit-yahoo-trades.ts
  ```

  Expected: a clear answer: Yahoo returns trade records, or Yahoo returns none for this league/key.

- [ ] If Yahoo returns trades, fix import mapping.

  Ensure `trader_team_key`, `tradee_team_key`, player names, and transaction timestamps map into `trades`.

- [ ] If Yahoo returns no trades, document the limitation and keep Trades hidden from member nav.

- [ ] Upgrade the timeline only after data exists.

  Add:
  - team/member names
  - players exchanged
  - season/week/date
  - "championship impact" if the traded member later won that season

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

**Acceptance Criteria:**
- There is a confirmed answer about whether Yahoo exposes historical trades for this league.
- If trades exist, production Supabase has nonzero `trades` rows after sync.
- Trades page is visible only when it has real content.
- Trade page tells stories, not just rows.

---

## Task 9: Media And Avatar Polish

**Goal:** Make league memories feel curated instead of upload-form-first.

**Files:**
- Modify: `src/app/(dashboard)/media/page.tsx`
- Modify: `src/components/features/media/MediaGallery.tsx`
- Modify: `src/components/features/media/MediaUploadForm.tsx`
- Modify: `src/components/ui/manager-avatar.tsx`
- Modify: `src/lib/utils/avatar-map.ts`
- Assets: `public/avatars/*`, `public/Vegasentrance.MOV`
- Modify: `docs/PROGRESS.md`

**Steps:**

- [ ] Hide upload controls from normal members.

  Upload should be commissioner-only until moderation and tagging are solid.

- [ ] Rename the page conceptually.

  Keep route `/media`, but present it as "League Memories" or "Memory Wall" in UI copy.

- [ ] Feature the Vegas entrance video as a curated artifact.

  Give it a title, season/context, and short caption instead of showing it as an empty-state fallback.

- [ ] Normalize avatar rendering.

  Audit existing avatar dimensions and object positioning. Fix visible cropping issues in CSS before regenerating assets.

- [ ] Decide whether to replace any AI avatars.

  If real photos exist in the repo or Supabase media, prefer real images for this private league tool. If not, keep AI avatars but normalize dimensions.

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

**Acceptance Criteria:**
- Media page no longer looks empty.
- Upload controls are not visible to normal members.
- The Vegas video feels like a league artifact.
- Avatars render consistently in dashboard, H2H, managers, and records surfaces.

---

## Task 10: Season Arc Pages

**Goal:** Give each season a story page: champion path, last-place race, turning points, records, key writeups, and defining matchups.

**Files:**
- Modify: `src/app/(dashboard)/seasons/[year]/page.tsx`
- Modify: `src/components/features/seasons/SeasonHighlights.tsx`
- Modify: `src/components/features/seasons/SeasonJourneyChart.tsx`
- Create: `src/components/features/seasons/SeasonArc.tsx`
- Modify: `src/lib/supabase/queries/league.ts`
- Modify: `src/lib/supabase/queries/writeups.ts`
- Modify: `src/lib/supabase/queries/trades.ts`

**Steps:**

- [ ] Add a Season Arc section below core standings.

  Include:
  - champion path
  - last-place story
  - highest score
  - worst score
  - closest game
  - biggest blowout
  - relevant writeups
  - trades if Task 8 succeeds

- [ ] Keep it deterministic first.

  Do not add new AI generation until the deterministic season arc is useful.

- [ ] Link to receipts.

  Each story item should link to the relevant record, writeup, H2H matchup, or trade when possible.

- [ ] Run verification.

  ```bash
  npm run lint
  npm run test:run
  npm run typecheck
  npm run build
  ```

**Acceptance Criteria:**
- Opening a season gives a coherent story, not only standings.
- At least 2024 and 2025 have strong arc content.
- Story claims are backed by visible stats or links.

---

## First Conversation Decision

Before implementation starts, choose one of these two starting tracks:

1. **Practical Launch Track, recommended:** Task 1 -> Task 2 -> Task 3 -> Task 4.
2. **Story Track:** Task 1 -> Task 5 -> Task 6, then return to Task 2/3 before sharing broadly.

The Practical Launch Track is safer because stale sync, red CI, and open admin access will undermine any story improvements if left unresolved.
