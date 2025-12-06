'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Cloud, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface YahooLeague {
  league_key: string;
  name: string;
  season: string;
  num_teams: number;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function YahooImportPage() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [leagues, setLeagues] = useState<YahooLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/import/yahoo/status');
      const data = await response.json();

      if (data.connected) {
        setStatus('connected');
        setLeagues(data.leagues || []);
      } else {
        setStatus('disconnected');
      }
    } catch {
      setStatus('disconnected');
    }
  };

  const handleConnect = () => {
    // Redirect to Yahoo OAuth
    window.location.href = '/api/auth/yahoo';
  };

  const handleSync = async () => {
    if (!selectedLeague) return;

    setSyncing(true);
    setSyncResult(null);
    setError(null);

    try {
      const response = await fetch('/api/import/yahoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueKey: selectedLeague }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: `Synced ${data.teamsImported} teams, ${data.matchupsImported} matchups`,
        });
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/auth/yahoo/disconnect', { method: 'POST' });
      setStatus('disconnected');
      setLeagues([]);
      setSelectedLeague('');
    } catch {
      setError('Failed to disconnect');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Yahoo Fantasy API</h1>
        <p className="text-muted-foreground">
          Connect to Yahoo Fantasy to automatically sync your league data
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="h-6 w-6" />
              <div>
                <CardTitle>Yahoo Connection</CardTitle>
                <CardDescription>Status of your Yahoo Fantasy API connection</CardDescription>
              </div>
            </div>
            <Badge
              variant={
                status === 'connected'
                  ? 'default'
                  : status === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {status === 'connected' && <CheckCircle2 className="mr-1 h-3 w-3" />}
              {status === 'error' && <AlertCircle className="mr-1 h-3 w-3" />}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {status === 'disconnected' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Yahoo account to sync your fantasy football leagues. This will allow
                FantasyMax to import:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>League settings and configuration</li>
                <li>Team rosters and standings</li>
                <li>Weekly matchup results</li>
                <li>Trade history</li>
              </ul>
              <Button onClick={handleConnect}>
                <Cloud className="mr-2 h-4 w-4" />
                Connect Yahoo Account
              </Button>
            </div>
          )}

          {status === 'connected' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">Your Yahoo account is connected</p>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                There was an error connecting to Yahoo. Please try again.
              </p>
              <Button onClick={handleConnect}>Reconnect</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {status === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>Sync League Data</CardTitle>
            <CardDescription>Select a league to import or update its data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leagues.length > 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select League</label>
                  <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a league" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues.map((league) => (
                        <SelectItem key={league.league_key} value={league.league_key}>
                          {league.name} ({league.season}) - {league.num_teams} teams
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSync} disabled={!selectedLeague || syncing}>
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync League Data
                    </>
                  )}
                </Button>

                {syncResult && (
                  <div
                    className={`p-4 rounded-md ${syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {syncResult.success ? (
                      <CheckCircle2 className="inline mr-2 h-4 w-4" />
                    ) : (
                      <AlertCircle className="inline mr-2 h-4 w-4" />
                    )}
                    {syncResult.message}
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-md bg-red-50 text-red-700">
                    <AlertCircle className="inline mr-2 h-4 w-4" />
                    {error}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                No leagues found. Make sure you have active leagues on Yahoo Fantasy.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            If you haven&apos;t configured the Yahoo API yet, follow these steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Go to{' '}
              <a
                href="https://developer.yahoo.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Yahoo Developer Console
              </a>
            </li>
            <li>Create a new application with &quot;Fantasy Sports&quot; API access</li>
            <li>Set the redirect URI to your app&apos;s callback URL</li>
            <li>Copy the Client ID and Client Secret to your environment variables</li>
            <li>Restart your application and connect above</li>
          </ol>

          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-mono">
              YAHOO_CLIENT_ID=your_client_id
              <br />
              YAHOO_CLIENT_SECRET=your_client_secret
              <br />
              YAHOO_REDIRECT_URI={process.env.NEXT_PUBLIC_APP_URL}/api/auth/yahoo/callback
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
