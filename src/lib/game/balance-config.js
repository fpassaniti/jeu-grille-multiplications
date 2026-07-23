/**
 * Modèle de calibration récompense/temps par nombre d'opérations élémentaires
 * (SPEC §4.4/§4.5) : remplace les valeurs difficulty/timeSec choisies à la
 * main par une fonction du nombre d'opérations réellement requises par
 * l'algorithme posé, pour que le gain (XP/pièces, dérivés du score) et le
 * temps alloué reflètent l'effort réel plutôt que d'égaliser les points/minute
 * entre modes.
 */

/** Difficulté attribuée par opération élémentaire (multiplication/addition/soustraction à un chiffre). */
export const OP_DIFFICULTY = 0.5;

/** Secondes allouées par opération élémentaire (base adulte). */
export const OP_SEC = 4;

/** Temps de lecture/mise en place fixe d'une question (base adulte). */
export const BASE_SEC = 5;

/** Opération-équivalent supplémentaire quand le palier implique une retenue/un emprunt. */
export const CARRY_BONUS_OPS = 1;

/** Plage de difficulté des modes « rappel » (tables, division) : une seule opération de mémorisation. */
export const RECALL_DIFFICULTY_RANGE = [0.3, 0.7];

/** Plage de temps (secondes, adulte) des modes « rappel ». */
export const RECALL_TIME_RANGE_SEC = [6, 10];

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Difficulté d'un palier générique (addition/soustraction/multiplication posées)
 * à partir de son nombre d'opérations élémentaires.
 * @param {number} operationCount
 * @returns {number}
 */
export function operationDifficulty(operationCount) {
  return round1(OP_DIFFICULTY * operationCount);
}

/**
 * Temps alloué (secondes, adulte) d'un palier générique à partir de son
 * nombre d'opérations élémentaires.
 * @param {number} operationCount
 * @returns {number}
 */
export function operationTimeSec(operationCount) {
  return Math.round(BASE_SEC + OP_SEC * operationCount);
}

/**
 * Rescale une valeur brute (grille de difficulté « de rappel » existante,
 * ex. tables/division) vers une plage cible, par normalisation min-max sur
 * son propre intervalle d'origine. Préserve la forme relative (7×7 reste
 * plus dur que 1×1) sans laisser le pic rivaliser avec les modes posés.
 * @param {number} rawValue
 * @param {number} rawMin
 * @param {number} rawMax
 * @param {[number, number]} targetRange
 * @returns {number}
 */
export function rescaleRecall(rawValue, rawMin, rawMax, targetRange) {
  const [targetMin, targetMax] = targetRange;
  if (rawMax === rawMin) {
    return targetMin;
  }
  const t = (rawValue - rawMin) / (rawMax - rawMin);
  return targetMin + t * (targetMax - targetMin);
}
