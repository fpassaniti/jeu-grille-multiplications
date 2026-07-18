import { describe, it, expect } from 'vitest';
import { seededRng } from '../../test/seeded-rng.js';
import tables, { DIFFICULTY_MATRIX, tableDifficulty, tableTime } from './tables.js';

describe('matrice de difficulté (iso-V1)', () => {
  it('valeurs de référence', () => {
    expect(tableDifficulty(7, 7)).toBe(3.0); // pic
    expect(tableDifficulty(1, 1)).toBe(0.5);
    expect(tableDifficulty(10, 5)).toBe(0.5);
    expect(tableDifficulty(2, 8)).toBe(1.2);
    expect(DIFFICULTY_MATRIX).toHaveLength(10);
    DIFFICULTY_MATRIX.forEach((row) => {
      expect(row).toHaveLength(10);
      row.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(0.5);
        expect(d).toBeLessThanOrEqual(3.0);
      });
    });
  });

  it('hors limites → 1.0', () => {
    expect(tableDifficulty(0, 5)).toBe(1.0);
    expect(tableDifficulty(11, 5)).toBe(1.0);
  });
});

describe('tableTime (iso-V1 : 5–15 s, ×3 enfant)', () => {
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

  it('boardState retourne des références fraîches et l’état résolu', () => {
    const gen = tables.createGenerator({ selectedTables: [] }, 'adulte', seededRng(6));
    const before = gen.boardState();
    expect(before.grid[2][4]).toBe(15); // (2+1)×(4+1)
    expect(before.solvedCells.flat().every((s) => s === false)).toBe(true);
    const q = gen.next();
    gen.markSolved(q.id);
    const after = gen.boardState();
    expect(after).not.toBe(before);
    expect(after.solvedCells).not.toBe(before.solvedCells);
    expect(after.solvedCells[q.meta.row - 1][q.meta.col - 1]).toBe(true);
  });
});
