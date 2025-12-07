# FantasyMax Roadmap

**Last Updated:** December 6, 2025

This roadmap outlines the feature development plan for FantasyMax - the social/historical layer for your fantasy football league.

---

## Current State

### Data Imported ✅
| Data | Count | Source |
|------|-------|--------|
| Seasons | 10 | Yahoo API (2015-2024) |
| Members | 22 | Yahoo API |
| Teams | 133 | Yahoo API |
| Matchups | 978 | Yahoo API |
| Trades | 0 | Not yet imported |

### Working Features ✅
- [x] Yahoo OAuth connection
- [x] League/Season/Team/Matchup sync
- [x] Dashboard with stats overview
- [x] Seasons list page
- [x] Sidebar navigation
- [x] Development auth bypass

---

## Technical Assessment (Dec 6, 2025)

**Stack Snapshot**
- Next.js 16 (App Router) + React 19 with Tailwind v4 and Radix UI; SSR via Supabase client.
- Supabase backing store; RLS currently disabled and `createAdminClient()` is used with `BYPASS_AUTH`.
- Imports: 10 seasons, 22 members, 133 teams, 978 matchups; trades not yet synced; member identity merging is unresolved.

**Key Risks & Mitigations**
- Auth bypass/admin client in UI → restore user-scoped `createClient()` usage, enforce RLS, and remove admin keys from browser routes.
- Data integrity (duplicate members/team names, orphaned matchups) → add canonical identity table + merge tooling; enforce FK/unique constraints and indexed queries/materialized views.
- Heavy stat queries on Next.js routes → pre-aggregate (materialized views or cron refresh) for career stats and H2H matrix; guard with timeouts and loading states.
- Yahoo API instability → scheduled sync with retries/backoff, checksum-based idempotency, and manual CSV import fallback.
- No automated regression net for stats → establish fixtures and `vitest` coverage for calculators plus contract tests around Supabase views.

**Immediate Technical Priorities (before Phase 1 UI ships)**
- [ ] Schema hardening: PK/FK/unique constraints on members/teams/seasons/matchups; indexes on `(league_id, season_year, member_id)` and `(team_id, week)`; cascades for deletions/merges.
- [ ] Data validation job: detect orphaned records, duplicate members, and inconsistent ids; nightly report surfaced to admins.
- [ ] Observability: structured logging with request IDs; error boundaries around App Router layouts; log Supabase query timings.
- [ ] Access control: environment-specific Supabase keys; feature flags for BYPASS_AUTH; server-only admin client; middleware route protection.
- [ ] CI baseline: lint + `vitest` for stat calculators (fixtures from imported seasons) + build step in CI; add happy-path E2E for auth once re-enabled.

---

## UX Design System & Principles

A cohesive design language that makes FantasyMax feel like a premium sports broadcast experience, not a generic stats dashboard.

### Design Philosophy
**Aesthetic Direction:** Sports broadcast meets modern editorial - think ESPN graphics meets Stripe's polish. Bold typography, dramatic data visualization, and motion that tells stories.

**Core Principles:**
1. **Data should feel alive** - Stats aren't just numbers; they're stories waiting to be told
2. **Context over navigation** - Keep users in flow with drawers/modals instead of page jumps
3. **Personality over neutrality** - This is YOUR league; the app should have character
4. **Motion with purpose** - Every animation should reveal meaning, not just look pretty

### Global UX Components

#### Command Palette (⌘+K / Ctrl+K)
**Priority: HIGH** | **Sprint: 1**

The power-user navigation hub - makes the app feel fast, professional, and modern.

- [ ] Global keyboard shortcut (⌘+K / Ctrl+K) opens modal
- [ ] Fuzzy search across managers, seasons, matchups, records
- [ ] Quick navigation: Type "Mike" → "Go to Manager: Mike," "H2H: Mike vs. John"
- [ ] Action shortcuts: "Sync Yahoo," "Start Poll" (commissioner only)
- [ ] Recent searches and suggested queries
- [ ] Implementation: Use `cmdk` library (same as Vercel, Linear, Raycast)

*This is the Phase 1 stepping stone to Phase 7's Natural Language Query - simpler to implement, immediate power-user value.*

#### Skeleton Loaders
**Priority: HIGH** | **Sprint: 1**

Loading states that feel fast and intentional.

- [ ] Animated skeleton screens mimicking content shape (not spinners)
- [ ] Shimmer effect on placeholder blocks
- [ ] Skeleton variants for: cards, tables, charts, avatars
- [ ] Content should "fade in" from skeleton (not pop)

#### Fluid Transitions (Framer Motion)
**Priority: MEDIUM** | **Sprint: 1-2**

Motion that makes the app feel like an application, not a website.

- [ ] Page transitions with shared element animations
- [ ] List filtering/sorting with smooth item rearrangement
- [ ] Staggered reveals on page load (animation-delay cascade)
- [ ] Scroll-triggered animations for data reveals
- [ ] Hover states that surprise and delight

#### Accessibility-First Patterns
**Priority: HIGH** | **Sprint: 1**

Beyond color - every visual encoding has a non-color alternative.

- [ ] Win/Loss indicators: ▲ green + ▼ red (not just color)
- [ ] Heatmaps include pattern overlays for colorblind users
- [ ] Focus states visible and keyboard-navigable
- [ ] Screen reader announcements for dynamic content
- [ ] Reduced motion mode respects `prefers-reduced-motion`

### Visual Design Specifications

#### Typography System
Distinctive fonts that feel like sports broadcast meets premium editorial.

**Recommended Pairings (pick one):**
| Option | Display (Headlines) | Body (Stats/Text) | Vibe |
|--------|---------------------|-------------------|------|
| A | **Bebas Neue** | **DM Sans** | Bold broadcast, ESPN-like |
| B | **Oswald** | **Source Sans Pro** | Athletic, modern |
| C | **Anton** | **Work Sans** | Punchy, high-impact |
| D | **Playfair Display** | **Lato** | Editorial, premium |

- [ ] Establish type scale with CSS variables
- [ ] Headlines: Bold, condensed, all-caps for impact
- [ ] Stats: Tabular numerals (monospace for alignment)
- [ ] Body: Readable, clean, generous line-height

#### Color System
Dramatic palette with dark mode as primary (sports broadcast aesthetic).

**Core Palette:**
```css
/* Dark theme (primary) */
--bg-primary: #0a0a0f;        /* Near-black */
--bg-secondary: #12121a;       /* Card backgrounds */
--bg-elevated: #1a1a24;        /* Hover states */

/* Text */
--text-primary: #ffffff;
--text-secondary: #9ca3af;
--text-muted: #6b7280;

/* Accent - Championship Gold */
--accent-gold: #fbbf24;
--accent-gold-dim: #92702a;

/* Status Colors */
--win: #22c55e;                /* Green */
--loss: #ef4444;               /* Red */
--tie: #eab308;                /* Yellow */

/* Heatmap Scale (wins) */
--heat-5: #166534;             /* Dominant (10-1) */
--heat-4: #22c55e;             /* Strong (8-3) */
--heat-3: #86efac;             /* Slight (6-5) */
--heat-2: #fca5a5;             /* Slight loss */
--heat-1: #ef4444;             /* Bad */
--heat-0: #991b1b;             /* Dominated */
```

- [ ] CSS custom properties for all colors
- [ ] Light mode variant (lower priority)
- [ ] High contrast mode for accessibility

#### Component Library Priorities
Build these reusable components first:

| Component | Priority | Used In |
|-----------|----------|---------|
| `ManagerCard` | HIGH | Managers grid, dashboard |
| `StatBadge` | HIGH | Everywhere |
| `RivalryCard` | HIGH | Profile, H2H, dashboard |
| `RecordPlaque` | MEDIUM | Records page |
| `TimelinePoint` | MEDIUM | Manager profile |
| `HeatmapCell` | HIGH | H2H matrix |
| `DrawerPanel` | HIGH | H2H drilldown, modals |
| `SkeletonCard` | HIGH | All loading states |
| `CommandPalette` | HIGH | Global |

#### Animation Patterns
Consistent motion language across the app.

```css
/* Timing */
--duration-fast: 150ms;      /* Micro-interactions */
--duration-normal: 300ms;    /* Page elements */
--duration-slow: 500ms;      /* Page transitions */

/* Easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* Decelerate */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Symmetric */
```

- [ ] Stagger delay: 50ms between items in lists
- [ ] Entry: Fade up + scale from 0.95
- [ ] Exit: Fade down + scale to 0.98
- [ ] Hover: Scale 1.02 with shadow lift

---

## Phase 1: Core Stats & History (Data-Ready)

These features use existing imported data and provide the historical foundation.

### 1.0 Personalized Dashboard `/dashboard`
**Priority: HIGH** | **Data: Ready**

The user's personal hub - not a generic overview, but *their* story.

**"Your Next Opponent" Card:**
- [ ] Upcoming matchup with opponent avatar
- [ ] All-time H2H record against that opponent
- [ ] Last 3 matchup results as mini timeline
- [ ] "Rivalry status" label (Nemesis, Victim, Even, First Meeting)

**"This Week in Your History" Widget:**
- [ ] Random historical event from current NFL week
- [ ] Examples: "Week 14, 2019: Your highest score ever (178.5 pts)"
- [ ] Rotates on refresh, "Show another" button
- [ ] Links to the relevant season/matchup

**Personal Trophy Case:**
- [ ] Championships (🏆) with years
- [ ] Records held (if any)
- [ ] Awards won
- [ ] "Career highlights" expandable section

**Rivalry Tracker Mini-View:**
- [ ] Top Nemesis with record (who beats you most)
- [ ] Top Victim with record (who you beat most)
- [ ] Click to expand full H2H breakdown

### 1.1 Managers Page `/managers`
**Priority: HIGH** | **Data: Ready**

The heart of the social experience - who are we?

**Dynamic Card Grid:**
- [ ] Each manager is an interactive "card" (not a table row)
- [ ] Card hover: flip/animate to reveal key stat ("2x Champion 🏆")
- [ ] Smooth grid animation when sorting/filtering
- [ ] Avatar with subtle glow for championship winners

**View Toggles:**
- [ ] **Grid View**: Visual cards with avatars, minimal stats
- [ ] **List View**: Dense sortable table with all stats
- [ ] **Power Rank View**: Card size/position based on career win %

**Interactive Sorting & Filtering:**
- [ ] Sort by: Championships, All-Time Wins, Win %, Years Active, Total Points
- [ ] Filter by: Active/Inactive, Championship winners, Decade joined
- [ ] Animated grid rearrangement on sort change

- [ ] Click through to individual manager profile

### 1.2 Manager Profile `/managers/[id]`
**Priority: HIGH** | **Data: Ready**

Deep dive into one manager's history.

**Career Timeline Visualization:**
- [ ] Horizontal interactive timeline (not a table)
- [ ] Each point = one season, hover reveals "10-4, 2nd place"
- [ ] Visual markers: 🏆 championships, 💀 last places
- [ ] Click season → drawer/modal with full season breakdown
- [ ] Trend line showing win % over career

**Broadcast-Style Rivalry Cards:**
- [ ] "Nemesis" card: `[Avatar] John (10W-4L) [Avatar] You`
- [ ] "Victim" card: Same broadcast graphic style
- [ ] Click to see all matchups in that rivalry

**Stats & Records:**
- [ ] Career stats (total points, avg per week, career W-L-T)
- [ ] Personal records (best week, worst week, best season)
- [ ] Best single-week score with opponent and date
- [ ] Team name history across seasons

**Management:**
- [ ] Team name merge ability for multi-email Yahoo users

### 1.3 Head-to-Head `/head-to-head`
**Priority: HIGH** | **Data: Ready**

The rivalry tracker - who owns who?

**Interactive Matrix:**
- [ ] Grid of all manager pairings
- [ ] Cell shows record (e.g., "8-4")
- [ ] Sticky headers for both axes (manager names visible while scrolling)

**In-Context Drilldowns:**
- [ ] Click cell → animated side drawer (not new page)
- [ ] Drawer shows game-by-game history for that rivalry
- [ ] Each game: date, scores, playoff indicator, margin
- [ ] "Close" returns to matrix without losing scroll position

**Heatmap Mode Toggle:**
- [ ] Default: Simple green (winning) / red (losing)
- [ ] Heatmap: Intensity based on dominance (10-1 = deep green, 6-5 = pale green)
- [ ] Pattern overlay option for colorblind accessibility

**Filtering & Highlights:**
- [ ] Dropdown to filter by season range
- [ ] "Biggest Rivalries" auto-highlight (most total matchups with close record)
- [ ] Include/exclude playoff matchups toggle

### 1.4 Records `/records`
**Priority: MEDIUM** | **Data: Ready**

League record book - the legends live here. Treat it like a **virtual trophy room**.

**Trophy Card Design:**
- [ ] Each record is a "digital plaque" or trophy card (not a table row)
- [ ] Prominently feature holder's avatar and name
- [ ] Record value displayed dramatically (large typography)
- [ ] Date/season when record was set

**"Record Broken!" Animations:**
- [ ] Records broken in current/recent season get special treatment
- [ ] Glowing effect, "NEW!" badge, or celebration animation
- [ ] "Previous holder" shown for context

**Categories:**
- [ ] **Single Week**: Highest score, lowest score, biggest blowout, closest game
- [ ] **Season**: Most wins, most points, best record, worst record
- [ ] **All-Time**: Career wins, career points, longest win streak
- [ ] **Playoffs**: Most appearances, most championships, most runner-ups
- [ ] **Dubious**: Most last place finishes, most points against, unluckiest (high PA)

### 1.5 Season Detail Pages `/seasons/[year]`
**Priority: HIGH** | **Data: Ready**

Deep dive into any season's story.

**Interactive Playoff Bracket:**
- [ ] Central, prominent bracket visualization
- [ ] Hover matchup → show final score
- [ ] Click matchup → link to detailed box score
- [ ] Winner path highlighted

**"Season Journey" Chart:**
- [ ] Line chart: each team's rank week-by-week
- [ ] Hover line → highlight that team, show name
- [ ] Visualize narratives: hot starts, collapses, late runs
- [ ] Toggle to show points instead of rank

**Standings & Highlights:**
- [ ] Final standings with records
- [ ] Season champion highlight (trophy, celebration styling)
- [ ] Last place "winner" highlight (skull, shame styling)
- [ ] Season-specific records (high score that year, etc.)

**Week-by-Week:**
- [ ] Expandable/collapsible scoreboard per week
- [ ] Trade activity timeline (when available)

### Phase 1 Technical Notes
- Pre-aggregate season and career stats in Supabase views/materialized views to keep App Router responses fast and predictable.
- Identity mapping must survive Yahoo email changes; add canonical member identity and merge flow before exposing profile editing.
- H2H matrix will need virtualization or pagination on the client to avoid rendering all cells at once.

### Recommended Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| **framer-motion** | Animations | Industry standard for React, layout animations, shared element transitions |
| **cmdk** | Command palette | Same library as Vercel, Linear - proven UX pattern |
| **@tanstack/react-virtual** | Virtualization | H2H matrix with 22x22 cells needs efficient rendering |
| **recharts** or **visx** | Charts | Season journey charts, scatter plots |
| **vaul** | Drawers | Smooth mobile-friendly drawers for H2H drilldowns |
| **sonner** | Toasts | Modern toast notifications |
| **next-themes** | Theme switching | Dark/light mode with SSR support |
| **date-fns** | Date formatting | "Week 14, 2019" display formatting |

### Font Loading Strategy
```tsx
// next/font for optimal loading
import { Bebas_Neue, DM_Sans } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display'
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body'
});
```

---

## Phase 2: Data Enrichment

Import additional data to unlock more features.

### 2.1 Trade Sync
**Priority: MEDIUM** | **Data: Needs Import**

- [ ] Yahoo trade history import
- [ ] Trade detail storage (players exchanged)
- [ ] Trade timeline view
- [ ] "Trade winners/losers" analysis (future)

### 2.2 Draft Data
**Priority: LOW** | **Data: Needs Import**

- [ ] Draft results by year
- [ ] Draft grade history
- [ ] "Best picks" and "Biggest busts" tracking

### 2.3 Weekly Lineups (Optional)
**Priority: LOW** | **Data: Complex**

- [ ] Historical starting lineups
- [ ] "Points left on bench" analysis
- [ ] Optimal lineup comparisons

---

## Phase 3: Social Features

The community-building layer that makes this more than just stats.

### 3.1 Awards System `/awards`
**Priority: MEDIUM** | **Data: Needs Setup**

End-of-season recognition.

Award Types:
- [ ] MVP (Most Valuable Player owner)
- [ ] Comeback Player of the Year
- [ ] Biggest Disappointment
- [ ] Best Waiver Wire Pickup
- [ ] Trade of the Year
- [ ] Worst Trade of the Year
- [ ] Commissioner's Award
- [ ] Rookie of the Year
- [ ] Custom awards (commissioner-defined)

Features:
- [ ] Award history by year
- [ ] Member award counts
- [ ] Award ceremony/reveal page

### 3.2 Hall of Shame `/hall-of-shame`
**Priority: MEDIUM** | **Data: Ready**

Immortalize the last place finishers.

- [ ] Last place "trophy case" with photos
- [ ] Punishment history (if tracked)
- [ ] "Closest to avoiding it" stats
- [ ] Shame leaderboard (most last places)
- [ ] Season-by-season shame inductees

### 3.3 Voting System `/voting`
**Priority: LOW** | **Data: Needs Setup**

Democratic league decisions.

- [ ] Create polls (commissioner)
- [ ] Vote on rule changes
- [ ] Award voting
- [ ] Anonymous vs public voting options
- [ ] Results visualization
- [ ] Historical poll archive

### 3.4 Constitution `/constitution`
**Priority: LOW** | **Data: Needs Setup**

League rules documentation.

- [ ] Formatted rules display
- [ ] Rule categories (scoring, trading, playoffs)
- [ ] Amendment history
- [ ] Version tracking
- [ ] Commissioner notes

### 3.5 Media Gallery `/media`
**Priority: LOW** | **Data: Needs Setup**

League memories and moments.

- [ ] Photo/video upload
- [ ] Tag members in media
- [ ] Event categorization (draft, championship, etc.)
- [ ] Season/year filtering
- [ ] Gallery view with lightbox
- [ ] Member photo collections

---

## Phase 4: Commissioner Tools

Admin features for league management.

### 4.1 Commissioner Writeups
**Priority: MEDIUM** | **Data: Needs Setup**

Season recaps and narratives.

- [ ] Rich text editor for season recaps
- [ ] Weekly power rankings posts
- [ ] Playoff preview articles
- [ ] Publish/draft status
- [ ] Feature on homepage

### 4.2 Member Management
**Priority: MEDIUM** | **Data: Partial**

- [ ] Invite new members via email
- [ ] Link Yahoo accounts to members
- [ ] Role management (commissioner, president, treasurer)
- [ ] Merge duplicate members
- [ ] Deactivate former members

### 4.3 Data Import Tools
**Priority: HIGH** | **Data: In Progress**

- [ ] CSV import wizard
- [ ] Yahoo re-sync functionality
- [ ] Data validation/cleanup tools
- [ ] Import history/logs

### 4.4 League Settings
**Priority: LOW** | **Data: Needs Setup**

- [ ] League name/description
- [ ] Logo upload
- [ ] Scoring settings display
- [ ] Connected platform status

---

## Phase 5: Advanced Analytics

Power-user features for the stat nerds.

### 5.1 Luck Analysis
**Priority: LOW** | **Data: Ready**

- [ ] Expected wins vs actual wins
- [ ] Schedule strength analysis
- [ ] "What if different schedule" simulator
- [ ] Points For vs Points Against scatter plot

### 5.2 Trends & Predictions
**Priority: LOW** | **Data: Ready**

- [ ] Year-over-year performance trends
- [ ] Championship probability model
- [ ] "Due for regression" flags
- [ ] Historical performance charts

### 5.3 Matchup Predictions
**Priority: LOW** | **Data: Ready**

- [ ] H2H historical edge percentages
- [ ] "This week in history" comparisons
- [ ] Rivalry momentum tracking

---

## Phase 6: Polish & Production

Final touches before inviting the league.

### 6.1 Authentication
**Priority: HIGH** | **Blocking**

- [ ] Re-enable Supabase auth
- [ ] Member invitation flow
- [ ] Email verification
- [ ] Password reset
- [ ] Session management

### 6.2 Mobile Experience
**Priority: MEDIUM**

- [ ] Responsive design audit
- [ ] Touch-friendly interactions
- [ ] Mobile navigation improvements
- [ ] PWA support (optional)

### 6.3 Performance
**Priority: MEDIUM**

- [ ] Database query optimization
- [ ] Materialized views for complex stats
- [ ] Image optimization
- [ ] Loading states/skeletons

### 6.4 Notifications
**Priority: LOW**

- [ ] Email notifications for polls
- [ ] New content alerts
- [ ] Championship/shame announcements

---

## Quick Wins (Can Do Anytime)

Small improvements that add polish:

### UX Polish (High Impact)
- [ ] **Skeleton loaders** for all data-fetching pages
- [ ] **Command palette** (⌘+K) - transforms perceived app quality
- [ ] **Staggered animations** on list/grid page loads
- [ ] **Hover micro-interactions** on cards and buttons
- [ ] **Empty state illustrations** with personality (not just text)
- [ ] **404 page** with league humor and search prompt

### Visual Identity
- [ ] Dark mode as default (sports broadcast aesthetic)
- [ ] Favicon and meta tags
- [ ] OG images for sharing (auto-generated for records/stats)
- [ ] Custom cursor on interactive elements (optional)
- [ ] Loading animations with league branding

### Engagement Features
- [ ] "This day in league history" widget
- [ ] Random stat generator ("Did you know...")
- [ ] Share buttons for records (copy link, Twitter/X)
- [ ] Export stats to CSV
- [ ] Season comparison tool
- [ ] "Career highlight reel" auto-generated summary

---

## Release Gates & Quality Bar

- [ ] CI required checks: lint, typecheck, `vitest` stat calculator suite, and `next build` on every PR.
- [ ] Supabase RLS enabled with least-privileged keys; `BYPASS_AUTH` disabled in production; admin client is server-only.
- [ ] Observability: structured logs with request IDs, error boundaries on app shell, uptime monitor for Supabase functions/API.
- [ ] Performance: p95 < 1.5s for dashboard/managers on current dataset; H2H matrix uses virtualization or server-side aggregation.
- [ ] Data quality: nightly validation report free of orphaned/duplicate records; imports are idempotent and logged.
- [ ] Security & compliance: secrets managed via environment, audit trail for commissioner actions, manual review for AI-generated content before publish.

---

## Technical Debt

Items to address as we go:

- [ ] Switch back to `createClient()` from `createAdminClient()` after auth
- [ ] Remove `BYPASS_AUTH` environment variable for production
- [ ] Enable RLS policies properly
- [ ] Add proper error boundaries
- [ ] Set up logging/monitoring
- [ ] Add unit tests for stat calculations
- [ ] E2E tests for critical flows
- [ ] Type safety improvements
- [ ] Database constraints/indexes for seasons/members/teams/matchups; materialized views for heavy aggregates
- [ ] Nightly data validation/cleanup job (orphan detection, duplicate identities, merge audit log)

---

## Suggested Development Order

Based on data availability, UX impact, and "wow" factor:

### Sprint 0: Design System Foundation
*The UX DNA that makes everything else feel premium*

1. **Typography & color system** - CSS variables, font loading
2. **Core component library** - `ManagerCard`, `StatBadge`, `SkeletonCard`, `DrawerPanel`
3. **Animation system** - Framer Motion setup, shared timing/easing constants
4. **Command palette** - Global ⌘+K with basic navigation
5. **Skeleton loading patterns** - Reusable skeleton components

### Sprint 1: Core Stats with Premium UX
*First features members will see - must feel polished*

1. **Personalized Dashboard** - "Your Next Opponent," trophy case, rivalry tracker
2. **Managers page** - Dynamic card grid with view toggles, sorting animations
3. **Manager profile** - Career timeline visualization, broadcast-style rivalry cards
4. **Head-to-Head matrix** - Heatmap mode, in-context drawer drilldowns
5. **Season detail pages** - Interactive playoff bracket, "Season Journey" chart

### Sprint 2: Records & Recognition
*Trophy room experience*

1. **Records page** - Trophy card design, "Record Broken!" animations
2. **Hall of Shame** - Dramatic last-place showcase
3. **Awards system setup** - Award card designs
4. **Commissioner writeups** - Rich text with broadcast-style headers

### Sprint 3: Data Enrichment
1. Trade import from Yahoo
2. Trades page with timeline view
3. Enhanced season pages with trade activity
4. Award assignment UI

### Sprint 4: Production Ready
1. Authentication re-enable (Supabase auth)
2. Member invitation flow
3. Mobile responsive pass (touch targets, navigation)
4. Performance optimization (materialized views, image optimization)

### Sprint 5: Social Layer
1. Voting system with results visualization
2. Media uploads with gallery lightbox
3. Constitution page
4. Notifications

### Sprint 6: AI Features (Optional)
1. Season recap generator
2. Matchup preview generator
3. Natural language stats query
4. Trash talk assistant 🔥

---

## Success Metrics

How we know it's working:

- [ ] All 22 members have accounts and log in
- [ ] Season pages are browsed during NFL season
- [ ] Members reference H2H records in group chat
- [ ] Commissioner uses writeups feature
- [ ] Voting participation > 80%
- [ ] Someone shares a record on social media

---

## Notes

- This is a living document - priorities will shift based on feedback
- Focus on "wow" features first (H2H matrix, Records) over "necessary" features (auth)
- Keep the development experience smooth with BYPASS_AUTH until ready for members
- When in doubt, ship something simple and iterate

---

## Phase 7: AI-Powered Features

Leverage AI to generate content and insights that would be tedious to write manually.

### 7.1 AI Season Recaps `/seasons/[year]/recap`
**Priority: MEDIUM** | **Data: Ready** | **AI: Narrative Generation**

Automatically generate engaging season narratives from data.

- [ ] Generate season story arc (who started hot, who faded, comeback stories)
- [ ] Identify key turning points (biggest upset, playoff clinching moments)
- [ ] Rivalry highlights woven into narrative
- [ ] Championship path storytelling
- [ ] "Commissioner can edit/approve before publishing" workflow
- [ ] Regenerate with different tone options (serious, humorous, ESPN-style)

### 7.2 Matchup Preview Generator
**Priority: MEDIUM** | **Data: Ready** | **AI: Content Generation**

Weekly matchup previews with historical context.

- [ ] Auto-generate preview articles for upcoming matchups
- [ ] Include H2H history, recent form, key stats
- [ ] "Tale of the tape" comparisons
- [ ] Prediction with confidence level based on historical data
- [ ] Shareable preview cards for group chat

### 7.3 Trash Talk Assistant 🔥
**Priority: LOW** | **Data: Ready** | **AI: Fun**

Generate personalized, historically-accurate trash talk.

- [ ] Input: Two managers, Output: Trash talk ammunition
- [ ] References actual H2H record, embarrassing losses, close calls
- [ ] Tone selector (friendly banter → ruthless)
- [ ] "Copy to clipboard" for easy sharing
- [ ] Respects boundaries (no truly mean content)

### 7.4 Natural Language Stats Query
**Priority: MEDIUM** | **Data: Ready** | **AI: Interface**

Ask questions in plain English instead of navigating.

- [ ] "Who has the best record against Mike?"
- [ ] "What's my longest win streak?"
- [ ] "Show me all matchups decided by less than 5 points"
- [ ] "Who's been last place the most?"
- [ ] Convert queries to database lookups, return formatted answers
- [ ] Suggest related queries

### 7.5 Trade Analysis & Grading
**Priority: LOW** | **Data: Needs Trade Import** | **AI: Analysis**

Retrospective trade evaluation.

- [ ] Grade historical trades based on post-trade performance
- [ ] "Trade winner" calculations with confidence intervals
- [ ] Identify patterns (who consistently wins trades, who overpays)
- [ ] Trade timing analysis (deadline deals vs. early season)

### 7.6 AI Power Rankings
**Priority: LOW** | **Data: Ready** | **AI: Analysis + Content**

Weekly auto-generated power rankings with explanations.

- [ ] Algorithm considers: record, points, strength of schedule, trends
- [ ] Written explanations for each ranking ("Despite 2-4 record, has 3rd most points...")
- [ ] Historical comparison ("Last time they started this cold: 2019")
- [ ] Commissioner can override/edit before publishing

### 7.7 Award Nomination Assistant
**Priority: LOW** | **Data: Ready** | **AI: Analysis**

Suggest award candidates based on data analysis.

- [ ] Scan season data for standout performances
- [ ] Generate nominations for each award category with reasoning
- [ ] Identify "snubs" - players who might be overlooked
- [ ] Support custom award criteria

---

## Assumptions & Risks

Things this roadmap takes for granted that should be validated or addressed:

### Data Assumptions
- [ ] **Yahoo API stability** - Yahoo could deprecate/change API. Consider: backup manual entry, ESPN support
- [ ] **10-year history exists** - New leagues have no history. Need: "new league" onboarding path
- [ ] **Data consistency** - Yahoo data is accurate and complete. Need: data validation, dispute resolution
- [ ] **Single league** - App assumes one league. Future: multi-league support?

### User Assumptions
- [ ] **22 members will engage** - Some members may be lurkers. Need: engagement metrics, re-engagement features
- [ ] **Commissioner will maintain** - Commissioner burnout is real. Need: co-commissioner support, automated tasks
- [ ] **Members have Yahoo accounts** - Some may have joined via different emails. Need: account linking/merging
- [ ] **Desktop usage** - Currently desktop-first. Validate: where do members actually browse?
- [ ] **Members care about stats** - Some just want social features. Need: balanced feature focus

### Technical Assumptions
- [ ] **Supabase free tier sufficient** - Monitor: database size, API calls, storage
- [ ] **Next.js 16 stability** - App Router and React 19 concurrency are evolving. Monitor: breaking changes
- [ ] **No offline need** - Members always have internet. Consider: PWA caching for read-only

---

## Missing Features to Consider

Features not in original phases that may be needed:

### User Experience Gaps
- [ ] **Search** - Search across members, seasons, matchups, trades
- [ ] **Onboarding flow** - First-time member experience, tour of features
- [ ] **Notification preferences** - Let members control what they're notified about
- [ ] **Bookmarks/favorites** - Save interesting matchups, stats, pages
- [ ] **Quick stats widget** - "My stats at a glance" dashboard card

### Data & Administration
- [ ] **Data export** - Members may want to export their own history
- [ ] **Audit log** - Track commissioner actions for transparency
- [ ] **Scheduled syncs** - Auto-sync from Yahoo on schedule (not just manual)
- [ ] **Data validation UI** - Review/fix data discrepancies
- [ ] **Dispute resolution** - Process when members disagree about data accuracy

### Platform Expansion (Future)
- [ ] **ESPN integration** - Many leagues use ESPN instead of Yahoo
- [ ] **Sleeper integration** - Growing platform, especially younger leagues
- [ ] **Multi-league support** - Members in multiple leagues see all their history
- [ ] **Public "hall of fame" page** - Shareable public page (opt-in) for bragging

### Accessibility & Compliance
- [ ] **WCAG 2.1 AA compliance** - Screen reader support, keyboard navigation
- [ ] **Color blind friendly** - Don't rely solely on red/green for win/loss
- [ ] **Reduced motion option** - For members with vestibular disorders

---

## AI Implementation Notes

### When AI Adds Value
✅ **Narrative generation** - Turning data into stories is tedious for humans, natural for AI
✅ **Pattern recognition** - Finding interesting stats humans might miss
✅ **Natural language interface** - Lower barrier to accessing complex data
✅ **Content drafts** - Commissioner can edit AI drafts faster than writing from scratch

### When AI is Overkill
❌ **Simple calculations** - Just calculate win percentage, don't ask AI
❌ **Data display** - Tables and charts don't need AI
❌ **User authentication** - Security should be deterministic
❌ **Basic CRUD** - Creating/editing records doesn't need AI

### Implementation Approach
1. **AI features should be opt-in** - Not everyone wants AI-generated content
2. **Human review for published content** - AI drafts, commissioner approves
3. **Clear labeling** - Mark AI-generated content so members know
4. **Graceful degradation** - App works fully without AI features
5. **Local-first where possible** - Consider smaller models for simple tasks

---

*"The best time to start tracking your league history was 10 years ago. The second best time is now."*
