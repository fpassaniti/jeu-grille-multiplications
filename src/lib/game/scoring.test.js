import { describe, it, expect } from 'vitest';
import {
  computeScore,
  computeDigitScore,
  maxPointsPerQuestion,
  BASE_POINTS,
  FLOOR_RATIO,
  DIGIT_DIFFICULTY,
  MAX_DIFFICULTY,
  MAX_POSED_DIGITS
} from './scoring.js';
import { operationDifficulty, POSED_SCORE_CALIBRATION } from './balance-config.js';

function q(difficulty, timeAllowedSec) {
  return { difficulty, timeAllowedSec };
}

describe('scoring unifié (SPEC §4.4)', () => {
  it('réponse instantanée : round(15 × difficulté)', () => {
    expect(computeScore(q(1.0, 10), 10)).toBe(15);
    expect(computeScore(q(3.0, 10), 10)).toBe(45);
    expect(computeScore(q(0.5, 10), 10)).toBe(8);
  });

  it('temps écoulé : plancher 0.25 → une bonne réponse lente rapporte toujours', () => {
    expect(computeScore(q(1.0, 10), 0)).toBe(4); // round(15 × 0.25)
    expect(computeScore(q(3.0, 10), 0)).toBe(11);
    expect(computeScore(q(0.5, 40), 0)).toBeGreaterThan(0);
  });

  it('maxPointsPerQuestion : pire cas posé (M6, avec calibration) l\'emporte sur le pire cas non posé', () => {
    const nonPosedMax = Math.round(BASE_POINTS * MAX_DIFFICULTY);
    const posedMax =
      Math.round(BASE_POINTS * operationDifficulty(10) * POSED_SCORE_CALIBRATION) + MAX_POSED_DIGITS;
    expect(posedMax).toBeGreaterThan(nonPosedMax);
    expect(maxPointsPerQuestion()).toBe(posedMax);
  });

  it('la vitesse est un ratio : insensible au ×k du temps alloué', () => {
    // mi-temps sur 10 s ≡ mi-temps sur 30 s (×3 enfant)
    expect(computeScore(q(2.0, 10), 5)).toBe(computeScore(q(2.0, 30), 15));
    // et une table à 8 s ≡ une addition posée à 40 s à ratio égal
    expect(computeScore(q(1.2, 8), 4)).toBe(computeScore(q(1.2, 40), 20));
  });

  it('monotone en temps restant et en difficulté', () => {
    expect(computeScore(q(1.5, 20), 15)).toBeGreaterThan(computeScore(q(1.5, 20), 5));
    expect(computeScore(q(2.5, 20), 10)).toBeGreaterThan(computeScore(q(1.0, 20), 10));
  });

  it('borne le ratio à [0, 1] (timers défensifs)', () => {
    expect(computeScore(q(1.0, 10), 15)).toBe(BASE_POINTS);
    expect(computeScore(q(1.0, 10), -5)).toBe(4);
  });
});

describe('computeDigitScore (un calcul élémentaire, question posée)', () => {
  it('même formule que computeScore, à difficulté fixe DIGIT_DIFFICULTY', () => {
    expect(computeDigitScore(10, 10)).toBe(computeScore(q(DIGIT_DIFFICULTY, 10), 10));
    expect(computeDigitScore(5, 10)).toBe(computeScore(q(DIGIT_DIFFICULTY, 10), 5));
  });

  it('réponse instantanée (ratio 1) : round(15 × DIGIT_DIFFICULTY)', () => {
    expect(computeDigitScore(10, 10)).toBe(Math.round(BASE_POINTS * DIGIT_DIFFICULTY));
  });

  it('temps écoulé (ratio 0) : plancher FLOOR_RATIO, jamais 0', () => {
    expect(computeDigitScore(0, 10)).toBe(Math.round(BASE_POINTS * DIGIT_DIFFICULTY * FLOOR_RATIO));
    expect(computeDigitScore(0, 10)).toBeGreaterThan(0);
  });

  it('un chiffre verrouillé vaut autant qu\'un calcul de table moyen', () => {
    // DIGIT_DIFFICULTY est le milieu de RECALL_DIFFICULTY_RANGE ([0.3, 0.7], cf. balance-config.js)
    expect(DIGIT_DIFFICULTY).toBeCloseTo(0.5, 5);
  });
});
