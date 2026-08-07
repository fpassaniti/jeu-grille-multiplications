import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({
  mockDb: { openChestResult: null }
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings) => {
    const query = typeof strings === 'string' ? strings : strings[0];
    if (query.includes('SELECT open_chest')) {
      return [{ result: mockDb.openChestResult }];
    }
    return [];
  })
}));

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
      level: null
    });
  });
});
