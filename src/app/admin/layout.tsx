import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

    // Get member data and verify commissioner role
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'commissioner') {
      // Not a commissioner, redirect to dashboard
      redirect('/');
    }

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar userRole={member.role} />
        <div className="flex-1 flex flex-col">
          <AdminHeader member={member} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    );
  }

  // Development mode: bypass auth, use commissioner as mock user
  const supabase = await createAdminClient();

  // Find commissioner member
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('role', 'commissioner')
    .single();

  if (!member) {
    // Fallback to first active member if no commissioner
    const { data: fallbackMember } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!fallbackMember) {
      redirect('/login');
    }

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar userRole={fallbackMember.role} />
        <div className="flex-1 flex flex-col">
          <AdminHeader member={fallbackMember} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={member.role} />
      <div className="flex-1 flex flex-col">
        <AdminHeader member={member} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
