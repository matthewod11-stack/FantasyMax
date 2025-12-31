import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function audit() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const activeMattId = 'c2b4f7d5-c2c0-427e-aaee-f648d5a4995d';

  // Get all Matt's teams
  const { data: mattTeams } = await supabase.from('teams').select('id').eq('member_id', activeMattId);
  const mattTeamIds = mattTeams?.map(t => t.id) || [];

  // Get all members
  const { data: members } = await supabase.from('members').select('id, display_name, is_active');

  // Get all matchups
  const { data: matchups } = await supabase
    .from('matchups')
    .select('id, week, home_score, away_score, home_team_id, away_team_id, winner_team_id, is_tie, seasons!inner(year)')
    .eq('status', 'final');

  // Get mv_h2h_matrix for Matt
  const { data: mvRecords } = await supabase.from('mv_h2h_matrix').select('*');

  // For each opponent, compare MV vs actual
  console.log('=== Matt OD H2H Audit ===\n');

  for (const opponent of members || []) {
    if (opponent.id === activeMattId) continue;

    // Get opponent teams
    const { data: oppTeams } = await supabase.from('teams').select('id').eq('member_id', opponent.id);
    const oppTeamIds = oppTeams?.map(t => t.id) || [];

    // Count actual matchups
    const mattVsOpp = matchups?.filter(m =>
      (mattTeamIds.includes(m.home_team_id) && oppTeamIds.includes(m.away_team_id)) ||
      (mattTeamIds.includes(m.away_team_id) && oppTeamIds.includes(m.home_team_id))
    );

    if (!mattVsOpp || mattVsOpp.length === 0) continue;

    let actualMattWins = 0, actualOppWins = 0;
    mattVsOpp.forEach(m => {
      const mattIsHome = mattTeamIds.includes(m.home_team_id);
      const mattTeamId = mattIsHome ? m.home_team_id : m.away_team_id;
      if (!m.is_tie) {
        if (m.winner_team_id === mattTeamId) actualMattWins++;
        else actualOppWins++;
      }
    });

    // Get MV record
    const mvRecord = mvRecords?.find(r =>
      (r.member_1_id === activeMattId && r.member_2_id === opponent.id) ||
      (r.member_1_id === opponent.id && r.member_2_id === activeMattId)
    );

    let mvMattWins = 0, mvOppWins = 0, mvTotal = 0;
    if (mvRecord) {
      mvTotal = mvRecord.total_matchups;
      if (mvRecord.member_1_id === activeMattId) {
        mvMattWins = mvRecord.member_1_wins;
        mvOppWins = mvRecord.member_2_wins;
      } else {
        mvMattWins = mvRecord.member_2_wins;
        mvOppWins = mvRecord.member_1_wins;
      }
    }

    const recordMatch = actualMattWins === mvMattWins && actualOppWins === mvOppWins;
    const totalMatch = mattVsOpp.length === mvTotal;

    if (!recordMatch || !totalMatch) {
      console.log(`❌ ${opponent.display_name}:`);
      console.log(`   Actual: Matt ${actualMattWins}-${actualOppWins} (${mattVsOpp.length} games)`);
      console.log(`   MV:     Matt ${mvMattWins}-${mvOppWins} (${mvTotal} games)`);
    }
  }

  console.log('\n(Only showing mismatches)');

  // Now also check the head_to_head_records view for comparison
  console.log('\n\n=== Checking head_to_head_records view ===\n');
  const { data: h2hRecords } = await supabase.from('head_to_head_records').select('*');

  for (const opponent of members || []) {
    if (opponent.id === activeMattId) continue;

    const { data: oppTeams } = await supabase.from('teams').select('id').eq('member_id', opponent.id);
    const oppTeamIds = oppTeams?.map(t => t.id) || [];

    const mattVsOpp = matchups?.filter(m =>
      (mattTeamIds.includes(m.home_team_id) && oppTeamIds.includes(m.away_team_id)) ||
      (mattTeamIds.includes(m.away_team_id) && oppTeamIds.includes(m.home_team_id))
    );

    if (!mattVsOpp || mattVsOpp.length === 0) continue;

    let actualMattWins = 0, actualOppWins = 0;
    mattVsOpp.forEach(m => {
      const mattIsHome = mattTeamIds.includes(m.home_team_id);
      const mattTeamId = mattIsHome ? m.home_team_id : m.away_team_id;
      if (!m.is_tie) {
        if (m.winner_team_id === mattTeamId) actualMattWins++;
        else actualOppWins++;
      }
    });

    // Get old H2H record
    const h2hRecord = h2hRecords?.find(r =>
      (r.member_1_id === activeMattId && r.member_2_id === opponent.id) ||
      (r.member_1_id === opponent.id && r.member_2_id === activeMattId)
    );

    let h2hMattWins = 0, h2hOppWins = 0, h2hTotal = 0;
    if (h2hRecord) {
      h2hTotal = h2hRecord.total_matchups;
      if (h2hRecord.member_1_id === activeMattId) {
        h2hMattWins = h2hRecord.member_1_wins;
        h2hOppWins = h2hRecord.member_1_losses;
      } else {
        h2hMattWins = h2hRecord.member_1_losses;
        h2hOppWins = h2hRecord.member_1_wins;
      }
    }

    const recordMatch = actualMattWins === h2hMattWins && actualOppWins === h2hOppWins;
    const totalMatch = mattVsOpp.length === h2hTotal;

    if (!recordMatch || !totalMatch) {
      console.log(`❌ ${opponent.display_name} (old view):`);
      console.log(`   Actual: Matt ${actualMattWins}-${actualOppWins} (${mattVsOpp.length} games)`);
      console.log(`   H2H:    Matt ${h2hMattWins}-${h2hOppWins} (${h2hTotal} games)`);
    }
  }
}

audit().catch(console.error);
