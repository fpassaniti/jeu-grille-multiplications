import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from './engine.svelte.js';

const TABLES_CONFIG = {
  modeId: 'tables',
  options: { selectedTables: [] },
  level: 'adulte',
  durationMin: 3
};

let engine;

beforeEach(() => {
  vi.useFakeTimers();
  engine = new GameEngine();
});

afterEach(() => {
  engine.destroy();
  vi.useRealTimers();
});

describe('GameEngine — cycle de vie', () => {
  it('démarre en playing avec une question et les timers', () => {
    engine.start(TABLES_CONFIG);
    expect(engine.state).toBe('playing');
    expect(engine.gameTimer).toBe(180);
    expect(engine.question).not.toBeNull();
    expect(engine.questionTimer).toBe(engine.question.timeAllowedSec);
    expect(engine.board).not.toBeNull();
    expect(engine.progress.total).toBe(100);
  });

  it('le timer global décompte et termine la partie', () => {
    engine.start(TABLES_CONFIG);
    vi.advanceTimersByTime(3 * 60 * 1000);
    expect(engine.gameTimer).toBe(0);
    expect(engine.state).toBe('finished');
  });

  it('destroy annule tous les timers', () => {
    engine.start(TABLES_CONFIG);
    engine.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('end en cours de partie → finished, timers stoppés', () => {
    engine.start(TABLES_CONFIG);
    engine.end();
    expect(engine.state).toBe('finished');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('restart : start est idempotent (pas de timers orphelins)', () => {
    engine.start(TABLES_CONFIG);
    vi.advanceTimersByTime(5000);
    engine.start(TABLES_CONFIG);
    expect(engine.state).toBe('playing');
    expect(engine.gameTimer).toBe(180);
    expect(engine.score).toBe(0);
    // 1 interval global + 1 interval question uniquement
    expect(vi.getTimerCount()).toBe(2);
  });
});

describe('GameEngine — validation des réponses (fix bug #6)', () => {
  it('un préfixe correct ne déclenche PAS de vérification', () => {
    engine.start(TABLES_CONFIG);
    const answer = String(engine.question.answer);
    if (answer.length < 2) {
      // forcer une question à réponse multi-chiffres : rejouer jusqu'à en avoir une
      while (String(engine.question.answer).length < 2) {
        engine.onAnswerInput(String(engine.question.answer));
        vi.advanceTimersByTime(600);
      }
    }
    engine.onAnswerInput(String(engine.question.answer)[0]);
    expect(engine.feedback).toBeNull(); // ni correct ni incorrect
  });

  it('réponse complète correcte → points, feedback, question suivante après 500 ms', () => {
    engine.start(TABLES_CONFIG);
    const first = engine.question;
    engine.onAnswerInput(String(first.answer));
    expect(engine.feedback).toBe('correct');
    expect(engine.score).toBeGreaterThan(0);
    expect(engine.progress.cumulative).toBe(1);
    expect(engine.solvedHistory[0].answer).toBe(first.answer);
    expect(engine.errorsCount).toBe(0);
    vi.advanceTimersByTime(500);
    expect(engine.question.id).not.toBe(first.id);
    expect(engine.feedback).toBeNull();
  });

  it('réponse pleine longueur fausse → incorrect, 1 erreur max par question', () => {
    engine.start(TABLES_CONFIG);
    const answer = engine.question.answer;
    const wrong = String(answer === 11 ? 12 : answer + 1).padStart(String(answer).length, '9');
    engine.onAnswerInput(wrong.slice(0, String(answer).length));
    expect(engine.feedback).toBe('incorrect');
    expect(engine.errorsCount).toBe(1);
    // le flash s'efface et la saisie est réinitialisée
    vi.advanceTimersByTime(600);
    expect(engine.feedback).toBeNull();
    expect(engine.userAnswer).toBe('');
    // deuxième erreur sur la même question : pas de double comptage
    engine.onAnswerInput(wrong.slice(0, String(answer).length));
    expect(engine.errorsCount).toBe(1);
  });

  it('submitAnswer force la vérification (Enter / OK)', () => {
    engine.start(TABLES_CONFIG);
    const answer = String(engine.question.answer);
    if (answer.length >= 2) {
      engine.onAnswerInput(answer[0]);
      expect(engine.feedback).toBeNull();
      engine.submitAnswer();
      expect(engine.feedback).toBe('incorrect');
    } else {
      engine.submitAnswer(); // saisie vide : no-op
      expect(engine.feedback).toBeNull();
    }
  });

  it('filtre les caractères non numériques', () => {
    engine.start(TABLES_CONFIG);
    engine.onAnswerInput('a-b');
    expect(engine.userAnswer).toBe('');
    expect(engine.feedback).toBeNull();
  });

  it('timeout → marqué erreur, question suivante après 1 s', () => {
    engine.start(TABLES_CONFIG);
    const first = engine.question;
    vi.advanceTimersByTime(first.timeAllowedSec * 1000);
    expect(engine.feedback).toBe('timeout');
    expect(engine.errorsCount).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(engine.question.id).not.toBe(first.id);
    expect(engine.feedback).toBeNull();
  });

  it('la saisie est ignorée pendant le feedback correct et après la fin', () => {
    engine.start(TABLES_CONFIG);
    engine.onAnswerInput(String(engine.question.answer));
    expect(engine.feedback).toBe('correct');
    engine.onAnswerInput('9');
    expect(engine.userAnswer).toBe(String(engine.question.answer));
    engine.end();
    engine.onAnswerInput('1');
    expect(engine.feedback).toBe('correct');
  });
});

describe('GameEngine — pool et résultats', () => {
  it('épuisement du pool → reset + notification 1,5 s (score conservé)', () => {
    engine.start({ ...TABLES_CONFIG, level: 'enfant', options: { selectedTables: [1] } });
    // pool = ligne 1 ∪ colonne 1 = 19 cellules
    expect(engine.progress.total).toBe(19);
    for (let i = 0; i < 19; i++) {
      engine.onAnswerInput(String(engine.question.answer));
      expect(engine.feedback).toBe('correct');
      vi.advanceTimersByTime(500);
    }
    // la 20e question a déclenché le reset du pool
    expect(engine.poolResetNotice).toBe(true);
    expect(engine.progress).toEqual({ solved: 0, total: 19, cumulative: 19 });
    expect(engine.score).toBeGreaterThan(0);
    expect(engine.question).not.toBeNull();
    vi.advanceTimersByTime(1500);
    expect(engine.poolResetNotice).toBe(false);
  });

  it('results expose le résumé de partie', () => {
    engine.start({ ...TABLES_CONFIG, durationMin: 2 });
    engine.onAnswerInput(String(engine.question.answer));
    vi.advanceTimersByTime(500);
    engine.end();
    const results = engine.results;
    expect(results.modeId).toBe('tables');
    expect(results.level).toBe('adulte');
    expect(results.durationMin).toBe(2);
    expect(results.questionsSolved).toBe(1);
    expect(results.questionsTotal).toBe(100);
    expect(results.errorsCount).toBe(0);
    expect(results.score).toBe(engine.score);
  });

  it('results.elapsedSec reflète le temps réellement joué (fin anticipée incluse)', () => {
    engine.start({ ...TABLES_CONFIG, durationMin: 3 });
    vi.advanceTimersByTime(20_000); // 20 s jouées sur 180 s nominales
    engine.end();
    expect(engine.results.elapsedSec).toBe(20);
  });

  it('elapsedSec = durée nominale si la partie va à son terme', () => {
    engine.start({ ...TABLES_CONFIG, durationMin: 2 });
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(engine.results.elapsedSec).toBe(120);
  });

  it('fonctionne aussi avec un mode générique (addition)', () => {
    engine.start({ modeId: 'addition', options: { tiers: ['A1'] }, level: 'adulte', durationMin: 3 });
    expect(engine.board).toBeNull();
    expect(engine.progress.total).toBeNull();
    const q = engine.question;
    expect(q.operator).toBe('+');
    engine.onAnswerInput(String(q.answer));
    expect(engine.feedback).toBe('correct');
    expect(engine.progress.cumulative).toBe(1);
  });
});
