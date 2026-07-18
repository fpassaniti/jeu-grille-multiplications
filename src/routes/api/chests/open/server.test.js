import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({
  mockDb: { openChestResult: null, itemRow: null }
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings) => {
    const query = typeof strings === 'string' ? strings : strings[0];
    if (query.includes('SELECT open_chest')) {
      return [{ result: mockDb.openChestResult }];
    }
    if (query.includes('FROM items WHERE id')) {
      return mockDb.itemRow ? [mockDb.itemRow] : [];
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
    mockDb.itemRow = null;
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

  it('ouvre un coffre sans item (pièces seules)', async () => {
    mockRequest.json.mockResolvedValue({ type: 'daily' });
    mockDb.openChestResult = { coins: 45, balance: 145, duplicate: false };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      chestType: 'daily',
      coins: 45,
      item: null,
      duplicate: false,
      refund: 0,
      coinsBalance: 145,
      milestone: null,
      level: null
    });
  });

  it('ouvre un coffre avec item et hydrate ses détails', async () => {
    mockRequest.json.mockResolvedValue({ type: 'welcome' });
    mockDb.openChestResult = {
      coins: 100,
      item_id: 8,
      item_code: 'outfit_tshirt_star',
      rarity: 'common',
      duplicate: false,
      balance: 100
    };
    mockDb.itemRow = {
      code: 'outfit_tshirt_star',
      slot: 'outfit',
      rarity: 'common',
      name: { fr: 'T-shirt étoile' },
      asset_url: '/images/items/outfit_tshirt_star.svg'
    };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body.item).toEqual({
      id: 8,
      code: 'outfit_tshirt_star',
      slot: 'outfit',
      rarity: 'common',
      name: { fr: 'T-shirt étoile' },
      assetUrl: '/images/items/outfit_tshirt_star.svg'
    });
  });

  it('signale un doublon avec son remboursement', async () => {
    mockRequest.json.mockResolvedValue({ type: 'daily' });
    mockDb.openChestResult = {
      coins: 30,
      item_id: 8,
      item_code: 'outfit_tshirt_star',
      rarity: 'common',
      duplicate: true,
      refund: 75,
      balance: 500
    };
    mockDb.itemRow = {
      code: 'outfit_tshirt_star',
      slot: 'outfit',
      rarity: 'common',
      name: { fr: 'T-shirt étoile' },
      asset_url: '/images/items/outfit_tshirt_star.svg'
    };
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.body.duplicate).toBe(true);
    expect(response.body.refund).toBe(75);
  });
});
