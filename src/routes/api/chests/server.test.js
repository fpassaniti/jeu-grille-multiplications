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
    perfectDone: []
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
    return [];
  })
}));

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
