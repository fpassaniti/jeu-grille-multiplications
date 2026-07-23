/**
 * Mode « divisions » — activé (SPEC §4.1). Quotients exacts : inverse des
 * tables de multiplication. Non intégré aux presets CE1/CE2 (public encore
 * jeune sur cette notion) : accessible via le mode "Libre" uniquement.
 *
 * Mode « rappel » (comme les tables, SPEC §4.4) : diviser par un diviseur
 * connu est une seule opération de mémorisation, pas un algorithme
 * multi-étapes — la difficulté/le temps reflètent une variance psychologique
 * réduite (diviser par 9 un peu plus dur que par 10), rescalée via
 * `rescaleRecall` plutôt que dérivée d'un nombre d'opérations.
 */
import { randInt, makeGenericGenerator, makeTiersValidator } from './generator-utils.js';
import {
  rescaleRecall,
  RECALL_DIFFICULTY_RANGE,
  RECALL_TIME_RANGE_SEC
} from '../game/balance-config.js';

function makeDivisionGenerate(divisors) {
  return (rng) => {
    const b = divisors[Math.floor(rng() * divisors.length)];
    const q = randInt(1, 10, rng);
    return { operands: [b * q, b], answer: q };
  };
}

// Difficulté brute de rappel (avant rescale), reflétant les diviseurs 7/8/9
// moins bien mémorisés que 2/5/10.
const RAW_MIN = 1.0;
const RAW_MAX = 2.4;

function recallDifficulty(raw) {
  return Math.round(rescaleRecall(raw, RAW_MIN, RAW_MAX, RECALL_DIFFICULTY_RANGE) * 100) / 100;
}

function recallTimeSec(raw) {
  return Math.round(rescaleRecall(raw, RAW_MIN, RAW_MAX, RECALL_TIME_RANGE_SEC));
}

/** @type {import('./types.js').Tier[]} */
const TIERS = [
  {
    id: 'D1',
    labelKey: 'difficulty.tiers.D1',
    difficulty: recallDifficulty(1.0),
    timeSec: recallTimeSec(1.0),
    generate: makeDivisionGenerate([2, 5, 10])
  },
  {
    id: 'D2',
    labelKey: 'difficulty.tiers.D2',
    difficulty: recallDifficulty(1.6),
    timeSec: recallTimeSec(1.6),
    generate: makeDivisionGenerate([3, 4, 6])
  },
  {
    id: 'D3',
    labelKey: 'difficulty.tiers.D3',
    difficulty: recallDifficulty(2.4),
    timeSec: recallTimeSec(2.4),
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
