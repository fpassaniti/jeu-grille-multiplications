/**
 * Mode « soustractions posées » — paliers pédagogiques S1–S5 (SPEC §4.5).
 * Résultat toujours ≥ 0.
 */
import {
  genSubtractionNoBorrow,
  genSubtractionWithBorrow,
  makeGenericGenerator,
  makeTiersValidator
} from './generator-utils.js';

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'S1',
    labelKey: 'difficulty.tiers.S1',
    difficulty: 0.6,
    timeSec: 6,
    generate: (rng) => genSubtractionNoBorrow({ numCols: 2, maxA: 20 }, rng)
  },
  {
    id: 'S2',
    labelKey: 'difficulty.tiers.S2',
    difficulty: 0.9,
    timeSec: 9,
    generate: (rng) => genSubtractionNoBorrow({ numCols: 2, maxA: 100 }, rng)
  },
  {
    id: 'S3',
    labelKey: 'difficulty.tiers.S3',
    difficulty: 1.4,
    timeSec: 14,
    generate: (rng) => genSubtractionWithBorrow({ numCols: 2, maxA: 100 }, rng)
  },
  {
    id: 'S4',
    labelKey: 'difficulty.tiers.S4',
    difficulty: 1.6,
    timeSec: 16,
    generate: (rng) => genSubtractionNoBorrow({ numCols: 3, maxA: 1000 }, rng)
  },
  {
    id: 'S5',
    labelKey: 'difficulty.tiers.S5',
    difficulty: 2.0,
    timeSec: 20,
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
