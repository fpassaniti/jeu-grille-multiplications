import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    aggRows: [],
    claimedRows: []
  }
}));

vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      return async (strings) => {
        const query = typeof strings === 'string' ? strings : strings.join('?');
        if (query.includes('FROM game_sessions')) {
          return mockDb.aggRows;
        }
        if (query.includes("chest_type = 'mission'")) {
          return mockDb.claimedRows;
        }
        return [];
      };
    })
  };
});

const { getMissionStatus, getTodayMission } = await import('./missions.js');

describe('getTodayMission', () => {
  it('est déterministe pour une date donnée', () => {
    expect(getTodayMission('2026-08-13')).toBe(getTodayMission('2026-08-13'));
  });
});

describe('getMissionStatus', () => {
  beforeEach(() => {
    mockDb.aggRows = [];
    mockDb.claimedRows = [];
  });

  it('coffre indisponible si la mission n’est pas complétée', async () => {
    mockDb.aggRows = [];
    const status = await getMissionStatus('user-1', '2026-08-13');
    expect(status.completed).toBe(false);
    expect(status.chestAvailable).toBe(false);
  });

  it('coffre disponible si complétée et pas encore réclamée', async () => {
    // Force la mission 'duration_x4' pour ce test en fabriquant un agrégat
    // qui la complète quelle que soit la mission réellement tirée n'est pas
    // possible sans mocker le catalogue ; on vérifie donc le comportement
    // via une date dont on sait, par construction du hash, quelle mission
    // sort — plus simple : on complète les 3 objectifs à la fois.
    const enabledModes = ['tables', 'addition', 'subtraction', 'multiplication', 'division'];
    mockDb.aggRows = [
      ...enabledModes.map((game_mode) => ({ game_mode, duration: 5, count: 5 }))
    ];
    mockDb.claimedRows = [];
    const status = await getMissionStatus('user-1', '2026-08-13');
    expect(status.completed).toBe(true);
    expect(status.chestAvailable).toBe(true);
  });

  it('coffre indisponible si déjà réclamé aujourd’hui, même complétée', async () => {
    const enabledModes = ['tables', 'addition', 'subtraction', 'multiplication', 'division'];
    mockDb.aggRows = [
      ...enabledModes.map((game_mode) => ({ game_mode, duration: 5, count: 5 }))
    ];
    mockDb.claimedRows = [{ 1: 1 }];
    const status = await getMissionStatus('user-1', '2026-08-13');
    expect(status.completed).toBe(true);
    expect(status.chestAvailable).toBe(false);
  });
});
