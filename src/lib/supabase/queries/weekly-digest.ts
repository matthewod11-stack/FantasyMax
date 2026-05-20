import { createAdminClient, getUntypedAdminClient } from '../server';

export interface WeekHighlight {
  type: 'high_score' | 'upset' | 'closest' | 'earnings';
  title: string;
  description: string;
  memberName?: string;
  value?: string;
}

export interface WeeklyDigestData {
  week: number;
  seasonYear: number;
  highlights: WeekHighlight[];
  emailSubject: string;
  emailBody: string;
}

export async function generateWeeklyDigest(
  seasonId: string,
  week: number,
): Promise<WeeklyDigestData | null> {
  const supabase = await createAdminClient();

  const { data: season } = await supabase
    .from('seasons')
    .select('id, year')
    .eq('id', seasonId)
    .single();

  if (!season) return null;

  let { data: matchups } = await supabase
    .from('matchups')
    .select(
      `
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
    .eq('is_playoff', false);

  if (!matchups?.length) {
    const fallback = await supabase
      .from('matchups')
      .select(
        `
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
      .eq('status', 'final');
    matchups = fallback.data ?? [];
  }

  const highlights: WeekHighlight[] = [];
  let highScorer = { name: '', score: 0 };
  let closest = { diff: Infinity, desc: '' };
  let biggestUpset = { diff: 0, desc: '' };

  for (const m of matchups ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const home = m.home_team as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const away = m.away_team as any;
    const homeScore = m.home_score ?? 0;
    const awayScore = m.away_score ?? 0;
    const homeName = home?.member?.display_name || home?.team_name || 'Home';
    const awayName = away?.member?.display_name || away?.team_name || 'Away';

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
    if (margin > biggestUpset.diff) {
      biggestUpset = {
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
      value: `$50 earnings`,
    });
  }

  if (closest.desc) {
    highlights.push({
      type: 'closest',
      title: 'Nail-Biter',
      description: closest.desc,
    });
  }

  if (biggestUpset.desc) {
    highlights.push({
      type: 'upset',
      title: 'Biggest Margin',
      description: biggestUpset.desc,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modfantasyleague.com';
  const dashboardUrl = `${baseUrl}/?week=${week}`;

  const emailSubject = `Week ${week} — ${highScorer.name || 'League'} tops the board`;
  const emailBody = `Week ${week} is in the books.

${highScorer.name ? `${highScorer.name} led the league with ${highScorer.score.toFixed(1)} points` : 'Scores are updated'}${highScorer.name ? ' — another $50 in the kitty.' : '.'}

${closest.desc ? `Closest game: ${closest.desc}.` : ''}

See standings, rivalries, earnings, and more:
${dashboardUrl}

— League of Degenerates`;

  const digest: WeeklyDigestData = {
    week,
    seasonYear: season.year,
    highlights,
    emailSubject,
    emailBody,
  };

  const untyped = await getUntypedAdminClient();
  await untyped.from('weekly_digests').upsert(
    {
      season_id: seasonId,
      week,
      highlights,
      email_subject: emailSubject,
      email_body: emailBody,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'season_id,week' },
  );

  return digest;
}

export async function getWeeklyDigest(
  seasonId: string,
  week: number,
): Promise<WeeklyDigestData | null> {
  const supabase = await createAdminClient();

  const untyped = await getUntypedAdminClient();
  const { data } = await untyped
    .from('weekly_digests')
    .select('week, highlights, email_subject, email_body, seasons(year)')
    .eq('season_id', seasonId)
    .eq('week', week)
    .single();

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seasons = data.seasons as any;

  return {
    week: data.week,
    seasonYear: seasons?.year ?? new Date().getFullYear(),
    highlights: (data.highlights as WeekHighlight[]) ?? [],
    emailSubject: data.email_subject ?? '',
    emailBody: data.email_body ?? '',
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
