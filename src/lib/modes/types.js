/**
 * Typedefs partagés par tous les modes de calcul.
 * JS pur (aucun import Svelte) : utilisable côté client, serveur et tests.
 */

/**
 * Une question posée au joueur.
 * @typedef {Object} Question
 * @property {string} id - Clé d'unicité/anti-répétition (ex: 'tables:3x7', 'addition:38+45')
 * @property {number[]} operands - Opérandes dans l'ordre d'affichage (posé : [haut, ..., bas])
 * @property {'×'|'+'|'−'|'÷'} operator
 * @property {number} answer
 * @property {number} difficulty - Échelle commune 0.5–3.0
 * @property {number} timeAllowedSec - Temps alloué pour répondre
 * @property {Object} meta - Spécifique au mode ({row,col} / {tier,carry} / {tier,borrow} / {tier})
 */

/**
 * État de la grille 10×10 (mode tables uniquement).
 * @typedef {Object} BoardState
 * @property {number[][]} grid - grid[r][c] = (r+1)*(c+1)
 * @property {boolean[][]} solvedCells
 * @property {number[]} selectedNumbers - Tables actives (mode enfant)
 */

/**
 * Générateur de questions, créé par partie (avec état).
 * @typedef {Object} QuestionGenerator
 * @property {() => Question} next
 * @property {(id: string) => void} markSolved
 * @property {() => {solved: number, total: number|null, cumulative: number}} progress
 * @property {() => boolean} poolExhausted
 * @property {() => void} resetPool
 * @property {() => (BoardState|null)} boardState - null pour les modes génériques
 */

/**
 * Palier pédagogique d'un mode générique.
 * @typedef {Object} Tier
 * @property {string} id - 'A1'…'A6', 'S1'…'S5', 'M1'…'M5', 'D1'…'D3'
 * @property {string} labelKey - Clé i18n ('difficulty.tiers.A1')
 * @property {number} difficulty - Échelle commune 0.5–3.0
 * @property {number} timeSec - Temps de base (niveau adulte)
 * @property {(rng: () => number) => {operands: number[], answer: number, meta: Object}} generate
 */

/**
 * Résultat de validation d'options.
 * @typedef {{ok: true, value: Object} | {ok: false, error: string}} ValidationResult
 */

/**
 * Un mode de calcul.
 * @typedef {Object} GameMode
 * @property {string} id
 * @property {boolean} enabled
 * @property {string} labelKey - Clé i18n ('modes.addition')
 * @property {string} icon - Emoji affiché sur la carte du mode
 * @property {'grid'|'generic'} boardType - Le mapping vers les composants vit dans GameScreen.svelte
 * @property {Tier[]} tiers - [] pour tables
 * @property {Object} defaultOptions
 * @property {(options: any) => ValidationResult} validateOptions - Retourne la version normalisée
 * @property {(options: Object, level: 'adulte'|'enfant', rng?: () => number) => QuestionGenerator} createGenerator
 */

export {};
