import type {
  WriteupLoreTopic,
  WriteupType,
  WriteupWithDetails,
  WriteupsBySeason,
} from '@/types/contracts/queries';

export interface WriteupLoreFilters {
  seasonYear?: number;
  type?: WriteupType;
  memberId?: string;
  topic?: WriteupLoreTopic;
}

export interface WriteupFilterMemberOption {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface WriteupFilterOptions {
  seasons: number[];
  types: WriteupType[];
  topics: WriteupLoreTopic[];
  members: WriteupFilterMemberOption[];
}

const TOPIC_ORDER: WriteupLoreTopic[] = ['playoffs', 'draft', 'trade', 'championship'];

function normalizedLoreText(writeup: Pick<WriteupWithDetails, 'title' | 'content' | 'excerpt' | 'writeup_type'>) {
  return `${writeup.title} ${writeup.excerpt ?? ''} ${writeup.content} ${writeup.writeup_type}`.toLowerCase();
}

export function getWriteupLoreTopics(
  writeup: Pick<WriteupWithDetails, 'title' | 'content' | 'excerpt' | 'writeup_type'>,
): WriteupLoreTopic[] {
  const text = normalizedLoreText(writeup);
  const topics = new Set<WriteupLoreTopic>();

  if (
    writeup.writeup_type === 'playoff_preview'
    || /\bplayoff|semi.?final|title game|championship\b/.test(text)
  ) {
    topics.add('playoffs');
  }

  if (
    writeup.writeup_type === 'draft_notes'
    || /\bdraft|vegas|suite|custom draft board|live draft\b/.test(text)
  ) {
    topics.add('draft');
  }

  if (/\btrade|trade block|deadline drama\b/.test(text)) {
    topics.add('trade');
  }

  if (/\bchampionship|title game|champion\b/.test(text)) {
    topics.add('championship');
  }

  return TOPIC_ORDER.filter((topic) => topics.has(topic));
}

function hasActiveFilters(filters: WriteupLoreFilters) {
  return Boolean(filters.seasonYear || filters.type || filters.memberId || filters.topic);
}

function writeupMatchesFilters(writeup: WriteupWithDetails, filters: WriteupLoreFilters) {
  if (filters.seasonYear && writeup.season?.year !== filters.seasonYear) {
    return false;
  }

  if (filters.type && writeup.writeup_type !== filters.type) {
    return false;
  }

  if (filters.memberId && !writeup.mentions.some((mention) => mention.member_id === filters.memberId)) {
    return false;
  }

  if (filters.topic && !getWriteupLoreTopics(writeup).includes(filters.topic)) {
    return false;
  }

  return true;
}

export function filterWriteupSeasons(
  seasons: WriteupsBySeason[],
  filters: WriteupLoreFilters,
): WriteupsBySeason[] {
  const isFiltered = hasActiveFilters(filters);

  return seasons
    .map((season) => {
      if (filters.seasonYear && season.season_year !== filters.seasonYear) {
        return null;
      }

      const writeups = season.writeups.filter((writeup) => writeupMatchesFilters(writeup, filters));
      if (writeups.length === 0) {
        return null;
      }

      return {
        ...season,
        writeups,
        ai_review: isFiltered ? null : season.ai_review,
        ai_review_generated_at: isFiltered ? null : season.ai_review_generated_at,
      };
    })
    .filter((season): season is WriteupsBySeason => season !== null);
}

export function getWriteupFilterOptions(seasons: WriteupsBySeason[]): WriteupFilterOptions {
  const seasonYears = new Set<number>();
  const types = new Set<WriteupType>();
  const topics = new Set<WriteupLoreTopic>();
  const members = new Map<string, WriteupFilterMemberOption>();

  for (const season of seasons) {
    seasonYears.add(season.season_year);

    for (const writeup of season.writeups) {
      types.add(writeup.writeup_type);
      getWriteupLoreTopics(writeup).forEach((topic) => topics.add(topic));

      for (const mention of writeup.mentions) {
        if (!mention.member) continue;
        members.set(mention.member.id, {
          id: mention.member.id,
          displayName: mention.member.display_name,
          avatarUrl: mention.member.avatar_url,
        });
      }
    }
  }

  return {
    seasons: Array.from(seasonYears).sort((a, b) => b - a),
    types: Array.from(types).sort(),
    topics: TOPIC_ORDER.filter((topic) => topics.has(topic)),
    members: Array.from(members.values()).sort((a, b) => a.displayName.localeCompare(b.displayName)),
  };
}

export function formatLoreTopicLabel(topic: WriteupLoreTopic) {
  const labels: Record<WriteupLoreTopic, string> = {
    playoffs: 'Playoffs',
    draft: 'Draft',
    trade: 'Trades',
    championship: 'Championship',
  };

  return labels[topic];
}
