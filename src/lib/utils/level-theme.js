const THEME_GRADIENTS = {
  blue: 'linear-gradient(45deg, #4d57ff, #8a90ff)',
  green: 'linear-gradient(45deg, #43d787, #7df0b2)',
  purple: 'linear-gradient(45deg, #9c5fff, #c29aff)',
  orange: 'linear-gradient(45deg, #ff8f3e, #ffb585)',
  red: 'linear-gradient(45deg, #ff6b6b, #ff9999)',
  teal: 'linear-gradient(45deg, #26c0c0, #7fe7e7)',
  indigo: 'linear-gradient(45deg, #4f46e5, #a5b4fc)',
  pink: 'linear-gradient(45deg, #ec4899, #f9a8d4)',
  amber: 'linear-gradient(45deg, #d97706, #fbbf24)',
  gold: 'linear-gradient(45deg, #d4af37, #f9e29c)'
};

/**
 * Dégradé CSS associé à un `color_theme` de `level_definitions`.
 * Utilisé par LevelBadge (pastille de niveau).
 * @param {string|null} colorTheme
 * @returns {string}
 */
export function getLevelGradient(colorTheme) {
  return THEME_GRADIENTS[colorTheme] || THEME_GRADIENTS.blue;
}
