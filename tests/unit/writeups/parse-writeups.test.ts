import { describe, expect, it } from 'vitest';
import { generateTitle, inferWriteupType } from '../../../scripts/parse-writeups';

describe('historical writeup parser lore classification', () => {
  it.each([
    {
      name: 'Vegas draft logistics',
      seasonYear: 2024,
      content:
        'Alright boys. My flights are booked. The suite is booked. Custom draft board has arrived. Two months out from Vegas draft weekend and the plans are becoming a reality.',
      expectedType: 'draft_notes',
      expectedTitle: '2024 Vegas Draft Planning',
    },
    {
      name: 'playoff race update',
      seasonYear: 2015,
      content:
        'Well Boys it is coming down to the wire for a coveted playoff berth. Two teams are guaranteed a spot, two playoff games this week can decide the final seed, and the tie breaker will be total points scored.',
      expectedType: 'standings_update',
      expectedTitle: '2015 Playoff Race Update',
    },
    {
      name: 'championship recap',
      seasonYear: 2024,
      content:
        'Championship recap: Garrett survived the final, the bracket collapsed around the top seeds, and the title game turned into an all-time Hall of Shame swing.',
      expectedType: 'season_recap',
      expectedTitle: '2024 Championship Recap',
    },
    {
      name: 'champion celebration',
      seasonYear: 2022,
      content:
        'Well that is all she wrote! As I am sure you guessed, yours truly is once again CHAMPION. How does he keep winning? How do I model my strategy?',
      expectedType: 'season_recap',
      expectedTitle: '2022 Season Recap',
    },
    {
      name: 'rule announcement',
      seasonYear: 2023,
      content:
        'HUGE UPDATE: rule change vote is live. The league announcement covers playoff settings, dues, draft order, and commissioner housekeeping.',
      expectedType: 'announcement',
      expectedTitle: '2023 League Announcement',
    },
    {
      name: 'trade drama',
      seasonYear: 2017,
      content:
        'TRADE BLOCK: PJ has made Cam Newton available and Jim has made Brady available. Trade deadline drama is officially on, gentlemen.',
      expectedType: 'announcement',
      expectedTitle: '2017 Trade Drama',
    },
  ])('classifies and titles $name', ({ content, expectedTitle, expectedType, seasonYear }) => {
    const type = inferWriteupType(content);

    expect(type).toBe(expectedType);
    expect(generateTitle(content, type, seasonYear)).toBe(expectedTitle);
  });
});
