import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import type { CsvImportType } from '@/lib/import/csv-parser';

const importRequestSchema = z.object({
  type: z.enum(['members', 'seasons', 'teams', 'matchups', 'trades']),
  data: z.array(z.record(z.string(), z.unknown())),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    // Verify the user is authenticated and is a commissioner
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('members')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'commissioner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, data } = importRequestSchema.parse(body);

    // Create import log
    const { data: importLog } = await supabase
      .from('import_logs')
      .insert({
        source: 'csv',
        status: 'processing',
        started_by: member.id,
      })
      .select()
      .single();

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Get league ID (create if doesn't exist)
    let { data: league } = await supabase.from('league').select('id').single();

    if (!league) {
      const { data: newLeague } = await supabase
        .from('league')
        .insert({
          name: 'My Fantasy League',
          founded_year: new Date().getFullYear(),
        })
        .select()
        .single();
      league = newLeague;
    }

    if (!league) {
      throw new Error('Failed to get or create league');
    }

    switch (type) {
      case 'members':
        for (const row of data) {
          const memberData = row as {
            name: string;
            email?: string;
            joined_year: number;
            role?: string;
          };

          const { data: existing } = await supabase
            .from('members')
            .select('id')
            .eq('display_name', memberData.name)
            .single();

          if (existing) {
            const { error } = await supabase
              .from('members')
              .update({
                email: memberData.email || null,
                joined_year: memberData.joined_year,
                role: (memberData.role as 'commissioner' | 'president' | 'treasurer' | 'member') || 'member',
              })
              .eq('id', existing.id);

            if (error) {
              errors.push(`Failed to update ${memberData.name}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            const { error } = await supabase.from('members').insert({
              display_name: memberData.name,
              email: memberData.email || null,
              joined_year: memberData.joined_year,
              role: (memberData.role as 'commissioner' | 'president' | 'treasurer' | 'member') || 'member',
            });

            if (error) {
              errors.push(`Failed to create ${memberData.name}: ${error.message}`);
            } else {
              created++;
            }
          }
        }
        break;

      case 'seasons':
        for (const row of data) {
          const seasonData = row as {
            year: number;
            num_teams: number;
            num_weeks?: number;
            champion?: string;
            last_place?: string;
          };

          const { data: existing } = await supabase
            .from('seasons')
            .select('id')
            .eq('league_id', league.id)
            .eq('year', seasonData.year)
            .single();

          if (existing) {
            const { error } = await supabase
              .from('seasons')
              .update({
                num_teams: seasonData.num_teams,
                num_weeks: seasonData.num_weeks || 17,
                data_source: 'csv',
                import_status: 'complete',
              })
              .eq('id', existing.id);

            if (error) {
              errors.push(`Failed to update season ${seasonData.year}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            const { error } = await supabase.from('seasons').insert({
              league_id: league.id,
              year: seasonData.year,
              name: `${seasonData.year} Season`,
              num_teams: seasonData.num_teams,
              num_weeks: seasonData.num_weeks || 17,
              data_source: 'csv',
              import_status: 'complete',
            });

            if (error) {
              errors.push(`Failed to create season ${seasonData.year}: ${error.message}`);
            } else {
              created++;
            }
          }
        }
        break;

      case 'teams':
        for (const row of data) {
          const teamData = row as {
            year: number;
            manager_name: string;
            team_name: string;
            final_rank?: number;
            wins?: number;
            losses?: number;
            ties?: number;
            points_for?: number;
            points_against?: number;
          };

          // Find season
          const { data: season } = await supabase
            .from('seasons')
            .select('id')
            .eq('league_id', league.id)
            .eq('year', teamData.year)
            .single();

          if (!season) {
            errors.push(`Season ${teamData.year} not found for team ${teamData.team_name}`);
            continue;
          }

          // Find or create member
          let { data: memberRecord } = await supabase
            .from('members')
            .select('id')
            .eq('display_name', teamData.manager_name)
            .single();

          if (!memberRecord) {
            const { data: newMember, error } = await supabase
              .from('members')
              .insert({
                display_name: teamData.manager_name,
                joined_year: teamData.year,
              })
              .select()
              .single();

            if (error || !newMember) {
              errors.push(`Failed to create member ${teamData.manager_name}`);
              continue;
            }
            memberRecord = newMember;
          }

          const { data: existing } = await supabase
            .from('teams')
            .select('id')
            .eq('season_id', season.id)
            .eq('member_id', memberRecord.id)
            .single();

          const teamRecord = {
            season_id: season.id,
            member_id: memberRecord.id,
            team_name: teamData.team_name,
            final_rank: teamData.final_rank,
            final_record_wins: teamData.wins || 0,
            final_record_losses: teamData.losses || 0,
            final_record_ties: teamData.ties || 0,
            total_points_for: teamData.points_for || 0,
            total_points_against: teamData.points_against || 0,
            is_champion: teamData.final_rank === 1,
            is_last_place: false, // Will be set based on final_rank == num_teams
          };

          if (existing) {
            const { error } = await supabase.from('teams').update(teamRecord).eq('id', existing.id);
            if (error) {
              errors.push(`Failed to update team ${teamData.team_name}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            const { error } = await supabase.from('teams').insert(teamRecord);
            if (error) {
              errors.push(`Failed to create team ${teamData.team_name}: ${error.message}`);
            } else {
              created++;
            }
          }
        }
        break;

      case 'matchups':
        for (const row of data) {
          const matchupData = row as {
            year: number;
            week: number;
            home_team: string;
            away_team: string;
            home_score: number;
            away_score: number;
            is_playoff?: boolean;
            is_championship?: boolean;
          };

          // Find season
          const { data: season } = await supabase
            .from('seasons')
            .select('id')
            .eq('league_id', league.id)
            .eq('year', matchupData.year)
            .single();

          if (!season) {
            errors.push(`Season ${matchupData.year} not found`);
            continue;
          }

          // Find teams by manager name
          const { data: homeTeam } = await supabase
            .from('teams')
            .select('id, member:members(display_name)')
            .eq('season_id', season.id)
            .single();

          const { data: teams } = await supabase
            .from('teams')
            .select('id, member:members(display_name)')
            .eq('season_id', season.id);

          const homeTeamRecord = teams?.find(
            (t) => (t.member as { display_name: string })?.display_name === matchupData.home_team,
          );
          const awayTeamRecord = teams?.find(
            (t) => (t.member as { display_name: string })?.display_name === matchupData.away_team,
          );

          if (!homeTeamRecord || !awayTeamRecord) {
            errors.push(
              `Teams not found for matchup: ${matchupData.home_team} vs ${matchupData.away_team}`,
            );
            continue;
          }

          const winnerId =
            matchupData.home_score > matchupData.away_score
              ? homeTeamRecord.id
              : matchupData.away_score > matchupData.home_score
                ? awayTeamRecord.id
                : null;

          const { error } = await supabase.from('matchups').upsert(
            {
              season_id: season.id,
              week: matchupData.week,
              home_team_id: homeTeamRecord.id,
              away_team_id: awayTeamRecord.id,
              home_score: matchupData.home_score,
              away_score: matchupData.away_score,
              winner_team_id: winnerId,
              is_tie: matchupData.home_score === matchupData.away_score,
              is_playoff: matchupData.is_playoff || false,
              is_championship: matchupData.is_championship || false,
              status: 'final',
            },
            {
              onConflict: 'season_id,week,home_team_id,away_team_id',
            },
          );

          if (error) {
            errors.push(`Failed to create matchup week ${matchupData.week}: ${error.message}`);
          } else {
            created++;
          }
        }
        break;

      case 'trades':
        for (const row of data) {
          const tradeData = row as {
            year: number;
            date: string;
            week?: number;
            team_1: string;
            team_2: string;
            team_1_gives: string;
            team_2_gives: string;
            notes?: string;
          };

          // Find season
          const { data: season } = await supabase
            .from('seasons')
            .select('id')
            .eq('league_id', league.id)
            .eq('year', tradeData.year)
            .single();

          if (!season) {
            errors.push(`Season ${tradeData.year} not found`);
            continue;
          }

          // Find teams
          const { data: teams } = await supabase
            .from('teams')
            .select('id, member:members(display_name)')
            .eq('season_id', season.id);

          const team1 = teams?.find(
            (t) => (t.member as { display_name: string })?.display_name === tradeData.team_1,
          );
          const team2 = teams?.find(
            (t) => (t.member as { display_name: string })?.display_name === tradeData.team_2,
          );

          if (!team1 || !team2) {
            errors.push(`Teams not found for trade: ${tradeData.team_1} - ${tradeData.team_2}`);
            continue;
          }

          const { error } = await supabase.from('trades').insert({
            season_id: season.id,
            team_1_id: team1.id,
            team_2_id: team2.id,
            team_1_sends: tradeData.team_1_gives.split(',').map((item) => ({
              type: 'player',
              name: item.trim(),
            })),
            team_2_sends: tradeData.team_2_gives.split(',').map((item) => ({
              type: 'player',
              name: item.trim(),
            })),
            trade_date: tradeData.date,
            week: tradeData.week,
            notes: tradeData.notes,
          });

          if (error) {
            errors.push(`Failed to create trade: ${error.message}`);
          } else {
            created++;
          }
        }
        break;
    }

    // Update import log
    if (importLog?.id) {
      await supabase
        .from('import_logs')
        .update({
          status: errors.length > 0 && created === 0 && updated === 0 ? 'failed' : 'completed',
          records_processed: data.length,
          records_created: created,
          records_updated: updated,
          errors: errors,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importLog.id);
    }

    return NextResponse.json({
      success: errors.length === 0 || created > 0 || updated > 0,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error('CSV Import error:', error);
    return NextResponse.json(
      {
        success: false,
        created: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      { status: 500 },
    );
  }
}
