# Multi-Agent Orchestration Experiment

**Branch:** `experiment/multi-agent-orchestration`
**Created:** December 6, 2025
**Goal:** Test parallel development using multiple Claude instances to accelerate ROADMAP.md completion

---

## The Hypothesis

By dividing work across 4 specialized agents with clear boundaries, we can:
1. Complete Sprint 0 + Sprint 1 faster than sequential development
2. Maintain code quality through defined contracts
3. Avoid merge conflicts through strict file ownership

---

## Agent Assignments

### Agent A: Design System Foundation
**Focus:** Visual DNA and reusable components

**Owns:**
- `src/components/ui/` (new components)
- `src/styles/` (if created)
- `tailwind.config.ts` (theme extensions)

**Tasks:**
- [x] Typography system (Bebas Neue + DM Sans via next/font)
- [x] Color CSS variables (dark theme palette from ROADMAP)
- [x] Animation constants (Framer Motion timing/easing)
- [x] `ManagerCard` component
- [x] `StatBadge` component
- [x] `SkeletonCard` component
- [x] `HeatmapCell` component
- [x] Command palette setup (cmdk)
- [x] `DrawerPanel` component (bonus)
- [x] `ManagerAvatar` component (bonus)

**Does NOT touch:**
- Database/Supabase
- API routes
- Page components

---

### Agent B: Data & API Layer
**Focus:** Database optimization and query performance

**Owns:**
- `supabase/migrations/`
- `src/lib/supabase/queries/` (new)
- `src/lib/supabase/views/` (new)

**Tasks:**
- [ ] Create materialized view: `career_stats`
- [ ] Create materialized view: `h2h_matrix`
- [ ] Create materialized view: `season_standings`
- [ ] Add database indexes per ROADMAP technical notes
- [ ] Add FK constraints where missing
- [ ] Create query helpers for common patterns

**Does NOT touch:**
- UI components
- Page layouts
- Styling

---

### Agent C: Feature UI Pages
**Focus:** Page implementations using Agent A's components + Agent B's data

**Owns:**
- `src/app/(dashboard)/` (page files)
- `src/components/features/` (feature-specific components)

**Depends on:**
- Agent A's components (can use stubs initially)
- Agent B's queries (can use raw queries initially)

**Tasks:**
- [ ] Dashboard page with widgets
- [ ] Managers grid page
- [ ] Manager profile page
- [ ] H2H matrix page
- [ ] Records page
- [ ] Season detail page

**Does NOT touch:**
- Base UI components (Agent A's domain)
- Database migrations (Agent B's domain)

---

### Agent D: Testing & Infrastructure
**Focus:** Quality assurance and developer experience

**Owns:**
- `tests/`
- `.github/workflows/`
- `src/lib/errors/` (new)

**Tasks:**
- [ ] Vitest configuration
- [ ] Test fixtures from imported data
- [ ] Stat calculator unit tests
- [ ] Error boundary components
- [ ] Structured logging setup
- [ ] CI pipeline (lint, typecheck, test, build)

**Does NOT touch:**
- Feature implementations
- UI components
- Database schema

---

## Coordination Protocol

### Contracts (Shared Interfaces)

Before agents begin parallel work, establish contracts in:
```
src/types/contracts/
  ├── components.ts    # Component prop interfaces
  ├── queries.ts       # Query return types
  └── api.ts           # API response shapes
```

All agents reference these contracts. Changes require coordination.

### Communication Checkpoints

1. **After each agent completes a task:** Update this file's checklist
2. **Before modifying a shared file:** Check with orchestrator
3. **When blocked:** Document in `docs/KNOWN_ISSUES.md`

### Merge Strategy

```bash
# Each agent works on their own branch
experiment/multi-agent-orchestration/design-system
experiment/multi-agent-orchestration/data-layer
experiment/multi-agent-orchestration/features
experiment/multi-agent-orchestration/testing

# Merge order (respects dependencies):
1. design-system → main experiment branch
2. data-layer → main experiment branch
3. testing → main experiment branch
4. features → main experiment branch (last, uses all others)
```

---

## Success Criteria

This experiment succeeds if:
- [ ] All 4 agents complete their Sprint 0/1 tasks
- [ ] Merging produces zero conflicts (or easily resolved ones)
- [ ] The integrated result passes `npm run build`
- [ ] No significant rework needed due to coordination failures

## Failure Indicators

Abandon this approach if:
- Merge conflicts require >1 hour to resolve
- Agents frequently need to modify each other's files
- Contract changes cause cascading rework
- Sequential approach would have been faster

---

## How to Abandon This Experiment

If it's not working:

```bash
# Switch back to main (your safe checkpoint)
git checkout main

# Delete the experiment branch
git branch -D experiment/multi-agent-orchestration

# You're back exactly where you started!
```

Nothing on `main` is affected until you explicitly merge.

---

## Log

### December 6, 2025
- Created experiment branch from main (commit 1574b71)
- Documented agent assignments and coordination protocol
- Ready to begin parallel development
