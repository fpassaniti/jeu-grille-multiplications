/**
 * Registre des modes de calcul. JS pur : importé par le client (UI, engine)
 * ET par le serveur (validation des options dans POST /api/scores).
 */
import tables from './tables.js';
import addition from './addition.js';
import subtraction from './subtraction.js';
import multiplication from './multiplication.js';
import division from './division.js';

/** @type {Record<string, import('./types.js').GameMode>} */
export const MODES = { tables, addition, subtraction, multiplication, division };

/**
 * Mode par id, avec repli sur 'tables' (SPEC §4.2).
 * @param {string} id
 * @returns {import('./types.js').GameMode}
 */
export function getMode(id) {
  return MODES[id] ?? MODES.tables;
}

/**
 * Modes proposés dans l'UI.
 * @returns {import('./types.js').GameMode[]}
 */
export function listEnabledModes() {
  return Object.values(MODES).filter((mode) => mode.enabled);
}

/**
 * Vrai si l'id correspond à un mode déclaré (même désactivé) —
 * l'API veut distinguer « inconnu » de « repli tables ».
 * @param {string} id
 * @returns {boolean}
 */
export function isKnownMode(id) {
  return Object.hasOwn(MODES, id);
}
