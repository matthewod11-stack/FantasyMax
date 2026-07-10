# Commissioner Writeup Source Archive

This directory is the canonical, source-first archive for commissioner emails and writeups that ground FantasyMax narratives.

## Archive Rules

- Preserve the commissioner's body text verbatim.
- Remove email addresses, quoted-message headers, and transport artifacts.
- Keep one email/writeup per record with a stable source key.
- Record only dates visible in the source. Do not invent a date when an export omits it.
- Store season, week, type, and order as retrieval metadata; these labels do not replace the original writing.
- Correct metadata separately from the body text.
- Generated recaps, scouting reports, and summaries are downstream artifacts and must never overwrite these sources.

## Coverage

- **2015-2024:** Clean source material remains in docs/alltimewriteups.md. It will be segmented and indexed season by season without rewriting the body text.
- **2025:** Six emails are curated under docs/writeups/2025/.

## Additive Import

Preview an import without changing the database:

```bash
npm run writeups:import -- --year=2025
```

After reviewing the counts, explicitly opt into the source-keyed upsert:

```bash
npm run writeups:import -- --year=2025 --run
```

The importer never deletes or reseeds writeups. It validates the complete season archive, resolves the league, season, and commissioner from the database, and inserts or updates only records carrying a stable `source_key`. The original source date is stored separately from the application's publication timestamp. A small additive migration must be applied before either command can inspect source keys.
