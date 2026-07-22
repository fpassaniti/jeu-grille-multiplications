/**
 * Mode « divisions » — activé (SPEC §4.1). Quotients exacts : inverse des
 * tables de multiplication. Non intégré aux presets CE1/CE2 (public encore
 * jeune sur cette notion) : accessible via le mode "Libre" uniquement.
 */
import { randInt, makeGenericGenerator, makeTiersValidator } from './generator-utils.js';

function makeDivisionGenerate(divisors) {
  return (rng) => {
    const b = divisors[Math.floor(rng() * divisors.length)];
    const q = randInt(1, 10, rng);
    return { operands: [b * q, b], answer: q };
  };
}

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'D1',
    labelKey: 'difficulty.tiers.D1',
    difficulty: 1.0,
    timeSec: 10,
    generate: makeDivisionGenerate([2, 5, 10])
  },
  {
    id: 'D2',
    labelKey: 'difficulty.tiers.D2',
    difficulty: 1.6,
    timeSec: 16,
    generate: makeDivisionGenerate([3, 4, 6])
  },
  {
    id: 'D3',
    labelKey: 'difficulty.tiers.D3',
    difficulty: 2.4,
    timeSec: 24,
    generate: makeDivisionGenerate([7, 8, 9])
  }
];

/** @type {import('./types.js').GameMode} */
export default {
  id: 'division',
  enabled: true,
  labelKey: 'modes.division',
  icon: '➗',
  boardType: 'generic',
  tiers: TIERS,
  defaultOptions: { tiers: ['D1'] },
  validateOptions: makeTiersValidator(TIERS),
  createGenerator: makeGenericGenerator('division', TIERS, '÷')
};
