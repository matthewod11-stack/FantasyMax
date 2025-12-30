/**
 * Avatar Mapping Utility
 *
 * Maps member display names to their Pixar-style avatar images.
 * These are AI-generated avatars stored in /public/avatars/
 */

const AVATAR_MAP: Record<string, string> = {
  'Billy': '/avatars/billy.png',
  'Garrett C': '/avatars/garrett.png',
  'Hugo P': '/avatars/hugo.png',
  'James H': '/avatars/james.png',
  'Jeff': '/avatars/jeff.png',
  'K': '/avatars/k.png',
  'Kerry R': '/avatars/kerry.png',
  'Marko K': '/avatars/marko.png',
  'Matt OD': '/avatars/matt.png',
  'Mike OD': '/avatars/mike.png',
  'Nick D': '/avatars/nick-d.png',
  'Nick F': '/avatars/nick-f.png',
  'paul': '/avatars/paul.png',
  'PJ M': '/avatars/pj.png',
};

/**
 * Get avatar URL for a member by their display name
 * Returns undefined if no custom avatar exists (will fall back to initials)
 */
export function getAvatarUrl(displayName: string): string | undefined {
  return AVATAR_MAP[displayName];
}

/**
 * Check if a member has a custom avatar
 */
export function hasCustomAvatar(displayName: string): boolean {
  return displayName in AVATAR_MAP;
}

/**
 * Get all members who have custom avatars
 */
export function getMembersWithAvatars(): string[] {
  return Object.keys(AVATAR_MAP);
}
