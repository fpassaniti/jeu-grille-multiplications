import { MODES, isKnownMode } from '$lib/modes/index.js';
import { maxPointsPerQuestion } from '$lib/game/scoring.js';

const VALID_DURATIONS = [2, 3, 5];
const VALID_LEVELS = ['adulte', 'enfant'];
// Plausibilité : bien au-delà du maximum théorique, en supposant ~5 s minimum
// par question — dérivé de maxPointsPerQuestion() pour ne pas dupliquer le
// plafond de difficulté (évite le drift si le modèle de récompense change).
const MAX_POINTS_PER_SECOND = Math.ceil(maxPointsPerQuestion() / 5);

/**
 * Normalise et valide le payload de POST /api/scores — accepte l'ancien format
 * V1 (PWA en cache : solvedCells/totalPossibleCells/selectedTables) ET le
 * nouveau format V2 (gameMode/modeOptions/questionsSolved/questionsTotal/errorsCount).
 * @param {any} body
 * @returns {{error: string}|{value: Object}}
 */
export function normalizePayload(body) {
  const score = Number(body.score);
  const duration = parseInt(body.duration, 10);
  const level = body.level;

  if (body.score == undefined || !body.duration || !level) {
    return { error: 'Informations manquantes' };
  }
  if (!Number.isFinite(score) || score < 0) {
    return { error: 'Score invalide' };
  }
  if (!VALID_DURATIONS.includes(duration)) {
    return { error: 'Durée de jeu invalide' };
  }
  if (!VALID_LEVELS.includes(level)) {
    return { error: 'Niveau invalide' };
  }

  // Ancien payload : pas de gameMode → tables
  const gameMode = body.gameMode ?? 'tables';
  if (!isKnownMode(gameMode)) {
    return { error: 'Mode de jeu inconnu' };
  }
  const mode = MODES[gameMode];
  if (!mode.enabled) {
    return { error: 'Mode de jeu désactivé' };
  }

  // Options : nouveau format, ou reconstruction depuis selectedTables (V1)
  const rawOptions =
    body.modeOptions ??
    (gameMode === 'tables' && Array.isArray(body.selectedTables)
      ? { selectedTables: body.selectedTables }
      : {});
  const validation = mode.validateOptions(rawOptions);
  if (!validation.ok) {
    return { error: `Options de mode invalides : ${validation.error}` };
  }

  // Temps réellement joué (couvre la fin anticipée "Finir la partie") :
  // borné à [1, duration*60] — un ancien client sans elapsedSec suppose la durée nominale.
  const elapsedSec = Math.min(
    duration * 60,
    Number.isInteger(body.elapsedSec) && body.elapsedSec > 0 ? body.elapsedSec : duration * 60
  );

  // Plausibilité (anti-triche #7) : au-delà du maximum théorique pour le temps
  // RÉELLEMENT joué (et non la durée nominale, qui peut être bien supérieure
  // en cas de fin anticipée).
  if (score > elapsedSec * MAX_POINTS_PER_SECOND) {
    return { error: 'Score invalide' };
  }

  const questionsSolved = body.questionsSolved ?? body.solvedCells ?? 0;
  const questionsTotal = body.questionsTotal ?? body.totalPossibleCells ?? null;
  const errorsCount =
    Number.isInteger(body.errorsCount) && body.errorsCount >= 0 ? body.errorsCount : null;

  return {
    value: {
      score,
      duration,
      level,
      gameMode,
      modeOptions: validation.value,
      questionsSolved,
      questionsTotal,
      errorsCount,
      elapsedSec
    }
  };
}
