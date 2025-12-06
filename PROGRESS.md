# FantasyMax Progress Report

**Last Updated:** December 6, 2025 (Late Night Session - SYNC COMPLETE!)

---

## Overall Status: ~95% Complete

Yahoo sync fully working! 10 seasons imported with 978 matchups across 22 members. All data persisted in Supabase.

---

## Data Imported

| Year | Teams | Matchups | Status |
|------|-------|----------|--------|
| 2024 | 14 | 110 | Complete |
| 2023 | 14 | 110 | Complete |
| 2022 | 14 | 110 | Complete |
| 2021 | 14 | 105 | Complete |
| 2020 | 14 | 105 | Complete |
| 2019 | 13 | 90 | Complete |
| 2018 | 13 | 92 | Complete |
| 2017 | 13 | 90 | Complete |
| 2016 | 13 | 90 | Complete |
| 2015 | 11 | 76 | Complete |

**Totals:** 22 members, 133 teams, 978 matchups

---

## Project Workflow

### Git & Vercel Connection
- **GitHub Repo**: `matthewod11-stack/FantasyMax` (private)
- **Vercel Auto-Deploy**: Connected - every push to `main` triggers deployment
- **Production URL**: https://fantasymax.vercel.app

### Environment Variables (IMPORTANT)
When adding env vars to Vercel, **DO NOT copy-paste with trailing newlines**. This caused hours of debugging. Type values manually or carefully trim whitespace.

Required in Vercel Settings -> Environment Variables:
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

## Current State

### What's Working
| Feature | Status |
|---------|--------|
| Vercel deployment | Done |
| Yahoo OAuth | Done |
| League listing | Done - All 11 seasons visible |
| Yahoo disconnect | Done |
| Teams sync | Done - 133 teams imported |
| Matchups sync | Done - 978 matchups imported |
| Members sync | Done - 22 members created |
| Database persistence | Done - All data in Supabase |

### In Progress
| Feature | Status |
|---------|--------|
| Dashboard page | Uses createAdminClient for dev |
| Seasons page | Uses createAdminClient for dev |
| Auth integration | RLS bypassed during development |

### Still Disabled
| Feature | Reason |
|---------|--------|
| Supabase auth check | Commented out for dev |
| Import logs | Needs member ID |
| RLS enforcement | Using admin client for dev |

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
1. **Build feature pages** - Managers, Head-to-Head, Records
2. **Enable Supabase auth** - Re-enable auth checks, set up RLS
3. **Switch pages back to createClient()** - After RLS is configured

### Feature Pages (Data Ready!)
- Managers page - Query `members` + `teams` (data exists)
- Head-to-Head - Uses existing materialized view
- Records page - SQL queries for highs/lows
- Trades page - Query `trades` table (needs trade sync)

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

### The Four Layers of Yahoo API Quirks

Yahoo's Fantasy API has **four layers of non-standard formatting** that required extensive debugging:

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

**Solution**: Use `yahooObjectToArray()` helper.

#### 2. Wrapper Objects
Data is nested inside wrapper objects:
- Teams: `{"team": [[...props...], {...standings...}]}`
- Managers: `{"manager": {"nickname": "...", "guid": "..."}}`
- Matchups: `{"matchup": {...}}`

**Solution**: Always check for and unwrap: `obj?.wrapper || obj`

#### 3. Arrays of Single-Property Objects
Properties come as arrays that need flattening:
```json
[{"team_key": "449.l.75850.t.1"}, {"team_id": "1"}, {"name": "Game of Jones"}]
```

**Solution**: Use `flattenYahooArray()` helper.

#### 4. Double Numeric Keys in Matchups (THE BREAKTHROUGH!)
Matchups have an EXTRA numeric key layer inside:
```
matchups["0"].matchup["0"].teams  // actual structure
matchups["0"].matchup.teams       // what we expected
```

**Solution**: Unwrap twice and merge:
```typescript
const matchupOuter = matchupWrapper?.matchup || matchupWrapper;
const matchupArray = this.yahooObjectToArray(matchupOuter);
const matchupInner = matchupArray[0] || matchupOuter;
const matchup = { ...matchupOuter, ...matchupInner };
```

### Endpoint-Specific Quirks

| Endpoint | Structure | Notes |
|----------|-----------|-------|
| `/league/{key}` | `league[0]` = props | Direct object, no flattening needed |
| `/league/{key}/teams` | `league[1].teams{"0": {"team": [[props], {standings}]}}` | Needs unwrap + flatten |
| `/league/{key}/scoreboard` | `league[1].scoreboard{"0": {matchups{"0": {matchup{"0": {...}}}}}}` | FOUR layers of unwrapping! |

### Useful Libraries (If Starting Fresh)
- **Node.js**: [yahoo-fantasy-sports-api](https://github.com/whatadewitt/yahoo-fantasy-sports-api)
- **Python**: [yfpy](https://github.com/uberfastman/yfpy)

These handle all the parsing quirks automatically.

---

## Supabase Notes

### RLS Temporarily Bypassed
Dashboard and Seasons pages use `createAdminClient()` instead of `createClient()` to bypass RLS during development. TODOs mark these for switching back once auth is enabled.

### Middleware
The middleware at `src/lib/supabase/middleware.ts` skips auth checks for `/api/auth/yahoo/*` routes to prevent Supabase errors during Yahoo OAuth flow.

---

## Login Credentials

| Account | Email | Password |
|---------|-------|----------|
| Commissioner | matthew.od11@gmail.com | Judge99! |

---

## Architecture Notes

- **Dual Import System**: Yahoo API + CSV import feed same normalized schema
- **Materialized Views**: Pre-calculated head-to-head records for fast queries
- **Row Level Security**: Supabase RLS enforces member-only access (disabled for dev)
- **Server Components**: Default to RSC, use 'use client' only when needed
- **Auto-Deploy**: Push to main -> Vercel builds and deploys automatically
