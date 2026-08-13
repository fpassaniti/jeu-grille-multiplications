/**
 * Utilitaires de génération de questions : nombres aléatoires, contrôle
 * exact de la retenue/l'emprunt (génération chiffre par chiffre),
 * anti-répétition et fabrique de générateurs génériques.
 * JS pur, rng injectable pour des tests déterministes.
 */
import { POSED_SCORE_CALIBRATION, OPERATOR_SCORE_MULTIPLIER } from '../game/balance-config.js';

/**
 * Entier aléatoire inclusif dans [min, max].
 * @param {number} min
 * @param {number} max
 * @param {() => number} [rng]
 * @returns {number}
 */
export function randInt(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Élément aléatoire d'un tableau.
 * @template T
 * @param {T[]} arr
 * @param {() => number} [rng]
 * @returns {T}
 */
export function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Recompose un nombre depuis ses chiffres (unités en premier).
 * @param {number[]} digits - LSB-first
 * @returns {number}
 */
export function digitsToNumber(digits) {
  return digits.reduce((acc, d, i) => acc + d * 10 ** i, 0);
}

/**
 * Décompose un nombre en chiffres (unités en premier), complété à `width`.
 * @param {number} n
 * @param {number} width
 * @returns {number[]}
 */
export function numberToDigits(n, width) {
  const digits = [];
  let rest = n;
  for (let i = 0; i < width; i++) {
    digits.push(rest % 10);
    rest = Math.floor(rest / 10);
  }
  return digits;
}

/**
 * Vrai si l'addition des opérandes comporte au moins une retenue.
 * @param {number[]} operands
 * @returns {boolean}
 */
export function hasCarry(operands) {
  const width = Math.max(...operands.map((n) => String(n).length));
  const columns = operands.map((n) => numberToDigits(n, width));
  let carry = 0;
  for (let i = 0; i < width; i++) {
    const sum = columns.reduce((acc, digits) => acc + digits[i], carry);
    if (sum > 9) {
      return true;
    }
    carry = 0;
  }
  return false;
}

/**
 * Vrai si la soustraction a − b comporte au moins un emprunt.
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
export function hasBorrow(a, b) {
  const width = String(a).length;
  const da = numberToDigits(a, width);
  const db = numberToDigits(b, width);
  // Sans emprunt à la colonne i, aucun emprunt n'entre en colonne i+1 :
  // le premier chiffre de a inférieur au chiffre de b signe l'emprunt.
  for (let i = 0; i < width; i++) {
    if (da[i] < db[i]) {
      return true;
    }
  }
  return false;
}

/**
 * Addition sans retenue : chaque colonne somme à ≤ 9 par construction.
 * @param {{numCols: number, maxTotal: number, operandCount?: number}} opts
 * @param {() => number} [rng]
 * @returns {{operands: number[], answer: number, carry: false}}
 */
export function genAdditionNoCarry({ numCols, maxTotal, operandCount = 2 }, rng = Math.random) {
  // Sans retenue, les chiffres du total = sommes de colonnes : borner chaque
  // colonne par le chiffre correspondant de maxTotal−1 garantit total ≤ maxTotal−1.
  const columnCaps = numberToDigits(maxTotal - 1, numCols).map((d) => Math.min(9, d));
  for (let attempt = 0; attempt < 30; attempt++) {
    // Longueur de chaque opérande : au moins un occupe toutes les colonnes
    const lengths = Array.from({ length: operandCount }, () => randInt(1, numCols, rng));
    lengths[randInt(0, operandCount - 1, rng)] = numCols;

    const columns = Array.from({ length: operandCount }, () => new Array(numCols).fill(0));
    for (let col = 0; col < numCols; col++) {
      let budget = columnCaps[col];
      for (let k = 0; k < operandCount; k++) {
        if (col >= lengths[k]) continue;
        const isLead = col === lengths[k] - 1;
        const min = isLead ? 1 : 0;
        if (budget < min) {
          budget = min; // force un chiffre de tête valide, re-vérifié par l'oracle
        }
        const d = randInt(min, budget, rng);
        columns[k][col] = d;
        budget -= d;
      }
    }

    const operands = columns.map(digitsToNumber);
    const answer = operands.reduce((a, b) => a + b, 0);
    if (answer <= maxTotal && operands.every((n) => n >= 1) && !hasCarry(operands)) {
      return { operands, answer, carry: false };
    }
  }
  // Fallback déterministe sans retenue, mis à l'échelle du palier
  const base = 10 ** (numCols - 1);
  const operands = [Math.min(base + 2, Math.floor(maxTotal / 2)), Math.min(base + 1, Math.floor(maxTotal / 2))];
  while (operands.length < operandCount) operands.push(1);
  return { operands, answer: operands.reduce((a, b) => a + b, 0), carry: false };
}

/**
 * Addition avec retenue : une colonne (hors MSB) est forcée à sommer > 9.
 * @param {{numCols: number, maxTotal: number, operandCount?: number}} opts
 * @param {() => number} [rng]
 * @returns {{operands: number[], answer: number, carry: true}}
 */
export function genAdditionWithCarry({ numCols, maxTotal, operandCount = 2 }, rng = Math.random) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const forcedCol = randInt(0, numCols - 2, rng);
    const columns = Array.from({ length: operandCount }, () => new Array(numCols).fill(0));
    for (let col = 0; col < numCols; col++) {
      if (col === forcedCol) {
        const d1 = randInt(1, 9, rng);
        columns[0][col] = d1;
        columns[1][col] = randInt(10 - d1, 9, rng); // somme de colonne ≥ 10 garantie
        for (let k = 2; k < operandCount; k++) columns[k][col] = randInt(0, 9, rng);
      } else {
        for (let k = 0; k < operandCount; k++) {
          const isLead = col === numCols - 1;
          columns[k][col] = randInt(isLead ? 1 : 0, isLead ? 8 : 9, rng);
        }
      }
    }
    const operands = columns.map(digitsToNumber);
    const answer = operands.reduce((a, b) => a + b, 0);
    if (answer <= maxTotal && operands.every((n) => n >= 1) && hasCarry(operands)) {
      return { operands, answer, carry: true };
    }
  }
  // Fallback déterministe avec retenue (38+45 mis à l'échelle)
  const scale = 10 ** Math.max(0, numCols - 2);
  const operands = [38 * scale, 45 * scale];
  while (operands.length < operandCount) operands.push(1);
  return { operands, answer: operands.reduce((a, b) => a + b, 0), carry: true };
}

/**
 * Soustraction sans emprunt : chaque chiffre de a ≥ chiffre de b.
 * @param {{numCols: number, maxA: number}} opts
 * @param {() => number} [rng]
 * @returns {{operands: number[], answer: number, borrow: false}}
 */
export function genSubtractionNoBorrow({ numCols, maxA }, rng = Math.random) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const db = new Array(numCols).fill(0);
    const da = new Array(numCols).fill(0);
    const bLen = randInt(1, numCols, rng);
    for (let i = 0; i < numCols; i++) {
      if (i < bLen) {
        db[i] = randInt(i === bLen - 1 ? 1 : 0, 9, rng);
      }
      const isLeadA = i === numCols - 1;
      da[i] = randInt(Math.max(db[i], isLeadA ? 1 : 0), 9, rng);
    }
    const a = digitsToNumber(da);
    const b = digitsToNumber(db);
    if (a <= maxA && b >= 1 && a > b && !hasBorrow(a, b)) {
      return { operands: [a, b], answer: a - b, borrow: false };
    }
  }
  const scale = 10 ** Math.max(0, numCols - 2);
  const a = Math.min(58 * scale, maxA); // 58, 580… : aucun emprunt avec b ci-dessous
  const b = Math.min(12 * scale, Math.floor(a / 2));
  return { operands: [a, b], answer: a - b, borrow: false };
}

/**
 * Soustraction avec emprunt : une colonne force chiffre(b) > chiffre(a).
 * @param {{numCols: number, maxA: number}} opts
 * @param {() => number} [rng]
 * @returns {{operands: number[], answer: number, borrow: true}}
 */
export function genSubtractionWithBorrow({ numCols, maxA }, rng = Math.random) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const a = randInt(10 ** (numCols - 1) + 1, maxA, rng);
    const da = numberToDigits(a, numCols);
    const candidates = [];
    for (let i = 0; i < numCols - 1; i++) {
      if (da[i] <= 8) candidates.push(i);
    }
    if (candidates.length === 0) continue;
    const forcedCol = pick(candidates, rng);
    const db = new Array(numCols).fill(0);
    for (let i = 0; i < numCols; i++) {
      if (i === forcedCol) {
        db[i] = randInt(da[i] + 1, 9, rng);
      } else if (i === numCols - 1) {
        db[i] = da[i] >= 1 ? randInt(0, da[i] - 1, rng) : 0;
      } else {
        db[i] = randInt(0, da[i], rng);
      }
    }
    const b = digitsToNumber(db);
    if (b >= 1 && a > b && hasBorrow(a, b)) {
      return { operands: [a, b], answer: a - b, borrow: true };
    }
  }
  const scale = 10 ** Math.max(0, numCols - 2);
  const a = Math.min(52 * scale, maxA); // 52−17, 520−170… : emprunt garanti
  const b = 17 * scale;
  return { operands: [a, b], answer: a - b, borrow: true };
}

/**
 * Anti-répétition : mémorise les N derniers ids de questions.
 * @param {number} [windowSize]
 */
export function createAntiRepeat(windowSize = 6) {
  /** @type {string[]} */
  const recent = [];
  return {
    accepts(id) {
      return !recent.includes(id);
    },
    push(id) {
      recent.push(id);
      if (recent.length > windowSize) {
        recent.shift();
      }
    }
  };
}

/**
 * Tire une question en évitant les répétitions récentes (jamais bloquant).
 * @param {() => import('./types.js').Question} genFn
 * @param {{accepts: (id: string) => boolean, push: (id: string) => void}} antiRepeat
 * @param {number} [maxTries]
 */
export function generateNonRepeating(genFn, antiRepeat, maxTries = 8) {
  let question = genFn();
  for (let i = 1; i < maxTries && !antiRepeat.accepts(question.id); i++) {
    question = genFn();
  }
  antiRepeat.push(question.id);
  return question;
}

/**
 * Étapes de saisie posée d'une question (une ligne = un nombre à faire deviner).
 * Multiplication à multiplicateur multi-chiffres (meta.partials) : un étage
 * par produit partiel puis la somme finale. Sinon : une seule étape (le résultat).
 * @param {'+'|'−'|'×'|'÷'} operator
 * @param {number} answer
 * @param {Object} meta
 * @returns {{key: string, value: number, digits: number, shift: number}[]}
 */
export function computeStages(operator, answer, meta) {
  if (operator === '×' && Array.isArray(meta?.partials)) {
    const stages = meta.partials.map((p, i) => ({
      key: `partial${i}`,
      value: p.value,
      digits: String(p.value).length,
      shift: p.shift
    }));
    stages.push({ key: 'final', value: answer, digits: String(answer).length, shift: 0 });
    return stages;
  }
  return [{ key: 'final', value: answer, digits: String(answer).length, shift: 0 }];
}

/**
 * Vrai si la question doit être affichée posée en colonnes (et saisie
 * chiffre par chiffre) plutôt qu'en ligne. +/− multi-chiffres, ou ×
 * dès que le palier la marque posée (meta.posed — absent pour ×10/×100/×1000,
 * qui restent une règle mentale, pas une technique posée).
 * @param {'+'|'−'|'×'|'÷'} operator
 * @param {number[]} operands
 * @param {Object} meta
 * @returns {boolean}
 */
export function computePosed(operator, operands, meta) {
  if (operator === '+' || operator === '−') {
    return Math.max(...operands) >= 10;
  }
  if (operator === '×') {
    return meta?.posed === true;
  }
  return false;
}

/** Facteur de temps par niveau, aligné sur le ×3 historique des tables (équité points/minute entre modes). */
export const LEVEL_TIME_FACTOR = { adulte: 1, enfant: 3 };

/**
 * Fabrique le générateur des modes génériques (pool infini, pas de plateau).
 * @param {string} modeId
 * @param {import('./types.js').Tier[]} allTiers
 * @param {'+'|'−'|'×'|'÷'} operator
 * @returns {(options: {tiers: string[]}, level: 'adulte'|'enfant', rng?: () => number) => import('./types.js').QuestionGenerator}
 */
export function makeGenericGenerator(modeId, allTiers, operator) {
  return function createGenerator(options, level, rng = Math.random) {
    const activeTiers = allTiers.filter((t) => options.tiers.includes(t.id));
    const tiers = activeTiers.length > 0 ? activeTiers : allTiers;
    const antiRepeat = createAntiRepeat(6);
    const timeFactor = LEVEL_TIME_FACTOR[level] ?? 1;
    let solved = 0;

    return {
      next() {
        const tier = pick(tiers, rng);
        return generateNonRepeating(() => {
          const { operands, answer, ...meta } = tier.generate(rng);
          const stages = computeStages(operator, answer, meta);
          const totalDigits = stages.reduce((sum, stage) => sum + stage.digits, 0);
          return {
            id: `${modeId}:${operands.join(operator)}`,
            operands,
            operator,
            answer,
            difficulty: tier.difficulty,
            timeAllowedSec: tier.timeSec * timeFactor,
            meta: { tier: tier.id, ...meta },
            posed: computePosed(operator, operands, meta),
            stages,
            digitWeight:
              (tier.difficulty / totalDigits) *
              POSED_SCORE_CALIBRATION *
              (OPERATOR_SCORE_MULTIPLIER[operator] ?? 1)
          };
        }, antiRepeat);
      },
      markSolved() {
        solved += 1;
      },
      progress() {
        return { solved, total: null, cumulative: solved };
      },
      poolExhausted() {
        return false;
      },
      resetPool() {},
      boardState() {
        return null;
      }
    };
  };
}

/**
 * Validateur d'options standard pour les modes à paliers.
 * @param {import('./types.js').Tier[]} allTiers
 * @returns {(options: any) => import('./types.js').ValidationResult}
 */
export function makeTiersValidator(allTiers) {
  const known = allTiers.map((t) => t.id);
  return function validateOptions(options) {
    if (!options || typeof options !== 'object' || !Array.isArray(options.tiers)) {
      return { ok: false, error: 'Options invalides : liste de paliers attendue' };
    }
    const tiers = [...new Set(options.tiers)].filter((id) => known.includes(id));
    if (tiers.length === 0) {
      return { ok: false, error: 'Aucun palier valide sélectionné' };
    }
    tiers.sort((x, y) => known.indexOf(x) - known.indexOf(y));
    return { ok: true, value: { tiers } };
  };
}
