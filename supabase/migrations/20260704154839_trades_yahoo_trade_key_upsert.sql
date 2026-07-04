-- PostgREST/Supabase upsert cannot target the previous partial unique index
-- on yahoo_trade_key. A normal unique index still allows multiple NULL values
-- in Postgres while supporting onConflict: 'yahoo_trade_key'.
DROP INDEX IF EXISTS idx_trades_yahoo_trade_key;

CREATE UNIQUE INDEX idx_trades_yahoo_trade_key
  ON trades(yahoo_trade_key);
