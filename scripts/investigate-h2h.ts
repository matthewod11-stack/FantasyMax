import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function investigate() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get member IDs
  const { data: members } = await supabase
    .from('members')
    .select('id, display_name')
    .in('display_name', ['Nick D', 'Mike OD', 'Matt OD', 'Hugo P']);

  console.log('Members:', members);

  const memberMap = new Map(members?.map(m => [m.id, m.display_name]));
  const idMap = new Map(members?.map(m => [m.display_name, m.id]));

  // Get H2H data for these specific members
  const { data: h2h } = await supabase
    .from('mv_h2h_matrix')
    .select('*');

  // Find Nick vs Mike
  const nickVsMike = h2h?.find(h => {
    const n1 = memberMap.get(h.member_1_id);
    const n2 = memberMap.get(h.member_2_id);
    return (n1?.includes('Nick') && n2?.includes('Mike')) || (n1?.includes('Mike') && n2?.includes('Nick'));
  });

  // Find Matt vs Hugo
  const mattVsHugo = h2h?.find(h => {
    const n1 = memberMap.get(h.member_1_id);
    const n2 = memberMap.get(h.member_2_id);
    return (n1?.includes('Matt') && n2?.includes('Hugo')) || (n1?.includes('Hugo') && n2?.includes('Matt'));
  });

  console.log('\n=== Nick D vs Mike OD ===');
  console.log('H2H Record:', nickVsMike);
  console.log(`Wins sum: ${nickVsMike?.member_1_wins} + ${nickVsMike?.member_2_wins} + ${nickVsMike?.ties} ties = ${(nickVsMike?.member_1_wins || 0) + (nickVsMike?.member_2_wins || 0) + (nickVsMike?.ties || 0)}`);
  console.log(`Total matchups: ${nickVsMike?.total_matchups}`);

  console.log('\n=== Matt OD vs Hugo P ===');
  console.log('H2H Record:', mattVsHugo);
  console.log(`Wins sum: ${mattVsHugo?.member_1_wins} + ${mattVsHugo?.member_2_wins} + ${mattVsHugo?.ties} ties = ${(mattVsHugo?.member_1_wins || 0) + (mattVsHugo?.member_2_wins || 0) + (mattVsHugo?.ties || 0)}`);
  console.log(`Total matchups: ${mattVsHugo?.total_matchups}`);

  // Now let's look at the actual matchups to verify
  const nickId = idMap.get('Nick D');
  const mikeId = idMap.get('Mike OD');
  const mattId = idMap.get('Matt OD');
  const hugoId = idMap.get('Hugo P');

  console.log('\n=== Verifying with actual matchups ===');

  // Get all matchups for Nick vs Mike
  const { data: nickMikeMatchups } = await supabase
    .from('matchups')
    .select(`
      id, week, home_score, away_score, winner_team_id, is_tie, is_playoff, status,
      season:seasons(year),
      home_team:teams!matchups_home_team_id_fkey(member_id),
      away_team:teams!matchups_away_team_id_fkey(member_id)
    `)
    .eq('status', 'final');

  const nickMikeFiltered = nickMikeMatchups?.filter(m => {
    const homeId = m.home_team?.member_id;
    const awayId = m.away_team?.member_id;
    return (homeId === nickId && awayId === mikeId) || (homeId === mikeId && awayId === nickId);
  });

  console.log(`\nNick vs Mike actual matchups (${nickMikeFiltered?.length} found):`);
  let nickWins = 0, mikeWins = 0, ties = 0, playoffGames = 0;
  nickMikeFiltered?.forEach(m => {
    const homeIsNick = m.home_team?.member_id === nickId;
    const nickScore = homeIsNick ? m.home_score : m.away_score;
    const mikeScore = homeIsNick ? m.away_score : m.home_score;
    const winner = m.is_tie ? 'TIE' : (nickScore > mikeScore ? 'Nick' : 'Mike');
    if (m.is_tie) ties++;
    else if (winner === 'Nick') nickWins++;
    else mikeWins++;
    if (m.is_playoff) playoffGames++;
    console.log(`  ${m.season?.year} Week ${m.week}: ${nickScore}-${mikeScore} (${winner})${m.is_playoff ? ' [PLAYOFF]' : ''}`);
  });
  console.log(`COMPUTED: Nick ${nickWins} - ${mikeWins} Mike, ${ties} ties, ${playoffGames} playoff games`);

  // Get all matchups for Matt vs Hugo
  const mattHugoFiltered = nickMikeMatchups?.filter(m => {
    const homeId = m.home_team?.member_id;
    const awayId = m.away_team?.member_id;
    return (homeId === mattId && awayId === hugoId) || (homeId === hugoId && awayId === mattId);
  });

  console.log(`\nMatt vs Hugo actual matchups (${mattHugoFiltered?.length} found):`);
  let mattWins = 0, hugoWins = 0, mattHugoTies = 0, mattHugoPlayoffs = 0;
  mattHugoFiltered?.forEach(m => {
    const homeIsMatt = m.home_team?.member_id === mattId;
    const mattScore = homeIsMatt ? m.home_score : m.away_score;
    const hugoScore = homeIsMatt ? m.away_score : m.home_score;
    const winner = m.is_tie ? 'TIE' : (mattScore > hugoScore ? 'Matt' : 'Hugo');
    if (m.is_tie) mattHugoTies++;
    else if (winner === 'Matt') mattWins++;
    else hugoWins++;
    if (m.is_playoff) mattHugoPlayoffs++;
    console.log(`  ${m.season?.year} Week ${m.week}: ${mattScore}-${hugoScore} (${winner})${m.is_playoff ? ' [PLAYOFF]' : ''}`);
  });
  console.log(`COMPUTED: Matt ${mattWins} - ${hugoWins} Hugo, ${mattHugoTies} ties, ${mattHugoPlayoffs} playoff games`);
}

investigate().catch(console.error);
