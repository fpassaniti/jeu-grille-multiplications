import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({ mockDb: { buyItemResult: null, consumableResult: null } }));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings, ...values) => {
    const query = typeof strings === 'string' ? strings : strings[0];
    if (query.includes('SELECT * FROM buy_item')) {
      return [mockDb.buyItemResult];
    }
    if (query.includes('SELECT buy_consumable')) {
      return [{ result: mockDb.consumableResult }];
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
    mockDb.consumableResult = null;
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
    ['not_purchasable', 403],
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

  it('achète un consommable (gel de streak)', async () => {
    mockRequest.json.mockResolvedValue({ consumable: 'freeze' });
    mockDb.consumableResult = { success: true, pricePaid: 300, coinsBalance: 700 };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, coinsBalance: 700, pricePaid: 300 });
  });

  it('mappe l\'erreur already_active du consommable vers 409', async () => {
    mockRequest.json.mockResolvedValue({ consumable: 'booster' });
    mockDb.consumableResult = { error: 'already_active' };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(409);
  });

  it('rejette un consommable inconnu', async () => {
    mockRequest.json.mockResolvedValue({ consumable: 'nawak' });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
  });
});
