const DECEMBER = 11; // 0-indexed
const JANUARY = 0; // 0-indexed

export const MIN_SNOW_DURATION_MS = 10_000;
export const MAX_SNOW_DURATION_MS = 120_000;

export const BASE_SLEIGH_CHANCE = 0.15;

/**
 * Returns true if the given date is in the Christmas period:
 * from December 15th (00:00) to January 2nd (23:59:59) inclusive.
 */
export function isChristmasPeriod(now: Date = new Date()): boolean {
  const month = now.getMonth();
  const day = now.getDate();

  if (month === DECEMBER && day >= 15) {
    return true;
  }

  if (month === JANUARY && day <= 2) {
    return true;
  }

  return false;
}

/**
 * Returns a random snowfall duration in milliseconds between 10s and 120s.
 */
export function getChristmasSnowDuration(): number {
  return (
    Math.floor(Math.random() * (MAX_SNOW_DURATION_MS - MIN_SNOW_DURATION_MS + 1)) +
    MIN_SNOW_DURATION_MS
  );
}

/**
 * Returns the probability chance (0..1) of triggering the Santa sleigh traverse.
 */
export function getSleighChance(): number {
  return BASE_SLEIGH_CHANCE;
}
