# FantasyMax Progress Report

**Last Updated:** December 6, 2025 (Late Night Session)

---

## Overall Status: ~85-90% Complete

Yahoo OAuth working, teams parsing correctly (14 teams!), matchups parsing in progress. The Yahoo API response parsing has been extensively debugged and documented.

---

## Project Workflow

### Git & Vercel Connection
- **GitHub Repo**: `matthewod11-stack/FantasyMax` (private)
- **Vercel Auto-Deploy**: Connected - every push to `main` triggers deployment
- **Production URL**: https://fantasymax.vercel.app

### Environment Variables (IMPORTANT)
When adding env vars to Vercel, **DO NOT copy-paste with trailing newlines**. This caused hours of debugging. Type values manually or carefully trim whitespace.

Required in Vercel Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://ykgtcxdgeiwaiqaizdqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
YAHOO_CLIENT_ID=dj0yJmk9dTNTNkNKZFZ3YTVDJmQ9WVdrOU5rdDBWMVpDVmxZbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWZi
YAHOO_CLIENT_SECRET=20af8e3eb725cb6c5ef37870f5a2cd3dad3dfd37
NEXT_PUBLIC_APP_URL=https://fantasymax.vercel.app
```

### Yahoo Developer Console
- App configured at https://developer.yahoo.com/apps/
- Redirect URI: `https://fantasymax.vercel.app/api/auth/yahoo/callback`
- Permissions: Fantasy Sports (Read)

---

## Session Summary (December 6, 2025 - Late Night)

### Accomplished This Session
1. **Teams parsing fixed** - 14 teams now parse correctly from FFL 2K24
2. **Yahoo API structure fully decoded** - See Technical Notes below
3. **Helper functions created**:
   - `yahooObjectToArray()` - Converts `{"0": {...}, "1": {...}}` to arrays
   - `flattenYahooArray()` - Merges `[{a: 1}, {b: 2}]` into `{a: 1, b: 2}`
   - `safeLog()` - Debug logging that never crashes on undefined
4. **Scoreboard parsing updated** - Fixed extra "0" key nesting layer
5. **Manager access fixed** - Now correctly accesses `managers[0].manager`

### Current Status
- **Teams**: Parsing correctly (14 teams from FFL 2K24)
- **Matchups**: Parsing logic updated, testing in progress
- **Database writes**: Need to verify after parsing works

### Debug Logging Active
Check Vercel Runtime Logs for detailed output:
- `src/lib/yahoo/client.ts` - All API responses and parsing steps
- `src/app/api/import/yahoo/route.ts` - Team/member processing

---

## Current State

### What's Working
| Feature | Status |
|---------|--------|
| Vercel deployment | ✅ Auto-deploys from GitHub |
| Yahoo OAuth | ✅ Connects and authenticates |
| League listing | ✅ All 11 seasons visible |
| Yahoo disconnect | ✅ Works |
| Teams parsing | ✅ 14 teams parsed correctly |
| League details | ✅ Parses name, settings, etc. |

### What Needs Testing
| Feature | Status |
|---------|--------|
| Matchups parsing | 🔄 Logic updated, needs verification |
| Database writes | 🔄 Teams should write to Supabase |
| Full season sync | 🔄 End-to-end test needed |

### Still Disabled
| Feature | Reason |
|---------|--------|
| Supabase auth check | Commented out for dev |
| Import logs | Needs member ID |

---

## Deployment Info

| Environment | URL |
|-------------|-----|
| **Production** | https://fantasymax.vercel.app |
| **GitHub** | https://github.com/matthewod11-stack/FantasyMax |
| **Supabase** | https://ykgtcxdgeiwaiqaizdqc.supabase.co |

---

## Next Session Tasks

### Immediate Priority
1. **Test sync again** - Verify teams write to Supabase
2. **Check matchups** - Confirm scoreboard parsing works end-to-end
3. **Verify in Supabase** - Query `teams` and `matchups` tables

### After Sync Works
4. **Re-enable Supabase auth** - Uncomment auth checks in import route
5. **Remove debug logging** - Clean up console.log statements
6. **Test multiple seasons** - Import FFL 2K23, 2K22, etc.

### Feature Pages (Once Data Imported)
- Managers page - Query `members` + `teams`
- Head-to-Head - Uses existing materialized view
- Trades page - Query `trades` table
- Records page - SQL queries for highs/lows

---

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Yahoo API client | `src/lib/yahoo/client.ts` |
| Yahoo OAuth routes | `src/app/api/auth/yahoo/` |
| Yahoo sync/import | `src/app/api/import/yahoo/route.ts` |
| Supabase middleware | `src/lib/supabase/middleware.ts` |
| Database schema | `supabase/migrations/20241123000000_initial_schema.sql` |
| TypeScript types | `src/types/database.types.ts` |
| Project config | `CLAUDE.md` |

---

## Technical Notes: Yahoo API Response Structure

### The Three Layers of Yahoo API Quirks

Yahoo's Fantasy API is notoriously difficult to work with. The JSON responses have **three layers of non-standard formatting**:

#### 1. Objects with Numeric Keys (Not Arrays)
Instead of returning `[{...}, {...}]`, Yahoo returns:
```json
{
  "teams": {
    "0": {"team": [...]},
    "1": {"team": [...]},
    "count": 2
  }
}
```

**Solution**: Use `yahooObjectToArray()` helper:
```typescript
private yahooObjectToArray(obj: Record<string, any>): any[] {
  if (!obj) return [];
  return Object.keys(obj)
    .filter(key => !isNaN(Number(key)))
    .map(key => obj[key]);
}
```

#### 2. Wrapper Objects
Data is nested inside wrapper objects:
- Teams: `{"team": [[...props...], {...standings...}]}`
- Managers: `{"manager": {"nickname": "...", "guid": "..."}}`
- Matchups: `{"matchup": {...}}`

**Solution**: Always check for and unwrap these:
```typescript
const manager = managerWrapper?.manager || managerWrapper;
```

#### 3. Arrays of Single-Property Objects
Properties come as arrays that need flattening:
```json
[{"team_key": "449.l.75850.t.1"}, {"team_id": "1"}, {"name": "Game of Jones"}]
```

**Solution**: Use `flattenYahooArray()` helper:
```typescript
private flattenYahooArray(arr: any[]): Record<string, any> {
  if (!Array.isArray(arr)) return arr || {};
  const result: Record<string, unknown> = {};
  for (const item of arr) {
    if (item && typeof item === 'object') {
      Object.assign(result, item);
    }
  }
  return result;
}
```

### Endpoint-Specific Quirks

| Endpoint | Structure | Notes |
|----------|-----------|-------|
| `/league/{key}` | `league[0]` = props | Direct object, no flattening needed |
| `/league/{key}/teams` | `league[1].teams{"0": {"team": [[props], {standings}]}}` | Needs unwrap + flatten |
| `/league/{key}/scoreboard` | `league[1].scoreboard{"0": {matchups: ...}}` | Extra "0" key layer! |

### Useful Libraries (If Starting Fresh)
- **Node.js**: [yahoo-fantasy-sports-api](https://github.com/whatadewitt/yahoo-fantasy-sports-api)
- **Python**: [yfpy](https://github.com/uberfastman/yfpy)

These handle all the parsing quirks automatically.

---

## Supabase Middleware
The middleware at `src/lib/supabase/middleware.ts` skips auth checks for `/api/auth/yahoo/*` routes to prevent Supabase errors during Yahoo OAuth flow.

## Auth Temporarily Disabled
In `src/app/api/import/yahoo/route.ts`, the commissioner auth check is commented out. Re-enable once Supabase auth is set up:
```typescript
// Lines 18-37 are commented out - uncomment when ready
```

---

## Login Credentials

| Account | Email | Password |
|---------|-------|----------|
| Commissioner | matthew.od11@gmail.com | Judge99! |

---

## Architecture Notes

- **Dual Import System**: Yahoo API + CSV import feed same normalized schema
- **Materialized Views**: Pre-calculated head-to-head records for fast queries
- **Row Level Security**: Supabase RLS enforces member-only access
- **Server Components**: Default to RSC, use 'use client' only when needed
- **Auto-Deploy**: Push to main → Vercel builds and deploys automatically
