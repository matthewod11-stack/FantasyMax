import { describe, expect, it } from 'vitest';
import type { YahooTransaction } from '@/lib/yahoo/types';
import { mapYahooTradeToDbRow } from '@/lib/yahoo/trade-import';

const trade: YahooTransaction = {
  transaction_key: '359.l.179401.tr.352',
  transaction_id: '352',
  type: 'trade',
  status: 'successful',
  timestamp: 1480407832,
  trader_team_key: '359.l.179401.t.11',
  tradee_team_key: '359.l.179401.t.4',
  players: [
    {
      player_key: '359.p.1',
      player_id: '1',
      name: { full: 'Doug Baldwin', first: 'Doug', last: 'Baldwin' },
      transaction_data: {
        type: 'trade',
        source_team_key: '359.l.179401.t.11',
        destination_team_key: '359.l.179401.t.4',
      },
    },
    {
      player_key: '359.p.2',
      player_id: '2',
      name: { full: 'DeAndre Hopkins', first: 'DeAndre', last: 'Hopkins' },
      transaction_data: {
        type: 'trade',
        source_team_key: '359.l.179401.t.4',
        destination_team_key: '359.l.179401.t.11',
      },
    },
  ],
};

describe('Yahoo trade import mapping', () => {
  it('maps a Yahoo trade into the trades upsert row shape', () => {
    expect(
      mapYahooTradeToDbRow(trade, {
        seasonId: 'season-2016',
        teamIdByYahooKey: new Map([
          ['359.l.179401.t.11', 'team-11'],
          ['359.l.179401.t.4', 'team-4'],
        ]),
      }),
    ).toEqual({
      row: {
        season_id: 'season-2016',
        team_1_id: 'team-11',
        team_2_id: 'team-4',
        team_1_sends: [{ name: 'Doug Baldwin', position: '' }],
        team_2_sends: [{ name: 'DeAndre Hopkins', position: '' }],
        trade_date: '2016-11-29',
        yahoo_trade_key: '359.l.179401.tr.352',
      },
      skippedReason: null,
    });
  });

  it('skips a trade when an involved Yahoo team key is not in the season lookup', () => {
    expect(
      mapYahooTradeToDbRow(trade, {
        seasonId: 'season-2016',
        teamIdByYahooKey: new Map([['359.l.179401.t.11', 'team-11']]),
      }),
    ).toEqual({
      row: null,
      skippedReason: 'missing-team',
    });
  });
});
