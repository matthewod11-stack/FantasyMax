import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function refreshViews() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Refreshing materialized views...');
  console.log('Supabase URL:', supabaseUrl);

  // Try using a stored function to refresh the views
  // First, let's create a function via raw SQL
  const { data, error } = await supabase.rpc('refresh_all_materialized_views');

  if (error) {
    console.log('RPC refresh_all_materialized_views does not exist, trying to create it...');

    // The service role key should have permission to run raw SQL via the REST API
    // But Supabase doesn't expose raw SQL directly via the client
    // We need to use the SQL editor or a migration

    // Let's try a different approach - manually trigger an insert/update/delete cycle
    // that would fire the triggers
    console.log('\nAttempting to trigger view refresh via dummy matchup update...');

    // Get a random matchup to "update"
    const { data: matchup } = await supabase
      .from('matchups')
      .select('id, status')
      .eq('status', 'final')
      .limit(1)
      .single();

    if (matchup) {
      console.log('Found matchup to trigger update:', matchup.id);

      // Update and immediately restore to trigger the refresh
      const { error: updateError } = await supabase
        .from('matchups')
        .update({ status: 'final' })
        .eq('id', matchup.id);

      if (updateError) {
        console.log('Update error:', updateError);
      } else {
        console.log('Matchup update completed - this should trigger the refresh triggers!');
      }
    }

    // Wait a moment for the triggers to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the refresh worked
    console.log('\nVerifying refresh...');
    const activeMattId = 'c2b4f7d5-c2c0-427e-aaee-f648d5a4995d';
    const paulId = '5196e5a7-0930-42b2-a629-01924e20b5fd';

    const { data: mvRecord } = await supabase
      .from('mv_h2h_matrix')
      .select('*')
      .or(`and(member_1_id.eq.${activeMattId},member_2_id.eq.${paulId}),and(member_1_id.eq.${paulId},member_2_id.eq.${activeMattId})`)
      .single();

    console.log('Matt vs Paul MV record after refresh:', mvRecord);
  } else {
    console.log('Refresh successful via RPC:', data);
  }
}

refreshViews().catch(console.error);
