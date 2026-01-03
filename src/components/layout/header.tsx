'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Search } from 'lucide-react';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { MemberSelector } from './member-selector';
import type { Member } from '@/types/database.types';

interface HeaderProps {
  member: Member | null;
}

export function Header({ member }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { open: openPalette } = useCommandPalette();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const initials = member?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      <MemberSelector />
      <div className="flex items-center gap-3">
        {/* Search Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={openPalette}
          className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openPalette}
          className="sm:hidden"
        >
          <Search className="h-5 w-5" />
        </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member?.avatar_url ?? undefined} alt={member?.display_name} />
              <AvatarFallback>{initials ?? '?'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{member?.display_name}</p>
              <p className="text-xs text-muted-foreground">{member?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{member?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
