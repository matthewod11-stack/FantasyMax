export interface TradeChampionshipImpactInput {
  seasonYear: number;
  team1MemberName: string;
  team2MemberName: string;
  team1IsChampion: boolean;
  team2IsChampion: boolean;
}

export function formatTradeChampionshipImpact({
  seasonYear,
  team1MemberName,
  team2MemberName,
  team1IsChampion,
  team2IsChampion,
}: TradeChampionshipImpactInput): string | null {
  if (team1IsChampion) {
    return `${team1MemberName} won the ${seasonYear} championship after this deal.`;
  }

  if (team2IsChampion) {
    return `${team2MemberName} won the ${seasonYear} championship after this deal.`;
  }

  return null;
}
