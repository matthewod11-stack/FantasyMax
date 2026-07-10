# AI Narratives, Manager Scouting, and Draft Analysis

**Status:** Product/data direction for the next FantasyMax workstream  
**Date:** July 10, 2026  
**Scope:** Planning only; no production behavior changed in this session

## Product Goal

Make FantasyMax feel like the league's own intelligence and memory layer, not a generic recap generator.

The commissioner's original writing is the authoritative narrative source. League data is the authoritative statistical source. AI should work downstream of both: it should not discover facts, replace the source voice, or decide what is statistically meaningful.

## Source-First Decision

Do not keep iterating on the current generated recaps as if they are the source material. Preserve and index the original commissioner emails first, then regenerate downstream artifacts from those sources plus verified league data.

The 2015-2024 source writing in `docs/alltimewriteups.md` is already clean. The gap is segmentation and retrieval: the current parser can merge distinct emails, apply rough labels, and feed only the first few excerpts to the model. Work through the archive season by season without rewriting the bodies.

The six supplied 2025 emails are now preserved as separate source records in `docs/writeups/2025/`. Five retain exact dates from the email chain; the Final Four email remains explicitly undated rather than receiving an invented timestamp.

## Current-State Findings

- The 11 season reviews were regenerated recently with `claude-sonnet-5`, but they still read as one repeated template: season hook, champion, large score, last-place jab.
- The season prompt asks for exactly three paragraphs but supplies four required story beats. All live reviews currently use four paragraphs, and several miss the requested word limit.
- Season lore retrieval takes only the first five writeups in stored order and only the first 300 characters of each. In years with many writeups, this overweights announcements and draft logistics while omitting later playoff and championship material.
- The standings prompt includes only ten teams even in fourteen-team seasons.
- The 91 H2H recaps are an older frozen batch. The generator can print scores in the wrong winner/loser order, and sampled live recaps contain record or momentum contradictions.
- Season and H2H generators bypass the shared structured-AI layer and save raw prose directly. They do not store prompt version, source-data hash, cited facts, or a reviewable fact snapshot.
- Draft/publish fields exist for season reviews, but the generator writes directly to the live review field and the member UI does not enforce approval state.
- The current evals pass, but they do not call the production prompt builders and therefore do not catch the problems above.
- Clean commissioner source exists for 2015-2024, but it remains in one legacy file and has not been audited as one-email-per-record.
- Six 2025 commissioner emails now fill the previous lore gap from the draft through the Final Four. The supplied export does not include a championship result or final season recap.
- The manager page already has strong raw material: career history, championships, weekly high scores, rivalries, luck, and season-by-season results.
- Production currently has 11 historical season keys (2015-2025), 1,155 final matchups, 41 trades, 97 published writeups through 2024, 164 member mentions, 91 H2H recaps, and zero draft picks. The six new 2025 source records are archived locally but not yet imported.
- A `draft_picks` table and basic Draft Analyzer page already exist, but the Yahoo client and sync do not import draft results.

## Product Rules

1. **Sources before summaries.** Original commissioner writing is immutable input, not material to be overwritten by generated prose.
2. **Facts first, prose second.** A deterministic fact pack owns names, numbers, denominators, comparisons, and source links.
3. **Receipts are part of the feature.** A claim such as “opened RB-RB-RB in 6 of 9 drafts” should link to those drafts.
4. **Normalize across seasons.** League size and scoring environments changed. Compare managers to that season's league, not just raw career totals.
5. **Use confidence language.** Small samples can be shown as facts, but not promoted into personality claims.
6. **AI selects wording, not truth.** Generated output may reference only supplied source and fact IDs, and every citation must validate before save.
7. **Publish intentionally.** Generate to draft, preview, approve, then publish. Do not overwrite member-facing content directly.
8. **Regenerate when evidence changes.** Store `prompt_version`, `model`, `source_hash`, generation time, and the source fact snapshot.
9. **Do not infer injuries.** Draft results alone can show whom someone selected, not why a player missed time.

## Manager Scouting Report

### Placement

Add one full-width **Scouting Report** directly after the six headline stat cards and before Trophy Case/Career Timeline. It becomes the interpretation layer between the raw summary and the evidence lower on the page.

### Proposed Shape

- **The book on [Manager]** — an 80-120 word career-level summary.
- **Four strongest tendencies** — each shows the claim, numerator/denominator, league comparison, confidence, and a receipt link.
- **Draft Room** — appears only after at least four complete draft seasons are available for that manager.
- **Receipts** — links to the relevant season, H2H matchup, trade, or historical writeup.
- **Coverage metadata** — for example, “Based on 7 seasons / 104 games; refreshed after 2025.”

The module should choose the most distinctive evidence for each manager rather than filling the same slots for everyone.

### Insight Candidates Available Now

| Insight | Minimum evidence | Notes |
| --- | ---: | --- |
| Performance archetype | 3 seasons / 30 games | Win rate, season-relative scoring, playoff and title conversion |
| Consistent vs. boom-or-bust | 4 seasons | Use season-normalized rank and scoring variance |
| Weekly ceiling/floor | 30 regular-season weeks | Weekly percentile, all-play result, high-score rate, volatility |
| Fast starter / strong finisher | 4 seasons | Compare first and final thirds within each season |
| Playoff profile | 6 playoff games | Record and berth-to-title conversion; avoid “clutch” below threshold |
| Rivalry fingerprint | 5 meetings | Use 8 meetings before language such as “dominates” |
| Trade personality | 5 trades / 3 seasons | Frequency, timing, and favorite partner only until player positions are reliable |
| Archive reputation | 3 writeups / 2 seasons | Direct commissioner excerpts and links, not unattributed lore |

### Draft Insights After Import

- First-round and first-three-round position mix
- Common opening sequences such as RB-RB-RB or WR-WR-RB
- Typical round for first QB and TE
- Positional runs and roster-construction balance
- Repeat-player affinity across seasons
- NFL-team “homer” tendencies, if historical player-team metadata is reliable
- Draft-slot tendencies and reach/value analysis, only if a valid historical baseline is available
- Relationship between draft style and team outcome, described as correlation rather than causation

### Confidence Language

- **High confidence:** at least 6 seasons plus 70% recurrence, or a large season-adjusted difference from the league baseline.
- **Medium confidence:** 3-5 seasons plus 60% recurrence, or a meaningful season-adjusted difference.
- **Fact only:** below those thresholds. Show the exact result but do not turn it into a personality claim.
- Use **always/never** only for 100% recurrence over at least 5 eligible seasons.
- Always display the period and denominator: “6 of 9 tracked drafts,” not “always.”

## Data Corrections Before Scouting Prose

These affect the trustworthiness of generated claims and should be repaired in the feature that first relies on them:

- Manager profiles use the legacy directional H2H view and hardcode ties to zero. Use the normalized H2H matrix and its real ties/streaks.
- Career win percentage currently has two tie-handling definitions. Establish one canonical formula.
- Career Luck Index is cumulative, which naturally makes long-tenured managers look more extreme. Use season- or week-normalized luck for personality claims.
- Career schedule strength currently deduplicates opponents rather than weighting every matchup. Repair that before calling a schedule easy or hard.
- Two zero-game 2025 team rows inflate the stored team count from 14 to 16 and must be excluded or reconciled before league-baseline calculations.
- Trade player positions are blank today, so claims such as “always trades running backs” are not yet supported.
- The profile's “Since” year should come from actual season coverage when it conflicts with the member metadata.

## Yahoo Draft Import

### Feasibility

This is likely feasible through Yahoo's league draft-results resource. FantasyMax already stores a Yahoo league key for every season from 2015 through 2025, and nearly every historical team row also has a Yahoo team key. Yahoo's official Fantasy Sports documentation confirms that private league data is available to an authenticated league member and that season-specific game/league keys are the API's historical addressing model.

The expected resource is:

```text
GET /fantasy/v2/league/{yahoo_league_key}/draftresults?format=json
```

The first implementation session must make a read-only production-equivalent probe against one known season before changing schema or sync behavior. A local probe could not decrypt the stored production OAuth credentials, so the exact historical payload and availability still need to be proven with the production encryption context.

Official reference: <https://developer.yahoo.com/fantasysports/guide/>

### Import Sequence

1. Probe one recent completed season and save a sanitized payload fixture.
2. Parse Yahoo's numeric-key wrappers into draft results.
3. Map `team_key` to the season team/member and `player_key` to player metadata.
4. Reconcile the one unkeyed team in each of 2015-2017 and the extra zero-game 2025 rows.
5. Upsert one season and report completeness: expected picks, imported picks, mapped teams, and enriched players.
6. Backfill all available seasons only after the single-season audit passes.
7. Regenerate database types; `draft_picks` is not currently represented in `database.types.ts`.

Do not extend the schema speculatively. After the probe, add only the identifiers and fields actually needed for stable upsert and analysis, likely including a season team reference, Yahoo team key, source metadata, and any confirmed keeper/auction fields.

## Injury and Bust Analysis

“Six of nine first-round picks missed considerable time” is a strong idea, but it is not supported by draft results alone.

A separate, verified player-outcome layer is needed for:

- weekly fantasy points or games active
- roster tenure and starting-lineup weeks
- confirmed games missed
- confirmed injury cause rather than benching, poor performance, suspension, or roster churn
- cross-provider player identity mapping

Until that exists, FantasyMax may say a top pick was unavailable or underproduced only when the underlying data directly supports that wording. It should not label the cause an injury. A reasonable future threshold for “considerable time” is at least four regular-season games missed due to a confirmed injury, with at least five eligible early picks before making a manager-level tendency claim.

## Narrative Pipeline V2

Each artifact should follow the same flow:

1. Load immutable, one-email-per-record commissioner sources.
2. Build a typed, deterministic fact pack from league data.
3. Rank candidate insights by distinctiveness, confidence, freshness, and source quality.
4. Retrieve relevant source passages across preseason, regular season, playoffs, and championship instead of taking the first five writeups.
5. Send only selected facts and source passages to the model.
6. Require structured output with `cited_source_keys` and `cited_fact_ids`.
7. Validate the schema, citations, names, numbers, length, and forbidden unsupported claims.
8. Save a draft with its source/fact snapshot, source hash, prompt version, and model.
9. Preview and approve before publishing.
10. Regenerate only when the source hash or prompt version changes.

The target voice should be **league archivist with commissioner edge**: specific, dry, and recognizable, with much less generic “ESPN broadcast” filler. The writing should vary because the selected story is different, not because the temperature is higher.

## Recommended Session-Sized Sequence

Following the project's one-feature-per-session rule:

1. **2025 source archive and additive import.** Preserve the six emails as separate records, validate metadata, and import without touching the existing 97 writeups.
2. **Historical source segmentation.** Work backward one season at a time through the clean 2015-2024 source, separating emails and checking date/week/type/manager links without rewriting the bodies.
3. **Source coverage and retrieval.** Produce a season-by-season coverage report and retrieval rules that select draft, early/midseason, playoff, and championship passages.
4. **Grounded Season Review V2 pilot (2025).** Generate a fresh artifact from the six 2025 sources plus verified season facts; do not edit the old recap into shape.
5. **Season review approval and corpus refresh.** Approve the source-grounded voice, then regenerate and audit prior seasons only after their source segmentation passes.
6. **H2H fact repair and recap refresh.** Fix score orientation/streak inputs, add real production evals, and replace the old 91-recap batch.
7. **Manager Scouting Report V1.** Use existing performance, playoff, rivalry, normalized luck, trade-count, and source-writing evidence; add the module to manager pages.
8. **Yahoo draft-results import.** Probe and import one historical season with a completeness report, then backfill in a later session.
9. **Draft DNA.** Add deterministic manager draft tendencies and the conditional Draft Room subsection.
10. **Player outcomes/availability.** Choose and validate a historical data source before adding injury, bust, or durability language.

## Acceptance Criteria for the First Slice

- The six 2025 emails exist as six separate source records in chronological order.
- Body text is verbatim apart from collapsed blank lines and removed email-chain headers.
- No email address is copied into the repository.
- Five known dates are preserved and the Final Four email remains explicitly undated.
- Each source has a stable key, season, type, week context, and order.
- Import is additive and idempotent; it cannot clear or duplicate the existing 97 writeups.
- No AI recap is regenerated until the source records can be retrieved and inspected independently.

## Open Product Decisions

- Should every generated artifact require commissioner approval, or only season reviews and league-wide content?
- Should the Scouting Report include a single archetype label, or let the evidence stand without one?
- How sharp should the published voice be when a claim is negative but statistically strong?
- Should old published recaps remain accessible as archived versions after refresh?
