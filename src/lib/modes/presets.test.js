import { describe, it, expect } from 'vitest';
import { PRESETS, presetOptionsFor, detectPreset } from './presets.js';
import { getMode } from './index.js';

describe('presets CE1 / CE2 / Libre', () => {
  it('les options de chaque preset sont valides pour leur mode', () => {
    for (const preset of PRESETS) {
      if (!preset.byMode) continue;
      for (const [modeId, options] of Object.entries(preset.byMode)) {
        expect(getMode(modeId).validateOptions(options).ok).toBe(true);
      }
    }
  });

  it('presetOptionsFor retourne une copie (pas de mutation partagée)', () => {
    const a = presetOptionsFor('ce1', 'addition');
    const b = presetOptionsFor('ce1', 'addition');
    expect(a).toEqual({ tiers: ['A1', 'A2', 'A3'] });
    expect(a).not.toBe(b);
    a.tiers.push('A6');
    expect(presetOptionsFor('ce1', 'addition').tiers).toHaveLength(3);
  });

  it('presetOptionsFor : libre ou inconnu → null', () => {
    expect(presetOptionsFor('libre', 'addition')).toBeNull();
    expect(presetOptionsFor('inconnu', 'addition')).toBeNull();
  });

  it('detectPreset : aller-retour', () => {
    expect(detectPreset('addition', presetOptionsFor('ce1', 'addition'))).toBe('ce1');
    expect(detectPreset('subtraction', presetOptionsFor('ce2', 'subtraction'))).toBe('ce2');
    expect(detectPreset('tables', { selectedTables: [2, 3, 4, 5, 10] })).toBe('ce1');
    expect(detectPreset('addition', { tiers: ['A1', 'A6'] })).toBe('libre');
    // l'ordre ne compte pas
    expect(detectPreset('addition', { tiers: ['A3', 'A1', 'A2'] })).toBe('ce1');
  });
});
