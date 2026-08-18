/**
 * Mode « tables de multiplication » : grille 10×10, matrice de difficulté
 * et règles de temps migrées de la V1 (game-logic.js + /play).
 *
 * Score volontairement identique à la formule V1 historique (difficulté
 * brute × temps restant, cf. `computeLegacyWholeScore` dans
 * `../game/scoring.js`) — pas le modèle « rappel » rescalé de
 * `../game/balance-config.js` (utilisé par division) : le classement des
 * tables (`/api/leaderboard`) contient des scores historiques enregistrés
 * sous cette ancienne formule, il faut rester comparable. `tableDifficulty()`
 * elle-même reste donc la valeur brute de `DIFFICULTY_MATRIX`, sans rescale.
 *
 * Exception délibérée et scopée (anti-abus, 2026-08-16) : une décote de
 * *session* (`coverageFactor`, voir `createGenerator`) est appliquée
 * par-dessus cette formule quand `selectedTables` (mode enfant) restreint le
 * pool à des cellules nettement plus faciles que la grille complète —
 * analyse des `game_sessions` en base ayant montré un farming réel des
 * tables 1/2/10 (jusqu'à 2,5× plus de bonnes réponses/minute pour un score
 * comparable, voire supérieur, à une session normale). Elle ne change pas
 * `tableDifficulty()` ni les scores déjà enregistrés — seules les nouvelles
 * parties avec un pool restreint sont concernées.
 */
import { pick, createAntiRepeat } from './generator-utils.js';

// Difficulté cognitive relative brute des multiplications (0.5–3.0, pic 7×7)
export const DIFFICULTY_MATRIX = [
  // 1    2    3    4    5    6    7    8    9   10
  [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // Table de 1
  [0.5, 0.8, 0.8, 0.9, 0.9, 1.0, 1.1, 1.2, 1.0, 0.5], // Table de 2
  [0.5, 0.8, 1.0, 1.2, 1.2, 1.3, 1.4, 1.5, 1.3, 0.5], // Table de 3
  [0.5, 0.9, 1.2, 1.4, 1.4, 1.5, 1.6, 1.7, 1.5, 0.5], // Table de 4
  [0.5, 0.9, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.6, 0.5], // Table de 5
  [0.5, 1.0, 1.3, 1.5, 1.6, 2.0, 2.4, 2.5, 2.0, 0.5], // Table de 6
  [0.5, 1.1, 1.4, 1.6, 1.7, 2.4, 3.0, 2.7, 2.2, 0.5], // Table de 7
  [0.5, 1.2, 1.5, 1.7, 1.8, 2.5, 2.7, 2.6, 2.1, 0.5], // Table de 8
  [0.5, 1.0, 1.3, 1.5, 1.6, 2.0, 2.2, 2.1, 1.9, 0.5], // Table de 9
  [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]  // Table de 10
];

/**
 * Difficulté d'une cellule (indices 1-based) — formule V1 exacte, valeur
 * brute de `DIFFICULTY_MATRIX`, aucun rescale.
 * @param {number} row
 * @param {number} col
 * @returns {number}
 */
export function tableDifficulty(row, col) {
  if (row < 1 || row > 10 || col < 1 || col > 10) {
    return 1.0;
  }
  return DIFFICULTY_MATRIX[row - 1][col - 1];
}

/**
 * Temps alloué pour une cellule — formule V1 exacte (5–15 s adulte, ×3
 * enfant), aucun rescale.
 * @param {number} row
 * @param {number} col
 * @param {'adulte'|'enfant'} level
 * @returns {number}
 */
export function tableTime(row, col, level) {
  const base = Math.floor(5 + ((row + col) / 20) * 10);
  return level === 'enfant' ? base * 3 : base;
}

const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Plancher du multiplicateur de décote (`coverageFactor`, `createGenerator`) :
 * même une sélection réduite à une seule table facile garde au moins 40 %
 * du score normal, pour ne pas écraser à zéro la pratique d'un enfant qui
 * débute vraiment sur une table donnée.
 */
export const MIN_COVERAGE_FACTOR = 0.4;

/**
 * Moyenne brute de `DIFFICULTY_MATRIX` sur ses 100 cellules — calculée
 * dynamiquement (pas une constante recopiée à la main) pour rester
 * synchronisée si la grille est un jour retouchée. Sert de référence
 * « grille complète » au `coverageFactor` de `createGenerator`.
 * @returns {number}
 */
function fullGridAverageDifficulty() {
  const total = DIFFICULTY_MATRIX.reduce(
    (sum, row) => sum + row.reduce((rowSum, value) => rowSum + value, 0),
    0
  );
  return total / (DIFFICULTY_MATRIX.length * DIFFICULTY_MATRIX[0].length);
}

/** @type {import('./types.js').GameMode} */
export default {
  id: 'tables',
  enabled: true,
  labelKey: 'modes.tables',
  icon: '🔢',
  boardType: 'grid',
  tiers: [],
  defaultOptions: { selectedTables: [...ALL_TABLES] },

  validateOptions(options) {
    if (!options || typeof options !== 'object') {
      return { ok: false, error: 'Options invalides' };
    }
    const raw = options.selectedTables;
    if (raw === undefined || (Array.isArray(raw) && raw.length === 0)) {
      // [] toléré (≡ toutes les tables, cas du mode adulte)
      return { ok: true, value: { selectedTables: [] } };
    }
    if (!Array.isArray(raw)) {
      return { ok: false, error: 'selectedTables doit être un tableau' };
    }
    const selectedTables = [...new Set(raw.map((n) => parseInt(n, 10)))]
      .filter((n) => ALL_TABLES.includes(n))
      .sort((a, b) => a - b);
    if (selectedTables.length === 0) {
      return { ok: false, error: 'Aucune table valide sélectionnée' };
    }
    return { ok: true, value: { selectedTables } };
  },

  createGenerator(options, level, rng = Math.random) {
    const selectedNumbers =
      level === 'enfant' && options.selectedTables?.length > 0
        ? [...options.selectedTables]
        : [...ALL_TABLES];

    // Pool : mode enfant = cellules dont la ligne OU la colonne est une table choisie (règle V1)
    const pool = [];
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 10; col++) {
        if (level !== 'enfant' || selectedNumbers.includes(row) || selectedNumbers.includes(col)) {
          pool.push(`${row},${col}`);
        }
      }
    }

    // Décote anti-abus (cf. commentaire d'en-tête) : un pool nettement plus
    // facile que la grille complète (ex. sélection {1,2,10}) rapporte moins
    // par cellule. `selectedNumbers` couvre déjà les 10 tables hors mode
    // enfant restreint, donc `coverageFactor` vaut naturellement 1 sinon.
    const poolAvgDifficulty =
      pool.reduce((sum, key) => {
        const [row, col] = key.split(',').map(Number);
        return sum + tableDifficulty(row, col);
      }, 0) / pool.length;
    const coverageFactor = Math.min(
      1,
      Math.max(MIN_COVERAGE_FACTOR, poolAvgDifficulty / fullGridAverageDifficulty())
    );

    const solved = new Set();
    const antiRepeat = createAntiRepeat(1);
    let cumulative = 0;

    return {
      next() {
        let available = pool.filter((key) => !solved.has(key));
        if (available.length > 1) {
          const filtered = available.filter((key) => antiRepeat.accepts(`tables:${key}`));
          if (filtered.length > 0) {
            available = filtered;
          }
        }
        const key = pick(available, rng);
        const [row, col] = key.split(',').map(Number);
        antiRepeat.push(`tables:${key}`);
        return {
          id: `tables:${key}`,
          operands: [row, col],
          operator: '×',
          answer: row * col,
          difficulty: tableDifficulty(row, col) * coverageFactor,
          timeAllowedSec: tableTime(row, col, level),
          legacyWhole: true,
          meta: { row, col }
        };
      },
      markSolved(id) {
        const key = id.replace('tables:', '');
        if (!solved.has(key)) {
          solved.add(key);
          cumulative += 1;
        }
      },
      progress() {
        return { solved: solved.size, total: pool.length, cumulative };
      },
      poolExhausted() {
        return solved.size >= pool.length;
      },
      resetPool() {
        solved.clear();
      },
      boardState() {
        return { selectedNumbers: [...selectedNumbers] };
      }
    };
  }
};
