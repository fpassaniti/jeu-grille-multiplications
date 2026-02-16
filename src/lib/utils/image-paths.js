/**
 * Utility functions for generating image paths based on level numbers
 */

/**
 * Get the image path for a level
 * @param {number} level - The level number
 * @param {boolean} large - Whether to get the large version (lg)
 * @returns {string} The image path
 */
export function getLevelImagePath(level, large = false) {
  const suffix = large ? '_lg' : '';
  return `/images/levels/level_${level}${suffix}.png`;
}

/**
 * Get the image path for a level badge/thumbnail
 * @param {number} level - The level number
 * @returns {string} The badge image path
 */
export function getLevelBadgePath(level) {
  return getLevelImagePath(level, false);
}

/**
 * Get the image path for a level poster/print
 * @param {number} level - The level number
 * @returns {string} The poster image path
 */
export function getLevelPosterPath(level) {
  return getLevelImagePath(level, true);
}
