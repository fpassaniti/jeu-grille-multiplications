/**
 * Mode « multiplications étendues » — paliers M1–M5 (SPEC §4.5).
 * difficulty/timeSec dérivés du nombre d'opérations élémentaires (SPEC §4.4,
 * `balance-config.js`) plutôt que choisis à la main.
 */
import { randInt, makeGenericGenerator, makeTiersValidator } from './generator-utils.js';
import { operationDifficulty, operationTimeSec, CARRY_BONUS_OPS } from '../game/balance-config.js';

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'M1',
    labelKey: 'difficulty.tiers.M1',
    // Règle mentale (ajout d'un zéro), pas une technique posée : 1 opération.
    operationCount: 1,
    difficulty: operationDifficulty(1),
    timeSec: operationTimeSec(1),
    generate: (rng) => {
      const n = randInt(2, 99, rng);
      return { operands: [n, 10], answer: n * 10 };
    }
  },
  {
    id: 'M2',
    labelKey: 'difficulty.tiers.M2',
    // Règle mentale (ajout de zéros), pas une technique posée : 1 opération.
    operationCount: 1,
    difficulty: operationDifficulty(1),
    timeSec: operationTimeSec(1),
    generate: (rng) => {
      const n = randInt(2, 99, rng);
      const factor = rng() < 0.5 ? 100 : 1000;
      return { operands: [n, factor], answer: n * factor };
    }
  },
  {
    id: 'M3',
    labelKey: 'difficulty.tiers.M3',
    // 2 multiplications à un chiffre (dizaine × c, unité × c), sans retenue.
    operationCount: 2,
    difficulty: operationDifficulty(2),
    timeSec: operationTimeSec(2),
    generate: (rng) => {
      // AB × c sans retenue : chaque chiffre × c reste ≤ 9
      const c = randInt(2, 9, rng);
      const maxDigit = Math.floor(9 / c);
      const a = randInt(1, maxDigit, rng);
      const b = randInt(0, maxDigit, rng);
      const n = a * 10 + b;
      return { operands: [n, c], answer: n * c, carry: false, posed: true };
    }
  },
  {
    id: 'M4',
    labelKey: 'difficulty.tiers.M4',
    // 2 multiplications à un chiffre + 1 opération-équivalent pour la retenue.
    operationCount: 2 + CARRY_BONUS_OPS,
    difficulty: operationDifficulty(2 + CARRY_BONUS_OPS),
    timeSec: operationTimeSec(2 + CARRY_BONUS_OPS),
    generate: (rng) => {
      // AB × c avec retenue : le chiffre des unités × c dépasse 9
      const c = randInt(2, 9, rng);
      const minB = Math.floor(9 / c) + 1;
      const b = randInt(Math.min(minB, 9), 9, rng);
      const a = randInt(1, 9, rng);
      const n = a * 10 + b;
      return { operands: [n, c], answer: n * c, carry: true, posed: true };
    }
  },
  {
    id: 'M5',
    labelKey: 'difficulty.tiers.M5',
    // 3 multiplications à un chiffre (centaine/dizaine/unité × c) + retenue(s) probable(s).
    operationCount: 3 + CARRY_BONUS_OPS,
    difficulty: operationDifficulty(3 + CARRY_BONUS_OPS),
    timeSec: operationTimeSec(3 + CARRY_BONUS_OPS),
    generate: (rng) => {
      const n = randInt(100, 999, rng);
      const c = randInt(2, 9, rng);
      return { operands: [n, c], answer: n * c, posed: true };
    }
  },
  {
    id: 'M6',
    labelKey: 'difficulty.tiers.M6',
    // 6 multiplications à un chiffre (2 produits partiels × jusqu'à 3 chiffres)
    // + 4 additions posées pour sommer les produits partiels décalés.
    operationCount: 10,
    difficulty: operationDifficulty(10),
    timeSec: operationTimeSec(10),
    generate: (rng) => {
      // AB(C) × DE : multiplicateur à 2 chiffres, chiffres non nuls pour
      // que les deux produits partiels soient pédagogiquement significatifs.
      const n = randInt(10, 999, rng);
      const tens = randInt(1, 9, rng);
      const units = randInt(1, 9, rng);
      const m = tens * 10 + units;
      const partials = [
        { value: n * units, shift: 0 },
        { value: n * tens, shift: 1 }
      ];
      return { operands: [n, m], answer: n * m, posed: true, partials };
    }
  }
];

/** @type {import('./types.js').GameMode} */
export default {
  id: 'multiplication',
  enabled: true,
  labelKey: 'modes.multiplication',
  icon: '✖️',
  boardType: 'generic',
  tiers: TIERS,
  defaultOptions: { tiers: ['M1'] },
  validateOptions: makeTiersValidator(TIERS),
  createGenerator: makeGenericGenerator('multiplication', TIERS, '×')
};
