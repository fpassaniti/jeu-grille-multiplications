/**
 * Scoring unifié V2 (SPEC §4.4) : la vitesse est un ratio → équitable entre
 * une table à 8 s et une addition posée à 40 s, insensible au ×3 enfant.
 *
 * Depuis la refonte « un calcul = un score » (SPEC §4.4, révision scoring par
 * calcul élémentaire) : les questions posées (addition/soustraction/
 * multiplication dès qu'un opérande ≥ 10 — en pratique tous les paliers
 * générés par les générateurs addition/soustraction et M3-M6, qui forcent
 * toujours un opérande à ≥ 10) ne passent plus par `computeScore` — chaque chiffre
 * verrouillé est scoré immédiatement via `computeDigitScore`
 * (`GameEngine#checkDigit`/`#awardDigitPoints`, `engine.svelte.js`). Le crédit
 * s'accumule donc au fil de la saisie : une coupure du minuteur en plein
 * milieu d'un calcul posé ne fait plus perdre les chiffres déjà validés.
 * `computeScore` reste utilisé tel quel pour les questions NON posées (tables,
 * division, M1/M2 « règle mentale ») via `GameEngine#checkWhole`.
 */

import { operationDifficulty, POSED_SCORE_CALIBRATION } from './balance-config.js';

export const BASE_POINTS = 15;
export const FLOOR_RATIO = 0.25;
// Plus haute difficulté parmi les paliers NON posés (M1/M2, seuls paliers
// générique en dehors de tables/division à encore utiliser `computeScore` —
// tous les paliers addition/soustraction et M3-M6 sont toujours posés, cf.
// commentaire ci-dessus) = OP_DIFFICULTY × 1.
export const MAX_DIFFICULTY = 0.8;

/**
 * Poids par défaut d'« un calcul élémentaire » pour `computeDigitScore` —
 * milieu de `RECALL_DIFFICULTY_RANGE` ([0.3, 0.7]). N'est plus le poids
 * réellement utilisé pour les questions posées (addition/soustraction/
 * multiplication) : celles-ci passent désormais un `digitWeight` propre à la
 * question (`question.digitWeight`, calculé dans
 * `src/lib/modes/generator-utils.js` = `tier.difficulty / totalDigits ×
 * POSED_SCORE_CALIBRATION`, proportionnel à la difficulté réelle du palier
 * plutôt qu'une constante identique pour tous). Conservé comme valeur par
 * défaut du paramètre `digitWeight` (rétrocompatibilité des appels/tests
 * sans poids explicite).
 */
export const DIGIT_DIFFICULTY = 0.5;

/**
 * Nombre maximal de chiffres à saisir sur l'ensemble des étapes d'une même
 * question posée (pire cas = M6, `src/lib/modes/multiplication.js`) : 2
 * produits partiels (n × units, n × tens, n ≤ 999, units/tens ≤ 9 → ≤ 4
 * chiffres chacun) + la somme finale (n × m, m ≤ 99 → ≤ 5 chiffres) = 13.
 * Utilisé uniquement par `maxPointsPerQuestion()` (plafond anti-triche) — à
 * revérifier si un palier plus exigeant que M6 est ajouté.
 */
export const MAX_POSED_DIGITS = 13;

/**
 * Points d'une bonne réponse à une question NON posée (tables, division,
 * M1/M2) — réponse entière, un seul événement de score par question.
 * @param {import('$lib/modes/types.js').Question} question
 * @param {number} timeRemainingSec
 * @returns {number}
 */
export function computeScore(question, timeRemainingSec) {
  const ratio = Math.max(0, Math.min(1, timeRemainingSec / question.timeAllowedSec));
  return Math.round(BASE_POINTS * question.difficulty * (FLOOR_RATIO + (1 - FLOOR_RATIO) * ratio));
}

/**
 * Points d'un chiffre correct verrouillé sur une question posée — même
 * formule que `computeScore`, avec le poids propre à la question
 * (`question.digitWeight`, proportionnel à la difficulté du palier) au lieu
 * de la difficulté globale de la question.
 * @param {number} timeRemainingSec
 * @param {number} timeAllowedSec
 * @param {number} [digitWeight]
 * @returns {number}
 */
export function computeDigitScore(timeRemainingSec, timeAllowedSec, digitWeight = DIGIT_DIFFICULTY) {
  const ratio = Math.max(0, Math.min(1, timeRemainingSec / timeAllowedSec));
  return Math.round(BASE_POINTS * digitWeight * (FLOOR_RATIO + (1 - FLOOR_RATIO) * ratio));
}

/**
 * Maximum théorique par question (utilisé par l'anti-triche serveur) : le
 * plus haut entre le pire cas non posé (une question, `computeScore`) et le
 * pire cas posé (M6, le palier le plus dur — `operationDifficulty(10)`,
 * marge d'arrondi de `MAX_POSED_DIGITS` points pour l'arrondi indépendant de
 * chaque chiffre). À revérifier si un palier plus exigeant que M6 est ajouté.
 * @returns {number}
 */
export function maxPointsPerQuestion() {
  const nonPosedMax = Math.round(BASE_POINTS * MAX_DIFFICULTY);
  const posedMax =
    Math.round(BASE_POINTS * operationDifficulty(10) * POSED_SCORE_CALIBRATION) + MAX_POSED_DIGITS;
  return Math.max(nonPosedMax, posedMax);
}
