import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({ mockDb: { buyItemResult: null, potionResult: null } }));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings, ...values) => {
    const query = typeof strings === 'string' ? strings : strings[0];
    if (query.includes('SELECT * FROM buy_item')) {
      return [mockDb.buyItemResult];
    }
    if (query.includes('SELECT buy_potion')) {
      return [{ result: mockDb.potionResult }];
    }
    return [];
  })
}));

describe('POST /api/shop/buy', () => {
  let mockRequest;
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = { json: vi.fn() };
    mockCookies = {
      get: vi.fn(() => JSON.stringify({ user: { id: 'user-id', displayName: 'Test' } }))
    };
    mockDb.buyItemResult = null;
    mockDb.potionResult = null;
  });

  it('401 si non connecté', async () => {
    mockCookies.get.mockReturnValue(null);
    mockRequest.json.mockResolvedValue({ itemId: 1 });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(401);
  });

  it('achat réussi : renvoie coinsBalance/pricePaid', async () => {
    mockRequest.json.mockResolvedValue({ itemId: 5 });
    mockDb.buyItemResult = { success: true, error_code: null, price_paid: 150, coins_balance: 350 };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, coinsBalance: 350, pricePaid: 150 });
  });

  it.each([
    ['item_not_found', 404],
    ['level_locked', 403],
    ['already_owned', 409],
    ['insufficient_coins', 402]
  ])('mappe l\'erreur %s vers le statut %i', async (errorCode, status) => {
    mockRequest.json.mockResolvedValue({ itemId: 5 });
    mockDb.buyItemResult = { success: false, error_code: errorCode, price_paid: null, coins_balance: 0 };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(status);
    expect(response.body).toHaveProperty('error', errorCode);
  });

  it('rejette un itemId invalide', async () => {
    mockRequest.json.mockResolvedValue({ itemId: 'nope' });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
  });

  it('achète une potion (gel de streak)', async () => {
    mockRequest.json.mockResolvedValue({ potionCode: 'streak_freeze_1' });
    mockDb.potionResult = { success: true, pricePaid: 80, coinsBalance: 700 };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, coinsBalance: 700, pricePaid: 80 });
  });

  it('mappe l\'erreur unknown_potion vers 404', async () => {
    mockRequest.json.mockResolvedValue({ potionCode: 'nawak' });
    mockDb.potionResult = { error: 'unknown_potion' };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(404);
  });

  it('mappe l\'erreur freeze_cap_reached vers 409', async () => {
    mockRequest.json.mockResolvedValue({ potionCode: 'streak_freeze_14' });
    mockDb.potionResult = { error: 'freeze_cap_reached' };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(409);
  });
});
