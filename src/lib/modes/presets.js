/**
 * Presets pédagogiques CE1 / CE2 / Libre (SPEC §4.5).
 */

export const PRESETS = [
  {
    id: 'ce1',
    labelKey: 'difficulty.presets.ce1',
    icon: '🌱',
    byMode: {
      addition: { tiers: ['A1', 'A2', 'A3'] },
      subtraction: { tiers: ['S1', 'S2', 'S3'] },
      multiplication: { tiers: ['M1'] },
      tables: { selectedTables: [2, 3, 4, 5, 10] }
    }
  },
  {
    id: 'ce2',
    labelKey: 'difficulty.presets.ce2',
    icon: '🌳',
    byMode: {
      addition: { tiers: ['A3', 'A4', 'A5'] },
      subtraction: { tiers: ['S3', 'S4', 'S5'] },
      multiplication: { tiers: ['M1', 'M2', 'M3', 'M4'] },
      tables: { selectedTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
    }
  },
  {
    id: 'libre',
    labelKey: 'difficulty.presets.libre',
    icon: '🎛️',
    byMode: null
  }
];

/**
 * Options d'un preset pour un mode donné (null pour « libre »).
 * @param {string} presetId
 * @param {string} modeId
 * @returns {Object|null}
 */
export function presetOptionsFor(presetId, modeId) {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset || !preset.byMode) {
    return null;
  }
  const options = preset.byMode[modeId];
  return options ? structuredClone(options) : null;
}

/**
 * Détecte le preset correspondant à des options (pour surligner le bouton actif).
 * @param {string} modeId
 * @param {Object} options
 * @returns {'ce1'|'ce2'|'libre'}
 */
export function detectPreset(modeId, options) {
  for (const preset of PRESETS) {
    if (!preset.byMode) continue;
    const ref = preset.byMode[modeId];
    if (ref && JSON.stringify(normalize(ref)) === JSON.stringify(normalize(options))) {
      return preset.id;
    }
  }
  return 'libre';
}

function normalize(options) {
  const out = {};
  for (const key of Object.keys(options || {}).sort()) {
    const value = options[key];
    out[key] = Array.isArray(value) ? [...value].sort() : value;
  }
  return out;
}
