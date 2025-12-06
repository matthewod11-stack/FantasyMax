import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[RootPage] user:', user?.id);

  if (user) {
    // Check if user is a league member
    const { data: member, error } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('[RootPage] member:', member, 'error:', error);

    if (member) {
      // Redirect to dashboard (handled by (dashboard) layout)
      redirect('/seasons');
    }
  }

  // Not authenticated, redirect to login
  redirect('/login');
}
