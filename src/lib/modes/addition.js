/**
 * Mode « additions posées » — paliers pédagogiques A1–A6 (SPEC §4.5).
 * difficulty/timeSec dérivés du nombre d'opérations élémentaires (SPEC §4.4,
 * `balance-config.js`) plutôt que choisis à la main.
 */
import {
  genAdditionNoCarry,
  genAdditionWithCarry,
  makeGenericGenerator,
  makeTiersValidator
} from './generator-utils.js';
import { operationDifficulty, operationTimeSec, CARRY_BONUS_OPS } from '../game/balance-config.js';

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'A1',
    labelKey: 'difficulty.tiers.A1',
    // 2 colonnes, sans retenue.
    operationCount: 2,
    difficulty: operationDifficulty(2),
    timeSec: operationTimeSec(2),
    generate: (rng) => genAdditionNoCarry({ numCols: 2, maxTotal: 20 }, rng)
  },
  {
    id: 'A2',
    labelKey: 'difficulty.tiers.A2',
    // 2 colonnes, sans retenue.
    operationCount: 2,
    difficulty: operationDifficulty(2),
    timeSec: operationTimeSec(2),
    generate: (rng) => genAdditionNoCarry({ numCols: 2, maxTotal: 100 }, rng)
  },
  {
    id: 'A3',
    labelKey: 'difficulty.tiers.A3',
    // 2 colonnes + 1 opération-équivalent pour la retenue.
    operationCount: 2 + CARRY_BONUS_OPS,
    difficulty: operationDifficulty(2 + CARRY_BONUS_OPS),
    timeSec: operationTimeSec(2 + CARRY_BONUS_OPS),
    generate: (rng) => genAdditionWithCarry({ numCols: 2, maxTotal: 100 }, rng)
  },
  {
    id: 'A4',
    labelKey: 'difficulty.tiers.A4',
    // 3 colonnes, sans retenue.
    operationCount: 3,
    difficulty: operationDifficulty(3),
    timeSec: operationTimeSec(3),
    generate: (rng) => genAdditionNoCarry({ numCols: 3, maxTotal: 1000 }, rng)
  },
  {
    id: 'A5',
    labelKey: 'difficulty.tiers.A5',
    // 3 colonnes + 1 opération-équivalent pour la retenue.
    operationCount: 3 + CARRY_BONUS_OPS,
    difficulty: operationDifficulty(3 + CARRY_BONUS_OPS),
    timeSec: operationTimeSec(3 + CARRY_BONUS_OPS),
    generate: (rng) => genAdditionWithCarry({ numCols: 3, maxTotal: 1000 }, rng)
  },
  {
    id: 'A6',
    labelKey: 'difficulty.tiers.A6',
    // 4 colonnes × en moyenne 1,35 addition/colonne (jusqu'à 3 opérandes,
    // 35 % du temps) + 1 opération-équivalent pour la retenue.
    operationCount: 6,
    difficulty: operationDifficulty(6),
    timeSec: operationTimeSec(6),
    generate: (rng) =>
      genAdditionWithCarry(
        { numCols: 4, maxTotal: 10000, operandCount: rng() < 0.35 ? 3 : 2 },
        rng
      )
  }
];

/** @type {import('./types.js').GameMode} */
export default {
  id: 'addition',
  enabled: true,
  labelKey: 'modes.addition',
  icon: '➕',
  boardType: 'generic',
  tiers: TIERS,
  defaultOptions: { tiers: ['A1', 'A2', 'A3'] },
  validateOptions: makeTiersValidator(TIERS),
  createGenerator: makeGenericGenerator('addition', TIERS, '+')
};
