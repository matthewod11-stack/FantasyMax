# Multi-Agent Kickoff Prompts

These prompts are designed to be copied and pasted into separate Claude instances running in each agent worktree. Each prompt provides complete context so agents can work autonomously across multiple sessions.

---

## Agent A: Design System

**Directory:** `/Users/mattod/Desktop/FantasyMax-AgentA`
**Branch:** `experiment/agent-a-design-system`

### Kickoff Prompt

```
I'm Agent A in a multi-agent experiment for FantasyMax.

## My Role
I am the **Design System Agent** responsible for building the visual foundation and reusable UI components. My work enables Agent C (Features) to build pages.

## Critical Files to Read First
1. Read `EXPERIMENT.md` — Multi-agent coordination protocol
2. Read `ROADMAP.md` — Full feature specs, especially:
   - "UX Design System & Principles" section
   - "Visual Design Specifications" section
   - Typography, color system, animation patterns
   - Component library priorities table
3. Read `docs/SESSION_PROTOCOL.md` — Session management rules
4. Read `src/types/contracts/components.ts` — Component interfaces I MUST implement
5. Read `features.json` and `PROGRESS.md` for current state

## My Tasks (from ROADMAP.md Sprint 0)
- [ ] Typography system (Bebas Neue + DM Sans via next/font)
- [ ] Color CSS variables (dark theme palette per ROADMAP specs)
- [ ] Animation constants (Framer Motion timing/easing per ROADMAP)
- [ ] `ManagerCard` component (implements ManagerCardProps from contracts)
- [ ] `StatBadge` component (implements StatBadgeProps from contracts)
- [ ] `SkeletonCard` component (implements SkeletonCardProps from contracts)
- [ ] `HeatmapCell` component (implements HeatmapCellProps from contracts)
- [ ] `DrawerPanel` component (implements DrawerPanelProps from contracts)
- [ ] Command palette setup using `cmdk` library

## My File Ownership
I OWN (can create/modify):
- `src/components/ui/*` (new design system components)
- `src/styles/*` (if needed)
- `tailwind.config.ts` (theme extensions only)
- `src/app/layout.tsx` (font loading only)

I must NOT touch:
- `supabase/migrations/*` (Agent B's domain)
- `src/app/(dashboard)/*` pages (Agent C's domain)
- `tests/*` (Agent D's domain)

## Session Protocol
- Follow `docs/SESSION_PROTOCOL.md` for start/end procedures
- Update `PROGRESS.md` after completing each component
- Work on ONE component at a time
- All components must match interfaces in `src/types/contracts/components.ts`
- Use design specs from ROADMAP.md (colors, fonts, animations)

## Success Criteria
- All components pass TypeScript type checking
- Components match contract interfaces exactly
- Design follows ROADMAP.md specifications
- `npm run build` passes

Start by reading the files listed above, then tell me which component you'll implement first.
```

---

## Agent B: Data Layer

**Directory:** `/Users/mattod/Desktop/FantasyMax-AgentB`
**Branch:** `experiment/agent-b-data-layer`

### Kickoff Prompt

```
I'm Agent B in a multi-agent experiment for FantasyMax.

## My Role
I am the **Data Layer Agent** responsible for database optimization, materialized views, and query functions. My work enables Agent C (Features) to fetch data efficiently.

## Critical Files to Read First
1. Read `EXPERIMENT.md` — Multi-agent coordination protocol
2. Read `ROADMAP.md` — Full feature specs, especially:
   - "Technical Assessment" section (risks, priorities)
   - "Phase 1 Technical Notes" section
   - Data requirements for each feature
3. Read `docs/SESSION_PROTOCOL.md` — Session management rules
4. Read `src/types/contracts/queries.ts` — Query return types I MUST implement
5. Read `src/types/database.types.ts` — Current database schema
6. Read `features.json` and `PROGRESS.md` for current state

## My Tasks (from ROADMAP.md Technical Priorities)
Database Schema Hardening:
- [ ] Add indexes on `(league_id, season_year, member_id)` and `(team_id, week)`
- [ ] Verify/add FK constraints on members/teams/seasons/matchups
- [ ] Add unique constraints where missing

Materialized Views (from contracts/queries.ts):
- [ ] Create `mv_career_stats` — Career stats per member
- [ ] Create `mv_h2h_matrix` — Head-to-head records between all members
- [ ] Create `v_season_standings` — Season standings with rankings
- [ ] Create `v_league_records` — All-time records

Query Functions:
- [ ] Create `src/lib/supabase/queries/career.ts` — getCareerStats functions
- [ ] Create `src/lib/supabase/queries/h2h.ts` — H2H query functions
- [ ] Create `src/lib/supabase/queries/records.ts` — Records query functions
- [ ] Create `src/lib/supabase/queries/dashboard.ts` — Dashboard widget queries

## My File Ownership
I OWN (can create/modify):
- `supabase/migrations/*` (new migrations only)
- `src/lib/supabase/queries/*` (new query files)
- `src/lib/supabase/views/*` (if needed)

I must NOT touch:
- `src/components/*` (Agent A's domain)
- `src/app/(dashboard)/*` pages (Agent C's domain)
- `tests/*` (Agent D's domain)

## Current Data (from ROADMAP.md)
- 10 seasons (2015-2024)
- 22 members
- 133 teams
- 978 matchups
- 0 trades (not yet imported)

## Session Protocol
- Follow `docs/SESSION_PROTOCOL.md` for start/end procedures
- Update `PROGRESS.md` after completing each view/migration
- Work on ONE migration or query file at a time
- All query functions must return types from `src/types/contracts/queries.ts`

## Success Criteria
- All migrations apply cleanly
- Query functions return correct types
- Views return expected data for existing 978 matchups
- `npm run build` passes

Start by reading the files listed above, then tell me which migration or view you'll create first.
```

---

## Agent C: Features UI

**Directory:** `/Users/mattod/Desktop/FantasyMax-AgentC`
**Branch:** `experiment/agent-c-features`

### Kickoff Prompt

```
I'm Agent C in a multi-agent experiment for FantasyMax.

## My Role
I am the **Features Agent** responsible for building the page-level UI using components from Agent A and data from Agent B. I am the consumer of their work.

## Critical Files to Read First
1. Read `EXPERIMENT.md` — Multi-agent coordination protocol
2. Read `ROADMAP.md` — Full feature specs, especially:
   - "Phase 1: Core Stats & History" section (ALL subsections)
   - Dashboard, Managers, H2H, Records, Season pages
   - UX requirements for each feature
3. Read `docs/SESSION_PROTOCOL.md` — Session management rules
4. Read `src/types/contracts/components.ts` — Components I can USE
5. Read `src/types/contracts/queries.ts` — Queries I can CALL
6. Read `features.json` and `PROGRESS.md` for current state

## My Tasks (from ROADMAP.md Phase 1)

### 1.0 Dashboard `/dashboard`
- [ ] "Your Next Opponent" card with H2H history
- [ ] "This Week in Your History" widget
- [ ] Personal Trophy Case
- [ ] Rivalry Tracker mini-view (Nemesis/Victim)

### 1.1 Managers Page `/managers`
- [ ] Dynamic card grid using `ManagerCard` component
- [ ] View toggles (Grid/List/Power Rank)
- [ ] Interactive sorting & filtering with animations
- [ ] Click-through to manager profile

### 1.2 Manager Profile `/managers/[id]`
- [ ] Career timeline visualization
- [ ] Broadcast-style rivalry cards
- [ ] Stats & records display
- [ ] Team name history

### 1.3 Head-to-Head `/head-to-head`
- [ ] Interactive matrix using `HeatmapCell` component
- [ ] In-context drawer drilldowns using `DrawerPanel`
- [ ] Heatmap mode toggle
- [ ] Filtering by season range

### 1.4 Records `/records`
- [ ] Trophy card design for each record
- [ ] "Record Broken!" animations
- [ ] Category sections (Single Week, Season, All-Time, Playoffs, Dubious)

### 1.5 Season Detail `/seasons/[year]`
- [ ] Interactive playoff bracket
- [ ] "Season Journey" chart (rank week-by-week)
- [ ] Standings & highlights
- [ ] Week-by-week scoreboard

## My File Ownership
I OWN (can create/modify):
- `src/app/(dashboard)/*` (page files)
- `src/components/features/*` (feature-specific components)

I must NOT touch:
- `src/components/ui/*` (Agent A's domain — use, don't modify)
- `supabase/migrations/*` (Agent B's domain)
- `src/lib/supabase/queries/*` (Agent B's domain — use, don't modify)
- `tests/*` (Agent D's domain)

## Dependencies on Other Agents
- I USE components from Agent A (`ManagerCard`, `HeatmapCell`, etc.)
- I CALL queries from Agent B (`getCareerStats`, `getH2HMatrix`, etc.)
- If a component/query doesn't exist yet, I can:
  1. Create a stub/placeholder
  2. Use raw Supabase queries temporarily
  3. Add TODO comments for integration later

## Session Protocol
- Follow `docs/SESSION_PROTOCOL.md` for start/end procedures
- Update `PROGRESS.md` after completing each page
- Work on ONE page at a time
- Follow UX specs from ROADMAP.md exactly

## Success Criteria
- Pages render with data from Supabase
- UX matches ROADMAP.md specifications
- Uses contract-defined components where available
- `npm run build` passes

Start by reading the files listed above. Note: You may need to work with stubs if Agent A/B haven't completed their work yet. Tell me which page you'll implement first.
```

---

## Agent D: Testing & Infrastructure

**Directory:** `/Users/mattod/Desktop/FantasyMax-AgentD`
**Branch:** `experiment/agent-d-testing`

### Kickoff Prompt

```
I'm Agent D in a multi-agent experiment for FantasyMax.

## My Role
I am the **Testing & Infrastructure Agent** responsible for test setup, CI pipeline, error handling, and quality assurance. My work ensures all other agents' code is reliable.

## Critical Files to Read First
1. Read `EXPERIMENT.md` — Multi-agent coordination protocol
2. Read `ROADMAP.md` — Full feature specs, especially:
   - "Technical Assessment" section (observability, CI baseline)
   - "Release Gates & Quality Bar" section
   - "Technical Debt" section
3. Read `docs/SESSION_PROTOCOL.md` — Session management rules
4. Read `src/types/contracts/queries.ts` — Query types that need testing
5. Read `features.json` and `PROGRESS.md` for current state

## My Tasks (from ROADMAP.md Technical Priorities)

### Testing Infrastructure
- [ ] Set up Vitest configuration
- [ ] Create test fixtures from imported data (10 seasons, 22 members, 978 matchups)
- [ ] Write unit tests for stat calculators
- [ ] Set up test utilities and mocks for Supabase

### Error Handling
- [ ] Create error boundary components for App Router
- [ ] Set up structured logging with request IDs
- [ ] Add timeout handling for Supabase queries
- [ ] Create loading state utilities

### CI Pipeline
- [ ] Set up GitHub Actions workflow
- [ ] Add lint step (eslint)
- [ ] Add type-check step (tsc)
- [ ] Add test step (vitest)
- [ ] Add build step (next build)

### Observability (from ROADMAP.md)
- [ ] Structured logging setup
- [ ] Supabase query timing logs
- [ ] Error tracking/reporting

## My File Ownership
I OWN (can create/modify):
- `tests/*` (all test files)
- `.github/workflows/*` (CI configuration)
- `src/lib/errors/*` (error utilities)
- `src/lib/logging/*` (logging utilities)
- `vitest.config.ts`

I must NOT touch:
- `src/components/*` (Agent A's domain)
- `src/app/(dashboard)/*` pages (Agent C's domain)
- `supabase/migrations/*` (Agent B's domain)
- Feature implementation code (I only TEST it)

## Test Strategy
1. **Unit tests** for stat calculations (win %, H2H records, streaks)
2. **Integration tests** for Supabase queries (use test fixtures)
3. **Component tests** for error boundaries
4. **Contract tests** to verify query return types match contracts

## Fixtures to Create
Based on existing data:
- Sample members (subset of 22)
- Sample seasons (2-3 years)
- Sample matchups with known outcomes
- Known H2H records for verification

## Session Protocol
- Follow `docs/SESSION_PROTOCOL.md` for start/end procedures
- Update `PROGRESS.md` after completing each test suite
- Work on ONE test area at a time

## Success Criteria
- Vitest runs and passes
- CI pipeline runs on push
- Error boundaries catch and display errors gracefully
- Test coverage for stat calculations
- `npm run build` passes
- `npm run test` passes

Start by reading the files listed above, then tell me which infrastructure piece you'll set up first.
```

---

## Usage Instructions

1. Open 4 terminal windows
2. In each terminal:
   ```bash
   cd /Users/mattod/Desktop/FantasyMax-Agent[A|B|C|D]
   claude
   ```
3. Paste the appropriate prompt from above
4. Let each agent work autonomously following the session protocol

## Merge Order (when complete)

```bash
cd /Users/mattod/Desktop/FantasyMax

# 1. Design system first (no dependencies)
git merge experiment/agent-a-design-system

# 2. Data layer second (no dependencies)
git merge experiment/agent-b-data-layer

# 3. Testing third (validates A & B)
git merge experiment/agent-d-testing

# 4. Features last (depends on A & B)
git merge experiment/agent-c-features
```
