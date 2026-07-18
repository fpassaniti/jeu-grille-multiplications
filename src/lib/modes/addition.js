/**
 * Mode « additions posées » — paliers pédagogiques A1–A6 (SPEC §4.5).
 */
import {
  genAdditionNoCarry,
  genAdditionWithCarry,
  makeGenericGenerator,
  makeTiersValidator
} from './generator-utils.js';

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'A1',
    labelKey: 'difficulty.tiers.A1',
    difficulty: 0.5,
    timeSec: 5,
    generate: (rng) => genAdditionNoCarry({ numCols: 2, maxTotal: 20 }, rng)
  },
  {
    id: 'A2',
    labelKey: 'difficulty.tiers.A2',
    difficulty: 0.8,
    timeSec: 8,
    generate: (rng) => genAdditionNoCarry({ numCols: 2, maxTotal: 100 }, rng)
  },
  {
    id: 'A3',
    labelKey: 'difficulty.tiers.A3',
    difficulty: 1.2,
    timeSec: 12,
    generate: (rng) => genAdditionWithCarry({ numCols: 2, maxTotal: 100 }, rng)
  },
  {
    id: 'A4',
    labelKey: 'difficulty.tiers.A4',
    difficulty: 1.4,
    timeSec: 14,
    generate: (rng) => genAdditionNoCarry({ numCols: 3, maxTotal: 1000 }, rng)
  },
  {
    id: 'A5',
    labelKey: 'difficulty.tiers.A5',
    difficulty: 1.8,
    timeSec: 18,
    generate: (rng) => genAdditionWithCarry({ numCols: 3, maxTotal: 1000 }, rng)
  },
  {
    id: 'A6',
    labelKey: 'difficulty.tiers.A6',
    difficulty: 2.4,
    timeSec: 24,
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
