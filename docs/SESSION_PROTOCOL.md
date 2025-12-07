# FantasyMax — Session Protocol

> **Purpose:** Ensure continuity across multiple Claude Code sessions.
> **Based on:** [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

---

## Core Principle

> "Each new session begins with no memory of what came before."

We use **structured artifacts** to maintain continuity:

| Artifact | Purpose | Location |
|----------|---------|----------|
| **PROGRESS.md** | Log of completed work | `PROGRESS.md` |
| **ROADMAP.md** | Checkbox tracking | `ROADMAP.md` |
| **features.json** | Pass/fail status | `features.json` |
| **KNOWN_ISSUES.md** | Parking lot | `docs/KNOWN_ISSUES.md` |

---

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════════════════╗
║  FANTASYMAX SESSION MANAGEMENT                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  SESSION START:                                                       ║
║    ./scripts/dev-init.sh                                              ║
║                                                                       ║
║  DURING SESSION:                                                      ║
║    • Work on ONE task at a time                                       ║
║    • Update docs after each completed task                            ║
║    • Commit frequently                                                ║
║                                                                       ║
║  CHECKPOINT (context getting long):                                   ║
║    "Update PROGRESS.md and features.json with current state"          ║
║                                                                       ║
║  SESSION END (before compaction):                                     ║
║    "Before ending: Please follow session end protocol..."             ║
║                                                                       ║
║  IF BLOCKED:                                                          ║
║    Add to docs/KNOWN_ISSUES.md → Move to next task                    ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Session Start Protocol

1. **Run init script:** `./scripts/dev-init.sh`
2. **Read progress:** `cat PROGRESS.md`
3. **Check features:** `cat features.json`
4. **Verify previous work:** `npm run build`
5. **Check blockers:** `cat docs/KNOWN_ISSUES.md`
6. **Pick next task:** First unchecked in ROADMAP.md

---

## Session End Protocol

1. Run verification (build, type-check)
2. Add entry to TOP of PROGRESS.md
3. Update features.json status
4. Check off tasks in ROADMAP.md
5. Commit with descriptive message
6. Note "Next Session Should" in PROGRESS.md

---

## Session Prompts

### Session Start Prompt

```
I'm continuing work on FantasyMax.

This is a multi-session implementation. Please follow the session protocol:

1. Run ./scripts/dev-init.sh to verify environment
2. Read PROGRESS.md for previous session work
3. Read ROADMAP.md to find the NEXT unchecked task
4. Check features.json for pass/fail status
5. Check docs/KNOWN_ISSUES.md for any blockers

Work on ONE task only (single-feature-per-session rule). Tell me what's next.
```

### Session End Prompt

```
Before ending: Please follow session end protocol:

1. Run verification (npm run build)
2. Add session entry to TOP of PROGRESS.md
3. Update features.json with pass/fail status
4. Check off completed task in ROADMAP.md
5. Commit with descriptive message

What's the "Next Session Should" note for PROGRESS.md?
```

### Checkpoint Prompt (Mid-Session)

```
Let's checkpoint. Update PROGRESS.md and features.json
with current state, then we can continue.
```

### After Long Break Prompt

```
Resuming FantasyMax after a break. Full context reload:

1. Run ./scripts/dev-init.sh
2. Read docs/SESSION_PROTOCOL.md (workflow rules)
3. Read PROGRESS.md (all session history)
4. Check features.json and docs/KNOWN_ISSUES.md

Summarize: where are we, what's next, any blockers?
```

---

## Understanding Sessions vs Tasks

**Session = Context Window** (not calendar day, not task)

```
┌─────────────────────────────────────────────────────────────┐
│  Context Window                                             │
│                                                             │
│  Task A ──► Task B ──► Task C ──► [Context limit]           │
│    ↓          ↓                         ↓                   │
│  Update    Update              SESSION ENDS                 │
│   docs      docs               (update docs)                │
└─────────────────────────────────────────────────────────────┘
                              ↓
              ┌───────────────────────────────┐
              │  NEW SESSION                  │
              │  Run init, read progress      │
              │  Continue Task C or next      │
              └───────────────────────────────┘
```

- **Update docs** → After every completed task
- **New session** → After compaction or fresh start
- **Can complete multiple tasks** in one context window
- **Large tasks can span** multiple sessions

---

## Key Project Locations

| Purpose | Location |
|---------|----------|
| Session progress log | `PROGRESS.md` |
| Task roadmap | `ROADMAP.md` |
| Feature tracking | `features.json` |
| Known issues | `docs/KNOWN_ISSUES.md` |
| Dev init script | `scripts/dev-init.sh` |
| Project config | `CLAUDE.md` |
| Source code | `src/` |
| Supabase schema | `supabase/migrations/` |

---

## Tips for Success

1. **Start sessions the same way** — Always run dev-init.sh
2. **Checkpoint often** — Don't wait for context limit
3. **PROGRESS.md entries at TOP** — Most recent first
4. **Descriptive commits** — They serve as documentation
5. **Park blockers immediately** — Don't let them derail progress
6. **JSON for tracking** — Resists inappropriate edits
7. **Verify before marking complete** — Build must pass
