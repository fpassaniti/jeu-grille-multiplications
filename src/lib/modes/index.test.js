import { describe, it, expect } from 'vitest';
import { MODES, getMode, listEnabledModes, isKnownMode } from './index.js';

describe('registre des modes', () => {
  it('expose les 5 modes déclarés', () => {
    expect(Object.keys(MODES).sort()).toEqual(
      ['addition', 'division', 'multiplication', 'subtraction', 'tables'].sort()
    );
  });

  it('getMode : repli sur tables pour un id inconnu', () => {
    expect(getMode('addition').id).toBe('addition');
    expect(getMode('nawak').id).toBe('tables');
    expect(getMode(undefined).id).toBe('tables');
  });

  it('listEnabledModes exclut division', () => {
    const ids = listEnabledModes().map((m) => m.id);
    expect(ids).toEqual(['tables', 'addition', 'subtraction', 'multiplication']);
  });

  it('isKnownMode distingue inconnu de désactivé', () => {
    expect(isKnownMode('division')).toBe(true);
    expect(isKnownMode('nawak')).toBe(false);
  });

  it('chaque mode respecte l’interface GameMode', () => {
    for (const mode of Object.values(MODES)) {
      expect(typeof mode.id).toBe('string');
      expect(typeof mode.enabled).toBe('boolean');
      expect(typeof mode.labelKey).toBe('string');
      expect(['grid', 'generic']).toContain(mode.boardType);
      expect(Array.isArray(mode.tiers)).toBe(true);
      expect(mode.validateOptions(mode.defaultOptions).ok).toBe(true);
      expect(typeof mode.createGenerator).toBe('function');
    }
  });
});
