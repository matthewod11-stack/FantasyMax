# FantasyMax - Project Configuration

## Project Overview

**Project Name:** FantasyMax
**Description:** Fantasy football league history and social platform - the historical/social layer that sits alongside Yahoo/ESPN

**Tech Stack:**
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (invite-only)
- Storage: Supabase Storage (media uploads)
- Styling: Tailwind CSS v4
- Components: shadcn/ui
- Validation: Zod
- Testing: Vitest, Playwright

## Session Management

This is a **long-running, multi-session implementation**. Follow these protocols:

### Session Start
```bash
./scripts/dev-init.sh
```

### Key Documents
| Document | Purpose |
|----------|---------|
| `PROGRESS.md` | Session-by-session log of completed work |
| `ROADMAP.md` | Checkbox tracking of all tasks |
| `features.json` | Machine-readable pass/fail status |
| `docs/KNOWN_ISSUES.md` | Parking lot for blockers |
| `docs/SESSION_PROTOCOL.md` | Full protocol documentation |

### Single-Feature-Per-Session Rule
> **CRITICAL:** Work on ONE checkbox item per session. This prevents scope creep.

### After Each Session
1. Run verification (`npm run build`)
2. Update `PROGRESS.md` with session entry
3. Update `features.json` status
4. Check off completed tasks in `ROADMAP.md`
5. Commit with descriptive message

For full protocol details, see `docs/SESSION_PROTOCOL.md`.

---

## Core Concepts

### This is NOT a fantasy platform replacement
FantasyMax is the social/historical layer that complements Yahoo/ESPN:
- 10+ years of historical stats and records
- Personal manager dashboards with head-to-head records
- Media uploads (photos/videos from league events)
- League voting system
- Constitution/rules documentation
- Hall of shame for last place
- Trade history and rivalry tracking
- End of season awards
- Commissioner writeups and recaps

### Data Model Philosophy
- **Members** = Real people (persist across all seasons)
- **Teams** = A member's fantasy team for a specific season
- Every table supports dual import: Yahoo API OR CSV
- All external IDs stored for sync matching (yahoo_* fields)

### Access Control
- **League members only** - no public access
- **Pre-loaded experience** - admin imports data before inviting members
- **Role-based permissions:**
  - Commissioner: Full admin, data import, member management
  - President (Players Association): Voting, disputes
  - Treasurer: Financial tracking (future feature)
  - Member: Read access, voting, media uploads

## Project Structure

```
src/
  app/
    (auth)/           # Login, invite acceptance
    (dashboard)/      # Main member-facing pages
    admin/            # Commissioner-only pages
    api/              # API routes
  components/
    ui/               # shadcn/ui components
    features/         # Feature-specific components
    layout/           # Layout components (header, sidebar)
  lib/
    supabase/         # Supabase client configuration
    yahoo/            # Yahoo API integration
    import/           # CSV/data import utilities
    utils/            # General utilities
  hooks/              # Custom React hooks
  types/              # TypeScript type definitions
  constants/          # App-wide constants
supabase/
  migrations/         # Database migrations
```

## Key Technical Decisions

1. **Dual Import System**: Yahoo API + CSV import feed same normalized schema
2. **Materialized Views**: Pre-calculated head-to-head records for fast queries
3. **Row Level Security**: Supabase RLS enforces member-only access
4. **Server Components**: Default to RSC, use 'use client' only when needed
5. **Zod Validation**: All API inputs and imports validated with Zod

## Yahoo API Integration

### Response Structure Quirks
Yahoo's Fantasy API has non-standard JSON formatting that requires special handling:

1. **Objects with Numeric Keys**: Returns `{"0": {...}, "1": {...}}` instead of arrays
2. **Wrapper Objects**: Data nested in wrappers like `{"team": [...]}`, `{"manager": {...}}`
3. **Property Arrays**: Properties as `[{a: 1}, {b: 2}]` instead of `{a: 1, b: 2}`

### Helper Functions (in `src/lib/yahoo/client.ts`)
```typescript
// Convert {"0": {...}, "1": {...}} to array
yahooObjectToArray(obj)

// Merge [{a: 1}, {b: 2}] into {a: 1, b: 2}
flattenYahooArray(arr)

// Safe logging that never crashes on undefined
safeLog(label, data, maxLen)
```

### Common Patterns
```typescript
// Unwrap manager from wrapper
const manager = managerWrapper?.manager || managerWrapper;

// Access team standings (team is array: [props, standings])
const teamProps = flattenYahooArray(teamArray[0]);
const standings = teamArray[1]?.team_standings;

// Scoreboard has extra "0" key layer
const scoreboardContent = yahooObjectToArray(leagueArray[1]?.scoreboard)[0];
const matchups = scoreboardContent?.matchups;
```

### Endpoint Response Structures
| Endpoint | Access Path |
|----------|-------------|
| `/league/{key}` | `fantasy_content.league[0]` |
| `/league/{key}/teams` | `fantasy_content.league[1].teams{"0": {"team": [...]}}` |
| `/league/{key}/scoreboard` | `fantasy_content.league[1].scoreboard{"0": {matchups: ...}}` |

### Alternative: Use Existing Libraries
If starting fresh, consider these wrappers that handle parsing:
- **Node.js**: [yahoo-fantasy-sports-api](https://github.com/whatadewitt/yahoo-fantasy-sports-api)
- **Python**: [yfpy](https://github.com/uberfastman/yfpy)

## Database Tables

Core tables (see migrations for full schema):
- `league` - Single league configuration
- `members` - People in the league
- `seasons` - One per year
- `teams` - Member's team for a season
- `matchups` - Weekly matchup results
- `trades` - Trade history
- `awards` - Season awards
- `polls` / `votes` - Voting system
- `media` / `media_tags` - Photos/videos
- `rules` / `rule_amendments` - Constitution

## Coding Conventions

Follow ~/claude-docs/rules.md standards, with these specifics:

### File Naming
- Components: PascalCase (`SeasonCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Types: camelCase with `.types.ts` suffix (`season.types.ts`)

### Import Order
1. React/Next.js
2. Third-party libraries
3. @/lib imports
4. @/components imports
5. @/hooks imports
6. @/types imports
7. Relative imports

### API Routes
- Use Zod for request validation
- Return consistent response shapes: `{ data, error }`
- Log errors with structured context

### Supabase Queries
- Use typed client from `@/lib/supabase/server`
- Handle errors explicitly
- Use RLS policies for access control (don't filter in code)

## Common Tasks

### Adding a New Page
1. Create route in `src/app/(dashboard)/[feature]/page.tsx`
2. Add feature components in `src/components/features/[feature]/`
3. Add any new types to `src/types/`

### Adding Admin Functionality
1. Create route in `src/app/admin/[feature]/page.tsx`
2. Verify commissioner role in component
3. Add API route if needed in `src/app/api/`

### Importing Data
- CSV: Use `src/lib/import/csv-parser.ts`
- Yahoo: Use `src/lib/yahoo/sync.ts`
- Both normalize to same schema via `src/lib/import/normalizer.ts`

## Security Considerations

- All routes except login require authenticated member
- Admin routes require commissioner role check
- File uploads validated for type and size
- PII (emails) encrypted where needed
- No public API access

## Testing

- Unit tests: `tests/unit/` (Vitest)
- Integration tests: `tests/integration/` (Vitest)
- E2E tests: `tests/e2e/` (Playwright)
- Minimum 80% coverage for utilities
- 100% coverage for import/validation logic
