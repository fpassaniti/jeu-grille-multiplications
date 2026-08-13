import { describe, it, expect } from 'vitest';
import { MISSIONS, pickMissionForDate } from './catalog.js';

const ENABLED_MODE_IDS = ['tables', 'addition', 'subtraction', 'multiplication', 'division'];

function mission(id) {
  const m = MISSIONS.find((m) => m.id === id);
  if (!m) throw new Error(`mission inconnue: ${id}`);
  return m;
}

describe('pickMissionForDate', () => {
  it('est déterministe : même date → même mission', () => {
    expect(pickMissionForDate('2026-08-13')).toBe(pickMissionForDate('2026-08-13'));
  });

  it('retourne toujours une entrée du catalogue', () => {
    for (const day of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      expect(MISSIONS).toContain(pickMissionForDate(day));
    }
  });
});

describe('each_mode', () => {
  const m = mission('each_mode');

  it('incomplet si aucun mode joué', () => {
    const { slots, completed } = m.computeObjectives([], { enabledModeIds: ENABLED_MODE_IDS });
    expect(completed).toBe(false);
    expect(slots.every((s) => !s.done)).toBe(true);
  });

  it('coche uniquement les modes joués aujourd’hui', () => {
    const rows = [
      { game_mode: 'tables', duration: 3, count: 2 },
      { game_mode: 'addition', duration: 5, count: 1 }
    ];
    const { slots, completed } = m.computeObjectives(rows, { enabledModeIds: ENABLED_MODE_IDS });
    expect(slots.find((s) => s.key === 'tables').done).toBe(true);
    expect(slots.find((s) => s.key === 'division').done).toBe(false);
    expect(completed).toBe(false);
  });

  it('complet quand tous les modes activés ont été joués', () => {
    const rows = ENABLED_MODE_IDS.map((game_mode) => ({ game_mode, duration: 3, count: 1 }));
    const { completed } = m.computeObjectives(rows, { enabledModeIds: ENABLED_MODE_IDS });
    expect(completed).toBe(true);
  });
});

describe('same_mode_x5', () => {
  const m = mission('same_mode_x5');

  it('cumule un même mode sur plusieurs durées', () => {
    const rows = [
      { game_mode: 'tables', duration: 2, count: 2 },
      { game_mode: 'tables', duration: 5, count: 3 },
      { game_mode: 'addition', duration: 3, count: 4 }
    ];
    const { slots, completed } = m.computeObjectives(rows, {});
    expect(slots.filter((s) => s.done)).toHaveLength(5);
    expect(completed).toBe(true);
  });

  it('ne mélange pas plusieurs modes pour compléter', () => {
    const rows = [
      { game_mode: 'tables', duration: 3, count: 2 },
      { game_mode: 'addition', duration: 3, count: 2 },
      { game_mode: 'division', duration: 3, count: 2 }
    ];
    const { completed } = m.computeObjectives(rows, {});
    expect(completed).toBe(false);
  });
});

describe('duration_x4', () => {
  const m = mission('duration_x4');

  it('ignore les parties dont la durée nominale n’est pas 5 minutes', () => {
    const rows = [
      { game_mode: 'tables', duration: 3, count: 10 },
      { game_mode: 'tables', duration: 5, count: 2 }
    ];
    const { slots, completed } = m.computeObjectives(rows, {});
    expect(slots.filter((s) => s.done)).toHaveLength(2);
    expect(completed).toBe(false);
  });

  it('complet à 4 parties de 5 minutes, tous modes confondus', () => {
    const rows = [
      { game_mode: 'tables', duration: 5, count: 2 },
      { game_mode: 'addition', duration: 5, count: 2 }
    ];
    const { completed } = m.computeObjectives(rows, {});
    expect(completed).toBe(true);
  });
});
