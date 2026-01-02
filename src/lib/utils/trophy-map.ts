/**
 * Toilet Trophy Image Mapping
 *
 * Maps seasons to their "Toilet Trophy" images - AI-generated humorous
 * images of the last-place finisher being flushed down a golden toilet.
 *
 * Note: Only seasons with available member photos have custom trophy images.
 * Seasons without photos use the default trophy image.
 */

const TROPHY_MAP: Record<number, string> = {
  2016: '/trophies/2016.png',
  2017: '/trophies/2017.png',
  2020: '/trophies/2020.png',
  2022: '/trophies/2022.png',
  2023: '/trophies/2023.png',
  2024: '/trophies/2024.png',
  2025: '/trophies/2025.png',
};

/** Default toilet trophy image for seasons without custom AI images */
export const DEFAULT_TOILET_TROPHY = '/avatars/default-toilet-trophy.png';

/**
 * Get the toilet trophy image URL for a given season year.
 * Returns undefined if no custom trophy image exists for that year.
 */
export function getToiletTrophyUrl(year: number): string | undefined {
  return TROPHY_MAP[year];
}

/**
 * Get the toilet trophy image URL, falling back to default if no custom image.
 * Always returns a valid URL.
 */
export function getToiletTrophyUrlWithFallback(year: number): string {
  return TROPHY_MAP[year] ?? DEFAULT_TOILET_TROPHY;
}

/**
 * Check if a toilet trophy image exists for a given year.
 */
export function hasToiletTrophy(year: number): boolean {
  return year in TROPHY_MAP;
}

/**
 * Get all years that have toilet trophy images.
 */
export function getToiletTrophyYears(): number[] {
  return Object.keys(TROPHY_MAP).map(Number).sort((a, b) => a - b);
}
