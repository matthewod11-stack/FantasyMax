/**
 * Mentions Module
 * Sprint 2.4: Auto-detect member mentions in writeups
 *
 * Exports detection utilities and database operations
 */

export {
  detectMentions,
  detectUniqueMentions,
  getMemberPatterns,
  type MemberNameEntry,
  type DetectedMention,
} from './detect-mentions';

export {
  saveMentions,
  getMentionsForWriteup,
  getMentionsForMember,
  clearMentionsForWriteup,
  backfillAllMentions,
  type WriteupMention,
} from './queries';
