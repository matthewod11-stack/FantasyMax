/**
 * League-Wide Query Functions
 *
 * These functions fetch league-level statistics and data
 * for the league dashboard.
 */

import { createAdminClient } from '../server';
import { prioritizeSeasonArcWriteups } from './writeups';
import type { TradeTimelineItem } from './trades';
import type { WriteupType } from '@/types/contracts/queries';

const ONE_DECIMAL_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatOneDecimal(value: number): string {
  return ONE_DECIMAL_FORMATTER.format(value);
}

function formatRecord(wins: number | null, losses: number | null, ties: number | null): string {
  const tieSuffix = ties ? `-${ties}` : '';
  return `${wins ?? 0}-${losses ?? 0}${tieSuffix}`;
}

function formatOrdinal(value: number | null): string {
  if (!value) return 'unranked';
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export interface SeasonArcMember {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface SeasonArcTeamInput {
  id: string;
  team_name: string | null;
  final_rank: number | null;
  final_record_wins: number | null;
  final_record_losses: number | null;
  final_record_ties: number | null;
  total_points_for: number | null;
  total_points_against: number | null;
  is_champion: boolean | null;
  is_last_place: boolean | null;
  playoff_seed: number | null;
  member: SeasonArcMember | null;
}

export interface SeasonArcMatchupInput {
  id: string;
  week: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  status: string | null;
  is_playoff: boolean | null;
  is_championship: boolean | null;
  is_consolation: boolean | null;
}

export interface SeasonArcWriteupInput {
  id: string;
  title: string;
  excerpt: string | null;
  week: number | null;
  writeup_type: WriteupType;
  published_at?: string | null;
  original_order?: number | null;
}

export interface SeasonArcBeat {
  title: string;
  summary: string;
  href: string;
}

export interface SeasonArcRecordBeat {
  kind: 'highest_score' | 'worst_score' | 'closest_game' | 'biggest_blowout';
  label: string;
  value: string;
  summary: string;
  href: string;
  week: number;
  matchupId: string;
}

export interface SeasonArcWriteupReceipt {
  id: string;
  title: string;
  excerpt: string | null;
  week: number | null;
  writeup_type: WriteupType;
  href: string;
}

export interface SeasonArcTradeReceipt {
  id: string;
  title: string;
  detail: string;
  championshipImpact: string | null;
  href: string;
}

export interface SeasonArcData {
  championPath: SeasonArcBeat | null;
  lastPlaceStory: SeasonArcBeat | null;
  records: SeasonArcRecordBeat[];
  receipts: {
    writeups: SeasonArcWriteupReceipt[];
    trades: SeasonArcTradeReceipt[];
  };
}

export interface BuildSeasonArcInput {
  year: number;
  season: {
    id: string;
    champion_team_id: string | null;
    last_place_team_id: string | null;
  };
  teams: readonly SeasonArcTeamInput[];
  matchups: readonly SeasonArcMatchupInput[];
  writeups: readonly SeasonArcWriteupInput[];
  trades: readonly TradeTimelineItem[];
}

function getMemberName(team: SeasonArcTeamInput | undefined): string {
  return team?.member?.display_name ?? 'Unknown';
}

function formatTradePlayers(players: { name: string; position?: string }[]): string {
  if (players.length === 0) return 'No players listed';
  return players.map((player) => player.name).join(', ');
}

function findChampionTeam(input: BuildSeasonArcInput): SeasonArcTeamInput | undefined {
  return (
    input.teams.find((team) => team.id === input.season.champion_team_id) ??
    input.teams.find((team) => team.is_champion)
  );
}

function findLastPlaceTeam(input: BuildSeasonArcInput): SeasonArcTeamInput | undefined {
  const explicitLastPlace =
    input.teams.find((team) => team.id === input.season.last_place_team_id) ??
    input.teams.find((team) => team.is_last_place);

  if (explicitLastPlace) return explicitLastPlace;

  const rankedTeams = input.teams.filter((team) => team.final_rank !== null);
  if (rankedTeams.length === 0) return undefined;

  return [...rankedTeams].sort((a, b) => (b.final_rank ?? 0) - (a.final_rank ?? 0))[0];
}

function buildChampionPath(
  champion: SeasonArcTeamInput | undefined,
  matchups: readonly SeasonArcMatchupInput[],
  teamMap: Map<string, SeasonArcTeamInput>,
): SeasonArcBeat | null {
  if (!champion?.member) return null;

  const record = formatRecord(
    champion.final_record_wins,
    champion.final_record_losses,
    champion.final_record_ties,
  );
  const seedLabel = champion.playoff_seed ? `No. ${champion.playoff_seed} seed` : 'champion';
  const championship = matchups.find(
    (matchup) =>
      matchup.status === 'final' &&
      matchup.is_championship &&
      matchup.winner_team_id === champion.id &&
      matchup.home_score !== null &&
      matchup.away_score !== null,
  );

  let summary = `${champion.member.display_name} finished ${record} as the ${seedLabel} with ${formatOneDecimal(champion.total_points_for ?? 0)} PF.`;

  if (championship && championship.home_score !== null && championship.away_score !== null) {
    const championWasHome = championship.home_team_id === champion.id;
    const opponent = teamMap.get(
      championWasHome ? championship.away_team_id : championship.home_team_id,
    );
    const championScore = championWasHome ? championship.home_score : championship.away_score;
    const opponentScore = championWasHome ? championship.away_score : championship.home_score;
    summary = `${champion.member.display_name} finished ${record} as the ${seedLabel} and closed with a ${formatOneDecimal(championScore)}-${formatOneDecimal(opponentScore)} championship win over ${getMemberName(opponent)}.`;
  }

  return {
    title: 'Champion Path',
    summary,
    href: `/managers/${champion.member.id}`,
  };
}

function buildLastPlaceStory(lastPlace: SeasonArcTeamInput | undefined): SeasonArcBeat | null {
  if (!lastPlace?.member || lastPlace.final_rank === null) return null;

  const record = formatRecord(
    lastPlace.final_record_wins,
    lastPlace.final_record_losses,
    lastPlace.final_record_ties,
  );

  return {
    title: 'Last-Place Race',
    summary: `${lastPlace.member.display_name} finished ${record} in ${formatOrdinal(lastPlace.final_rank)} with ${formatOneDecimal(lastPlace.total_points_for ?? 0)} PF and ${formatOneDecimal(lastPlace.total_points_against ?? 0)} PA.`,
    href: `/managers/${lastPlace.member.id}`,
  };
}

function buildRecordBeats(
  matchups: readonly SeasonArcMatchupInput[],
  teamMap: Map<string, SeasonArcTeamInput>,
): SeasonArcRecordBeat[] {
  const finalMatchups = matchups.filter(
    (matchup) =>
      matchup.status === 'final' &&
      matchup.home_score !== null &&
      matchup.away_score !== null,
  );

  const scoreEntries = finalMatchups.flatMap((matchup) => [
    {
      matchup,
      teamId: matchup.home_team_id,
      opponentId: matchup.away_team_id,
      score: matchup.home_score ?? 0,
    },
    {
      matchup,
      teamId: matchup.away_team_id,
      opponentId: matchup.home_team_id,
      score: matchup.away_score ?? 0,
    },
  ]);

  const highestScore = [...scoreEntries].sort((a, b) => b.score - a.score)[0];
  const worstScore = [...scoreEntries]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => a.score - b.score)[0];
  const marginEntries = finalMatchups
    .map((matchup) => {
      const homeScore = matchup.home_score ?? 0;
      const awayScore = matchup.away_score ?? 0;
      const homeWon = homeScore > awayScore;
      return {
        matchup,
        margin: Math.abs(homeScore - awayScore),
        winnerId: homeWon ? matchup.home_team_id : matchup.away_team_id,
        loserId: homeWon ? matchup.away_team_id : matchup.home_team_id,
      };
    })
    .filter((entry) => entry.margin > 0);
  const closestGame = [...marginEntries].sort((a, b) => a.margin - b.margin)[0];
  const biggestBlowout = [...marginEntries].sort((a, b) => b.margin - a.margin)[0];
  const records: SeasonArcRecordBeat[] = [];

  if (highestScore) {
    records.push({
      kind: 'highest_score',
      label: 'Highest Score',
      value: formatOneDecimal(highestScore.score),
      summary: `${getMemberName(teamMap.get(highestScore.teamId))} posted ${formatOneDecimal(highestScore.score)} against ${getMemberName(teamMap.get(highestScore.opponentId))} in Week ${highestScore.matchup.week}.`,
      href: '/records',
      week: highestScore.matchup.week,
      matchupId: highestScore.matchup.id,
    });
  }

  if (worstScore) {
    records.push({
      kind: 'worst_score',
      label: 'Worst Score',
      value: formatOneDecimal(worstScore.score),
      summary: `${getMemberName(teamMap.get(worstScore.teamId))} put up ${formatOneDecimal(worstScore.score)} against ${getMemberName(teamMap.get(worstScore.opponentId))} in Week ${worstScore.matchup.week}.`,
      href: '/records',
      week: worstScore.matchup.week,
      matchupId: worstScore.matchup.id,
    });
  }

  if (closestGame) {
    records.push({
      kind: 'closest_game',
      label: 'Closest Game',
      value: formatOneDecimal(closestGame.margin),
      summary: `${getMemberName(teamMap.get(closestGame.winnerId))} survived ${getMemberName(teamMap.get(closestGame.loserId))} by ${formatOneDecimal(closestGame.margin)} in Week ${closestGame.matchup.week}.`,
      href: '/head-to-head',
      week: closestGame.matchup.week,
      matchupId: closestGame.matchup.id,
    });
  }

  if (biggestBlowout) {
    records.push({
      kind: 'biggest_blowout',
      label: 'Biggest Blowout',
      value: formatOneDecimal(biggestBlowout.margin),
      summary: `${getMemberName(teamMap.get(biggestBlowout.winnerId))} beat ${getMemberName(teamMap.get(biggestBlowout.loserId))} by ${formatOneDecimal(biggestBlowout.margin)} in Week ${biggestBlowout.matchup.week}.`,
      href: '/records',
      week: biggestBlowout.matchup.week,
      matchupId: biggestBlowout.matchup.id,
    });
  }

  return records;
}

export function buildSeasonArc(input: BuildSeasonArcInput): SeasonArcData {
  const teamMap = new Map(input.teams.map((team) => [team.id, team]));
  const champion = findChampionTeam(input);
  const lastPlace = findLastPlaceTeam(input);
  const writeups = prioritizeSeasonArcWriteups(input.writeups).map((writeup) => ({
    id: writeup.id,
    title: writeup.title,
    excerpt: writeup.excerpt,
    week: writeup.week,
    writeup_type: writeup.writeup_type,
    href: `/writeups?season=${input.year}&writeup=${writeup.id}`,
  }));
  const trades = input.trades.slice(0, 4).map((trade) => ({
    id: trade.id,
    title: `${trade.team1MemberName} ↔ ${trade.team2MemberName}`,
    detail: `${formatTradePlayers(trade.team1Sends)} ↔ ${formatTradePlayers(trade.team2Sends)}`,
    championshipImpact: trade.championshipImpact,
    href: `/trades?season=${input.year}&trade=${trade.id}`,
  }));

  return {
    championPath: buildChampionPath(champion, input.matchups, teamMap),
    lastPlaceStory: buildLastPlaceStory(lastPlace),
    records: buildRecordBeats(input.matchups, teamMap),
    receipts: {
      writeups,
      trades,
    },
  };
}

/**
 * League-wide statistics
 */
export interface LeagueStats {
  totalSeasons: number;
  totalMembers: number;
  activeMembers: number;
  totalMatchups: number;
  foundedYear: number;
  leagueName: string;
}

/**
 * Get league-wide statistics
 */
export async function getLeagueStats(): Promise<LeagueStats> {
  const supabase = await createAdminClient();

  // Run queries in parallel
  const [
    { data: league },
    { count: seasonsCount },
    { data: members },
    { count: matchupsCount },
  ] = await Promise.all([
    supabase.from('league').select('name, founded_year').single(),
    supabase.from('seasons').select('*', { count: 'exact', head: true }),
    supabase.from('members').select('is_active'),
    supabase.from('matchups').select('*', { count: 'exact', head: true }).eq('status', 'final'),
  ]);

  const activeMembers = members?.filter(m => m.is_active).length ?? 0;

  return {
    totalSeasons: seasonsCount ?? 0,
    totalMembers: members?.length ?? 0,
    activeMembers,
    totalMatchups: matchupsCount ?? 0,
    foundedYear: league?.founded_year ?? 2015,
    leagueName: league?.name ?? 'League of Degenerates',
  };
}

/**
 * Notable matchup for history widget
 */
export interface NotableMatchup {
  id: string;
  week: number;
  year: number;
  homeTeamName: string;
  awayTeamName: string;
  homeMemberName: string;
  awayMemberName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string;
  margin: number;
  isPlayoff: boolean;
  isChampionship: boolean;
  notableReason: 'high_score' | 'blowout' | 'close_game' | 'playoff' | 'championship';
}

/**
 * Get notable matchups from a specific week across all seasons
 * (for "This Week in History" feature)
 */
export async function getLeagueWeekHistory(week: number, limit: number = 5): Promise<NotableMatchup[]> {
  const supabase = await createAdminClient();

  const { data: matchups, error } = await supabase
    .from('matchups')
    .select(`
      id,
      week,
      home_score,
      away_score,
      is_playoff,
      is_championship,
      winner_team_id,
      home_team_id,
      home_team:teams!matchups_home_team_id_fkey(
        team_name,
        member:members(display_name)
      ),
      away_team:teams!matchups_away_team_id_fkey(
        team_name,
        member:members(display_name)
      ),
      season:seasons(year)
    `)
    .eq('week', week)
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .order('season(year)', { ascending: false });

  if (error || !matchups) {
    console.error('[getLeagueWeekHistory] Error:', error);
    return [];
  }

  // Score each matchup for "notability"
  const scoredMatchups = matchups.map(m => {
    const homeScore = m.home_score ?? 0;
    const awayScore = m.away_score ?? 0;
    const margin = Math.abs(homeScore - awayScore);
    const maxScore = Math.max(homeScore, awayScore);
    const isHomeWinner = m.winner_team_id === m.home_team_id;
    const winnerName = isHomeWinner
      ? m.home_team?.member?.display_name
      : m.away_team?.member?.display_name;

    // Determine why this matchup is notable
    let notableReason: NotableMatchup['notableReason'] = 'close_game';
    let notabilityScore = 0;

    if (m.is_championship) {
      notableReason = 'championship';
      notabilityScore = 100;
    } else if (m.is_playoff) {
      notableReason = 'playoff';
      notabilityScore = 50;
    } else if (maxScore >= 180) {
      notableReason = 'high_score';
      notabilityScore = maxScore;
    } else if (margin >= 80) {
      notableReason = 'blowout';
      notabilityScore = margin;
    } else if (margin <= 5) {
      notableReason = 'close_game';
      notabilityScore = 50 - margin; // Closer = more notable
    }

    return {
      matchup: {
        id: m.id,
        week: m.week,
        year: m.season?.year ?? 0,
        homeTeamName: m.home_team?.team_name ?? 'Unknown',
        awayTeamName: m.away_team?.team_name ?? 'Unknown',
        homeMemberName: m.home_team?.member?.display_name ?? 'Unknown',
        awayMemberName: m.away_team?.member?.display_name ?? 'Unknown',
        homeScore,
        awayScore,
        winnerName: winnerName ?? 'Unknown',
        margin,
        isPlayoff: m.is_playoff ?? false,
        isChampionship: m.is_championship ?? false,
        notableReason,
      } satisfies NotableMatchup,
      score: notabilityScore,
    };
  });

  // Sort by notability and take top N (one per year max)
  const seenYears = new Set<number>();
  const notable: NotableMatchup[] = [];

  scoredMatchups
    .sort((a, b) => b.score - a.score)
    .forEach(({ matchup }) => {
      if (!seenYears.has(matchup.year) && notable.length < limit) {
        seenYears.add(matchup.year);
        notable.push(matchup);
      }
    });

  return notable.sort((a, b) => b.year - a.year);
}

/**
 * Get the most recent season with basic info
 */
export interface LatestSeasonInfo {
  id: string;
  year: number;
  name: string | null;
  numTeams: number;
  numWeeks: number;
  championName: string | null;
  championTeamName: string | null;
  lastPlaceName: string | null;
  isComplete: boolean;
  aiReviewPreview: string | null;
}

export async function getLatestSeason(): Promise<LatestSeasonInfo | null> {
  const supabase = await createAdminClient();

  const { data: season, error } = await supabase
    .from('seasons')
    .select(`
      id,
      year,
      name,
      num_teams,
      num_weeks,
      ai_review,
      champion_team:teams!fk_champion_team(
        team_name,
        member:members(display_name)
      ),
      last_place_team:teams!fk_last_place_team(
        member:members(display_name)
      )
    `)
    .order('year', { ascending: false })
    .limit(1)
    .single();

  if (error || !season) {
    console.error('[getLatestSeason] Error:', error);
    return null;
  }

  // Check if season is complete (has champion)
  const isComplete = !!season.champion_team;

  // Create a short preview of the AI review (first ~150 chars, end at sentence)
  let aiReviewPreview: string | null = null;
  if (season.ai_review) {
    const preview = season.ai_review.slice(0, 200);
    const sentenceEnd = preview.lastIndexOf('. ');
    aiReviewPreview = sentenceEnd > 80
      ? preview.slice(0, sentenceEnd + 1)
      : preview.slice(0, 150) + '...';
  }

  return {
    id: season.id,
    year: season.year,
    name: season.name,
    numTeams: season.num_teams,
    numWeeks: season.num_weeks,
    championName: season.champion_team?.member?.display_name ?? null,
    championTeamName: season.champion_team?.team_name ?? null,
    lastPlaceName: season.last_place_team?.member?.display_name ?? null,
    isComplete,
    aiReviewPreview,
  };
}
