# Yahoo Authentication And League Data Plan

**Status:** Yahoo account connection repaired; Fantasy Sports data access externally blocked
**Last verified:** 2026-08-01

## Current Production Truth

- FantasyMax completes Yahoo's OAuth2 consent flow on `modfantasyleague.com` and stores the refresh token encrypted in Supabase.
- The Yahoo developer app has the legacy **Fantasy Sports - Read** permission selected.
- Fresh OAuth2 bearer tokens receive HTTP 403 from every tested Fantasy endpoint, including public game metadata: `This application is not authorized to perform this action.`
- Yahoo's current application form no longer offers Fantasy Sports as a permission for new apps.
- Yahoo's documented OAuth1 request-token endpoint returns HTTP 404.
- Yahoo's current OAuth2 documentation describes support for UserInfo and advertising APIs, while the separate Fantasy guide still contains the legacy OAuth1 flow. The official documentation and live developer surface are therefore inconsistent.

## Recommended Product Split

### 1. Yahoo identity for member login

Use Yahoo OpenID Connect to prove identity, then map the Yahoo subject to an allowlisted FantasyMax member and team. Keep authorization inside FantasyMax:

- only mapped league members receive access;
- commissioner/admin remains an explicit FantasyMax role;
- unmatched Yahoo accounts enter a commissioner approval flow;
- the shared password remains as a temporary fallback during rollout.

Yahoo identity should not be treated as proof of league membership by itself.

### 2. League data ingestion as a separate system

Do not couple sign-in success to Yahoo Fantasy data availability. In priority order:

1. Ask Yahoo Developer Support to restore or clarify Fantasy API access for the existing legacy app.
2. If Yahoo provides a supported league export, build a commissioner upload that is idempotent and previewable before database writes.
3. Preserve the existing encrypted credential and sync code behind a health check so it can resume if Yahoo restores access.
4. Avoid authenticated scraping as the default: it is fragile, difficult to schedule safely, and may conflict with Yahoo's terms.

## Acceptance Gates For The Next Implementation

- A supported source successfully returns the current league and 2026 season before any importer work begins.
- Imports are deterministic, idempotent, and show a dry-run summary.
- Sync health records the last attempt, last success, source, imported counts, and a sanitized error.
- The dashboard never labels stale data as current.
- Yahoo login and league-data sync can fail independently without locking members out.

## Official References

- [Yahoo Fantasy Sports API guide](https://developer.yahoo.com/fantasysports/guide/)
- [Yahoo OAuth2 guide](https://developer.yahoo.com/oauth2/guide/)
- [Yahoo server-side authorization flow](https://developer.yahoo.com/oauth2/guide/flows_authcode/)
