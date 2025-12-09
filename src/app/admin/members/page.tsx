import { Suspense } from 'react';
import { getMembersWithStats, getMergeHistory } from '@/lib/supabase/queries';
import { MembersClient } from './MembersClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Merge, GitMerge } from 'lucide-react';

export default async function AdminMembersPage() {
  // Fetch members and merge history in parallel
  const [members, mergeHistory] = await Promise.all([
    getMembersWithStats(true), // Include merged members for the admin view
    getMergeHistory(),
  ]);

  // Separate active and merged members
  const activeMembers = members.filter((m) => !m.merged_into_id);
  const mergedMembers = members.filter((m) => m.merged_into_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Member Management</h1>
        <p className="text-muted-foreground">
          Merge duplicate members and manage member identities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Merge className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Merged Members</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mergedMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Total Merges</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mergeHistory.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Client Component */}
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading members...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        }
      >
        <MembersClient
          initialMembers={activeMembers}
          mergedMembers={mergedMembers}
          mergeHistory={mergeHistory}
        />
      </Suspense>
    </div>
  );
}
