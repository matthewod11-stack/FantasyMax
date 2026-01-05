import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPaletteWrapper } from '@/components/layout/command-palette-wrapper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // TODO: Remove BYPASS_AUTH when ready for production auth
  // Set BYPASS_AUTH=true in .env.local for local development
  const bypassAuth = process.env.BYPASS_AUTH === 'true';

  if (!bypassAuth) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      redirect('/login');
    }

    // Fetch all active members for the selector
    const { data: allMembers } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    // Fetch seasons for command palette
    const { data: seasons } = await supabase
      .from('seasons')
      .select('year')
      .order('year', { ascending: false });

    const seasonYears = seasons?.map((s) => s.year) ?? [];

    if (!allMembers || allMembers.length === 0) {
      redirect('/login');
    }

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar userRole={member.role} />
        <div className="flex-1 flex flex-col">
          <Suspense fallback={null}>
            <Header member={member} />
            <main className="flex-1 p-6">{children}</main>
            <CommandPaletteWrapper members={allMembers} seasons={seasonYears} />
          </Suspense>
        </div>
      </div>
    );
  }

  // Development mode: bypass auth, use commissioner as mock user
  const supabase = await createAdminClient();

  // Fetch all active members for the selector
  const { data: allMembers } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  // Fetch seasons for command palette
  const { data: seasons } = await supabase
    .from('seasons')
    .select('year')
    .order('year', { ascending: false });

  const seasonYears = seasons?.map((s) => s.year) ?? [];

  // Find commissioner as default, fallback to first member
  let defaultMember = allMembers?.find((m) => m.role === 'commissioner') ?? allMembers?.[0];

  // If no members exist at all (empty database), redirect to login
  if (!defaultMember || !allMembers || allMembers.length === 0) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={defaultMember.role} />
      <div className="flex-1 flex flex-col">
        <Suspense fallback={null}>
            <Header member={defaultMember} />
            <main className="flex-1 p-6">{children}</main>
            <CommandPaletteWrapper members={allMembers} seasons={seasonYears} />
          </Suspense>
      </div>
    </div>
  );
}
