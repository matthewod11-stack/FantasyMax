# FantasyMax — Known Issues & Parking Lot

> **Purpose:** Track issues, blockers, and deferred decisions.
> **Related Docs:** [ROADMAP.md](../ROADMAP.md) | [PROGRESS.md](../PROGRESS.md)

---

## How to Use This Document

**Add issues here when:**
- You encounter a bug that isn't blocking current work
- You discover something that needs investigation later
- A decision needs to be made but can wait
- You find edge cases that need handling eventually

**Format:**
```markdown
### [PHASE-X] Brief description
**Status:** Open | In Progress | Resolved | Deferred
**Severity:** Blocker | High | Medium | Low
**Discovered:** YYYY-MM-DD
**Description:** What happened / what's the issue
**Workaround:** (if any)
**Resolution:** (when resolved)
```

---

## Open Issues

### [TECH-DEBT] Auth bypass using createAdminClient()
**Status:** Open
**Severity:** High
**Discovered:** 2024-12-06
**Description:** Dashboard and Seasons pages use `createAdminClient()` instead of `createClient()` to bypass RLS during development. This bypasses all row-level security.
**Workaround:** Acceptable during development, but MUST be fixed before production
**Resolution:** Switch back to `createClient()` after enabling proper RLS policies

### [TECH-DEBT] BYPASS_AUTH environment variable
**Status:** Open
**Severity:** High
**Discovered:** 2024-12-06
**Description:** Auth checks are disabled via BYPASS_AUTH flag for development convenience
**Workaround:** Development only
**Resolution:** Remove flag and enable Supabase auth for production

### [TECH-DEBT] RLS policies disabled
**Status:** Open
**Severity:** High
**Discovered:** 2024-12-06
**Description:** Row Level Security is not enforced - all data accessible via admin client
**Workaround:** None needed for single-commissioner development
**Resolution:** Enable RLS policies before inviting league members

### [DATA] Member identity merging needed
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2024-12-06
**Resolved:** 2025-12-08
**Description:** Yahoo members who changed emails over the years appear as separate members. Need canonical identity table and merge tooling.
**Resolution:** Built `/admin/members` page with merge functionality. Database migration adds `merged_into_id` column, `member_merges` audit table, and `merge_members()` function. Merged members are hidden from normal views.

### [BUG] merge_members() function - wrong column name
**Status:** Resolved
**Severity:** Medium
**Discovered:** 2025-12-08
**Resolved:** 2025-12-08
**Description:** The `merge_members()` function referenced `proposed_by` column in `rule_amendments` table, but the actual column is `amended_by`. This caused merge operations to fail with "column proposed_by does not exist" error.
**Resolution:** Created migration `20241208100001_fix_merge_function.sql` with `CREATE OR REPLACE FUNCTION` to correct the column name. Applied to Supabase.

### [DATA] Trades not yet imported
**Status:** Open
**Severity:** Low
**Discovered:** 2024-12-06
**Description:** Trade history not synced from Yahoo. Trade count shows 0.
**Workaround:** Feature deferred to Phase 2.1
**Resolution:** Implement Yahoo trade sync

---

## Resolved Issues

### [BUILD] Dashboard layout TypeScript null check error
**Status:** Resolved
**Severity:** Blocker
**Discovered:** 2024-12-07
**Resolved:** 2025-12-23
**Description:** `npm run build` fails with TypeScript error in `src/app/(dashboard)/layout.tsx:63` - "'member' is possibly 'null'". The fallback logic at line 52-58 doesn't guarantee `member` is non-null if both queries fail.
**Resolution:** The layout was refactored to properly guard against null values. Line 70-75 now explicitly checks `if (!defaultMember || !allMembers || allMembers.length === 0)` before rendering, ensuring TypeScript can verify the value is non-null.

---

## Deferred Decisions

### Dark mode vs light mode default
**Status:** Deferred to Sprint 0
**Context:** ROADMAP specifies dark mode as primary (sports broadcast aesthetic), but need to implement theme system first
**Decision needed:** Confirm dark-first approach, light mode support level

### Typography font pairing
**Status:** Deferred to Sprint 0
**Context:** ROADMAP has 4 options (Bebas Neue/DM Sans, Oswald/Source Sans Pro, Anton/Work Sans, Playfair Display/Lato)
**Decision needed:** Pick final pairing, test for readability with stats data

---

## Edge Cases to Handle

| Case | Phase | Priority | Notes |
|------|-------|----------|-------|
| Member with no matchups | 1.1 | Low | Show "No history yet" state |
| Tied H2H record | 1.3 | Medium | How to show 5-5 in heatmap? |
| Missing week data | 1.5 | Low | Some 2015 weeks may be incomplete |
| Bye week matchups | 1.3 | Low | Exclude from H2H calculations |
| Playoff vs regular season | 1.3 | Medium | Toggle to include/exclude |
