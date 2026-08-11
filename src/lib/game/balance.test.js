import { describe, it, expect } from 'vitest';
import { getMode } from '$lib/modes/index.js';
import { tableDifficulty, tableTime } from '$lib/modes/tables.js';
import division from '$lib/modes/division.js';
import multiplication from '$lib/modes/multiplication.js';
import addition from '$lib/modes/addition.js';
import subtraction from '$lib/modes/subtraction.js';
import { OP_DIFFICULTY, RECALL_DIFFICULTY_RANGE } from './balance-config.js';
import { computeScore, computeDigitScore, computeLegacyWholeScore } from './scoring.js';

/**
 * Équilibrage entre modes (SPEC §4.4) : la récompense (et donc l'XP/les
 * pièces, dérivées 1:1 du score) doit être proportionnelle au nombre
 * d'opérations élémentaires requises par le palier — pas au points/minute
 * (objectif abandonné par décision produit : un calcul complexe doit
 * rapporter nettement plus qu'une table, même si moins de questions sont
 * résolues par minute).
 */

const GENERIC_MODE_IDS = ['addition', 'subtraction', 'multiplication'];

describe('équilibrage par opérations élémentaires (abandon du points/minute égal)', () => {
  describe('modes posés : difficulty = OP_DIFFICULTY × operationCount', () => {
    for (const modeId of GENERIC_MODE_IDS) {
      it(modeId, () => {
        const mode = getMode(modeId);
        for (const tier of mode.tiers) {
          expect(tier.operationCount).toBeGreaterThan(0);
          expect(tier.difficulty).toBeCloseTo(OP_DIFFICULTY * tier.operationCount, 5);
        }
      });
    }
  });

  describe('modes « rappel » : division reste resserrée autour de OP_DIFFICULTY ; tables reste en formule V1 brute', () => {
    it('tables : toutes les cellules dans la plage brute historique [0.5, 3.0] (formule V1, pas RECALL_DIFFICULTY_RANGE)', () => {
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const d = tableDifficulty(row, col);
          expect(d).toBeGreaterThanOrEqual(0.5);
          expect(d).toBeLessThanOrEqual(3.0);
        }
      }
    });

    it('division : tous les paliers dans RECALL_DIFFICULTY_RANGE', () => {
      for (const tier of division.tiers) {
        expect(tier.difficulty).toBeGreaterThanOrEqual(RECALL_DIFFICULTY_RANGE[0]);
        expect(tier.difficulty).toBeLessThanOrEqual(RECALL_DIFFICULTY_RANGE[1]);
      }
    });
  });

  it('plancher demandé : M6 (multiplication 3×2 chiffres) ≥ 6× un calcul de table/M1', () => {
    const m6 = multiplication.tiers.find((t) => t.id === 'M6');
    const m1 = multiplication.tiers.find((t) => t.id === 'M1');
    expect(m6.difficulty / m1.difficulty).toBeGreaterThanOrEqual(6);
    expect(m6.difficulty / tableDifficulty(1, 1)).toBeGreaterThanOrEqual(6);
  });

  describe('scoring réel par calcul élémentaire (posé, révision "un calcul = un score")', () => {
    // M3-M6/A*/S* sont toujours posées (opérande ≥ 10 forcé par les générateurs) :
    // leur score réel n'est plus `tier.difficulty` mais la somme des
    // `computeDigitScore` sur tous les chiffres tapés — cf. `scoring.js`.
    it('M6 (pire cas, rng → 1) rapporte, chiffre par chiffre, ≥ 6× un calcul de table (7×7)', () => {
      const gen = multiplication.createGenerator({ tiers: ['M6'] }, 'adulte', () => 0.999999);
      const q = gen.next();
      const totalDigits = q.stages.reduce((sum, stage) => sum + stage.digits, 0);
      const m6Max = totalDigits * computeDigitScore(q.timeAllowedSec, q.timeAllowedSec, q.digitWeight);

      const tableMax = computeLegacyWholeScore(
        tableTime(7, 7, 'adulte'),
        tableDifficulty(7, 7),
        'adulte'
      );

      expect(m6Max / tableMax).toBeGreaterThanOrEqual(6);
    });
  });

  describe('digitWeight (poids par chiffre des questions posées) proportionnel à la difficulté réelle', () => {
    it('un palier avec retenue/emprunt vaut strictement plus par chiffre que sans, à taille égale', () => {
      const rng = () => 0.5;
      const withCarry = addition
        .createGenerator({ tiers: ['A3'] }, 'adulte', rng)
        .next();
      const noCarry = addition
        .createGenerator({ tiers: ['A2'] }, 'adulte', rng)
        .next();
      expect(withCarry.digitWeight).toBeGreaterThan(noCarry.digitWeight);

      const sWithBorrow = subtraction
        .createGenerator({ tiers: ['S3'] }, 'adulte', rng)
        .next();
      const sNoBorrow = subtraction
        .createGenerator({ tiers: ['S2'] }, 'adulte', rng)
        .next();
      expect(sWithBorrow.digitWeight).toBeGreaterThan(sNoBorrow.digitWeight);
    });
  });

  describe('timer : bornes explicites par niveau (SPEC §4.4)', () => {
    it('tables adulte : 15 s suffisent (formule V1 : 5-15 s)', () => {
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          expect(tableTime(row, col, 'adulte')).toBeLessThanOrEqual(15);
        }
      }
    });

    it('multiplication complexe (M6) enfant : au moins 1 minute', () => {
      const m6 = multiplication.tiers.find((t) => t.id === 'M6');
      const gen = multiplication.createGenerator({ tiers: ['M6'] }, 'enfant');
      expect(gen.next().timeAllowedSec).toBeGreaterThanOrEqual(60);
      expect(m6.timeSec * 3).toBeGreaterThanOrEqual(60);
    });
  });
});
