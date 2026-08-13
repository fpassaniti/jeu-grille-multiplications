/**
 * Mot de passe "smoothie" : 1 à 3 emoji choisis dans une palette fixe,
 * peu importe l'ordre de sélection. Partagé entre login, register et
 * profile (client) et les endpoints d'auth (serveur).
 */

export const SMOOTHIE_INGREDIENTS = [
  '🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍒', '🥭', '🍉',
  '🥦', '🫜', '🌱', '🥥', '🥑', '🥐', '🥨', '🌰'
];

export const MAX_SMOOTHIE_SIZE = 3;

/**
 * @param {string[]} emojis
 * @returns {boolean}
 */
export function isValidSmoothie(emojis) {
  return Array.isArray(emojis)
    && emojis.length >= 1
    && emojis.length <= MAX_SMOOTHIE_SIZE
    && new Set(emojis).size === emojis.length
    && emojis.every(e => SMOOTHIE_INGREDIENTS.includes(e));
}

/**
 * Représentation canonique (triée, ordre-indépendante) d'un smoothie,
 * utilisée pour le stockage et la comparaison.
 * @param {string[]} emojis
 * @returns {string}
 */
export function smoothieKey(emojis) {
  return [...emojis]
    .sort((a, b) => SMOOTHIE_INGREDIENTS.indexOf(a) - SMOOTHIE_INGREDIENTS.indexOf(b))
    .join(',');
}
