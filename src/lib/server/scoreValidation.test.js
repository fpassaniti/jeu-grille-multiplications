import { describe, it, expect } from 'vitest';
import { normalizePayload } from './scoreValidation.js';
import { maxPointsPerQuestion } from '$lib/game/scoring.js';

const MAX_POINTS_PER_SECOND = Math.ceil(maxPointsPerQuestion() / 5);

describe('normalizePayload — extraSec (potions de bonus de temps)', () => {
  it('sans extraSec, plafonne elapsedSec à duration*60 comme avant', () => {
    const result = normalizePayload({
      score: 10,
      duration: 3,
      elapsedSec: 500, // > 180s nominal
      questionsSolved: 5
    });
    expect(result.value.elapsedSec).toBe(180);
  });

  it('avec extraSec, élargit le plafond en conséquence', () => {
    const result = normalizePayload(
      {
        score: 10,
        duration: 3,
        elapsedSec: 200, // > 180s nominal mais <= 180+30
        questionsSolved: 5
      },
      30
    );
    expect(result.value.elapsedSec).toBe(200);
  });

  it("extraSec n'élargit pas au-delà de sa propre valeur", () => {
    const result = normalizePayload(
      {
        score: 10,
        duration: 3,
        elapsedSec: 500,
        questionsSolved: 5
      },
      30
    );
    expect(result.value.elapsedSec).toBe(210); // 180 + 30
  });

  it('un score juste au-dessus du plafond nominal est accepté avec le bonus de temps qui le couvre', () => {
    // Juste au-dessus du plafond de plausibilité pour 180s réelles (rejeté
    // sans potion), mais dans le plafond élargi de 210s (potion +30s).
    const score = 180 * MAX_POINTS_PER_SECOND + 10;

    const withoutBonus = normalizePayload({ score, duration: 3, elapsedSec: 180 });
    expect('error' in withoutBonus).toBe(true);

    const withBonus = normalizePayload({ score, duration: 3, elapsedSec: 210 }, 30);
    expect('error' in withBonus).toBe(false);
  });
});
