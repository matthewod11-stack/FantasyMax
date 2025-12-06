import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get member data
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    // User exists but not a league member
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
