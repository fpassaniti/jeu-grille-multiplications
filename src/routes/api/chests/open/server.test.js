import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({
  mockDb: { openChestResult: null, dailySessionsAgg: [], missionClaimedRows: [], potionRows: [] }
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings) => {
    const query = typeof strings === 'string' ? strings : strings.join('?');
    if (query.includes('SELECT open_chest')) {
      return [{ result: mockDb.openChestResult }];
    }
    if (query.includes('FROM game_sessions')) {
      return mockDb.dailySessionsAgg;
    }
    if (query.includes("chest_type = 'mission'")) {
      return mockDb.missionClaimedRows;
    }
    if (query.includes('FROM potions')) {
      return mockDb.potionRows;
    }
    return [];
  })
}));

// Agrégat qui complète les 3 types de mission à la fois (chaque mode activé,
// 5 parties, durée nominale 5 min) — le test n'a pas besoin de savoir quelle
// mission est réellement tirée pour la date du jour.
const COMPLETES_ANY_MISSION = ['tables', 'addition', 'subtraction', 'multiplication', 'division'].map(
  (game_mode) => ({ game_mode, duration: 5, count: 5 })
);

describe('POST /api/chests/open', () => {
  let mockRequest;
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = { json: vi.fn() };
    mockCookies = {
      get: vi.fn(() => JSON.stringify({ user: { id: 'user-id', displayName: 'Test' } }))
    };
    mockDb.openChestResult = null;
    mockDb.dailySessionsAgg = [];
    mockDb.missionClaimedRows = [];
    mockDb.potionRows = [];
  });

  it('401 si non connecté', async () => {
    mockCookies.get.mockReturnValue(null);
    mockRequest.json.mockResolvedValue({ type: 'daily' });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(401);
  });

  it('400 sur un type de coffre inconnu', async () => {
    mockRequest.json.mockResolvedValue({ type: 'nawak' });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
  });

  it('409 si le coffre n\'est pas disponible', async () => {
    mockRequest.json.mockResolvedValue({ type: 'daily' });
    mockDb.openChestResult = { error: 'not_available' };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(409);
  });

  it('ouvre un coffre (pièces uniquement)', async () => {
    mockRequest.json.mockResolvedValue({ type: 'daily' });
    mockDb.openChestResult = { coins: 45, balance: 145 };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      chestType: 'daily',
      coins: 45,
      coinsBalance: 145,
      milestone: null,
      level: null,
      potions: null
    });
  });

  it('409 pour le coffre mission si la mission du jour n\'est pas complétée', async () => {
    mockRequest.json.mockResolvedValue({ type: 'mission' });
    mockDb.dailySessionsAgg = [];
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'not_available' });
  });

  it('ouvre le coffre mission (pièces + potions) une fois la mission complétée', async () => {
    mockRequest.json.mockResolvedValue({ type: 'mission' });
    mockDb.dailySessionsAgg = COMPLETES_ANY_MISSION;
    mockDb.missionClaimedRows = [];
    mockDb.openChestResult = { coins: 60, balance: 260, potions: ['time_bonus_20'] };
    mockDb.potionRows = [{ code: 'time_bonus_20', name: { fr: 'Bonus de temps +20s' } }];

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      chestType: 'mission',
      coins: 60,
      coinsBalance: 260,
      milestone: null,
      level: null,
      potions: [{ code: 'time_bonus_20', name: { fr: 'Bonus de temps +20s' } }]
    });
  });

  it('409 pour le coffre mission déjà réclamé aujourd\'hui, même complétée', async () => {
    mockRequest.json.mockResolvedValue({ type: 'mission' });
    mockDb.dailySessionsAgg = COMPLETES_ANY_MISSION;
    mockDb.missionClaimedRows = [{ 1: 1 }];
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'not_available' });
  });
});
