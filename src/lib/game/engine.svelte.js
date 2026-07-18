/**
 * Moteur de jeu V2 (SPEC §4.3) — classe à runes Svelte 5.
 *
 * Règle de cohabitation Svelte 4/5 : cette instance ne doit être lue QUE par
 * un composant en mode runes (/play/+page.svelte). Les composants legacy
 * reçoivent des scalaires/objets en props — jamais l'engine lui-même.
 * Aucun $effect ici : instanciable et testable hors composant (Vitest node).
 */
import { getMode } from '$lib/modes/index.js';
import { computeScore } from './scoring.js';

const CORRECT_DELAY_MS = 500;
const INCORRECT_FLASH_MS = 600;
const TIMEOUT_DELAY_MS = 1000;
const POOL_RESET_NOTICE_MS = 1500;

export class GameEngine {
  // ---- état réactif ----
  /** @type {'notStarted'|'playing'|'finished'} */
  state = $state('notStarted');
  score = $state(0);
  /** Secondes restantes de la partie */
  gameTimer = $state(0);
  /** Secondes restantes pour la question courante */
  questionTimer = $state(0);
  timeAllowed = $state(0);
  /** @type {import('$lib/modes/types.js').Question|null} */
  question = $state(null);
  userAnswer = $state('');
  /** @type {null|'correct'|'incorrect'|'timeout'} */
  feedback = $state(null);
  /** [{operands, operator, answer, points}] — le plus récent en tête, max 10 */
  solvedHistory = $state([]);
  progress = $state({ solved: 0, total: null, cumulative: 0 });
  errorsCount = $state(0);
  /** @type {import('$lib/modes/types.js').BoardState|null} */
  board = $state(null);
  poolResetNotice = $state(false);

  // ---- privé, non réactif ----
  #generator = null;
  #config = null;
  #gameInterval = null;
  #questionInterval = null;
  #timeouts = new Set();
  #erredThisQuestion = false;

  /**
   * @param {{modeId: string, options: Object, level: 'adulte'|'enfant', durationMin: number}} config
   */
  start({ modeId, options, level, durationMin }) {
    this.#clearTimers();
    const mode = getMode(modeId);
    this.#config = { modeId: mode.id, options, level, durationMin };
    this.#generator = mode.createGenerator(options, level);

    this.score = 0;
    this.errorsCount = 0;
    this.solvedHistory = [];
    this.userAnswer = '';
    this.feedback = null;
    this.poolResetNotice = false;
    this.gameTimer = durationMin * 60;
    this.#refreshDerived();
    this.state = 'playing';

    this.#gameInterval = setInterval(() => {
      this.gameTimer -= 1;
      if (this.gameTimer <= 0) {
        this.end();
      }
    }, 1000);

    this.#nextQuestion();
  }

  /**
   * Saisie utilisateur. Fix du bug de préfixe V1 (#6) : l'auto-vérification
   * n'a lieu que quand la longueur saisie atteint celle de la réponse.
   * @param {string} raw
   */
  onAnswerInput(raw) {
    if (this.state !== 'playing' || this.feedback === 'correct' || this.feedback === 'timeout') {
      return;
    }
    const cleaned = String(raw).replace(/[^0-9]/g, '');
    this.userAnswer = cleaned;
    if (this.feedback === 'incorrect' && cleaned !== '') {
      this.feedback = null;
    }
    if (cleaned.length >= String(this.question.answer).length) {
      this.#check(cleaned);
    }
  }

  /** Vérification forcée (Enter / bouton OK). */
  submitAnswer() {
    if (this.state !== 'playing' || this.feedback === 'correct' || this.feedback === 'timeout') {
      return;
    }
    if (this.userAnswer !== '') {
      this.#check(this.userAnswer);
    }
  }

  end() {
    this.#clearTimers();
    if (this.state === 'playing') {
      this.state = 'finished';
    }
  }

  /** À appeler dans onDestroy : stoppe tous les timers sans changer l'état. */
  destroy() {
    this.#clearTimers();
  }

  /** Résumé de partie consommé par EndScreen et la sauvegarde de score. */
  get results() {
    const durationMin = this.#config?.durationMin ?? 3;
    // Temps réellement joué (déduit du décompte, immunisé contre la dérive
    // d'horloge) : couvre la fin anticipée ("Finir la partie") pour un
    // anti-replay serveur basé sur la durée réelle plutôt que nominale.
    const elapsedSec = Math.max(1, durationMin * 60 - Math.max(0, this.gameTimer));
    return {
      modeId: this.#config?.modeId ?? 'tables',
      options: this.#config?.options ?? {},
      level: this.#config?.level ?? 'adulte',
      durationMin,
      elapsedSec,
      score: this.score,
      questionsSolved: this.progress.cumulative,
      questionsTotal: this.progress.total,
      errorsCount: this.errorsCount
    };
  }

  #check(raw) {
    if (parseInt(raw, 10) === this.question.answer) {
      const points = computeScore(this.question, this.questionTimer);
      this.score += points;
      this.#generator.markSolved(this.question.id);
      this.solvedHistory = [
        {
          operands: [...this.question.operands],
          operator: this.question.operator,
          answer: this.question.answer,
          points
        },
        ...this.solvedHistory
      ].slice(0, 10);
      this.#refreshDerived();
      this.feedback = 'correct';
      this.#stopQuestionTimer();
      this.#after(CORRECT_DELAY_MS, () => this.#nextQuestion());
    } else {
      this.feedback = 'incorrect';
      if (!this.#erredThisQuestion) {
        this.errorsCount += 1;
        this.#erredThisQuestion = true;
      }
      this.#after(INCORRECT_FLASH_MS, () => {
        if (this.feedback === 'incorrect') {
          this.feedback = null;
          this.userAnswer = '';
        }
      });
    }
  }

  #nextQuestion() {
    if (this.state !== 'playing') {
      return;
    }
    if (this.#generator.poolExhausted()) {
      this.#generator.resetPool();
      this.#refreshDerived();
      this.poolResetNotice = true;
      this.#after(POOL_RESET_NOTICE_MS, () => {
        this.poolResetNotice = false;
      });
    }
    this.question = this.#generator.next();
    this.timeAllowed = this.question.timeAllowedSec;
    this.questionTimer = this.timeAllowed;
    this.userAnswer = '';
    this.feedback = null;
    this.#erredThisQuestion = false;

    this.#stopQuestionTimer();
    this.#questionInterval = setInterval(() => {
      this.questionTimer -= 1;
      if (this.questionTimer <= 0) {
        this.#stopQuestionTimer();
        this.feedback = 'timeout';
        if (!this.#erredThisQuestion) {
          this.errorsCount += 1;
          this.#erredThisQuestion = true;
        }
        this.userAnswer = '';
        this.#after(TIMEOUT_DELAY_MS, () => this.#nextQuestion());
      }
    }, 1000);
  }

  #refreshDerived() {
    this.progress = this.#generator.progress();
    this.board = this.#generator.boardState();
  }

  #after(ms, fn) {
    const id = setTimeout(() => {
      this.#timeouts.delete(id);
      fn();
    }, ms);
    this.#timeouts.add(id);
  }

  #stopQuestionTimer() {
    if (this.#questionInterval !== null) {
      clearInterval(this.#questionInterval);
      this.#questionInterval = null;
    }
  }

  #clearTimers() {
    if (this.#gameInterval !== null) {
      clearInterval(this.#gameInterval);
      this.#gameInterval = null;
    }
    this.#stopQuestionTimer();
    for (const id of this.#timeouts) {
      clearTimeout(id);
    }
    this.#timeouts.clear();
  }
}
