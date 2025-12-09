'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ManagerAvatar } from '@/components/ui/manager-avatar';
import { Users, Merge, History, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import { mergeMembersAction, fetchMembersAction } from './actions';
import type { MemberWithStats, MergeHistoryEntry } from '@/lib/supabase/queries';

interface MembersClientProps {
  initialMembers: MemberWithStats[];
  mergedMembers: MemberWithStats[];
  mergeHistory: MergeHistoryEntry[];
}

export function MembersClient({
  initialMembers,
  mergedMembers,
  mergeHistory: initialHistory,
}: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [history, setHistory] = useState(initialHistory);
  const [isPending, startTransition] = useTransition();

  // Merge dialog state
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [primaryId, setPrimaryId] = useState<string>('');
  const [mergedId, setMergedId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);

  // Get member by ID
  const getMember = (id: string) =>
    [...members, ...mergedMembers].find((m) => m.id === id);

  // Handle merge submission
  const handleMerge = () => {
    if (!primaryId || !mergedId) {
      setMergeError('Please select both a primary member and a member to merge');
      return;
    }

    if (primaryId === mergedId) {
      setMergeError('Cannot merge a member into themselves');
      return;
    }

    setMergeError(null);
    setMergeSuccess(null);

    startTransition(async () => {
      const result = await mergeMembersAction(primaryId, mergedId, undefined, notes);

      if (result.success && result.data) {
        const mergedMember = getMember(mergedId);
        setMergeSuccess(
          `Successfully merged "${mergedMember?.display_name}" into primary. ` +
            `Updated ${result.data.teams_updated} teams and ${result.data.awards_updated} awards.`
        );

        // Refresh the members list
        const refreshResult = await fetchMembersAction(false);
        if (refreshResult.success && refreshResult.data) {
          setMembers(refreshResult.data);
        }

        // Reset form
        setPrimaryId('');
        setMergedId('');
        setNotes('');

        // Close dialog after delay
        setTimeout(() => {
          setIsMergeOpen(false);
          setMergeSuccess(null);
        }, 2000);
      } else {
        setMergeError(result.error || 'Failed to merge members');
      }
    });
  };

  // Get the primary member object
  const primaryMember = primaryId ? getMember(primaryId) : null;
  const memberToMerge = mergedId ? getMember(mergedId) : null;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Select members to merge duplicate identities
        </div>
        <Button onClick={() => setIsMergeOpen(true)}>
          <Merge className="h-4 w-4 mr-2" />
          Merge Members
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <Users className="h-4 w-4 mr-2" />
            Active ({members.length})
          </TabsTrigger>
          <TabsTrigger value="merged">
            <Merge className="h-4 w-4 mr-2" />
            Merged ({mergedMembers.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Members Table */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Members</CardTitle>
              <CardDescription>
                Members currently visible in the league. Look for duplicates with similar names.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Years Active</TableHead>
                    <TableHead>Yahoo ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ManagerAvatar
                            displayName={member.display_name}
                            avatarUrl={member.avatar_url}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">{member.display_name}</div>
                            {member.email && (
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.team_count}</Badge>
                      </TableCell>
                      <TableCell>
                        {member.years_active.length > 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {member.years_active[0]}–
                            {member.years_active[member.years_active.length - 1]}
                            {' '}
                            <span className="text-xs">
                              ({member.seasons_played} seasons)
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No teams</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {member.yahoo_manager_id
                            ? `${member.yahoo_manager_id.slice(0, 8)}...`
                            : '–'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPrimaryId(member.id);
                            setIsMergeOpen(true);
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Merged Members Table */}
        <TabsContent value="merged">
          <Card>
            <CardHeader>
              <CardTitle>Merged Members</CardTitle>
              <CardDescription>
                These members have been merged into other records and are hidden from normal views.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mergedMembers.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No merged members yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Original Member</TableHead>
                      <TableHead>Merged Into</TableHead>
                      <TableHead>Teams Moved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedMembers.map((member) => {
                      const mergedInto = getMember(member.merged_into_id!);
                      return (
                        <TableRow key={member.id} className="opacity-60">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <ManagerAvatar
                                displayName={member.display_name}
                                avatarUrl={member.avatar_url}
                                size="sm"
                              />
                              <span className="line-through">{member.display_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              {mergedInto?.display_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{member.team_count}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Merge History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Merge History</CardTitle>
              <CardDescription>Audit log of all member merges</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No merges performed yet
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {entry.merged_member_stats?.display_name || 'Unknown'}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {entry.primary_member?.display_name || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.merged_at).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.merged_member_stats && (
                        <div className="text-sm text-muted-foreground">
                          Moved {entry.merged_member_stats.team_count} teams
                        </div>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Merge Dialog */}
      <Dialog open={isMergeOpen} onOpenChange={setIsMergeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Merge Members</DialogTitle>
            <DialogDescription>
              Combine duplicate member records. All teams, awards, and stats from the
              merged member will be reassigned to the primary member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Primary Member Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Member (Keep)</label>
              <Select value={primaryId} onValueChange={setPrimaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the member to keep" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({member.team_count} teams)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {primaryMember && (
                <div className="text-xs text-muted-foreground">
                  Years: {primaryMember.years_active.join(', ') || 'None'}
                </div>
              )}
            </div>

            {/* Member to Merge Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Member to Merge (Remove)</label>
              <Select value={mergedId} onValueChange={setMergedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the duplicate to merge" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.id !== primaryId)
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span>{member.display_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({member.team_count} teams)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {memberToMerge && (
                <div className="text-xs text-muted-foreground">
                  Years: {memberToMerge.years_active.join(', ') || 'None'}
                </div>
              )}
            </div>

            {/* Preview */}
            {primaryMember && memberToMerge && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="text-sm font-medium">Merge Preview</div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Teams being moved:</span>{' '}
                  {memberToMerge.team_count}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Combined years:</span>{' '}
                  {Array.from(
                    new Set([...primaryMember.years_active, ...memberToMerge.years_active])
                  )
                    .sort()
                    .join(', ')}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Reason for merge..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Error/Success Messages */}
            {mergeError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                {mergeError}
              </div>
            )}
            {mergeSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="h-4 w-4" />
                {mergeSuccess}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMergeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!primaryId || !mergedId || isPending}
              variant="destructive"
            >
              {isPending ? 'Merging...' : 'Merge Members'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
