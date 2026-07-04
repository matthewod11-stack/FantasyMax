import { describe, expect, it } from 'vitest';
import {
  extractYahooTransactionNodes,
  parseYahooTradeTransactions,
  sanitizeYahooTransactionForAudit,
} from '@/lib/yahoo/trade-diagnostics';

const yahooTradeResponse = {
  fantasy_content: {
    league: [
      [{ league_key: '461.l.175829' }],
      {
        transactions: {
          count: 1,
          0: {
            transaction: [
              { transaction_key: '461.l.175829.tr.12' },
              { transaction_id: '12' },
              { type: 'trade' },
              { status: 'successful' },
              { timestamp: '1712345678' },
              {
                players: {
                  count: 2,
                  0: {
                    player: [
                      [
                        { player_key: '461.p.1' },
                        { name: { full: 'Amon-Ra St. Brown', first: 'Amon-Ra', last: 'St. Brown' } },
                      ],
                      {
                        transaction_data: [
                          { type: 'trade' },
                          { source_team_key: '461.l.175829.t.1' },
                          { destination_team_key: '461.l.175829.t.2' },
                        ],
                      },
                    ],
                  },
                  1: {
                    player: [
                      [
                        { player_key: '461.p.2' },
                        { name: { full: 'Bijan Robinson', first: 'Bijan', last: 'Robinson' } },
                      ],
                      {
                        transaction_data: [
                          { type: 'trade' },
                          { source_team_key: '461.l.175829.t.2' },
                          { destination_team_key: '461.l.175829.t.1' },
                        ],
                      },
                    ],
                  },
                },
              },
              { access_token: 'should-never-leak' },
            ],
          },
        },
      },
    ],
  },
};

describe('Yahoo trade diagnostics', () => {
  it('extracts transaction nodes from Yahoo numeric-key transaction containers', () => {
    const nodes = extractYahooTransactionNodes(yahooTradeResponse);

    expect(nodes).toHaveLength(1);
  });

  it('sanitizes a transaction shape without leaking unapproved raw fields', () => {
    const [node] = extractYahooTransactionNodes(yahooTradeResponse);
    const summary = sanitizeYahooTransactionForAudit(node);

    expect(summary).toEqual({
      transactionKey: '461.l.175829.tr.12',
      transactionId: '12',
      type: 'trade',
      status: 'successful',
      timestamp: 1712345678,
      timestampIso: '2024-04-05T19:34:38.000Z',
      traderTeamKey: null,
      tradeeTeamKey: null,
      playerCount: 2,
      players: [
        {
          name: 'Amon-Ra St. Brown',
          sourceTeamKey: '461.l.175829.t.1',
          destinationTeamKey: '461.l.175829.t.2',
          transactionType: 'trade',
        },
        {
          name: 'Bijan Robinson',
          sourceTeamKey: '461.l.175829.t.2',
          destinationTeamKey: '461.l.175829.t.1',
          transactionType: 'trade',
        },
      ],
      topLevelKeys: [
        'transaction_key',
        'transaction_id',
        'type',
        'status',
        'timestamp',
        'players',
        'access_token',
      ],
    });
    expect(JSON.stringify(summary)).not.toContain('should-never-leak');
  });

  it('parses Yahoo trade transactions into the sync import shape', () => {
    expect(parseYahooTradeTransactions(yahooTradeResponse)).toEqual([
      {
        transaction_key: '461.l.175829.tr.12',
        transaction_id: '12',
        type: 'trade',
        status: 'successful',
        timestamp: 1712345678,
        trader_team_key: undefined,
        tradee_team_key: undefined,
        players: [
          {
            player_key: '461.p.1',
            player_id: '',
            name: {
              full: 'Amon-Ra St. Brown',
              first: 'Amon-Ra',
              last: 'St. Brown',
            },
            transaction_data: {
              type: 'trade',
              source_team_key: '461.l.175829.t.1',
              destination_team_key: '461.l.175829.t.2',
            },
          },
          {
            player_key: '461.p.2',
            player_id: '',
            name: {
              full: 'Bijan Robinson',
              first: 'Bijan',
              last: 'Robinson',
            },
            transaction_data: {
              type: 'trade',
              source_team_key: '461.l.175829.t.2',
              destination_team_key: '461.l.175829.t.1',
            },
          },
        ],
      },
    ]);
  });
});
