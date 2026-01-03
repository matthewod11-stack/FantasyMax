# Phase 8: UI/UX Review - "Make It Wow" Plan

**Created:** January 2, 2026
**Goal:** Polish FantasyMax to create a "wow" experience before league launch
**Focus:** High-impact visual refinements, consistency, and micro-interactions

---

## Executive Summary

The app has solid foundations (dark theme, championship gold, semantic colors) but needs polish in:
1. **Typography consistency** - 40% of pages use wrong heading pattern
2. **Micro-interactions** - No hover scale/shadow on interactive elements
3. **Color refinement** - Muted grays feel flat, borders too subtle
4. **Championship presence** - Missing "wow" animations for winners

---

## Phase 1: Design System Fixes (Quick Wins)

**Files to modify:** `src/app/globals.css`

| Change | Current | Target | Impact |
|--------|---------|--------|--------|
| Muted foreground | `#9ca3af` (gray-400) | `#94a3b8` (slate-400) | Sophisticated blue tint |
| Border opacity | `0.1` | `0.12` | More visible on dark |
| Add elevation tokens | None | `--card-elevated`, `--card-overlay` | Layered UI depth |
| Championship pulse | None | `@keyframes championship-pulse` | Wow factor for champs |
| Reduced motion | None | `@media (prefers-reduced-motion)` | Accessibility |

---

## Phase 2: Card & Shadow Elevation

**Files to modify:** `src/components/ui/card.tsx`

| Change | Current | Target | Impact |
|--------|---------|--------|--------|
| Card shadow | `shadow-sm` | `shadow-lg` | Premium depth perception |
| Add hover transition | None | `transition-shadow duration-200` | Smooth hover effect |

---

## Phase 3: Typography Consistency

**Standardize page headers to use branded `.font-display` pattern:**

| Page | Current | Target |
|------|---------|--------|
| `/page.tsx` (dashboard) | `text-3xl font-bold` | `text-display-lg` or `font-display text-4xl` |
| `/managers/page.tsx` | `text-3xl font-bold` | `font-display text-4xl tracking-wide` |
| `/head-to-head/page.tsx` | `text-3xl font-bold` | `font-display text-4xl tracking-wide` |
| `/seasons/page.tsx` | `text-3xl font-bold` | `font-display text-4xl tracking-wide` |
| `/media/page.tsx` | `text-3xl font-bold` | `font-display text-4xl tracking-wide` |

**Already correct (no changes needed):**
- `/records/page.tsx`
- `/awards/page.tsx`
- `/hall-of-shame/page.tsx`
- `/writeups/page.tsx`
- `/voting/page.tsx`, `/constitution/page.tsx`, `/trades/page.tsx`

---

## Phase 4: Hover States & Micro-Interactions

### 4a. Dashboard Components

**File:** `src/components/features/dashboard/AllTimeLeaderboard.tsx`
- Add `hover:scale-[1.02] hover:shadow-md` to leaderboard rows
- Change `transition-colors` → `transition-all duration-200`
- Add `active:scale-[0.98]` for press feedback

**File:** `src/components/features/dashboard/HotRivalries.tsx`
- Increase rivalry bar height: `h-2` → `h-3`
- Add `transition-all duration-300` to bar fills

**File:** `src/components/features/dashboard/RecentHighlights.tsx`
- Add left border accent: `border-l-2` with semantic color
- Add hover scale to highlight items

### 4b. HeatmapCell Fix

**File:** `src/components/ui/heatmap-cell.tsx`
- Reduce hover scale: `hover:scale-105` → `hover:scale-[1.02]`
- Add custom shadow: `hover:shadow-[0_8px_16px_rgba(0,0,0,0.4)]`

### 4c. StatBadge Enhancement

**File:** `src/components/ui/stat-badge.tsx`
- Add hover feedback: `hover:scale-[1.02] active:scale-[0.98]`
- Change `transition-all` → `transition-[background-color,border-color,transform]`
- Use `glow-gold-lg` for championship variant (stronger glow)

---

## Phase 5: Section Spacing Standardization

**Standardize to `space-y-10` for main sections (balanced between 8 and 12):**

| Page | Current | Target |
|------|---------|--------|
| Dashboard | `space-y-8` | `space-y-10` |
| All other pages | `space-y-6` | `space-y-8` |

---

## Phase 6: Championship Glow Animation (Wow Factor)

**Add to globals.css:**
```css
@keyframes championship-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); }
}

.glow-gold-animate {
  animation: championship-pulse 3s ease-in-out infinite;
}
```

**Apply to:**
- Season champion cards (LatestSeasonCard)
- Championship badges on manager profiles
- Trophy icons in leaderboards
- Winner highlights in records page

---

## Phase 7: Shorten AI Summaries

**File:** `scripts/generate-h2h-recaps.ts`
- Update prompt to limit recaps to 3-4 sentences max
- Regenerate all 91 rivalry recaps with shorter prompts

**File:** `scripts/generate-season-reviews.ts` (if exists)
- Review current prompt, shorten if needed
- Regenerate season reviews if too long

---

## Implementation Order (Priority)

### Batch 1: Foundation (10 min)
1. globals.css color/shadow fixes
2. card.tsx shadow upgrade
3. Championship pulse animation

### Batch 2: Typography (15 min)
4. Dashboard heading fix
5. Managers page heading fix
6. H2H, Seasons, Media heading fixes

### Batch 3: Interactions (20 min)
7. Dashboard hover states
8. HeatmapCell scale fix
9. StatBadge enhancement

### Batch 4: Verification (10 min)
10. Browser visual check
11. Mobile responsiveness spot check
12. Build verification

---

## Files to Modify (Complete List)

```
src/app/globals.css                                    # Colors, shadows, animations
src/components/ui/card.tsx                             # Shadow elevation
src/components/ui/stat-badge.tsx                       # Hover states, championship glow
src/components/ui/heatmap-cell.tsx                     # Scale reduction
src/app/(dashboard)/page.tsx                           # Typography, spacing
src/app/(dashboard)/managers/page.tsx                  # Typography
src/app/(dashboard)/head-to-head/page.tsx              # Typography
src/app/(dashboard)/seasons/page.tsx                   # Typography
src/app/(dashboard)/media/page.tsx                     # Typography
src/components/features/dashboard/AllTimeLeaderboard.tsx  # Hover states
src/components/features/dashboard/HotRivalries.tsx     # Bar height, transitions
src/components/features/dashboard/RecentHighlights.tsx # Border accents
```

---

## Success Criteria

- [ ] All page headers use `font-display text-4xl tracking-wide`
- [ ] Cards have visible shadows (`shadow-lg`)
- [ ] Interactive elements scale subtly on hover (`scale-[1.02]`)
- [ ] Championship elements pulse with gold glow
- [ ] Muted text has sophisticated blue tint
- [ ] HeatmapCell hover feels smooth (102% not 105%)
- [ ] Build passes with no errors
- [ ] Visual verification in browser confirms "wow" factor

---

## Out of Scope (V2)

- Missing skeleton components for Seasons/Media/Trades
- Centralized StatCard component extraction
- Full accessibility audit (focus states, reduced motion)

---

## User Choices Summary

| Decision | Choice |
|----------|--------|
| Championship glow | **Pulsing animation** (3s subtle gold pulse) |
| Hover states | **Scale + shadow** (premium Apple-like feel) |
| AI summaries | **Regenerate shorter** (3-4 sentences max) |
