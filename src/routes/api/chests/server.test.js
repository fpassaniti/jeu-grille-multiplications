import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    progress: { level: 6, streak_days: 4, last_streak_reward: 0, last_daily_chest_at: null },
    dailyDone: [],
    welcomeDone: [],
    levelupDone: [],
    perfectPlayedToday: [],
    perfectDone: [],
    dailySessionsAgg: [],
    missionClaimedRows: []
  }
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings) => {
    const query = typeof strings === 'string' ? strings : strings.join('?');
    if (query.includes('SELECT level, streak_days')) return [mockDb.progress];
    if (query.includes('last_daily_chest_at IS NOT NULL')) return mockDb.dailyDone;
    if (query.includes("chest_type = 'welcome'")) return mockDb.welcomeDone;
    if (query.includes("chest_type = 'levelup'")) return mockDb.levelupDone;
    if (query.includes('errors_count = 0')) return mockDb.perfectPlayedToday;
    if (query.includes("chest_type = 'perfect'")) return mockDb.perfectDone;
    if (query.includes('GROUP BY game_mode')) return mockDb.dailySessionsAgg;
    if (query.includes("chest_type = 'mission'")) return mockDb.missionClaimedRows;
    return [];
  })
}));

// Agrégat qui complète les 3 types de mission à la fois — le test n'a pas
// besoin de savoir quelle mission est réellement tirée pour la date du jour.
const COMPLETES_ANY_MISSION = ['tables', 'addition', 'subtraction', 'multiplication', 'division'].map(
  (game_mode) => ({ game_mode, duration: 5, count: 5 })
);

describe('GET /api/chests', () => {
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      get: vi.fn(() => JSON.stringify({ user: { id: 'user-id', displayName: 'Test' } }))
    };
    mockDb.progress = { level: 6, streak_days: 4, last_streak_reward: 0, last_daily_chest_at: null };
    mockDb.dailyDone = [];
    mockDb.welcomeDone = [];
    mockDb.levelupDone = [];
    mockDb.perfectPlayedToday = [];
    mockDb.perfectDone = [];
    mockDb.dailySessionsAgg = [];
    mockDb.missionClaimedRows = [];
  });

  it('401 si non connecté', async () => {
    mockCookies.get.mockReturnValue(null);
    const response = await GET({ cookies: mockCookies });
    expect(response.status).toBe(401);
  });

  it('calcule la disponibilité de chaque coffre', async () => {
    const response = await GET({ cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body.daily.available).toBe(true);
    expect(response.body.streak).toEqual({ available: true, milestone: 3 });
    expect(response.body.levelup).toEqual({ available: true, level: 6 });
    expect(response.body.perfect.available).toBe(false); // pas de partie parfaite aujourd'hui
    expect(response.body.welcome.available).toBe(true);
    expect(response.body.mission.available).toBe(false); // mission du jour pas complétée
  });

  it('coffre mission disponible une fois la mission du jour complétée', async () => {
    mockDb.dailySessionsAgg = COMPLETES_ANY_MISSION;
    const response = await GET({ cookies: mockCookies });
    expect(response.body.mission.available).toBe(true);
  });

  it('coffre mission indisponible si déjà réclamé aujourd\'hui, même complétée', async () => {
    mockDb.dailySessionsAgg = COMPLETES_ANY_MISSION;
    mockDb.missionClaimedRows = [{ 1: 1 }];
    const response = await GET({ cookies: mockCookies });
    expect(response.body.mission.available).toBe(false);
  });

  it('coffre streak indisponible si aucun palier atteint', async () => {
    mockDb.progress.streak_days = 1;
    const response = await GET({ cookies: mockCookies });
    expect(response.body.streak).toEqual({ available: false, milestone: null });
  });

  it('coffre perfect disponible seulement si joué aujourd\'hui et non déjà réclamé', async () => {
    mockDb.perfectPlayedToday = [{ '?column?': 1 }];
    const response = await GET({ cookies: mockCookies });
    expect(response.body.perfect.available).toBe(true);
  });
});
