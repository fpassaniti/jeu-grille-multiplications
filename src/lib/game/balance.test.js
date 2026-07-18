import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/seeded-rng.js';
import { getMode } from '$lib/modes/index.js';
import { computeScore } from './scoring.js';

/**
 * Équilibrage entre modes (SPEC §4.4) : simulation déterministe d'un
 * « joueur modèle » qui répond juste à un ratio constant du temps alloué.
 * À ratio constant, points/minute isole le couple (difficulty, timeSec)
 * des paliers. Cible : chaque config dans ±30 % de la baseline tables adulte.
 */

const TRANSITION_SEC = 0.5; // délai feedback correct → question suivante

function simulate({ modeId, options, level }, answerRatio, minutes = 3, seed = 123) {
  const generator = getMode(modeId).createGenerator(options, level, seededRng(seed));
  let elapsed = 0;
  let points = 0;
  const totalSec = minutes * 60;

  while (elapsed < totalSec) {
    const question = generator.next();
    const responseTime = question.timeAllowedSec * answerRatio;
    elapsed += responseTime + TRANSITION_SEC;
    if (elapsed > totalSec) break;
    points += computeScore(question, question.timeAllowedSec - responseTime);
    generator.markSolved(question.id);
    if (generator.poolExhausted()) {
      generator.resetPool();
    }
  }
  return points / minutes;
}

// Comparaison à niveau constant : le ×3 enfant ralentit tous les modes de la
// même façon (le leaderboard sépare déjà adulte/enfant).
const CONFIGS_BY_LEVEL = {
  adulte: {
    'tables (toutes)': { modeId: 'tables', options: { selectedTables: [] } },
    'addition CE1': { modeId: 'addition', options: { tiers: ['A1', 'A2', 'A3'] } },
    'addition CE2': { modeId: 'addition', options: { tiers: ['A3', 'A4', 'A5'] } },
    'soustraction CE1': { modeId: 'subtraction', options: { tiers: ['S1', 'S2', 'S3'] } },
    'soustraction CE2': { modeId: 'subtraction', options: { tiers: ['S3', 'S4', 'S5'] } },
    'multiplication M1': { modeId: 'multiplication', options: { tiers: ['M1'] } },
    'multiplication CE2': {
      modeId: 'multiplication',
      options: { tiers: ['M1', 'M2', 'M3', 'M4'] }
    }
  },
  // NB : un sous-ensemble de tables faciles (ex. {2,5,10}) rapporte volontairement
  // moins (difficulté 0.5–0.9) — propriété V1 conservée, hors du périmètre « entre modes ».
  enfant: {
    'tables (toutes)': { modeId: 'tables', options: { selectedTables: [] } },
    'addition CE1': { modeId: 'addition', options: { tiers: ['A1', 'A2', 'A3'] } },
    'soustraction CE1': { modeId: 'subtraction', options: { tiers: ['S1', 'S2', 'S3'] } },
    'multiplication M1': { modeId: 'multiplication', options: { tiers: ['M1'] } }
  }
};

describe('équilibrage points/minute entre modes (±30 % des tables, à niveau constant)', () => {
  for (const [level, configs] of Object.entries(CONFIGS_BY_LEVEL)) {
    for (const answerRatio of [0.5, 0.8]) {
      describe(`${level}, réponse à ${answerRatio * 100} % du temps alloué`, () => {
        const baseline = simulate({ ...configs['tables (toutes)'], level }, answerRatio);

        for (const [label, config] of Object.entries(configs)) {
          it(`${label} : dans la bande`, () => {
            const perMinute = simulate({ ...config, level }, answerRatio);
            const ratio = perMinute / baseline;
            expect(
              ratio,
              `${label} (${level}) → ${perMinute.toFixed(1)} pts/min vs baseline ${baseline.toFixed(1)} (ratio ${ratio.toFixed(2)})`
            ).toBeGreaterThanOrEqual(0.7);
            expect(ratio).toBeLessThanOrEqual(1.3);
          });
        }
      });
    }
  }
});
