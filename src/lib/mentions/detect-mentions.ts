/**
 * Member Mention Detection
 * Sprint 2.4: Auto-detect member mentions in writeup content
 *
 * Detects member names in writeup text and extracts context.
 * Handles various name formats: display names, first names, full names.
 */

export interface MemberNameEntry {
  id: string;
  display_name: string;
}

export interface DetectedMention {
  memberId: string;
  memberName: string;
  matchedText: string;
  context: string;
  position: number;
}

/**
 * Name aliases for members - maps display_name to additional patterns to match
 * These are variations of names that appear in historical writeups
 */
const NAME_ALIASES: Record<string, string[]> = {
  'Matt OD': ['Matt', 'Matthew', 'Matt O', 'ODEEZUS'],
  'Mike OD': ['Mike OD', 'Michael O', 'Mike O\'D'],
  'Mikey B': ['Mikey B', 'Mike B', 'Mike Boggiano', 'Boggiano'],
  'Nick D': ['Nick D', 'Nick de Molina', 'de Molina', 'Nick De'],
  'Nick F': ['Nick F', 'Nick Fell'],
  'PJ M': ['PJ M', 'PJ', 'Pj O\'Brien', 'Pj', 'P.J.'],
  'Big Ben': ['Big Ben', 'Ben', 'Benjamin'],
  'Billy': ['Billy', 'Bill'],
  'Camil B': ['Camil', 'Camil B'],
  'Evan S': ['Evan', 'Evan S'],
  'Garrett C': ['Garrett', 'Garrett C'],
  'Hugo P': ['Hugo', 'Hugo P'],
  'James H': ['James H', 'James'],
  'Jeff': ['Jeff', 'Jeffrey'],
  'Jim W': ['Jim W', 'Jim', 'Jimmy'],
  'Kerry R': ['Kerry', 'Kerry R'],
  'Marko K': ['Marko', 'Marko K', 'Marco'],
  'Rohit K': ['Rohit', 'Rohit K'],
  'Tim M': ['Tim M', 'Tim', 'Timothy'],
  'paul': ['Paul', 'paul'],
  // K is too short and causes false positives - require full context
  'K': ['K\\.'], // Only match "K." with period to reduce false positives
};

/**
 * Names that are too common/short and should be skipped or handled carefully
 */
const SKIP_NAMES = new Set(['K']);

/**
 * Build a regex pattern for a name that matches word boundaries
 * Handles special characters and case-insensitivity
 */
function buildNamePattern(name: string): RegExp {
  // Escape special regex characters
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use word boundaries, case insensitive
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

/**
 * Extract context around a match (surrounding text)
 */
function extractContext(content: string, position: number, matchLength: number, contextLength: number = 60): string {
  const halfContext = Math.floor(contextLength / 2);
  const start = Math.max(0, position - halfContext);
  const end = Math.min(content.length, position + matchLength + halfContext);

  let context = content.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) context = '...' + context;
  if (end < content.length) context = context + '...';

  // Normalize whitespace
  context = context.replace(/\s+/g, ' ').trim();

  return context;
}

/**
 * Detect all member mentions in a piece of content
 *
 * @param content - The writeup content to search
 * @param members - Array of members with id and display_name
 * @returns Array of detected mentions with context
 */
export function detectMentions(content: string, members: MemberNameEntry[]): DetectedMention[] {
  const mentions: DetectedMention[] = [];
  const foundMembers = new Set<string>(); // Track which members we've already found

  for (const member of members) {
    // Skip if we've already found this member
    if (foundMembers.has(member.id)) continue;

    // Skip problematic names
    if (SKIP_NAMES.has(member.display_name)) continue;

    // Get aliases for this member, or use display_name as-is
    const namesToCheck = NAME_ALIASES[member.display_name] || [member.display_name];

    // Also add the display_name if it's not already in aliases
    if (!namesToCheck.includes(member.display_name)) {
      namesToCheck.unshift(member.display_name);
    }

    for (const nameVariant of namesToCheck) {
      if (foundMembers.has(member.id)) break; // Already found this member

      const pattern = buildNamePattern(nameVariant);
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        if (match.index === undefined) continue;

        mentions.push({
          memberId: member.id,
          memberName: member.display_name,
          matchedText: match[0],
          context: extractContext(content, match.index, match[0].length),
          position: match.index,
        });

        // Mark this member as found (we only need one mention per member per writeup)
        foundMembers.add(member.id);
        break; // Only capture first mention per name variant
      }
    }
  }

  return mentions;
}

/**
 * Detect mentions and return deduplicated list per member
 * Returns the first (most prominent) mention for each member
 */
export function detectUniqueMentions(content: string, members: MemberNameEntry[]): DetectedMention[] {
  const allMentions = detectMentions(content, members);

  // Deduplicate by memberId, keeping the first occurrence (by position)
  const byMember = new Map<string, DetectedMention>();

  for (const mention of allMentions) {
    const existing = byMember.get(mention.memberId);
    if (!existing || mention.position < existing.position) {
      byMember.set(mention.memberId, mention);
    }
  }

  return Array.from(byMember.values()).sort((a, b) => a.position - b.position);
}

/**
 * Get member name patterns for debugging/testing
 */
export function getMemberPatterns(members: MemberNameEntry[]): Array<{ member: string; patterns: string[] }> {
  return members
    .filter(m => !SKIP_NAMES.has(m.display_name))
    .map(member => ({
      member: member.display_name,
      patterns: NAME_ALIASES[member.display_name] || [member.display_name],
    }));
}
