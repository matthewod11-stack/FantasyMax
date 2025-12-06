import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    // Check if any members exist - only allow setup if no members
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Setup already complete. Please sign in.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, displayName } = setupSchema.parse(body);

    // Create auth user using admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for commissioner
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create commissioner member record (bypasses RLS with admin client)
    const { error: memberError } = await supabase.from('members').insert({
      user_id: authData.user.id,
      display_name: displayName,
      email,
      role: 'commissioner',
      joined_year: new Date().getFullYear(),
    });

    if (memberError) {
      // Clean up auth user if member creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create member: ' + memberError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Setup error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input: ' + error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    );
  }
}
