/**
 * Mode « soustractions posées » — paliers pédagogiques S1–S5 (SPEC §4.5).
 * Résultat toujours ≥ 0. difficulty/timeSec dérivés du nombre d'opérations
 * élémentaires (SPEC §4.4, `balance-config.js`) plutôt que choisis à la main.
 */
import {
  genSubtractionNoBorrow,
  genSubtractionWithBorrow,
  makeGenericGenerator,
  makeTiersValidator
} from './generator-utils.js';
import { operationDifficulty, operationTimeSec, CARRY_BONUS_OPS } from '../game/balance-config.js';

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'S1',
    labelKey: 'difficulty.tiers.S1',
    // 2 colonnes, sans emprunt.
    operationCount: 2,
    difficulty: operationDifficulty(2),
    timeSec: operationTimeSec(2),
    generate: (rng) => genSubtractionNoBorrow({ numCols: 2, maxA: 20 }, rng)
  },
  {
    id: 'S2',
    labelKey: 'difficulty.tiers.S2',
    // 2 colonnes, sans emprunt.
    operationCount: 2,
    difficulty: operationDifficulty(2),
    timeSec: operationTimeSec(2),
    generate: (rng) => genSubtractionNoBorrow({ numCols: 2, maxA: 100 }, rng)
  },
  {
    id: 'S3',
    labelKey: 'difficulty.tiers.S3',
    // 2 colonnes + 1 opération-équivalent pour l'emprunt.
    operationCount: 2 + CARRY_BONUS_OPS,
    difficulty: operationDifficulty(2 + CARRY_BONUS_OPS),
    timeSec: operationTimeSec(2 + CARRY_BONUS_OPS),
    generate: (rng) => genSubtractionWithBorrow({ numCols: 2, maxA: 100 }, rng)
  },
  {
    id: 'S4',
    labelKey: 'difficulty.tiers.S4',
    // 3 colonnes, sans emprunt.
    operationCount: 3,
    difficulty: operationDifficulty(3),
    timeSec: operationTimeSec(3),
    generate: (rng) => genSubtractionNoBorrow({ numCols: 3, maxA: 1000 }, rng)
  },
  {
    id: 'S5',
    labelKey: 'difficulty.tiers.S5',
    // 3 colonnes + 1 opération-équivalent pour l'emprunt.
    operationCount: 3 + CARRY_BONUS_OPS,
    difficulty: operationDifficulty(3 + CARRY_BONUS_OPS),
    timeSec: operationTimeSec(3 + CARRY_BONUS_OPS),
    generate: (rng) => genSubtractionWithBorrow({ numCols: 3, maxA: 1000 }, rng)
  }
];

/** @type {import('./types.js').GameMode} */
export default {
  id: 'subtraction',
  enabled: true,
  labelKey: 'modes.subtraction',
  icon: '➖',
  boardType: 'generic',
  tiers: TIERS,
  defaultOptions: { tiers: ['S1', 'S2', 'S3'] },
  validateOptions: makeTiersValidator(TIERS),
  createGenerator: makeGenericGenerator('subtraction', TIERS, '−')
};
