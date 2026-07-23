import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../lib/game/engine.svelte.js';
import { saveScore } from '../../lib/services/gameService.js';

/**
 * Test d'intégration : une partie complète pilotée par l'engine,
 * puis sauvegarde du score — vérifie le payload exact envoyé à /api/scores.
 */

describe('Intégration : partie + sauvegarde du score', () => {
  let engine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new GameEngine();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        xpEarned: 0,
        progressUpdate: null
      })
    });
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Résout la question courante : réponse entière, ou chiffre par chiffre
   * (droite → gauche) si posée, en avançant le minuteur factice entre les
   * lignes d'une multiplication à produits partiels. */
  function answerCurrentQuestion() {
    const q = engine.question;
    if (!q.posed) {
      engine.onAnswerInput(String(q.answer));
      return;
    }
    const stages = q.stages;
    stages.forEach((stage, i) => {
      for (let p = 0; p < stage.digits; p++) {
        engine.onAnswerInput(String(Math.floor(stage.value / 10 ** p) % 10));
      }
      if (i < stages.length - 1) {
        vi.advanceTimersByTime(500); // CORRECT_DELAY_MS entre deux lignes
      }
    });
  }

  async function playAndSave(config, questionsToSolve = 5) {
    engine.start(config);
    for (let i = 0; i < questionsToSolve; i++) {
      answerCurrentQuestion();
      vi.advanceTimersByTime(500);
    }
    engine.end();

    const results = engine.results;
    const payload = {
      name: 'Testeur',
      score: results.score,
      duration: results.durationMin,
      level: results.level,
      gameMode: results.modeId,
      modeOptions: results.options,
      questionsSolved: results.questionsSolved,
      questionsTotal: results.questionsTotal,
      errorsCount: results.errorsCount,
      elapsedSec: results.elapsedSec,
      solvedCells: results.questionsSolved,
      totalPossibleCells: results.questionsTotal,
      selectedTables:
        results.modeId === 'tables' && results.level === 'enfant'
          ? (results.options.selectedTables ?? [])
          : []
    };
    await saveScore(payload);
    return payload;
  }

  it('partie tables enfant : payload complet V1 + V2', async () => {
    const payload = await playAndSave({
      modeId: 'tables',
      options: { selectedTables: [2, 5] },
      level: 'enfant',
      durationMin: 3
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/scores',
      expect.objectContaining({ method: 'POST' })
    );
    const sent = JSON.parse(global.fetch.mock.calls[0][1].body);

    // Nouveau format V2
    expect(sent.gameMode).toBe('tables');
    expect(sent.modeOptions).toEqual({ selectedTables: [2, 5] });
    expect(sent.questionsSolved).toBe(5);
    expect(sent.questionsTotal).toBe(36); // lignes 2∪5 + colonnes 2∪5 = 20+20−4
    expect(sent.errorsCount).toBe(0);
    // Champs V1 (compat serveur non déployé / PWA)
    expect(sent.solvedCells).toBe(5);
    expect(sent.selectedTables).toEqual([2, 5]);
    expect(sent.level).toBe('enfant');
    expect(sent.duration).toBe(3);
    expect(sent.score).toBeGreaterThan(0);
    expect(payload.score).toBe(sent.score);
  });

  it('partie addition : pool infini (questionsTotal null), pas de tables', async () => {
    const payload = await playAndSave(
      { modeId: 'addition', options: { tiers: ['A1'] }, level: 'adulte', durationMin: 2 },
      3
    );
    const sent = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sent.gameMode).toBe('addition');
    expect(sent.modeOptions).toEqual({ tiers: ['A1'] });
    expect(sent.questionsTotal).toBeNull();
    expect(sent.selectedTables).toEqual([]);
    expect(payload.questionsSolved).toBe(3);
  });

  it('les erreurs sont comptées dans le payload', async () => {
    engine.start({
      modeId: 'tables',
      options: { selectedTables: [] },
      level: 'adulte',
      durationMin: 3
    });
    // une erreur : réponse fausse de même longueur que la bonne réponse
    const answer = engine.question.answer;
    const wrong = String(answer).length === String(answer + 1).length ? answer + 1 : answer - 1;
    engine.onAnswerInput(String(wrong));
    expect(engine.feedback).toBe('incorrect');
    vi.advanceTimersByTime(600);
    // puis une bonne réponse
    engine.onAnswerInput(String(engine.question.answer));
    vi.advanceTimersByTime(500);
    engine.end();

    expect(engine.results.errorsCount).toBe(1);
    expect(engine.results.questionsSolved).toBe(1);
  });

  it('saveScore propage les erreurs serveur', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Score invalide' })
    });
    await expect(
      saveScore({ name: 'x', score: 999999, duration: 3, level: 'adulte' })
    ).rejects.toThrow('Score invalide');
  });
});
