import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/seeded-rng.js';
import {
  randInt,
  digitsToNumber,
  numberToDigits,
  hasCarry,
  hasBorrow,
  genAdditionNoCarry,
  genAdditionWithCarry,
  genSubtractionNoBorrow,
  genSubtractionWithBorrow,
  createAntiRepeat,
  generateNonRepeating
} from './generator-utils.js';

describe('digits helpers', () => {
  it('convertit dans les deux sens (LSB-first)', () => {
    expect(numberToDigits(345, 3)).toEqual([5, 4, 3]);
    expect(numberToDigits(45, 3)).toEqual([5, 4, 0]);
    expect(digitsToNumber([5, 4, 3])).toBe(345);
  });

  it('randInt reste dans les bornes inclusives', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 200; i++) {
      const n = randInt(3, 7, rng);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });
});

describe('hasCarry / hasBorrow (oracles)', () => {
  it('détecte la retenue', () => {
    expect(hasCarry([38, 45])).toBe(true); // 8+5=13
    expect(hasCarry([23, 45])).toBe(false);
    expect(hasCarry([120, 30])).toBe(false);
    expect(hasCarry([155, 55])).toBe(true);
    expect(hasCarry([9, 1])).toBe(true);
  });

  it('détecte l’emprunt', () => {
    expect(hasBorrow(52, 17)).toBe(true); // 2 < 7
    expect(hasBorrow(58, 12)).toBe(false);
    expect(hasBorrow(300, 150)).toBe(true); // 0 < 5 aux dizaines
    expect(hasBorrow(20, 10)).toBe(false);
  });
});

describe('générateurs contrôlés (500 tirages seedés chacun)', () => {
  const N = 500;

  it('genAdditionNoCarry : bornes, pas de retenue, opérandes ≥ 1', () => {
    const rng = seededRng(42);
    for (let i = 0; i < N; i++) {
      const { operands, answer } = genAdditionNoCarry({ numCols: 2, maxTotal: 100 }, rng);
      expect(answer).toBe(operands[0] + operands[1]);
      expect(answer).toBeLessThanOrEqual(100);
      expect(hasCarry(operands)).toBe(false);
      operands.forEach((n) => expect(n).toBeGreaterThanOrEqual(1));
    }
  });

  it('genAdditionNoCarry ≤ 20 (palier A1)', () => {
    const rng = seededRng(43);
    for (let i = 0; i < N; i++) {
      const { answer, operands } = genAdditionNoCarry({ numCols: 2, maxTotal: 20 }, rng);
      expect(answer).toBeLessThanOrEqual(20);
      expect(hasCarry(operands)).toBe(false);
    }
  });

  it('genAdditionWithCarry : retenue présente, total borné', () => {
    const rng = seededRng(44);
    for (let i = 0; i < N; i++) {
      const { operands, answer } = genAdditionWithCarry({ numCols: 2, maxTotal: 100 }, rng);
      expect(answer).toBe(operands[0] + operands[1]);
      expect(answer).toBeLessThanOrEqual(100);
      expect(hasCarry(operands)).toBe(true);
    }
  });

  it('genAdditionWithCarry à 3 colonnes et 3 opérandes', () => {
    const rng = seededRng(45);
    for (let i = 0; i < N; i++) {
      const { operands, answer } = genAdditionWithCarry(
        { numCols: 3, maxTotal: 1000, operandCount: 3 },
        rng
      );
      expect(answer).toBe(operands.reduce((a, b) => a + b, 0));
      expect(answer).toBeLessThanOrEqual(1000);
      expect(hasCarry(operands)).toBe(true);
    }
  });

  it('genSubtractionNoBorrow : a > b, pas d’emprunt, résultat ≥ 0', () => {
    const rng = seededRng(46);
    for (let i = 0; i < N; i++) {
      const { operands, answer } = genSubtractionNoBorrow({ numCols: 2, maxA: 100 }, rng);
      const [a, b] = operands;
      expect(answer).toBe(a - b);
      expect(a).toBeLessThanOrEqual(100);
      expect(a).toBeGreaterThan(b);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(answer).toBeGreaterThanOrEqual(0);
      expect(hasBorrow(a, b)).toBe(false);
    }
  });

  it('genSubtractionWithBorrow : emprunt présent, résultat ≥ 0', () => {
    const rng = seededRng(47);
    for (let i = 0; i < N; i++) {
      const { operands, answer } = genSubtractionWithBorrow({ numCols: 3, maxA: 1000 }, rng);
      const [a, b] = operands;
      expect(answer).toBe(a - b);
      expect(a).toBeLessThanOrEqual(1000);
      expect(a).toBeGreaterThan(b);
      expect(answer).toBeGreaterThanOrEqual(0);
      expect(hasBorrow(a, b)).toBe(true);
    }
  });
});

describe('anti-répétition', () => {
  it('refuse un id présent dans la fenêtre puis l’accepte à nouveau', () => {
    const ar = createAntiRepeat(2);
    ar.push('a');
    ar.push('b');
    expect(ar.accepts('a')).toBe(false);
    ar.push('c'); // 'a' sort de la fenêtre
    expect(ar.accepts('a')).toBe(true);
  });

  it('generateNonRepeating ne bloque jamais même si tout se répète', () => {
    const ar = createAntiRepeat(6);
    const gen = () => ({ id: 'toujours-pareil' });
    expect(generateNonRepeating(gen, ar).id).toBe('toujours-pareil');
    expect(generateNonRepeating(gen, ar).id).toBe('toujours-pareil');
  });
});
