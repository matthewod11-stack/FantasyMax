import { createAdminClient, getUntypedAdminClient } from '../server';

export interface WeekHighlight {
  type: 'high_score' | 'upset' | 'closest' | 'earnings' | 'dashboard';
  title: string;
  description: string;
  memberName?: string;
  value?: string;
}

export type WeeklyDigestStatus = 'draft' | 'published';

export interface WeeklyDigestData {
  id: string;
  week: number;
  seasonYear: number;
  highlights: WeekHighlight[];
  emailSubject: string;
  emailBody: string;
  status: WeeklyDigestStatus;
  commissionerNote: string | null;
  publishedAt: string | null;
  publishedTitle: string;
}

export interface WeeklyDigestAdminData extends WeeklyDigestData {
  seasonId: string;
  generatedAt: string | null;
}

interface WeeklyDigestRow {
  id: string;
  season_id: string;
  week: number;
  highlights: unknown;
  email_subject: string | null;
  email_body: string | null;
  generated_at: string | null;
  status: string | null;
  commissioner_note: string | null;
  published_at: string | null;
  published_title: string | null;
  seasons?: { year?: number | null } | { year?: number | null }[] | null;
}

interface TeamRelation {
  team_name?: string | null;
  member?: { display_name?: string | null } | { display_name?: string | null }[] | null;
}

function getTeamDisplayName(team: TeamRelation | null, fallback: string) {
  const member = Array.isArray(team?.member) ? team?.member[0] : team?.member;
  return member?.display_name || team?.team_name || fallback;
}

function getSeasonYearFromRow(row: WeeklyDigestRow, fallbackYear: number) {
  const season = Array.isArray(row.seasons) ? row.seasons[0] : row.seasons;
  return season?.year ?? fallbackYear;
}

function toDigestStatus(status: string | null | undefined): WeeklyDigestStatus {
  return status === 'published' ? 'published' : 'draft';
}

function defaultPublishedTitle(week: number, highScorerName?: string) {
  return highScorerName
    ? `Week ${week}: ${highScorerName} Sets the Pace`
    : `Week ${week} League Dispatch`;
}

function formatWeeklyDigest(row: WeeklyDigestRow, fallbackSeasonYear: number): WeeklyDigestData {
  const highlights = Array.isArray(row.highlights) ? row.highlights : [];

  return {
    id: row.id,
    week: row.week,
    seasonYear: getSeasonYearFromRow(row, fallbackSeasonYear),
    highlights: highlights as WeekHighlight[],
    emailSubject: row.email_subject ?? '',
    emailBody: row.email_body ?? '',
    status: toDigestStatus(row.status),
    commissionerNote: row.commissioner_note,
    publishedAt: row.published_at,
    publishedTitle: row.published_title ?? defaultPublishedTitle(row.week),
  };
}

export async function generateWeeklyDigest(
  seasonId: string,
  week: number,
): Promise<WeeklyDigestData | null> {
  const supabase = await createAdminClient();

  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select('id, year')
    .eq('id', seasonId)
    .maybeSingle();

  if (seasonError) {
    throw new Error(`Failed to load season for weekly digest: ${seasonError.message}`);
  }

  if (!season) return null;

  const untyped = await getUntypedAdminClient();

  const { data: existingDigest, error: existingDigestError } = await untyped
    .from('weekly_digests')
    .select(
      'id, season_id, week, highlights, email_subject, email_body, generated_at, status, commissioner_note, published_at, published_title',
    )
    .eq('season_id', seasonId)
    .eq('week', week)
    .maybeSingle();

  if (existingDigestError) {
    throw new Error(`Failed to load existing weekly digest: ${existingDigestError.message}`);
  }

  if ((existingDigest as WeeklyDigestRow | null)?.status === 'published') {
    return formatWeeklyDigest(existingDigest as WeeklyDigestRow, season.year);
  }

  const { data: regularSeasonMatchups, error: matchupsError } = await supabase
    .from('matchups')
    .select(
      `
      id,
      week,
      home_score,
      away_score,
      is_playoff,
      home_team:teams!matchups_home_team_id_fkey(team_name, member:members(display_name)),
      away_team:teams!matchups_away_team_id_fkey(team_name, member:members(display_name))
    `,
    )
    .eq('season_id', seasonId)
    .eq('week', week)
    .eq('status', 'final')
    .eq('is_playoff', false)
    .order('id', { ascending: true });

  if (matchupsError) {
    throw new Error(`Failed to load regular-season matchups for weekly digest: ${matchupsError.message}`);
  }

  let matchups = regularSeasonMatchups;

  if (!matchups?.length) {
    const fallback = await supabase
      .from('matchups')
      .select(
        `
        id,
        week,
        home_score,
        away_score,
        is_playoff,
        home_team:teams!matchups_home_team_id_fkey(team_name, member:members(display_name)),
        away_team:teams!matchups_away_team_id_fkey(team_name, member:members(display_name))
      `,
      )
      .eq('season_id', seasonId)
      .eq('week', week)
      .eq('status', 'final')
      .order('id', { ascending: true });

    if (fallback.error) {
      throw new Error(`Failed to load fallback matchups for weekly digest: ${fallback.error.message}`);
    }

    matchups = fallback.data ?? [];
  }

  const highlights: WeekHighlight[] = [];
  let highScorer = { name: '', score: 0 };
  let closest = { diff: Infinity, desc: '' };
  let biggestMargin = { diff: 0, desc: '' };

  for (const m of matchups ?? []) {
    const home = m.home_team as TeamRelation | null;
    const away = m.away_team as TeamRelation | null;
    const homeScore = m.home_score ?? 0;
    const awayScore = m.away_score ?? 0;
    const homeName = getTeamDisplayName(home, 'Home');
    const awayName = getTeamDisplayName(away, 'Away');

    if (homeScore > highScorer.score) {
      highScorer = { name: homeName, score: homeScore };
    }
    if (awayScore > highScorer.score) {
      highScorer = { name: awayName, score: awayScore };
    }

    const diff = Math.abs(homeScore - awayScore);
    if (diff < closest.diff) {
      closest = {
        diff,
        desc: `${homeName} ${homeScore.toFixed(1)} - ${awayName} ${awayScore.toFixed(1)}`,
      };
    }

    const margin = Math.abs(homeScore - awayScore);
    if (margin > biggestMargin.diff) {
      biggestMargin = {
        diff: margin,
        desc: `${homeScore > awayScore ? homeName : awayName} won by ${margin.toFixed(1)}`,
      };
    }
  }

  if (highScorer.name) {
    highlights.push({
      type: 'high_score',
      title: 'Weekly High Scorer',
      description: `${highScorer.name} dropped ${highScorer.score.toFixed(1)} points`,
      memberName: highScorer.name,
      value: '$50 earnings',
    });
  }

  if (closest.desc) {
    highlights.push({
      type: 'closest',
      title: 'Nail-Biter',
      description: closest.desc,
    });
  }

  if (biggestMargin.desc) {
    highlights.push({
      type: 'upset',
      title: 'Biggest Margin',
      description: biggestMargin.desc,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modfantasyleague.com';
  const dashboardUrl = `${baseUrl}/?week=${week}`;
  const title = defaultPublishedTitle(week, highScorer.name);

  const emailSubject = `Week ${week} — ${highScorer.name || 'League'} tops the board`;
  const emailBody = `Week ${week} is in the books.

${highScorer.name ? `${highScorer.name} led the league with ${highScorer.score.toFixed(1)} points` : 'Scores are updated'}${highScorer.name ? ' — another $50 in the kitty.' : '.'}

${closest.desc ? `Closest game: ${closest.desc}.` : ''}
${biggestMargin.desc ? `Biggest margin: ${biggestMargin.desc}.` : ''}

See standings, rivalries, earnings, and more:
${dashboardUrl}

— League of Degenerates`;

  highlights.push({
    type: 'dashboard',
    title: 'Dashboard Link',
    description: dashboardUrl,
  });

  const existing = existingDigest as WeeklyDigestRow | null;
  const savedSubject = existing?.email_subject || emailSubject;
  const savedBody = existing?.email_body || emailBody;
  const savedTitle = existing?.published_title || title;

  const digest: WeeklyDigestData = {
    id: existing?.id ?? '',
    week,
    seasonYear: season.year,
    highlights,
    emailSubject: savedSubject,
    emailBody: savedBody,
    status: toDigestStatus(existing?.status),
    commissionerNote: existing?.commissioner_note ?? null,
    publishedAt: existing?.published_at ?? null,
    publishedTitle: savedTitle,
  };

  const { error: upsertError } = await untyped.from('weekly_digests').upsert(
    {
      season_id: seasonId,
      week,
      highlights,
      email_subject: savedSubject,
      email_body: savedBody,
      generated_at: new Date().toISOString(),
      status: digest.status,
      commissioner_note: digest.commissionerNote,
      published_at: digest.publishedAt,
      published_title: savedTitle,
    },
    { onConflict: 'season_id,week' },
  );

  if (upsertError) {
    throw new Error(`Failed to save weekly digest: ${upsertError.message}`);
  }

  return digest;
}

export async function getWeeklyDigest(
  seasonId: string,
  week: number,
): Promise<WeeklyDigestData | null> {
  const untyped = await getUntypedAdminClient();
  const { data } = await untyped
    .from('weekly_digests')
    .select(
      'id, season_id, week, highlights, email_subject, email_body, generated_at, status, commissioner_note, published_at, published_title, seasons(year)',
    )
    .eq('season_id', seasonId)
    .eq('week', week)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) return null;

  return formatWeeklyDigest(data as WeeklyDigestRow, new Date().getFullYear());
}

export async function getLatestWeeklyDigestForAdmin(
  seasonId: string,
): Promise<WeeklyDigestAdminData | null> {
  const untyped = await getUntypedAdminClient();
  const { data } = await untyped
    .from('weekly_digests')
    .select(
      'id, season_id, week, highlights, email_subject, email_body, generated_at, status, commissioner_note, published_at, published_title, seasons(year)',
    )
    .eq('season_id', seasonId)
    .order('week', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as WeeklyDigestRow;
  const digest = formatWeeklyDigest(row, new Date().getFullYear());

  return {
    ...digest,
    seasonId: row.season_id,
    generatedAt: row.generated_at,
  };
}

export async function getLatestSyncStatus(): Promise<{
  lastSyncAt: string | null;
  seasonYear: number | null;
  isStale: boolean;
}> {
  const supabase = await createAdminClient();

  const { data: season } = await supabase
    .from('seasons')
    .select('year, last_sync_at')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (!season) {
    return { lastSyncAt: null, seasonYear: null, isStale: true };
  }

  const lastSync = season.last_sync_at;
  const isStale = lastSync
    ? Date.now() - new Date(lastSync).getTime() > 8 * 24 * 60 * 60 * 1000
    : true;

  return {
    lastSyncAt: lastSync,
    seasonYear: season.year,
    isStale,
  };
}
