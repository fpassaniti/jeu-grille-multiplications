import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/seeded-rng.js';
import tables, { DIFFICULTY_MATRIX, tableDifficulty, tableTime } from './tables.js';

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
