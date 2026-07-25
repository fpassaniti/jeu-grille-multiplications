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

  it('fonctionne aussi avec un mode générique (addition, non posée)', () => {
    // A2 sur des petits totaux peut ne pas être posée ; on force un cas non
    // posé explicitement en dessous, ce test couvre juste le branchement mode générique.
    engine.start({ modeId: 'addition', options: { tiers: ['A1'] }, level: 'adulte', durationMin: 3 });
    expect(engine.board).toBeNull();
    expect(engine.progress.total).toBeNull();
    const q = engine.question;
    expect(q.operator).toBe('+');
    answerDigitsRightToLeft(engine, q.stages);
    expect(engine.feedback).toBe('correct');
    expect(engine.progress.cumulative).toBe(1);
  });
});

/**
 * Saisit les chiffres d'une question posée dans l'ordre attendu par l'engine :
 * chaque étage (produit partiel puis somme) de droite (unités) vers la gauche.
 * N'avance PAS les timers entre les étages — appelant à charge de le faire
 * (`vi.advanceTimersByTime(CORRECT_DELAY_MS)`) s'il veut poursuivre au-delà.
 */
function answerDigitsRightToLeft(engine, stages) {
  for (const stage of stages) {
    for (let p = 0; p < stage.digits; p++) {
      engine.onAnswerInput(String(Math.floor(stage.value / 10 ** p) % 10));
    }
  }
}

describe('GameEngine — validation posée chiffre par chiffre (multiplication à produits partiels, M6)', () => {
  const M6_CONFIG = {
    modeId: 'multiplication',
    options: { tiers: ['M6'] },
    level: 'adulte',
    durationMin: 3
  };

  it('saisie unités → gauche, avance immédiate entre chiffres, délai entre lignes', () => {
    engine.start(M6_CONFIG);
    const q = engine.question;
    expect(q.posed).toBe(true);
    expect(q.stages).toHaveLength(3);
    expect(engine.stageIndex).toBe(0);
    expect(engine.digitIndex).toBe(0);

    const [p0, p1, sum] = q.stages;

    // Étage 0 (1er produit partiel), chiffre des unités
    engine.onAnswerInput(String(p0.value % 10));
    expect(engine.digitIndex).toBe(1);
    expect(engine.stageIndex).toBe(0); // toujours la même ligne, pas de délai requis

    // Chiffres suivants de l'étage 0 (immédiat, sans avancer le temps)
    for (let p = 1; p < p0.digits; p++) {
      engine.onAnswerInput(String(Math.floor(p0.value / 10 ** p) % 10));
    }
    // Ligne complète : flash correct, puis délai avant la ligne suivante
    expect(engine.feedback).toBe('correct');
    expect(engine.stageIndex).toBe(0);
    vi.advanceTimersByTime(500);
    expect(engine.stageIndex).toBe(1);
    expect(engine.digitIndex).toBe(0);
    expect(engine.feedback).toBeNull();
    expect(engine.question.id).toBe(q.id); // toujours la même question

    // Étage 1 (2e produit partiel)
    for (let p = 0; p < p1.digits; p++) {
      engine.onAnswerInput(String(Math.floor(p1.value / 10 ** p) % 10));
    }
    vi.advanceTimersByTime(500);
    expect(engine.stageIndex).toBe(2);

    // Étage 2 (somme finale) → scoring + question suivante
    for (let p = 0; p < sum.digits; p++) {
      engine.onAnswerInput(String(Math.floor(sum.value / 10 ** p) % 10));
    }
    expect(engine.feedback).toBe('correct');
    expect(engine.score).toBeGreaterThan(0);
    expect(engine.progress.cumulative).toBe(1);
    expect(engine.solvedHistory[0].answer).toBe(q.answer);
    vi.advanceTimersByTime(500);
    expect(engine.question.id).not.toBe(q.id);
    expect(engine.stageIndex).toBe(0);
    expect(engine.digitIndex).toBe(0);
  });

  it('scoring par chiffre : le score augmente déjà avant la fin de la question', () => {
    engine.start(M6_CONFIG);
    const q = engine.question;
    const [p0] = q.stages;
    expect(engine.score).toBe(0);

    engine.onAnswerInput(String(p0.value % 10));
    // Un chiffre juste = un calcul crédité immédiatement, avant la fin de l'étage.
    expect(engine.score).toBeGreaterThan(0);
  });

  it('coupure du minuteur en plein milieu d\'une question posée : le score déjà gagné est conservé', () => {
    engine.start(M6_CONFIG);
    const q = engine.question;
    const [p0, p1] = q.stages;

    // Les deux produits partiels sont tapés en entier, la somme finale non commencée.
    for (let p = 0; p < p0.digits; p++) {
      engine.onAnswerInput(String(Math.floor(p0.value / 10 ** p) % 10));
    }
    vi.advanceTimersByTime(500);
    for (let p = 0; p < p1.digits; p++) {
      engine.onAnswerInput(String(Math.floor(p1.value / 10 ** p) % 10));
    }
    vi.advanceTimersByTime(500);
    expect(engine.stageIndex).toBe(2); // dernière étape (somme) pas encore commencée

    const scoreBeforeInterruption = engine.score;
    expect(scoreBeforeInterruption).toBeGreaterThan(0);

    // Le minuteur de partie coupe la partie avant que la somme finale soit tapée.
    engine.end();
    expect(engine.state).toBe('finished');
    expect(engine.score).toBe(scoreBeforeInterruption); // rien perdu des chiffres déjà validés
    expect(engine.progress.cumulative).toBe(0); // la question elle-même n'est pas comptée résolue
  });

  it('chiffre faux : la case reste active (ne progresse pas), 1 erreur max par question', () => {
    engine.start(M6_CONFIG);
    const q = engine.question;
    const expectedUnits = q.stages[0].value % 10;
    const wrongDigit = (expectedUnits + 1) % 10;

    engine.onAnswerInput(String(wrongDigit));
    expect(engine.feedback).toBe('incorrect');
    expect(engine.errorsCount).toBe(1);
    expect(engine.digitIndex).toBe(0); // pas d'avancée
    vi.advanceTimersByTime(600);
    expect(engine.feedback).toBeNull();
    expect(engine.userAnswer).toBe('');

    // Le bon chiffre ensuite avance normalement, sans double comptage d'erreur
    engine.onAnswerInput(String(expectedUnits));
    expect(engine.digitIndex).toBe(1);
    expect(engine.errorsCount).toBe(1);
  });
});
