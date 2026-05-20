import { createServiceRoleClient } from '@/lib/supabase/server';
import { encryptJson, decryptJson } from '@/lib/crypto/tokens';
import type { YahooOAuthTokens } from './types';

export async function saveYahooCredentials(
  leagueId: string,
  tokens: YahooOAuthTokens,
): Promise<void> {
  if (!tokens.refresh_token) {
    throw new Error('Yahoo tokens missing refresh_token — reconnect Yahoo in admin import');
  }

  const supabase = createServiceRoleClient();
  const encrypted = encryptJson(tokens);

  const { error } = await supabase.from('yahoo_credentials').upsert(
    {
      league_id: leagueId,
      encrypted_tokens: encrypted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'league_id' },
  );

  if (error) throw new Error(`Failed to save Yahoo credentials: ${error.message}`);
}

export async function loadYahooCredentials(): Promise<YahooOAuthTokens | null> {
  const supabase = createServiceRoleClient();
  const { data: league } = await supabase.from('league').select('id').single();
  if (!league) return null;

  const { data, error } = await supabase
    .from('yahoo_credentials')
    .select('encrypted_tokens')
    .eq('league_id', league.id)
    .maybeSingle();

  if (error || !data) return null;

  return decryptJson<YahooOAuthTokens>(data.encrypted_tokens);
}

export async function hasYahooCredentials(): Promise<boolean> {
  const tokens = await loadYahooCredentials();
  return tokens !== null && !!tokens.refresh_token;
}

export async function deleteYahooCredentials(): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: league } = await supabase.from('league').select('id').single();
  if (!league) return;
  await supabase.from('yahoo_credentials').delete().eq('league_id', league.id);
}
