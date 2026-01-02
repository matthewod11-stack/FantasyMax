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

---

## V2 Backlog

*Future sprints staged for V2 planning. Moved from ROADMAP.md for planning purposes.*

### Sprint 3: Data Enrichment

*Import additional data to unlock more features.*

#### 3.1 Trade Sync

- [ ] Yahoo trade history import
- [ ] Trade detail storage (players exchanged)
- [ ] Trade timeline view
- [ ] "Trade winners/losers" analysis

#### 3.2 Draft Data

- [ ] Draft results by year
- [ ] Draft grade history
- [ ] "Best picks" and "Biggest busts" tracking

#### 3.3 Enhanced Season Pages

- [ ] Trade activity timeline in season pages
- [ ] Draft recap integration

---

### Sprint 4: Production Ready

*Final touches before inviting the league.*

#### 4.1 Authentication ⚠️ BLOCKING

- [ ] Re-enable Supabase auth
- [ ] Member invitation flow via email
- [ ] Email verification
- [ ] Password reset
- [ ] Session management
- [ ] Switch from `createAdminClient()` to `createClient()`
- [ ] Enable RLS policies
- [ ] Remove `BYPASS_AUTH` for production

#### 4.2 Member Management

- [ ] Invite new members
- [ ] Link Yahoo accounts to members
- [ ] Role management (commissioner, president, treasurer)
- [x] Merge duplicate members
- [ ] Deactivate former members

#### 4.3 Mobile Experience

- [ ] Responsive design audit
- [ ] Touch-friendly interactions
- [ ] Mobile navigation improvements

#### 4.4 Performance

- [ ] Apply database migrations to production
- [ ] Regenerate TypeScript types
- [ ] Image optimization
- [ ] Loading state audit

---

### Sprint 5: Social Features

*The community-building layer.*

#### 5.1 Voting System `/voting`

- [ ] Create polls (commissioner)
- [ ] Vote on rule changes
- [ ] Award voting
- [ ] Anonymous vs public options
- [ ] Results visualization

#### 5.2 Media Gallery `/media`

- [ ] Photo/video upload
- [ ] Tag members in media
- [ ] Event categorization (draft, championship)
- [ ] Gallery with lightbox

#### 5.3 Constitution `/constitution`

- [ ] Formatted rules display
- [ ] Rule categories
- [ ] Amendment history
- [ ] Version tracking

#### 5.4 Notifications

- [ ] Email notifications for polls
- [ ] New content alerts
- [ ] Championship/shame announcements

---

### Sprint 6: AI Features (Optional)

*AI-generated content and insights.*

#### 6.1 Season Recaps `/seasons/[year]/recap`

*Note: Season reviews have been done in Sprint 2.5. Remaining work:*

- [ ] Auto-generate season narratives (enhanced)
- [ ] Key turning points identification
- [ ] Commissioner edit/approve workflow
- [ ] Tone options (serious, humorous, ESPN-style)

#### 6.2 Matchup Previews

- [ ] Weekly preview articles
- [ ] H2H history, recent form, key stats
- [ ] Predictions with confidence levels
- [ ] Shareable preview cards

#### 6.3 Natural Language Query

- [ ] "Who has the best record against Mike?"
- [ ] "What's my longest win streak?"
- [ ] Convert to database lookups
- [ ] Suggest related queries

#### 6.4 Trash Talk Assistant 🔥

- [ ] Generate historically-accurate trash talk
- [ ] References actual H2H records
- [ ] Tone selector (friendly → ruthless)
- [ ] Copy to clipboard
