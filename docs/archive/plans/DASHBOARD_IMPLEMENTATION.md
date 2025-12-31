# Sprint 1.4: Personalized Dashboard Implementation Plan

**Created:** 2025-12-08
**Status:** Ready for Implementation
**Session:** Single-feature focus on Dashboard

---

## Summary

Transform the generic league dashboard into a personalized member experience with 4 widgets:
1. **Next Opponent Card** - Upcoming matchup with H2H history
2. **This Week in History Widget** - Random historical events from same NFL week
3. **Personal Trophy Case** - Championships, records held, awards
4. **Rivalry Tracker Mini-View** - Top nemesis and victim at a glance

---

## Architecture Overview

```
src/app/(dashboard)/page.tsx          # Server component - fetches DashboardData
src/components/features/dashboard/
  ├── index.ts                        # Barrel exports
  ├── NextOpponentCard.tsx            # Client - upcoming matchup widget
  ├── HistoryWidget.tsx               # Client - "this week in history"
  ├── TrophyCase.tsx                  # Client - championships + records
  ├── RivalryTracker.tsx              # Client - nemesis/victim mini-view
  └── DashboardSkeleton.tsx           # Loading state for all widgets
```

**Data Flow:**
```
layout.tsx (resolves member)
     → page.tsx doesn't have member prop (current pattern)
     → page.tsx fetches member from DB using commissioner fallback
     → getDashboardData(memberId) called
     → Widgets receive data via props
```

---

## Implementation Steps

### Step 1: Create Dashboard Feature Directory
- [ ] Create `src/components/features/dashboard/` directory
- [ ] Create `index.ts` barrel export file

### Step 2: Update Dashboard Page (`page.tsx`)
**File:** `src/app/(dashboard)/page.tsx`

The current page shows generic league stats. Transform it to:
1. Get current member (same pattern as layout.tsx - commissioner fallback)
2. Call `getDashboardData(member.id)` from `@/lib/supabase/queries`
3. Call `getThisWeekInHistory(member.id, currentWeek)` for history widget
4. Render personalized greeting + 4 widget grid

**Key change:** The page becomes the user's personal hub, not a league overview.

### Step 3: NextOpponentCard Component
**File:** `src/components/features/dashboard/NextOpponentCard.tsx`

**Props:**
```typescript
interface NextOpponentCardProps {
  upcomingMatchup: UpcomingMatchup | null;
  memberName: string;
}
```

**Features:**
- [ ] Opponent avatar + name
- [ ] All-time H2H record (e.g., "5-3")
- [ ] Last 3 results as W/L/T badges
- [ ] Rivalry status label (Nemesis/Victim/Even/First Meeting)
- [ ] Empty state: "Season hasn't started" or "No upcoming games"

**Reuse:** `ManagerAvatar` from `@/components/ui/manager-avatar`

### Step 4: HistoryWidget Component
**File:** `src/components/features/dashboard/HistoryWidget.tsx`

**Props:**
```typescript
interface HistoryWidgetProps {
  events: HistoricalEvent[];
  currentWeek: number;
}
```

**Features:**
- [ ] Shows 1 random event from `thisWeekInHistory`
- [ ] "Show another" button to cycle through events
- [ ] Event card with year badge, description, value
- [ ] Icons by event type (trophy, flame, chart)
- [ ] Empty state: "No history for this week yet"

### Step 5: TrophyCase Component
**File:** `src/components/features/dashboard/TrophyCase.tsx`

**Props:**
```typescript
interface TrophyCaseProps {
  championships: { years: number[]; total: number };
  recordsHeld: LeagueRecordRow[];
  careerStats: CareerStatsRow;
}
```

**Features:**
- [ ] Championship years displayed as gold badges
- [ ] Records held as mini trophy cards (limited to 3)
- [ ] Career highlights: Win %, Playoff appearances
- [ ] Empty state: "No trophies yet - keep playing!"

**Reuse:** `StatBadge` from `@/components/ui/stat-badge`

### Step 6: RivalryTracker Component
**File:** `src/components/features/dashboard/RivalryTracker.tsx`

**Props:**
```typescript
interface RivalryTrackerProps {
  member: Member;
  topNemesis: RivalryData | null;
  topVictim: RivalryData | null;
}
```

**Features:**
- [ ] Two compact rivalry cards side-by-side
- [ ] Nemesis (red accent) and Victim (green accent)
- [ ] Shows record and "View H2H" link
- [ ] Empty states for each if no data

**Reuse:** Adapt `RivalryCard` pattern from `@/components/features/managers/RivalryCard.tsx`

### Step 7: DashboardSkeleton Component
**File:** `src/components/features/dashboard/DashboardSkeleton.tsx`

- [ ] Skeleton states for all 4 widgets
- [ ] Uses `SkeletonCard` pattern from `@/components/ui/skeleton-card`

### Step 8: Wrap Page with Suspense
- [ ] Update `page.tsx` to use Suspense boundary with `DashboardSkeleton` fallback

### Step 9: Session Closeout
- [ ] Run `npm run build` to verify
- [ ] Update `PROGRESS.md` with session entry
- [ ] Update `features.json` status
- [ ] Check off roadmap items

---

## Key Files to Modify

| File | Action |
|------|--------|
| `src/app/(dashboard)/page.tsx` | **Major rewrite** - personalized dashboard |
| `src/components/features/dashboard/*.tsx` | **Create** - 5 new files |

## Dependencies (Already Exist)

| Dependency | Location | Purpose |
|------------|----------|---------|
| `getDashboardData()` | `src/lib/supabase/queries/dashboard.ts` | Aggregates all dashboard data |
| `getThisWeekInHistory()` | `src/lib/supabase/queries/dashboard.ts` | Historical events for week |
| `ManagerAvatar` | `src/components/ui/manager-avatar.tsx` | Avatar with champion glow |
| `StatBadge` | `src/components/ui/stat-badge.tsx` | Stats display component |
| `RivalryCard` (pattern) | `src/components/features/managers/RivalryCard.tsx` | Reference for rivalry UI |
| Contract types | `src/types/contracts/queries.ts` | Type definitions |

---

## Current Week Logic

For "This Week in History", we need to determine the current NFL week. Options:
1. **Hardcode for now** - Use week 14 (December timeframe)
2. **Calculate from date** - NFL season week calculation
3. **Query from matchups** - Find highest week with `status='scheduled'`

**Recommendation:** Option 3 - query highest scheduled week from current season, fallback to week 1.

---

## Design Decisions

**Layout:** 2x2 grid on desktop, stacked on mobile
```
┌─────────────────┬─────────────────┐
│ Next Opponent   │ Trophy Case     │
├─────────────────┼─────────────────┤
│ This Week       │ Rivalry Tracker │
└─────────────────┴─────────────────┘
```

**Empty States:** Each widget handles its own empty state gracefully. Dashboard still shows personalized greeting even with no data.

**Animations:** Staggered card entrance using existing animation system (`--duration-stagger`).

---

## Type Definitions Reference

From `src/types/contracts/queries.ts`:

```typescript
interface DashboardData {
  member: Member;
  careerStats: CareerStatsRow;
  topNemesis: RivalryData | null;
  topVictim: RivalryData | null;
  upcomingMatchup: UpcomingMatchup | null;
  thisWeekInHistory: HistoricalEvent[];
  championships: { years: number[]; total: number };
  recordsHeld: LeagueRecordRow[];
}

interface UpcomingMatchup {
  opponent: Member;
  h2h_record: [number, number]; // [your wins, their wins]
  last_three_results: ('W' | 'L' | 'T')[];
  rivalry_type: 'nemesis' | 'victim' | 'rival' | 'even' | 'first_meeting';
}

interface HistoricalEvent {
  event_type: 'high_score' | 'low_score' | 'championship' | 'playoff' | 'blowout' | 'upset';
  description: string;
  season_year: number;
  week: number;
  value?: number;
  matchup_id?: string;
}

interface RivalryData {
  opponent: Member;
  wins: number;
  losses: number;
  ties: number;
  rivalry_type: 'nemesis' | 'victim' | 'rival' | 'even';
  total_matchups: number;
  last_matchup_date: string | null;
}
```

---

## Verification Checklist

- [ ] `npm run build` passes
- [ ] Dashboard shows personalized greeting with member name
- [ ] Next Opponent widget displays or shows empty state
- [ ] History widget cycles through events
- [ ] Trophy Case shows championships and records
- [ ] Rivalry Tracker shows nemesis/victim
- [ ] Mobile responsive (stacked layout)
- [ ] Loading skeletons display during data fetch

---

## Session Continuation

If implementation spans multiple sessions:
1. Reference this document at session start
2. Check off completed steps above
3. Continue from next unchecked step
4. Update `PROGRESS.md` after each session
