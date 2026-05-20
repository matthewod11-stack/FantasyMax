export function buildH2HRecapPrompt(stats: {
  member1: string;
  member2: string;
  wins1: number;
  wins2: number;
  totalMatchups: number;
  lastScores?: string;
}): string {
  return `Write a 3-4 sentence ESPN-style rivalry recap for a fantasy football league.

FACTS (use only these numbers):
- ${stats.member1}: ${stats.wins1} wins vs ${stats.member2}
- ${stats.member2}: ${stats.wins2} wins vs ${stats.member1}
- Total matchups: ${stats.totalMatchups}
${stats.lastScores ? `- Recent: ${stats.lastScores}` : ''}

Tone: witty but grounded in the stats. No invented scores or seasons.`;
}

export function buildSeasonReviewPrompt(stats: {
  year: number;
  champion: string;
  lastPlace: string;
  topScorer?: string;
}): string {
  return `Write a 150-200 word season review for ${stats.year}.

FACTS:
- Champion: ${stats.champion}
- Last place: ${stats.lastPlace}
${stats.topScorer ? `- Leading scorer: ${stats.topScorer}` : ''}

Use markdown. Stay factual; no invented trades or injuries.`;
}

export function buildTrashTalkPrompt(stats: {
  speaker: string;
  target: string;
  winsSpeaker: number;
  winsTarget: number;
  lastThree: string;
  tone: 'friendly' | 'savage' | 'espn';
}): string {
  return `Generate trash talk from ${stats.speaker} to ${stats.target} before their matchup.

FACTS:
- All-time H2H: ${stats.speaker} ${stats.winsSpeaker}-${stats.winsTarget} vs ${stats.target}
- Last 3 meetings: ${stats.lastThree}
- Tone: ${stats.tone}

2-3 sentences. Must cite the record. Copy-paste ready.`;
}
