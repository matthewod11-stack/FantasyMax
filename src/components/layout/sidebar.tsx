'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Users,
  Calendar,
  ArrowLeftRight,
  Image,
  Vote,
  BookOpen,
  Skull,
  Award,
  Swords,
  Settings,
  Upload,
  FileText,
  ClipboardList,
} from 'lucide-react';
interface SidebarProps {
  userRole?: string | null;
}

const memberNavItems = [
  { href: '/', label: 'Dashboard', icon: Trophy },
  { href: '/seasons', label: 'Seasons', icon: Calendar },
  { href: '/managers', label: 'Managers', icon: Users },
  { href: '/head-to-head', label: 'Head-to-Head', icon: Swords },
  { href: '/records', label: 'Records', icon: Award },
  { href: '/hall-of-shame', label: 'Hall of Shame', icon: Skull },
  { href: '/writeups', label: 'Writeups', icon: FileText },
  { href: '/media', label: 'Media', icon: Image },
  { href: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { href: '/draft-analyzer', label: 'Draft Analyzer', icon: ClipboardList },
  { href: '/voting', label: 'Voting', icon: Vote },
  { href: '/constitution', label: 'Constitution', icon: BookOpen },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Dashboard', icon: Settings },
  { href: '/admin/import', label: 'Import Data', icon: Upload },
  { href: '/admin/members', label: 'Manage Members', icon: Users },
  { href: '/admin/seasons', label: 'Manage Seasons', icon: Calendar },
  { href: '/admin/writeups', label: 'Writeups', icon: BookOpen },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const isCommissioner = userRole === 'commissioner';

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-muted-foreground">Matt OD&apos;s</span>
            <span className="text-lg font-bold">League of Degenerates</span>
          </div>
        </Link>
      </div>

      <nav className="space-y-1">
        {memberNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {isCommissioner && (
        <>
          <div className="my-6 border-t" />
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Commissioner
          </p>
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </aside>
  );
}
