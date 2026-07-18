import { describe, it, expect } from 'vitest';
import { computeScore, maxPointsPerQuestion, BASE_POINTS } from './scoring.js';

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

  it('maximum 45 points par question', () => {
    expect(maxPointsPerQuestion()).toBe(45);
    expect(computeScore(q(3.0, 5), 5)).toBe(45);
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
