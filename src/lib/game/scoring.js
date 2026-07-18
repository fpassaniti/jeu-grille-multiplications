/**
 * Scoring unifié V2 (SPEC §4.4) : la vitesse est un ratio → équitable entre
 * une table à 8 s et une addition posée à 40 s, insensible au ×3 enfant.
 */

export const BASE_POINTS = 15;
export const FLOOR_RATIO = 0.25;
export const MAX_DIFFICULTY = 3.0;

/**
 * Points d'une bonne réponse.
 * @param {import('$lib/modes/types.js').Question} question
 * @param {number} timeRemainingSec
 * @returns {number}
 */
export function computeScore(question, timeRemainingSec) {
  const ratio = Math.max(0, Math.min(1, timeRemainingSec / question.timeAllowedSec));
  return Math.round(BASE_POINTS * question.difficulty * (FLOOR_RATIO + (1 - FLOOR_RATIO) * ratio));
}

/**
 * Maximum théorique par question (utilisé par l'anti-triche serveur).
 * @returns {number}
 */
export function maxPointsPerQuestion() {
  return Math.round(BASE_POINTS * MAX_DIFFICULTY);
}
