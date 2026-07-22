/**
 * Persistance des réglages de jeu en localStorage (SPEC §4.3).
 * Migre la clé V1 `selectedMultiplicationTables` (boolean[10]).
 */
import { getMode } from '$lib/modes/index.js';

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

const KEY = 'multyfun.gameSettings.v2';
// Clé V1 laissée en place : un ancien service worker PWA peut encore servir l'ancien /play
const LEGACY_KEY = 'selectedMultiplicationTables';

const VALID_DURATIONS = [2, 3, 5];
const VALID_LEVELS = ['adulte', 'enfant'];

/**
 * @returns {{lastMode: string, level: 'adulte'|'enfant', duration: number, optionsByMode: Object}}
 */
export function defaultSettings() {
  return { lastMode: 'tables', level: 'adulte', duration: 3, optionsByMode: {} };
}

/**
 * Charge les réglages (validation de forme champ par champ, merge sur les défauts).
 */
export function loadSettings() {
  const settings = defaultSettings();
  if (!storageAvailable()) {
    return settings;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      migrateLegacyTables(settings);
      return settings;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lastMode === 'string' && getMode(parsed.lastMode).id === parsed.lastMode) {
      settings.lastMode = parsed.lastMode;
    }
    if (VALID_LEVELS.includes(parsed?.level)) {
      settings.level = parsed.level;
    }
    if (VALID_DURATIONS.includes(parsed?.duration)) {
      settings.duration = parsed.duration;
    }
    if (parsed?.optionsByMode && typeof parsed.optionsByMode === 'object') {
      for (const [modeId, options] of Object.entries(parsed.optionsByMode)) {
        const validation = getMode(modeId).validateOptions(options);
        if (getMode(modeId).id === modeId && validation.ok) {
          settings.optionsByMode[modeId] = validation.value;
        }
      }
    }
  } catch {
    // JSON corrompu → défauts
  }
  return settings;
}

/**
 * @param {ReturnType<typeof defaultSettings>} settings
 */
export function saveSettings(settings) {
  if (!storageAvailable()) {
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // stockage plein/indisponible : réglages non persistés, jeu fonctionnel
  }
}

/**
 * Options effectives d'un mode (réglages sauvegardés ou défauts du mode).
 * @param {ReturnType<typeof defaultSettings>} settings
 * @param {string} modeId
 */
export function optionsFor(settings, modeId) {
  // JSON.parse/stringify plutôt que structuredClone : ce dernier échoue sur les proxys
  // Svelte 5 ($state) que `settings` peut contenir côté appelant (DataCloneError).
  const saved = settings.optionsByMode[modeId];
  return JSON.parse(JSON.stringify(saved ?? getMode(modeId).defaultOptions));
}

function migrateLegacyTables(settings) {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw === null) {
      return;
    }
    const flags = JSON.parse(raw);
    if (Array.isArray(flags) && flags.length === 10) {
      const selectedTables = flags
        .map((selected, index) => (selected ? index + 1 : null))
        .filter((n) => n !== null);
      if (selectedTables.length > 0) {
        settings.optionsByMode.tables = { selectedTables };
        saveSettings(settings);
      }
    }
  } catch {
    // clé V1 corrompue : ignorée
  }
}
