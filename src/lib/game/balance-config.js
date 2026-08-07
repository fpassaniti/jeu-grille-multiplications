/**
 * Modèle de calibration récompense/temps par nombre d'opérations élémentaires
 * (SPEC §4.4/§4.5) : remplace les valeurs difficulty/timeSec choisies à la
 * main par une fonction du nombre d'opérations réellement requises par
 * l'algorithme posé, pour que le gain (XP/pièces, dérivés du score) et le
 * temps alloué reflètent l'effort réel plutôt que d'égaliser les points/minute
 * entre modes.
 */

/**
 * Difficulté attribuée par opération élémentaire (multiplication/addition/
 * soustraction à un chiffre). Calée sur le plus haut ratio (ancienne
 * difficulté / operationCount) observé dans le barème V2 précédent — garantit
 * qu'aucun palier existant ne rapporte moins qu'avant ; seuls les paliers à
 * fort operationCount (ex. M6) gagnent significativement.
 */
export const OP_DIFFICULTY = 0.8;

/**
 * Facteur d'étalonnage global du score des modes posés (addition/
 * soustraction/multiplication), appliqué en plus de la proportionnalité par
 * chiffre (`digitWeight`, `generator-utils.js`) — destiné à ramener l'ordre
 * de grandeur du score de session à celui des modes « rappel » (tables/
 * division), très supérieur en jeu réel d'après un retour terrain (~800-1800
 * pts/partie en tables). Valeur neutre (1) tant que le facteur réel n'est pas
 * mesuré : une simulation moteur (GameEngine + fake timers, vitesse de
 * réflexion/frappe identique dans tous les modes) a montré que la seule
 * proportionnalité par chiffre fait déjà remonter le score/seconde des modes
 * posés AU-DESSUS de celui des tables — ce qui contredit le retour terrain et
 * indique que l'écart réel vient d'une vitesse de résolution différente entre
 * rappel (instantané) et calcul posé (retenues = temps de réflexion par
 * chiffre, pas seulement de frappe), un paramètre qui ne se déduit pas d'une
 * simulation. NE PAS relever cette constante sans un score réel mesuré en jeu
 * (score de fin de partie, pas les pièces) pour tables ET addition/
 * soustraction à durée identique — calculer alors
 * `scoreTables / scoreAddition` (à `digitWeight` de proportionnalité
 * constant) pour obtenir la valeur cible.
 */
export const POSED_SCORE_CALIBRATION = 1;

/** Secondes allouées par opération élémentaire (base adulte). */
export const OP_SEC = 4;

/** Temps de lecture/mise en place fixe d'une question (base adulte). */
export const BASE_SEC = 5;

/** Opération-équivalent supplémentaire quand le palier implique une retenue/un emprunt. */
export const CARRY_BONUS_OPS = 1;

/**
 * Plage de difficulté des modes « rappel » (tables, division) : une seule
 * opération de mémorisation. Fixée une fois pour toutes au premier
 * rééquilibrage — ne pas la retoucher pour « rester cohérente » avec
 * OP_DIFFICULTY : les deux axes sont indépendants, seuls les modes posés
 * (addition/soustraction/multiplication) doivent être réhaussés.
 */
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
