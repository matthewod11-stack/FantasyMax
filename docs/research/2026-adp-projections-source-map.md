# 2026 ADP and Projection Source Map

Research date: 2026-07-17

Status: research only. No ingestion, schema, or publishing work is authorized by this document.

## Recommendation

Build the War Room around three separate evidence layers:

1. **Market price** — where players are actually being drafted.
2. **Expected production** — source-level stat projections, rescored for this league.
3. **FantasyMax conviction** — the existing movement, coaching, opportunity, and uncertainty signals.

Do not collapse these into one rank. The useful product is the disagreement:

```text
our league-adjusted projection
        versus
consensus market price
        versus
FantasyMax evidence signal
```

The best initial source set is:

- FantasyPros API for a licensed, structured consensus anchor.
- MyFantasyLeague ADP API for a free, filterable market dataset with sample size and range.
- Yahoo league-context rank and settings through the OAuth machinery already in FantasyMax.
- ESPN Mike Clay's 2026 projection guide as an independent, downloadable projection model.
- NFFC ADP as a high-stakes market cross-check when an authorized export can be obtained.

## Verified Sources

| Source | Evidence type | Access | 2026 status | Recommended role |
| --- | --- | --- | --- | --- |
| [FantasyPros API](https://www.fantasypros.com/api-data/) | ECR, ADP, full-stat projections, injuries, metadata | Documented JSON API; key required | Live | Primary structured consensus source |
| [MyFantasyLeague API](https://api.myfantasyleague.com/2026/api_info?STATE=details&TYPE=adp) | Real-draft ADP with min, max, and sample counts | Public documented JSON/XML API | Live | Primary free market source |
| [Yahoo Fantasy API](https://developer.yahoo.com/fantasysports/guide/) | League settings, player metadata, league-context overall rank | Existing OAuth | Available; exact 2026 projection payload unproven | Platform-native price and scoring context |
| [ESPN Mike Clay guide](https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf) | Independent full-stat projections | Public PDF download | Published 2026-07-09 | Independent projection source |
| [NFFC](https://nfc.shgn.com/football) | High-stakes real-draft ADP, min/max, draft count | Public site; no documented API found | Live | Market cross-check, not automated core yet |
| [FantasyData ADP](https://fantasydata.com/nfl/adp) | ADP by scoring/format | Web table plus CSV/XLS controls; full rows require Premium | Live | Optional licensed secondary source |
| [DraftSharks ADP Market Index](https://www.draftsharks.com/kb/best-fantasy-football-tools) | Platform-specific ADP and historical movement | Subscription product; no public API verified | Live | Human research/corroboration only |
| [Sleeper API](https://docs.sleeper.com/) | Player identities, drafts, rosters, trending adds/drops | Public documented read-only API | Live | Identity and trend support, not core ADP/projections |

### Source notes

#### FantasyPros

The formal API exposes:

- consensus rankings and ADP by position, scoring, week, and ranking type
- best, worst, average, and standard deviation of expert ranks
- preseason and weekly full-stat projections
- canonical FantasyPros IDs and external-ID cross-references

The free tier is for prototypes and non-production use. A personal/non-commercial production key is included with MVP/HOF subscriptions. Redistribution and commercial use require a commercial agreement.

The legacy `?export=xls` URL was probed. It returned HTML, not a real XLS file. The page contained a 505-player embedded ECR payload on 2026-07-17, but this is a brittle and licensing-poor ingestion path. Use the API instead.

Treat FantasyPros consensus as **one composite source**, not as 130 independent votes. Otherwise any later consensus would double-count the same underlying experts.

#### MyFantasyLeague

The public endpoint was directly verified:

```text
https://api.myfantasyleague.com/2026/export?TYPE=adp&JSON=1
```

At 2026-07-17 03:38 PDT it returned:

- 337 player ADP records
- 339 drafts reported by the feed
- rank, average pick, minimum pick, maximum pick
- drafts selected in and selection percentage
- stable MFL player IDs

The documented filters are especially useful:

- `PERIOD`: recent and season-window views
- `FCOUNT`: 8, 10, 12, 14, or 16-team leagues
- `IS_PPR`: PPR/non-PPR/all
- `IS_KEEPER`: redraft, keeper, or rookie-only
- `IS_MOCK`: mock-only, real-draft-only, or all
- `CUTOFF`: minimum draft-selection coverage
- `DETAILS`: included leagues for the current season

This should be the first free automated ADP source because its format and filtering assumptions are explicit.

#### Yahoo

Yahoo is the most important platform context because the league drafts there. Its official player collection supports league-context sorting by overall rank (`OR`), actual rank, fantasy points, or stat ID. League settings are also a documented resource.

However, the official guide does not document a clean preseason projected-stat or ADP field. A live read-only probe against the active 2026 league is required before promising either.

FantasyMax currently has Yahoo OAuth and league/team/matchup/trade sync, but does not yet sync league settings or players. The production league record currently has an empty `settings` object, so scoring-specific projection work is blocked on that settings probe.

#### ESPN Mike Clay

The public file was directly downloaded and inspected:

- valid PDF, 82 pages, approximately 5.2 MB
- created and modified 2026-07-09
- extractable text with team-by-team offensive stat lines
- games, attempts, completions, passing yards/TD/INT, sacks
- rushing attempts/yards/TD
- targets, receptions, receiving yards/TD
- PPR points and ranks

It is suitable for a deterministic PDF extraction experiment. Keep the original PDF hash and extracted-row audit. Because it is a published copyrighted guide, store and display derived values privately unless redistribution rights are confirmed.

#### NFFC

NFFC is valuable because it represents high-stakes behavior rather than analyst opinion. Public player pages expose ADP, min, max, draft count, and dated picks. The main site advertises thousands of 2026 leagues.

No documented API was found during this pass. Use a manual/authorized download if available. Do not build a production scraper around private web requests without permission.

#### Sleeper

Sleeper's documented API is excellent for player ID mapping and draft data. The official player feed includes Sleeper, ESPN, Yahoo, FantasyData, Rotowire, and other external identifiers where available, and Sleeper explicitly recommends caching it no more than daily.

Projection and ADP endpoints seen in third-party clients are not part of the core official documentation reviewed here. Do not depend on them until Sleeper documents them or a direct-use agreement is established.

## Consensus Method

### ADP consensus

Only combine observations with compatible contexts:

- redraft versus best ball versus dynasty
- PPR versus half-PPR versus standard
- one-QB versus superflex
- league size
- mock versus paid/real drafts
- recency window

For each player and context, calculate:

- source count and source names
- weighted median ADP
- minimum and maximum source ADP
- interquartile range or median absolute deviation
- newest and oldest source timestamps
- per-source sample size where available
- seven-day and thirty-day movement

Start with equal source weights. Do not invent accuracy weights until historical snapshots can be backtested. Use sample size as a confidence annotation, not an automatic claim that one market is universally superior.

Missing source coverage is `null`, never zero and never an implied last-place rank.

### Projection consensus

Store raw statistical components from every source. Do not average provider fantasy-point totals because their scoring assumptions differ.

First combine compatible stat components, then calculate FantasyMax points from the league's actual scoring rules. Preserve:

- each source projection
- median projection by stat
- low/high range and dispersion
- number of contributing sources per stat
- league-scored points per source
- league-scored consensus points

A simple median is the correct first model. It is robust, explainable, and does not pretend we have historical accuracy evidence that we do not yet possess.

### War Room deltas

The first useful derived features are:

- `projection_rank - consensus_adp_rank`: production value versus market price
- `yahoo_rank - cross_market_adp_rank`: Yahoo room distortion
- `recent_adp - prior_adp`: price movement
- `source_max_adp - source_min_adp`: market disagreement
- `FantasyMax signal direction + market movement`: thesis confirmation or contradiction
- replacement-level value by position under this league's roster and scoring rules

The interface should show the source disagreement and sample coverage beside any value label.

## Proposed Data Contract

This is a logical model, not a migration specification.

### Canonical player identity

`players`

- stable internal ID
- full/display name
- NFL team and position
- active status

`player_provider_ids`

- player ID
- provider
- provider player ID
- valid-from and valid-to dates
- match method and confidence
- manually verified flag

Names alone are not durable identifiers. Team changes, suffixes, punctuation, defenses, and rookies will otherwise create silent mismatches.

### Source snapshots

`data_snapshots`

- source and dataset type
- season and context JSON
- source update time and retrieval time
- content hash
- raw-object location
- parser version
- record count
- license/use scope
- success, partial, or rejected status

### ADP observations

`adp_observations`

- snapshot ID and player ID
- ADP, rank, position rank
- min/max pick
- sample size and selection percentage
- scoring, league size, draft type, and recency window

### Projection observations

`projection_observations`

- snapshot ID and player ID
- games
- passing, rushing, receiving, kicking, and defense components as nullable typed fields
- source-provided fantasy points and source scoring label
- FantasyMax-calculated points

The raw response belongs in object storage or a versioned local research archive. Supabase should hold normalized rows, hashes, and provenance—not repeated multi-megabyte blobs.

## Current FantasyMax State

Read-only production checks on 2026-07-17 found:

- `league.settings = {}`
- `draft_picks` contains 0 rows
- no `players` table
- no `player_projections` table
- no `adp_snapshots` table
- the current league row still stores Yahoo key `461.l.175829`

The existing `draft_picks` table is for the league's completed historical draft results. It is not the right home for preseason market or projection data.

## Recommended Research Sequence

1. Read-only probe the active Yahoo league settings, current player rank, and any projected-points subresources. Save only a sanitized fixture.
2. Acquire a FantasyPros prototype API key and inspect the 2026 players, consensus rankings, and preseason projections schemas.
3. Download MFL 14-team, PPR/half-PPR-nearest, redraft, non-mock snapshots and measure coverage.
4. Build a deterministic ESPN PDF extraction audit for 20 known players before attempting the full guide.
5. Resolve player IDs across FantasyPros, Yahoo, MFL, ESPN, and Sleeper; report matched, ambiguous, and missing counts.
6. Confirm the actual 2026 FantasyMax scoring and roster rules before calculating any custom values.
7. Produce one offline consensus CSV/JSON artifact and inspect disagreements manually.
8. Only then design the Supabase migration and automated refresh cadence.

## Public Versus Private Use

The private personal War Room can use licensed personal/non-commercial feeds according to their terms. The open-source project should ship:

- provider interfaces
- schemas and parsers
- synthetic fixtures
- user-supplied import commands

It should not redistribute paid or copyrighted rankings/projections. Public demo data should be synthetic, explicitly licensed, or fetched by each user's own credentials.

