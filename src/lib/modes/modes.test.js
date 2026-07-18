import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/seeded-rng.js';
import { hasCarry, hasBorrow } from './generator-utils.js';
import addition from './addition.js';
import subtraction from './subtraction.js';
import multiplication from './multiplication.js';
import division from './division.js';

const N = 300;

/** Tire N questions d'un seul palier et applique une assertion à chacune. */
function forTier(mode, tierId, assertFn, seed = 7) {
  const gen = mode.createGenerator({ tiers: [tierId] }, 'adulte', seededRng(seed));
  const tier = mode.tiers.find((t) => t.id === tierId);
  for (let i = 0; i < N; i++) {
    const q = gen.next();
    expect(q.difficulty).toBe(tier.difficulty);
    expect(q.timeAllowedSec).toBe(tier.timeSec);
    expect(q.meta.tier).toBe(tierId);
    assertFn(q);
  }
}

describe('addition — conformité des paliers (SPEC §4.5)', () => {
  it('A1 : sans retenue, ≤ 20', () =>
    forTier(addition, 'A1', (q) => {
      expect(q.answer).toBe(q.operands[0] + q.operands[1]);
      expect(q.answer).toBeLessThanOrEqual(20);
      expect(hasCarry(q.operands)).toBe(false);
    }));

  it('A2 : sans retenue, ≤ 100', () =>
    forTier(addition, 'A2', (q) => {
      expect(q.answer).toBeLessThanOrEqual(100);
      expect(hasCarry(q.operands)).toBe(false);
    }));

  it('A3 : avec retenue, ≤ 100', () =>
    forTier(addition, 'A3', (q) => {
      expect(q.answer).toBeLessThanOrEqual(100);
      expect(hasCarry(q.operands)).toBe(true);
    }));

  it('A4 : sans retenue, ≤ 1000', () =>
    forTier(addition, 'A4', (q) => {
      expect(q.answer).toBeLessThanOrEqual(1000);
      expect(hasCarry(q.operands)).toBe(false);
    }));

  it('A5 : avec retenue, ≤ 1000', () =>
    forTier(addition, 'A5', (q) => {
      expect(q.answer).toBeLessThanOrEqual(1000);
      expect(hasCarry(q.operands)).toBe(true);
    }));

  it('A6 : avec retenue, ≤ 10 000, parfois 3 opérandes', () => {
    let sawThreeOperands = false;
    forTier(addition, 'A6', (q) => {
      expect(q.answer).toBeLessThanOrEqual(10000);
      expect(hasCarry(q.operands)).toBe(true);
      expect(q.answer).toBe(q.operands.reduce((a, b) => a + b, 0));
      if (q.operands.length === 3) sawThreeOperands = true;
    });
    expect(sawThreeOperands).toBe(true);
  });

  it('temps enfant ×3 sur les modes génériques (aligné sur les tables)', () => {
    const gen = addition.createGenerator({ tiers: ['A1'] }, 'enfant', seededRng(8));
    expect(gen.next().timeAllowedSec).toBe(15); // 5 × 3
  });

  it('générateur infini : progress.total = null, boardState = null', () => {
    const gen = addition.createGenerator({ tiers: ['A1'] }, 'adulte', seededRng(9));
    gen.next();
    gen.markSolved('x');
    expect(gen.progress()).toEqual({ solved: 1, total: null, cumulative: 1 });
    expect(gen.poolExhausted()).toBe(false);
    expect(gen.boardState()).toBeNull();
  });
});

describe('soustraction — conformité des paliers', () => {
  const cases = [
    ['S1', 20, false],
    ['S2', 100, false],
    ['S3', 100, true],
    ['S4', 1000, false],
    ['S5', 1000, true]
  ];
  for (const [tierId, maxA, borrow] of cases) {
    it(`${tierId} : ${borrow ? 'avec' : 'sans'} emprunt, a ≤ ${maxA}, résultat ≥ 0`, () =>
      forTier(subtraction, tierId, (q) => {
        const [a, b] = q.operands;
        expect(q.answer).toBe(a - b);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(maxA);
        expect(hasBorrow(a, b)).toBe(borrow);
      }));
  }
});

describe('multiplication — conformité des paliers', () => {
  it('M1 : n × 10', () =>
    forTier(multiplication, 'M1', (q) => {
      expect(q.operands[1]).toBe(10);
      expect(q.answer).toBe(q.operands[0] * 10);
    }));

  it('M2 : n × 100 ou n × 1000', () =>
    forTier(multiplication, 'M2', (q) => {
      expect([100, 1000]).toContain(q.operands[1]);
    }));

  it('M3 : 2 chiffres × 1 chiffre, sans retenue', () =>
    forTier(multiplication, 'M3', (q) => {
      const [n, c] = q.operands;
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(99);
      expect(c).toBeGreaterThanOrEqual(2);
      expect(c).toBeLessThanOrEqual(9);
      expect((n % 10) * c).toBeLessThanOrEqual(9);
      expect(Math.floor(n / 10) * c).toBeLessThanOrEqual(9);
    }));

  it('M4 : 2 chiffres × 1 chiffre, avec retenue', () =>
    forTier(multiplication, 'M4', (q) => {
      const [n, c] = q.operands;
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(99);
      expect((n % 10) * c).toBeGreaterThan(9);
    }));

  it('M5 : 3 chiffres × 1 chiffre', () =>
    forTier(multiplication, 'M5', (q) => {
      const [n, c] = q.operands;
      expect(n).toBeGreaterThanOrEqual(100);
      expect(n).toBeLessThanOrEqual(999);
      expect(q.answer).toBe(n * c);
    }));
});

describe('division (V3, désactivée)', () => {
  it('est désactivée mais son générateur fonctionne (quotients exacts)', () => {
    expect(division.enabled).toBe(false);
    const gen = division.createGenerator({ tiers: ['D1'] }, 'adulte', seededRng(10));
    for (let i = 0; i < 100; i++) {
      const q = gen.next();
      const [dividend, divisor] = q.operands;
      expect(dividend % divisor).toBe(0);
      expect(q.answer).toBe(dividend / divisor);
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(10);
    }
  });
});

describe('validateOptions des modes à paliers', () => {
  it('normalise : dédup, filtre les inconnus, trie', () => {
    expect(addition.validateOptions({ tiers: ['A3', 'A1', 'A3', 'Z9'] })).toEqual({
      ok: true,
      value: { tiers: ['A1', 'A3'] }
    });
  });

  it('rejette vide ou invalide', () => {
    expect(addition.validateOptions({ tiers: [] }).ok).toBe(false);
    expect(addition.validateOptions({ tiers: ['Z9'] }).ok).toBe(false);
    expect(addition.validateOptions({}).ok).toBe(false);
    expect(addition.validateOptions(null).ok).toBe(false);
  });
});
