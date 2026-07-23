import { describe, it, expect } from 'vitest';
import { PRESETS, presetOptionsFor, detectPreset, groupPresetsForMode } from './presets.js';
import { getMode } from './index.js';

describe('presets CE1 / CE2 / CM1', () => {
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

  it('presetOptionsFor : mode sans preset (ex. division en CE1/CE2) ou id inconnu → null', () => {
    expect(presetOptionsFor('ce1', 'division')).toBeNull();
    expect(presetOptionsFor('ce2', 'division')).toBeNull();
    expect(presetOptionsFor('inconnu', 'addition')).toBeNull();
  });

  it('detectPreset : aller-retour', () => {
    expect(detectPreset('addition', presetOptionsFor('ce1', 'addition'))).toBe('ce1');
    expect(detectPreset('subtraction', presetOptionsFor('ce2', 'subtraction'))).toBe('ce2');
    expect(detectPreset('multiplication', presetOptionsFor('cm1', 'multiplication'))).toBe('cm1');
    expect(detectPreset('division', presetOptionsFor('cm1', 'division'))).toBe('cm1');
    expect(detectPreset('tables', { selectedTables: [2, 3, 4, 5, 10] })).toBe('ce1');
    expect(detectPreset('addition', { tiers: ['A1', 'A6'] })).toBeNull();
    // l'ordre ne compte pas
    expect(detectPreset('addition', { tiers: ['A3', 'A1', 'A2'] })).toBe('ce1');
  });

  it('CM1 soustraction est identique à CE2 : detectPreset renvoie le premier match (ce2)', () => {
    expect(presetOptionsFor('cm1', 'subtraction')).toEqual(presetOptionsFor('ce2', 'subtraction'));
    expect(detectPreset('subtraction', presetOptionsFor('cm1', 'subtraction'))).toBe('ce2');
  });

  it('groupPresetsForMode fusionne les presets aux paliers identiques (ce2/cm1 en soustraction)', () => {
    const groups = groupPresetsForMode('subtraction');
    const mergedGroup = groups.find((g) => g.ids.includes('cm1'));
    expect(mergedGroup.ids).toEqual(['ce2', 'cm1']);
    expect(mergedGroup.options).toEqual({ tiers: ['S3', 'S4', 'S5'] });
  });

  it('groupPresetsForMode ne fusionne pas les presets aux paliers distincts (addition)', () => {
    const groups = groupPresetsForMode('addition');
    expect(groups.map((g) => g.ids)).toEqual([['ce1'], ['ce2'], ['cm1']]);
  });

  it("groupPresetsForMode ignore les presets sans options pour le mode (ex. division en CE1/CE2)", () => {
    const groups = groupPresetsForMode('division');
    expect(groups.map((g) => g.ids)).toEqual([['cm1']]);
  });
});
