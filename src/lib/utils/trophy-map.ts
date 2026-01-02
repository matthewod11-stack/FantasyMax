/**
 * Toilet Trophy Image Mapping
 *
 * Maps seasons to their "Toilet Trophy" images - AI-generated humorous
 * images of the last-place finisher being flushed down a golden toilet.
 *
 * Note: Only seasons with available member photos have trophy images.
 * Seasons without photos (2015, 2018, 2019, 2021) are not included.
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

/**
 * Get the toilet trophy image URL for a given season year.
 * Returns undefined if no trophy image exists for that year.
 */
export function getToiletTrophyUrl(year: number): string | undefined {
  return TROPHY_MAP[year];
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
