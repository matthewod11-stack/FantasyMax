# Yahoo Fantasy API - Technical Reference

> **Purpose:** Hard-earned lessons from integrating with Yahoo's Fantasy API.
> **Important:** Yahoo's API has non-standard JSON formatting that requires special handling.

---

## Response Structure Quirks

Yahoo's Fantasy API has **four layers of non-standard formatting**:

### 1. Objects with Numeric Keys
Returns `{"0": {...}, "1": {...}}` instead of arrays

**Solution:** Use `yahooObjectToArray()` helper
```typescript
private yahooObjectToArray(obj: Record<string, any> | undefined): any[] {
  if (!obj) return [];
  return Object.keys(obj)
    .filter(key => !isNaN(Number(key)))
    .map(key => obj[key]);
}
```

### 2. Wrapper Objects
Data nested in wrappers like `{"team": [...]}`

**Solution:** Always unwrap: `obj?.wrapper || obj`

### 3. Arrays of Single-Property Objects
Properties as `[{a: 1}, {b: 2}]` instead of `{a: 1, b: 2}`

**Solution:** Use `flattenYahooArray()` helper
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

### 4. Double Numeric Keys in Matchups
Extra layer inside matchups

**Solution:** Unwrap twice and merge

---

## Endpoint Structures

| Endpoint | Structure |
|----------|-----------|
| `/league/{key}` | `league[0]` = props |
| `/league/{key}/teams` | `league[1].teams{"0": {"team": [[props], {standings}]}}` |
| `/league/{key}/scoreboard` | `league[1].scoreboard{"0": {matchups{"0": {matchup{"0": {...}}}}}}` |

---

## Helper Functions

Located in `src/lib/yahoo/client.ts`:

```typescript
// Convert {"0": {...}, "1": {...}} to array
yahooObjectToArray(obj)

// Merge [{a: 1}, {b: 2}] into {a: 1, b: 2}
flattenYahooArray(arr)

// Safe logging that never crashes on undefined
safeLog(label, data, maxLen)
```

---

## Common Patterns

### Unwrap Manager from Wrapper
```typescript
const manager = managerWrapper?.manager || managerWrapper;
```

### Access Team Standings
Team is array: [props, standings]
```typescript
const teamProps = flattenYahooArray(teamArray[0]);
const standings = teamArray[1]?.team_standings;
```

### Scoreboard Extra Layer
```typescript
const scoreboardContent = yahooObjectToArray(leagueArray[1]?.scoreboard)[0];
const matchups = scoreboardContent?.matchups;
```

---

## Endpoint Response Structures

| Endpoint | Access Path |
|----------|-------------|
| `/league/{key}` | `fantasy_content.league[0]` |
| `/league/{key}/teams` | `fantasy_content.league[1].teams{"0": {"team": [...]}}` |
| `/league/{key}/scoreboard` | `fantasy_content.league[1].scoreboard{"0": {matchups: ...}}` |

---

## Alternative Libraries

If starting fresh, consider these wrappers that handle parsing:
- **Node.js**: [yahoo-fantasy-sports-api](https://github.com/whatadewitt/yahoo-fantasy-sports-api)
- **Python**: [yfpy](https://github.com/uberfastman/yfpy)

---

## API Limits & Gotchas

1. **Rate Limiting**: Yahoo has rate limits - be careful with batch requests
2. **Token Refresh**: Access tokens expire after 1 hour, refresh tokens last 30 days
3. **Season Keys**: League keys follow pattern `{game_key}.l.{league_id}` (e.g., `449.l.123456`)
4. **Playoff Weeks**: Different leagues may have different playoff configurations

---

## Example: Full League Fetch

```typescript
// Get league with teams and standings
const response = await apiRequest(`/league/${leagueKey}/teams;out=standings`);

const leagueData = response.fantasy_content?.league;
const leagueArray = Array.isArray(leagueData) ? leagueData : yahooObjectToArray(leagueData);

// Second element contains teams
const teamsContainer = leagueArray[1]?.teams;
const teamsRaw = yahooObjectToArray(teamsContainer);

// Parse each team
const teams = teamsRaw.map(teamWrapper => {
  const teamArray = teamWrapper?.team;
  const teamProps = flattenYahooArray(teamArray[0]);
  const teamStandings = teamArray[1]?.team_standings;
  return { ...teamProps, team_standings: teamStandings };
});
```
