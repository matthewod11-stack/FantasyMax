/**
 * Avatar Mapping Utility
 *
 * Maps member display names to their Pixar-style avatar images.
 * These are AI-generated avatars stored in /public/avatars/
 */

export interface AvatarAsset {
  src: string;
  objectPosition?: string;
}

const DEFAULT_AVATAR_OBJECT_POSITION = 'center 38%';

const AVATAR_MAP: Record<string, AvatarAsset> = {
  billy: { src: '/avatars/billy.png' },
  'garrett c': { src: '/avatars/garrett.png' },
  'hugo p': { src: '/avatars/hugo.png' },
  'james h': { src: '/avatars/james.png' },
  jeff: { src: '/avatars/jeff.png', objectPosition: 'center center' },
  k: { src: '/avatars/k.png' },
  'kerry r': { src: '/avatars/kerry.png' },
  'marko k': { src: '/avatars/marko.png' },
  'matt od': { src: '/avatars/matt.png', objectPosition: 'center center' },
  'mike od': { src: '/avatars/mike.png' },
  'nick d': { src: '/avatars/nick-d.png', objectPosition: 'center center' },
  'nick f': { src: '/avatars/nick-f.png' },
  paul: { src: '/avatars/paul.png' },
  'pj m': { src: '/avatars/pj.png' },
};

function normalizeDisplayName(displayName: string): string {
  return displayName.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function getAvatarAsset(displayName: string): AvatarAsset | undefined {
  const asset = AVATAR_MAP[normalizeDisplayName(displayName)];
  if (!asset) return undefined;

  return {
    src: asset.src,
    objectPosition: asset.objectPosition ?? DEFAULT_AVATAR_OBJECT_POSITION,
  };
}

/**
 * Get avatar URL for a member by their display name
 * Returns undefined if no custom avatar exists (will fall back to initials)
 */
export function getAvatarUrl(displayName: string): string | undefined {
  return getAvatarAsset(displayName)?.src;
}

/**
 * Check if a member has a custom avatar
 */
export function hasCustomAvatar(displayName: string): boolean {
  return normalizeDisplayName(displayName) in AVATAR_MAP;
}

/**
 * Get all members who have custom avatars
 */
export function getMembersWithAvatars(): string[] {
  return Object.keys(AVATAR_MAP);
}
