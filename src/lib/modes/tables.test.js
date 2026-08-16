import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/seeded-rng.js';
import tables, {
  DIFFICULTY_MATRIX,
  tableDifficulty,
  tableTime,
  MIN_COVERAGE_FACTOR
} from './tables.js';

/** Moyenne brute de DIFFICULTY_MATRIX sur ses 100 cellules — référence indépendante pour les tests de `coverageFactor`. */
const FULL_GRID_AVG_DIFFICULTY =
  DIFFICULTY_MATRIX.flat().reduce((sum, d) => sum + d, 0) / 100;

describe('matrice de difficulté brute (formule V1)', () => {
  it('valeurs de référence de la grille brute', () => {
    expect(DIFFICULTY_MATRIX).toHaveLength(10);
    DIFFICULTY_MATRIX.forEach((row) => {
      expect(row).toHaveLength(10);
      row.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(0.5);
        expect(d).toBeLessThanOrEqual(3.0);
      });
    });
    expect(DIFFICULTY_MATRIX[6][6]).toBe(3.0); // pic 7×7
    expect(DIFFICULTY_MATRIX[0][0]).toBe(0.5);
  });
});

describe('tableDifficulty (formule V1 exacte, aucun rescale)', () => {
  it('retourne la valeur brute de la grille', () => {
    expect(tableDifficulty(7, 7)).toBe(3.0); // pic
    expect(tableDifficulty(1, 1)).toBe(0.5);
    expect(tableDifficulty(10, 5)).toBe(0.5);
    expect(tableDifficulty(2, 8)).toBe(1.2);
    expect(tableDifficulty(6, 8)).toBe(2.5);
    expect(tableDifficulty(8, 7)).toBe(2.7);
  });

  it('hors limites → valeur par défaut 1.0', () => {
    expect(tableDifficulty(0, 5)).toBe(1.0);
    expect(tableDifficulty(11, 5)).toBe(1.0);
  });
});

describe('tableTime (formule V1 exacte : 5–15 s adulte, ×3 enfant)', () => {
  it('bornes', () => {
    expect(tableTime(1, 1, 'adulte')).toBe(6);
    expect(tableTime(10, 10, 'adulte')).toBe(15);
    expect(tableTime(1, 1, 'enfant')).toBe(18);
    expect(tableTime(10, 10, 'enfant')).toBe(45);
  });
});

describe('validateOptions', () => {
  it('normalise (dédup + tri), filtre les valeurs hors 1–10', () => {
    const result = tables.validateOptions({ selectedTables: [5, 2, 5, 12, 'x'] });
    expect(result).toEqual({ ok: true, value: { selectedTables: [2, 5] } });
  });

  it('[] toléré (≡ toutes les tables)', () => {
    expect(tables.validateOptions({ selectedTables: [] })).toEqual({
      ok: true,
      value: { selectedTables: [] }
    });
    expect(tables.validateOptions({})).toEqual({ ok: true, value: { selectedTables: [] } });
  });

  it('rejette les non-tableaux et les listes sans table valide', () => {
    expect(tables.validateOptions({ selectedTables: 'nope' }).ok).toBe(false);
    expect(tables.validateOptions({ selectedTables: [42] }).ok).toBe(false);
    expect(tables.validateOptions(null).ok).toBe(false);
  });
});

describe('générateur', () => {
  it('mode adulte : pool de 100 cellules', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(1));
    expect(gen.progress()).toEqual({ solved: 0, total: 100, cumulative: 0 });
  });

  it('question générée : legacyWhole (formule de score V1, pas computeScore)', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(1));
    expect(gen.next().legacyWhole).toBe(true);
  });

  it('mode enfant : cellules dont la ligne OU la colonne est choisie (règle V1)', () => {
    const gen = tables.createGenerator({ selectedTables: [3] }, 'enfant', seededRng(2));
    // ligne 3 (10 cellules) + colonne 3 (10 cellules) − intersection 3×3 = 19
    expect(gen.progress().total).toBe(19);
    for (let i = 0; i < 100; i++) {
      const q = gen.next();
      const { row, col } = q.meta;
      expect(row === 3 || col === 3).toBe(true);
      expect(q.answer).toBe(row * col);
      expect(q.operator).toBe('×');
      expect(q.timeAllowedSec).toBe(tableTime(row, col, 'enfant'));
    }
  });

  it('markSolved → poolExhausted → resetPool conserve cumulative', () => {
    const gen = tables.createGenerator({ selectedTables: [2] }, 'enfant', seededRng(3));
    const total = gen.progress().total;
    while (!gen.poolExhausted()) {
      gen.markSolved(gen.next().id);
    }
    expect(gen.progress()).toEqual({ solved: total, total, cumulative: total });
    gen.resetPool();
    expect(gen.progress()).toEqual({ solved: 0, total, cumulative: total });
    // le pool redevient tirable
    expect(gen.next()).toBeTruthy();
  });

  it('markSolved est idempotent par cellule', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(4));
    const q = gen.next();
    gen.markSolved(q.id);
    gen.markSolved(q.id);
    expect(gen.progress().cumulative).toBe(1);
  });

  it('ne repropose pas immédiatement la même cellule', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(5));
    let previous = gen.next().id;
    for (let i = 0; i < 200; i++) {
      const id = gen.next().id;
      expect(id).not.toBe(previous);
      previous = id;
    }
  });

  it('boardState retourne les tables actives', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(6));
    expect(gen.boardState().selectedNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('coverageFactor (décote anti-abus des sélections de tables faciles)', () => {
  it('grille complète (adulte) : aucune décote, difficulty = tableDifficulty brute', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(7));
    for (let i = 0; i < 50; i++) {
      const q = gen.next();
      expect(q.difficulty).toBeCloseTo(tableDifficulty(q.meta.row, q.meta.col), 9);
    }
  });

  it('grille complète (enfant, les 10 tables cochées) : aucune décote', () => {
    const gen = tables.createGenerator(
      { selectedTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      'enfant',
      seededRng(8)
    );
    for (let i = 0; i < 50; i++) {
      const q = gen.next();
      expect(q.difficulty).toBeCloseTo(tableDifficulty(q.meta.row, q.meta.col), 9);
    }
  });

  it('sélection étroite {1,2,10} (enfant) : décote significative mais pas au plancher', () => {
    // Pool = lignes/colonnes {1,2,10} — moyenne brute 32.6/51, cf. calcul en plan.
    const expectedFactor = 32.6 / 51 / FULL_GRID_AVG_DIFFICULTY;
    expect(expectedFactor).toBeLessThan(1);
    expect(expectedFactor).toBeGreaterThan(MIN_COVERAGE_FACTOR);

    const gen = tables.createGenerator({ selectedTables: [1, 2, 10] }, 'enfant', seededRng(9));
    for (let i = 0; i < 50; i++) {
      const q = gen.next();
      const raw = tableDifficulty(q.meta.row, q.meta.col);
      expect(q.difficulty).toBeCloseTo(raw * expectedFactor, 6);
    }
  });

  it('sélection à une seule table facile ({10}) : décote maximale atteignable, au-dessus du plancher', () => {
    // Pool = ligne/colonne 10 uniquement — moyenne brute 0.5 (le minimum de la grille).
    const expectedFactor = 0.5 / FULL_GRID_AVG_DIFFICULTY;
    expect(expectedFactor).toBeGreaterThan(MIN_COVERAGE_FACTOR);

    const gen = tables.createGenerator({ selectedTables: [10] }, 'enfant', seededRng(10));
    for (let i = 0; i < 30; i++) {
      const q = gen.next();
      const raw = tableDifficulty(q.meta.row, q.meta.col);
      expect(q.difficulty).toBeCloseTo(raw * expectedFactor, 6);
    }
  });

  it('sélection qui évite les tables 1 et 10 (les plus faciles) : aucune décote (pool déjà plus dur que la moyenne)', () => {
    const gen = tables.createGenerator(
      { selectedTables: [2, 3, 4, 5, 6, 7, 8, 9] },
      'enfant',
      seededRng(11)
    );
    for (let i = 0; i < 50; i++) {
      const q = gen.next();
      // Moyenne du pool (96 cellules) ≈ 1.21 > moyenne pleine grille (1.184) →
      // ratio brut > 1, donc coverageFactor plafonné à 1 (Math.min(1, …)).
      expect(q.difficulty).toBeCloseTo(tableDifficulty(q.meta.row, q.meta.col), 9);
    }
  });
});
