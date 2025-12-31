/**
 * Admin API: Refresh Materialized Views
 *
 * POST /api/admin/refresh-views
 *
 * Refreshes materialized views that pre-calculate stats.
 * Use this after member merges or data imports to ensure
 * dashboard data is up to date.
 *
 * Strategy: Touch the updated_at on a random member to trigger
 * the refresh_career_stats trigger function.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Use service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // The mv_career_stats view has a trigger that refreshes on member changes
    // We can trigger it by updating any member's updated_at timestamp

    // First, get any member
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('id')
      .limit(1)
      .single();

    if (fetchError || !member) {
      return NextResponse.json(
        { error: 'No members found to trigger refresh' },
        { status: 404 }
      );
    }

    // Update the member to trigger the refresh
    const { error: updateError } = await supabase
      .from('members')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', member.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to trigger refresh', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Materialized views refresh triggered',
      refreshed: ['mv_career_stats'],
    });
  } catch (error) {
    console.error('[refresh-views] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh views', details: String(error) },
      { status: 500 }
    );
  }
}
