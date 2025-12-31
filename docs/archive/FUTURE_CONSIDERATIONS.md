# Future Considerations & Parking Lot

**Created:** December 8, 2025
**Purpose:** Capture operational maturity, infrastructure, and guardrail requirements for future sprints. These items are important but not blocking current development.

---

## 1. Weekly Yahoo Refresh (Data Freshness)

The current roadmap assumes static historical data. Once the platform is live, we'll need ongoing sync.

### Requirements
- [ ] Scheduled Yahoo sync (during NFL season: Weeks 1-18)
- [ ] Retry logic with exponential backoff
- [ ] Checksum/row count validation after each sync
- [ ] Data provenance tracking (source, timestamp, version)
- [ ] Manual "rerun last week" path for corrections
- [ ] Off-season handling (pause or monthly checks)

### Open Questions
- **Timing:** Supabase cron (Edge Function), Vercel cron, or GitHub Actions?
- **Frequency:** Daily (catch stat corrections) or weekly (Sunday night/Monday)?
- **Notification:** Alert on sync failures?

---

## 2. Staging & Compensating Controls

With no dedicated staging environment, we need compensating controls for safe deployments.

### Requirements
- [ ] Feature flags system (env-var based or service-based)
- [ ] Migration dark-launch steps (run new schema alongside old)
- [ ] Vercel preview builds for PR review
- [ ] Deployment checklist before prod deploys
- [ ] Rollback procedure documentation

### Open Questions
- **Feature flags:** Simple env-var (`FEATURE_AI_RECAP=true`) vs. service (LaunchDarkly, Vercel Edge Config)?
- **Shadow tables:** Worth the complexity for this scale?

---

## 3. Auth/RLS Bootstrap & Admin Recovery

Safe bootstrap of commissioner account and recovery paths.

### Two-Tier Auth Model

**Key Decision:** This app needs TWO authentication levels:

1. **League Members (Simple Password Gate)**
   - Commissioner shares URL + league password with members
   - Password entered once → stored in cookie/localStorage
   - Full read access to dashboard, stats, records, etc.
   - NOT tied to individual identity
   - Example: `modfantasyleague.com` → password screen → dashboard

2. **Commissioners (Full Supabase Auth)**
   - Real email/password login via Supabase Auth
   - Required for Yahoo API access, data imports, award granting
   - Required for admin actions (member management, writeups)
   - Links to `members` table with `role = 'commissioner'`

### Implementation Approach
```
┌─────────────────────────────────────────────────┐
│  modfantasyleague.com                           │
├─────────────────────────────────────────────────┤
│  /login (league password) → cookie set          │
│     ↓                                           │
│  Dashboard, Records, Awards, etc. (read-only)   │
├─────────────────────────────────────────────────┤
│  /admin/login (Supabase Auth)                   │
│     ↓                                           │
│  Admin panel, Yahoo sync, award granting        │
└─────────────────────────────────────────────────┘
```

### Requirements
- [ ] League password stored in env var (`LEAGUE_ACCESS_PASSWORD`)
- [ ] Password gate middleware for member routes
- [ ] Cookie/session for "logged in" state (no user identity)
- [ ] Pre-seed commissioner account safely
- [ ] Link existing manager records to commissioner user
- [ ] Admin bypass path for recovery (break-glass procedure)
- [ ] Audit logging for all admin actions
- [ ] RLS policy matrix documentation (per table/view)
- [ ] Rotation plan for `BYPASS_AUTH` flag → off

### Policy Matrix (Draft)
| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| `members` | Password Gate | Commissioner | Commissioner | Never |
| `teams` | Password Gate | Commissioner | Commissioner | Never |
| `matchups` | Password Gate | Commissioner | Commissioner | Never |
| `media` | Password Gate | Uploader/Commissioner | Uploader/Commissioner | Commissioner |
| `polls` | Password Gate | Commissioner | Commissioner | Commissioner |
| `votes` | Password Gate | Voter (once) | Never | Never |

### Open Questions
- **Commissioner email:** Which email to pre-seed?
- **Break-glass:** Manual SQL script with 2FA, or service role key with rotation?
- **Audit storage:** Dedicated `audit_log` table or external service?
- **Password rotation:** How to notify league members if password changes?
- **Cookie duration:** Persist forever, or require re-entry each season?

---

## 4. Data Integrity & Validation

Ensuring data quality and handling edge cases.

### Requirements
- [ ] Deterministic IDs for trades/drafts (hash-based)
- [ ] Duplicate member/team detection and resolution workflow
- [ ] Yahoo identity drift handling (email changes mid-season)
- [ ] Season/week timezone mapping (consistent UTC storage)
- [ ] Playoff vs regular-season flags on matchups
- [ ] Validation jobs with alerts (orphans, duplicates, missing data)

### Deterministic ID Strategy (Draft)
```
trade_id = hash(season_id + week + team1_id + team2_id + trade_timestamp)
draft_pick_id = hash(season_id + round + pick_number + player_id)
```

### Open Questions
- **Yahoo identity drift:** Track `yahoo_id_history` table, or rely on stable `manager_id`?
- **Playoff flag:** Column on `matchups` or computed from `week > playoffs_start_week`?

---

## 5. Observability & Operations

Production monitoring and incident response.

### Requirements
- [ ] Error monitoring (Sentry, Vercel built-in, or Supabase logs)
- [ ] Job health alerts for import/sync jobs
- [ ] Uptime checks (external service or Vercel analytics)
- [ ] Backup/restore drills (quarterly?)
- [ ] Rollback playbook (migrations + data)
- [ ] Incident response runbook

### Open Questions
- **Error monitoring:** Sentry (full-featured) vs. Vercel (simpler) vs. Supabase logs (cheapest)?
- **Uptime:** Better Uptime/Pingdom vs. Vercel analytics?
- **Playbook format:** Markdown doc or executable scripts?

---

## 6. Testing & Performance

Comprehensive testing and performance budgets.

### Requirements
- [ ] E2E smoke tests for auth/nav/core pages (Playwright)
- [ ] Accessibility checks in CI (axe-core)
- [ ] WCAG 2.1 AA compliance audit
- [ ] Load tests or performance budgets for heavy pages
- [ ] Caching/ISR strategy documentation

### Performance Budgets (Draft)
| Page | Target p95 |
|------|------------|
| Dashboard | < 1.5s |
| Managers list | < 1.0s |
| Manager profile | < 1.5s |
| H2H matrix | < 2.5s (heavy) |
| Season bracket | < 2.0s |
| API endpoints | < 500ms |

### Caching Strategy (Draft)
| Data | Strategy |
|------|----------|
| Career stats | ISR 1 hour, revalidate on sync |
| H2H matrix | ISR 1 hour, revalidate on sync |
| Season data | Static at build (historical) |
| Current season | ISR 15 min during NFL season |

### Open Questions
- **E2E scope:** Expand Playwright or use simpler tool?
- **Accessibility:** Automated only or include manual checklist?

---

## 7. Media, Social & AI Guardrails

Safety and cost controls for user-generated and AI-generated content.

### Media Requirements
- [ ] Storage quotas per member and total league cap
- [ ] CDN optimization for images/video
- [ ] Image compression/resizing on upload
- [ ] Abuse/malware scanning on uploads
- [ ] Content moderation workflow (flag → review)

### AI Requirements
- [ ] Ground AI outputs against Supabase data (no hallucinated stats)
- [ ] Cost limits (monthly budget, per-generation token caps)
- [ ] Model selection by feature (Sonnet for most, Opus for recaps)
- [ ] Eval harness to catch hallucinations
- [ ] Human review queue for published AI content
- [ ] Rate limiting per user

### Open Questions
- **Storage quotas:** 100MB per member? 1GB? Total league cap?
- **Malware scanning:** ClamAV/Lambda, VirusTotal API, or Supabase built-in?
- **AI budget:** Monthly cap? Token limits per generation?
- **Eval harness:** Automated assertions or human review queue?

---

## Priority Mapping

When these items should be addressed:

| Item | Recommended Sprint | Blocking? |
|------|-------------------|-----------|
| Auth/RLS bootstrap | Sprint 4 (Production Ready) | Yes |
| Feature flags | Sprint 4 (Production Ready) | No |
| Audit logging | Sprint 4 (Production Ready) | No |
| E2E smoke tests | Sprint 4 (Production Ready) | Yes |
| Weekly Yahoo sync | Post-launch | No |
| Error monitoring | Sprint 4 (Production Ready) | Yes |
| Media guardrails | Sprint 5 (Social Features) | Yes |
| AI guardrails | Sprint 6 (AI Features) | Yes |
| Performance budgets | Sprint 4 (Production Ready) | No |
| Backup drills | Post-launch | No |

---

## Notes

This document serves as a parking lot for operational considerations. Items should be promoted to `ROADMAP.md` when:
1. They become blocking for a sprint
2. We have answers to the open questions
3. We're ready to commit to implementation

*Last reviewed: December 8, 2025*
