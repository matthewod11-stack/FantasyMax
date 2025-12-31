# FantasyMax Roadmap

**Last Updated:** December 31, 2025

The social/historical layer for your fantasy football league. This document is organized by **Sprints** - the single source of truth for what to build and when.

---

## Quick Status

| Sprint | Focus | Status |
|--------|-------|--------|
| **Sprint 0** | Design System | ✅ Complete |
| **Sprint 1** | Core Stats Pages | ✅ Complete |
| **Sprint 2** | Records & Recognition | ✅ Complete (Phase 1) |
| **Sprint 2.5** | Shareable App | ⏳ In Progress |
| **Sprint 3** | Data Enrichment | ⏳ Not Started |
| **Sprint 4** | Production Ready | ⏳ Not Started |
| **Sprint 5** | Social Features | ⏳ Not Started |
| **Sprint 6** | AI Features | ⏳ Not Started |

### Data Imported
| Data | Count | Source |
|------|-------|--------|
| Seasons | 11 | Yahoo API (2015-2025) |
| Members | 22 | Yahoo API |
| Teams | 147 | Yahoo API |
| Matchups | 1088 | Yahoo API |
| Trades | 0 | Not yet imported |

---

## Sprint 0: Design System ✅ COMPLETE

*The UX DNA that makes everything feel premium. Completed Dec 7, 2025.*

### Deliverables

#### Typography & Colors ✅
- [x] Bebas Neue (display), DM Sans (body), DM Mono (stats) via `next/font`
- [x] CSS custom properties for all colors in `globals.css`
- [x] Dark theme as default (sports broadcast aesthetic)
- [x] Heatmap color scale for H2H visualization

#### Component Library ✅
| Component | Location | Purpose |
|-----------|----------|---------|
| `StatBadge` | `ui/stat-badge.tsx` | Win/loss/championship indicators |
| `SkeletonCard` | `ui/skeleton-card.tsx` | 5 loading state variants |
| `HeatmapCell` | `ui/heatmap-cell.tsx` | H2H matrix cells |
| `DrawerPanel` | `ui/drawer-panel.tsx` | Slide-out panels |
| `ManagerAvatar` | `ui/manager-avatar.tsx` | Avatar with champion glow |
| `ManagerCard` | `ui/manager-card.tsx` | 3 variants (compact/full/grid) |
| `CommandPalette` | `ui/command-palette.tsx` | ⌘+K navigation |

#### Animation System ✅
- [x] Timing variables (`--duration-fast/normal/slow/stagger`)
- [x] Easing curves (`--ease-out`, `--ease-in-out`, `--ease-spring`)
- [x] Shimmer animation for skeletons

---

## Sprint 1: Core Stats Pages ✅ COMPLETE

*The first features members will see - must feel polished.*

### 1.1 Managers Page `/managers` ✅ COMPLETE

Dynamic card grid showing all league members with career stats.

- [x] Interactive cards with hover animations
- [x] 3 view modes: Grid, List, Power Rank
- [x] Sort by: Championships, Wins, Win %, Points, Seasons, Name
- [x] Filter by: Active/Inactive
- [x] Championship glow effect for winners
- [x] Click through to profile

*Location: `src/app/(dashboard)/managers/page.tsx`*

### 1.2 Manager Profile `/managers/[id]` ✅ COMPLETE

Deep dive into one manager's history.

- [x] Career timeline visualization (bar chart with win % height)
- [x] Championship/Last Place markers with icons
- [x] Broadcast-style rivalry cards (Nemesis/Victim)
- [x] Career stats grid
- [x] Team name history across seasons
- [x] Season-by-season table
- [x] Click season → drawer with full breakdown
- [x] Team name merge for multi-email Yahoo users

*Location: `src/app/(dashboard)/managers/[id]/page.tsx`*

### 1.3 Head-to-Head Matrix `/head-to-head` ✅ COMPLETE

Interactive matrix showing all manager pairings.

- [x] NxN grid with sticky headers
- [x] Two modes: Record view and Heatmap view
- [x] Click cell → drawer with game-by-game history
- [x] Playoff/Championship indicators
- [ ] Filter by season range
- [ ] Pattern overlay for colorblind accessibility
- [ ] "Biggest Rivalries" highlight

*Location: `src/app/(dashboard)/head-to-head/page.tsx`*

### 1.4 Personalized Dashboard `/dashboard` ✅ COMPLETE

The user's personal hub - their story, not a generic overview.

**"Your Next Opponent" Card:**
- [x] Upcoming matchup with opponent avatar
- [x] All-time H2H record against opponent
- [x] Last 3 matchup results as mini timeline
- [x] Rivalry status label (Nemesis, Victim, Even)

**"This Week in History" Widget:**
- [x] Random historical event from current NFL week
- [x] Rotates on refresh, "Show another" button
- [ ] Links to relevant season/matchup

**Personal Trophy Case:**
- [x] Championships with years
- [x] Records held
- [ ] Awards won

**Rivalry Tracker Mini-View:**
- [x] Top Nemesis and Victim with records

### 1.5 Season Detail `/seasons/[year]` ✅ COMPLETE

Deep dive into any season's story.

**Playoff Bracket:**
- [x] Visual bracket with hover scores
- [x] Winner path highlighted
- [ ] Click matchup → detailed view (drawer)

**Season Journey Chart:**
- [x] Line chart: team rankings week-by-week
- [ ] Toggle between rank and points (disabled for now)
- [x] Hover to highlight team

**Standings & Highlights:**
- [x] Final standings with records
- [x] Champion and Last Place with styling
- [x] Season-specific records (high score, low score, blowout, closest game)

*Location: `src/app/(dashboard)/seasons/[year]/page.tsx`*

---

## Sprint 2: Records & Recognition

*The trophy room experience.*

### 2.1 Records Page `/records` ✅ COMPLETE

League record book as a virtual trophy room.

**Trophy Card Design:**
- [x] Each record as a "digital plaque" (not table rows)
- [x] Holder's avatar and name prominent
- [x] Record value in large typography
- [x] Date/season when set

**Categories:**
- [x] Single Week: Highest/lowest score, biggest blowout, closest game
- [x] Season: Most wins, most points, best/worst record
- [x] All-Time: Career wins, career points, longest win streak
- [x] Playoffs: Most appearances, championships, runner-ups
- [x] Dubious: Most last places, most points against

**Animations:**
- [x] "Record Broken!" effect for recent records (isRecent prop)
- [x] "Previous holder" shown for context (previousHolder prop)

*Location: `src/app/(dashboard)/records/page.tsx`*

### 2.2 Hall of Shame `/hall-of-shame` ✅ COMPLETE

Immortalize the last place finishers.

- [x] Last place "trophy case" with photos
- [x] Shame leaderboard (most last places)
- [ ] "Closest to avoiding it" stats (query ready, UI pending)
- [x] Season-by-season inductees

### 2.3 Awards System `/awards` ✅ BASIC DISPLAY COMPLETE

End-of-season recognition.

- [x] MVP, Comeback Player, Biggest Disappointment (display ready)
- [x] Trade of the Year, Worst Trade (display ready)
- [x] Award history by year (timeline view)
- [x] Most Decorated leaderboard
- [ ] Custom commissioner-defined awards (commissioner UI)
- [ ] Award ceremony/reveal page

*Location: `src/app/(dashboard)/awards/page.tsx`*

### 2.4 Commissioner Writeups

Historical archive and future content creation.

**Phase 1: Historical Archive (Priority)**
- [x] Database schema for writeups (season, title, content, type, author)
- [x] Parse `docs/alltimewriteups.md` into individual writeups with metadata
- [x] Seed script to import ~100+ historical writeups (2015-2024)
- [x] Writeups page with season grouping (accordion/expand)
- [x] Full-text search across writeups (PostgreSQL ts_rank + debounced UI)
- [x] Auto-detect mentioned members for tagging

**Phase 2: Commissioner Tools (Future)**
- [ ] Rich text editor for new recaps
- [ ] Weekly power rankings posts
- [ ] Publish/draft status
- [ ] Feature on homepage

---

## Sprint 2.5: Shareable App ⏳ IN PROGRESS

*Make the app shareable with league friends - no login required.*

### Phase 1: Fix Blockers ✅
- [x] Fix dashboard loading (career stats not found for member)
- [x] Fix H2H matrix (merged member records not showing)

### Phase 2: Make Shareable ✅
- [x] Global member selector in header ("Viewing as: [Member]")
- [x] Champion team name on season tiles
- [x] Active/Historic toggle for H2H matrix
- [x] Heatmap "Viewing As" highlighting

### Phase 3: Visual Polish ⏳
- [x] AI-generated Pixar-style member avatars (14 active members)
- [x] League rebranded to "Matt OD's League of Degenerates"
- [ ] Fix avatar stretching (Matt OD, Jeff have inconsistent aspect ratios)
- [ ] Manager profile image upload (Supabase Storage) - deferred, using AI avatars

### Phase 4: Data Import
- [x] Fix 500 error on import page (live website) - AdminHeader fix
- [x] Import 2025 season (11th season, just completed) - 14 teams, 110 matchups
- [ ] Import draft data from Yahoo
- [ ] Import trade data from Yahoo

### Phase 5: Feature Enhancements
- [x] AI-generated season reviews (using standings + writeup files)
- [ ] Weekly high score cash tracker ($50/week) on manager page
- [ ] Championship winnings tracker (rules changed over years) - "Coming Soon"
- [ ] Reimagine H2H page:
  - [ ] Record tab: selected member vs each team
  - [ ] Click team → expandable panel with matchup week/score history
  - [ ] Remove heatmap highlight (keep heatmap as separate view)
- [ ] Fix rivalry tracker confusion (clarify nemesis/victim record display)
- [ ] Hall of Shame: "Toilet Trophy Winners" (least wins in season)
  - [ ] AI-generated images of members getting flushed (Gemini/nanobanana)
  - [ ] Leverage original member photos for likeness

### Phase 6: V2 Features (Coming Soon)
- [ ] Trades page - placeholder with "Coming Soon" (no 404)
- [ ] Media page - placeholder with "Coming Soon" (no 404)
- [ ] Voting page - placeholder with "Coming Soon" (no 404)
- [ ] Constitution page - placeholder with "Coming Soon" (no 404)

---

## Sprint 3: Data Enrichment

*Import additional data to unlock more features.*

### 3.1 Trade Sync

- [ ] Yahoo trade history import
- [ ] Trade detail storage (players exchanged)
- [ ] Trade timeline view
- [ ] "Trade winners/losers" analysis

### 3.2 Draft Data

- [ ] Draft results by year
- [ ] Draft grade history
- [ ] "Best picks" and "Biggest busts" tracking

### 3.3 Enhanced Season Pages

- [ ] Trade activity timeline in season pages
- [ ] Draft recap integration

---

## Sprint 4: Production Ready

*Final touches before inviting the league.*

### 4.1 Authentication ⚠️ BLOCKING

- [ ] Re-enable Supabase auth
- [ ] Member invitation flow via email
- [ ] Email verification
- [ ] Password reset
- [ ] Session management
- [ ] Switch from `createAdminClient()` to `createClient()`
- [ ] Enable RLS policies
- [ ] Remove `BYPASS_AUTH` for production

### 4.2 Member Management

- [ ] Invite new members
- [ ] Link Yahoo accounts to members
- [ ] Role management (commissioner, president, treasurer)
- [x] Merge duplicate members
- [ ] Deactivate former members

### 4.3 Mobile Experience

- [ ] Responsive design audit
- [ ] Touch-friendly interactions
- [ ] Mobile navigation improvements

### 4.4 Performance

- [ ] Apply database migrations to production
- [ ] Regenerate TypeScript types
- [ ] Image optimization
- [ ] Loading state audit

---

## Sprint 5: Social Features

*The community-building layer.*

### 5.1 Voting System `/voting`

- [ ] Create polls (commissioner)
- [ ] Vote on rule changes
- [ ] Award voting
- [ ] Anonymous vs public options
- [ ] Results visualization

### 5.2 Media Gallery `/media`

- [ ] Photo/video upload
- [ ] Tag members in media
- [ ] Event categorization (draft, championship)
- [ ] Gallery with lightbox

### 5.3 Constitution `/constitution`

- [ ] Formatted rules display
- [ ] Rule categories
- [ ] Amendment history
- [ ] Version tracking

### 5.4 Notifications

- [ ] Email notifications for polls
- [ ] New content alerts
- [ ] Championship/shame announcements

---

## Sprint 6: AI Features (Optional)

*AI-generated content and insights.*

### 6.1 Season Recaps `/seasons/[year]/recap`

- [ ] Auto-generate season narratives
- [ ] Key turning points identification
- [ ] Commissioner edit/approve workflow
- [ ] Tone options (serious, humorous, ESPN-style)

### 6.2 Matchup Previews

- [ ] Weekly preview articles
- [ ] H2H history, recent form, key stats
- [ ] Predictions with confidence levels
- [ ] Shareable preview cards

### 6.3 Natural Language Query

- [ ] "Who has the best record against Mike?"
- [ ] "What's my longest win streak?"
- [ ] Convert to database lookups
- [ ] Suggest related queries

### 6.4 Trash Talk Assistant 🔥

- [ ] Generate historically-accurate trash talk
- [ ] References actual H2H records
- [ ] Tone selector (friendly → ruthless)
- [ ] Copy to clipboard

---

## Technical Infrastructure

*Cross-cutting concerns maintained throughout sprints.*

### Completed ✅

| Item | Location |
|------|----------|
| Schema hardening (indexes, constraints) | `migrations/20241207000001_schema_hardening.sql` |
| Career stats materialized view | `migrations/20241207000002_mv_career_stats.sql` |
| H2H matrix materialized view | `migrations/20241207000003_mv_h2h_matrix.sql` |
| Season standings view | `migrations/20241207000004_v_season_standings.sql` |
| League records view | `migrations/20241207000005_v_league_records.sql` |
| Structured logging | `src/lib/logging/` |
| Error boundaries | `src/lib/errors/`, `src/app/error.tsx` |
| CI pipeline | `.github/workflows/ci.yml` |
| Test fixtures | `tests/fixtures/` |
| Stat calculators with tests | `src/lib/stats/`, 108 tests |
| Query helper functions | `src/lib/supabase/queries/` |

### Pending

- [ ] Data validation job (orphan detection, duplicates)
- [ ] E2E tests for critical flows
- [ ] Apply migrations to Supabase production
- [ ] Regenerate `database.types.ts` after migrations

### Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (currently bypassed)
- **Testing:** Vitest
- **CI:** GitHub Actions

---

## Release Checklist

Before inviting league members:

- [ ] All Sprint 1 pages complete and polished
- [ ] Authentication working (Sprint 4.1)
- [ ] RLS enabled, admin client server-only
- [ ] CI passing: lint, typecheck, test, build
- [ ] Mobile responsive
- [ ] p95 < 1.5s for main pages

---

## Future Considerations

For operational maturity items (observability, staging controls, data integrity, guardrails), see **[docs/FUTURE_CONSIDERATIONS.md](docs/FUTURE_CONSIDERATIONS.md)**.

This includes:
- Weekly Yahoo refresh strategy
- Feature flags & deployment controls
- Auth/RLS bootstrap & admin recovery
- Data integrity & validation jobs
- Observability & ops runbooks
- Testing & performance budgets
- Media/AI guardrails

**Session Protocol:** When completing sprints, check if any items from `FUTURE_CONSIDERATIONS.md` should be promoted to active tasks.

---

## Ideas Backlog

*Features to consider for future sprints.*

### Analytics
- Expected wins vs actual wins (luck analysis)
- Schedule strength analysis
- "What if different schedule" simulator
- Championship probability model

### Platform
- ESPN integration
- Sleeper integration
- Multi-league support
- Public "hall of fame" page (opt-in)

### Accessibility
- WCAG 2.1 AA compliance
- Pattern overlays for colorblind users
- Reduced motion mode

### Engagement
- "This day in league history" widget
- Random stat generator ("Did you know...")
- Share buttons for records
- Export stats to CSV

---

## Design Reference

### Color Palette
```css
/* Dark theme */
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-elevated: #1a1a24;

/* Status */
--win: #22c55e;
--loss: #ef4444;
--gold: #fbbf24;

/* Heatmap (6 levels) */
--heat-5: #166534;  /* Dominant */
--heat-0: #991b1b;  /* Dominated */
```

### Typography
- **Display:** Bebas Neue (headlines, all-caps)
- **Body:** DM Sans (readable, clean)
- **Stats:** DM Mono (tabular numerals)

### Animation Timing
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-stagger: 50ms;
```

---

*"The best time to start tracking your league history was 10 years ago. The second best time is now."*
