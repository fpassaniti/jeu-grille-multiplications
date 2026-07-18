/**
 * Mode « multiplications étendues » — paliers M1–M5 (SPEC §4.5).
 */
import { randInt, makeGenericGenerator, makeTiersValidator } from './generator-utils.js';

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'M1',
    labelKey: 'difficulty.tiers.M1',
    difficulty: 0.6,
    timeSec: 6,
    generate: (rng) => {
      const n = randInt(2, 99, rng);
      return { operands: [n, 10], answer: n * 10 };
    }
  },
  {
    id: 'M2',
    labelKey: 'difficulty.tiers.M2',
    difficulty: 0.8,
    timeSec: 8,
    generate: (rng) => {
      const n = randInt(2, 99, rng);
      const factor = rng() < 0.5 ? 100 : 1000;
      return { operands: [n, factor], answer: n * factor };
    }
  },
  {
    id: 'M3',
    labelKey: 'difficulty.tiers.M3',
    difficulty: 1.5,
    timeSec: 15,
    generate: (rng) => {
      // AB × c sans retenue : chaque chiffre × c reste ≤ 9
      const c = randInt(2, 9, rng);
      const maxDigit = Math.floor(9 / c);
      const a = randInt(1, maxDigit, rng);
      const b = randInt(0, maxDigit, rng);
      const n = a * 10 + b;
      return { operands: [n, c], answer: n * c, carry: false };
    }
  },
  {
    id: 'M4',
    labelKey: 'difficulty.tiers.M4',
    difficulty: 2.2,
    timeSec: 22,
    generate: (rng) => {
      // AB × c avec retenue : le chiffre des unités × c dépasse 9
      const c = randInt(2, 9, rng);
      const minB = Math.floor(9 / c) + 1;
      const b = randInt(Math.min(minB, 9), 9, rng);
      const a = randInt(1, 9, rng);
      const n = a * 10 + b;
      return { operands: [n, c], answer: n * c, carry: true };
    }
  },
  {
    id: 'M5',
    labelKey: 'difficulty.tiers.M5',
    difficulty: 2.8,
    timeSec: 28,
    generate: (rng) => {
      const n = randInt(100, 999, rng);
      const c = randInt(2, 9, rng);
      return { operands: [n, c], answer: n * c };
    }
  }
];

/** @type {import('./types.js').GameMode} */
export default {
  id: 'multiplication',
  enabled: true,
  labelKey: 'modes.multiplication',
  icon: '✳️',
  boardType: 'generic',
  tiers: TIERS,
  defaultOptions: { tiers: ['M1'] },
  validateOptions: makeTiersValidator(TIERS),
  createGenerator: makeGenericGenerator('multiplication', TIERS, '×')
};
