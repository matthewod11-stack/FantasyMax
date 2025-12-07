import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar userRole={member.role} />
        <div className="flex-1 flex flex-col">
          <Header member={member} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    );
  }

  // Development mode: bypass auth, use commissioner as mock user
  const supabase = await createAdminClient();
  let { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('role', 'commissioner')
    .limit(1)
    .single();

  // Fallback to any member if no commissioner found
  if (!member) {
    const { data: anyMember } = await supabase
      .from('members')
      .select('*')
      .limit(1)
      .single();
    member = anyMember;
  }

// If no members exist at all (empty database), redirect to login
  if (!member) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={member?.role} />
      <div className="flex-1 flex flex-col">
        <Header member={member} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
