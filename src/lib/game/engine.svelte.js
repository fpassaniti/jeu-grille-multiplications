/**
 * Moteur de jeu V2 (SPEC §4.3) — classe à runes Svelte 5.
 *
 * Règle de cohabitation Svelte 4/5 : cette instance ne doit être lue QUE par
 * un composant en mode runes (/play/+page.svelte). Les composants legacy
 * reçoivent des scalaires/objets en props — jamais l'engine lui-même.
 * Aucun $effect ici : instanciable et testable hors composant (Vitest node).
 */
import { getMode } from '$lib/modes/index.js';
import { computeScore, computeDigitScore } from './scoring.js';

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
  /** Saisie courante : réponse entière (non posé) ou chiffre unique en cours (posé) */
  userAnswer = $state('');
  /** Index de l'étape en cours dans question.stages (posé multi-lignes : produits partiels puis somme) */
  stageIndex = $state(0);
  /** Nombre de chiffres déjà verrouillés dans l'étape active, comptés depuis la droite (unités) */
  digitIndex = $state(0);
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
  /** Somme des points déjà crédités chiffre par chiffre pour la question posée en cours. */
  #digitPointsAccumulated = 0;

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
    this.stageIndex = 0;
    this.digitIndex = 0;
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
   * Saisie utilisateur. Deux mécaniques selon `question.posed` :
   * - non posé (tables, ×10/×100/×1000, petites additions…) : réponse entière,
   *   fix du bug de préfixe V1 (#6) — l'auto-vérification n'a lieu que quand
   *   la longueur saisie atteint celle de la réponse.
   * - posé (addition/soustraction/multiplication en colonnes) : chaque frappe
   *   est un chiffre isolé, vérifié immédiatement contre la position courante
   *   de l'étape active (unités d'abord, puis vers la gauche — technique
   *   opératoire de l'école).
   * @param {string} raw
   */
  onAnswerInput(raw) {
    if (this.state !== 'playing' || this.feedback === 'correct' || this.feedback === 'timeout') {
      return;
    }
    const cleaned = String(raw).replace(/[^0-9]/g, '');

    if (!this.question.posed) {
      this.userAnswer = cleaned;
      if (this.feedback === 'incorrect' && cleaned !== '') {
        this.feedback = null;
      }
      if (cleaned.length >= String(this.question.answer).length) {
        this.#checkWhole(cleaned);
      }
      return;
    }

    const digitChar = cleaned.slice(-1);
    this.userAnswer = digitChar;
    if (this.feedback === 'incorrect' && digitChar !== '') {
      this.feedback = null;
    }
    if (digitChar !== '') {
      this.#checkDigit(digitChar);
    }
  }

  /** Vérification forcée (Enter / bouton OK) — no-op en mode posé (déjà vérifié à la frappe). */
  submitAnswer() {
    if (this.state !== 'playing' || this.feedback === 'correct' || this.feedback === 'timeout') {
      return;
    }
    if (this.question.posed) {
      return;
    }
    if (this.userAnswer !== '') {
      this.#checkWhole(this.userAnswer);
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

  /** Étapes de saisie de la question courante (posé multi-lignes ou réponse unique). */
  #stages() {
    return (
      this.question.stages ?? [
        {
          key: 'final',
          value: this.question.answer,
          digits: String(this.question.answer).length,
          shift: 0
        }
      ]
    );
  }

  /** Question non posée : comparaison à la réponse entière (mécanique historique V1/V2). */
  #checkWhole(raw) {
    if (parseInt(raw, 10) === this.question.answer) {
      this.#markQuestionSolved();
      return;
    }
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

  /**
   * Question posée : vérifie un seul chiffre à la position `digitIndex`
   * (depuis la droite) de l'étape active. Faux → la case reste active, on
   * retape le même chiffre. Juste → verrouillage définitif (vert) et
   * avancée immédiate vers la case suivante (à gauche), sans délai — le
   * délai `CORRECT_DELAY_MS` ne s'applique qu'entre deux lignes ou en fin
   * de question.
   */
  #checkDigit(digitChar) {
    const stages = this.#stages();
    const stage = stages[this.stageIndex];
    const expected = Math.floor(stage.value / 10 ** this.digitIndex) % 10;

    if (parseInt(digitChar, 10) !== expected) {
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
      return;
    }

    this.userAnswer = '';
    this.digitIndex += 1;
    this.#awardDigitPoints();

    if (this.digitIndex < stage.digits) {
      this.feedback = null;
      return;
    }

    // Ligne complète.
    if (this.stageIndex < stages.length - 1) {
      // Étape intermédiaire (produit partiel) : flash bref puis ligne suivante ;
      // le minuteur de question continue (question toujours en cours) — le
      // score, lui, est déjà crédité chiffre par chiffre (#awardDigitPoints).
      this.feedback = 'correct';
      this.#after(CORRECT_DELAY_MS, () => {
        this.stageIndex += 1;
        this.digitIndex = 0;
        this.userAnswer = '';
        this.feedback = null;
      });
      return;
    }

    // Dernière ligne de la dernière étape : scoring et progression historiques.
    this.#markQuestionSolved();
  }

  /**
   * Un chiffre juste = un calcul élémentaire : crédité immédiatement, autant
   * qu'un calcul de tables (`computeDigitScore`) — le score d'une question
   * posée s'accumule donc chiffre après chiffre plutôt qu'en un seul bloc à
   * la fin, pour qu'une coupure de minuteur en plein milieu du calcul ne
   * fasse perdre que les chiffres pas encore tapés.
   */
  #awardDigitPoints() {
    const points = computeDigitScore(this.questionTimer, this.question.timeAllowedSec);
    this.score += points;
    this.#digitPointsAccumulated += points;
    this.#refreshDerived();
  }

  /** Scoring/historique/avance de question — commun aux deux mécaniques. */
  #markQuestionSolved() {
    // Posé : déjà crédité chiffre par chiffre (#awardDigitPoints) — on réutilise
    // le total accumulé pour l'historique, sans re-créditer le score.
    const points = this.question.posed
      ? this.#digitPointsAccumulated
      : computeScore(this.question, this.questionTimer);
    if (!this.question.posed) {
      this.score += points;
    }
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
    this.stageIndex = 0;
    this.digitIndex = 0;
    this.feedback = null;
    this.#erredThisQuestion = false;
    this.#digitPointsAccumulated = 0;

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
