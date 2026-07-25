import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

const { mockDb } = vi.hoisted(() => ({ mockDb: { insertRows: [{ item_id: 5 }] } }));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings) => {
    const query = typeof strings === 'string' ? strings : strings[0];
    if (query.includes('INSERT INTO user_equipment')) {
      return mockDb.insertRows;
    }
    if (query.includes('FROM user_equipment')) {
      return []; // équipement déjà résolu : rien d'équipé
    }
    if (query.includes('FROM items WHERE is_default')) {
      return [
        { slot: 'body', item_id: 1, code: 'body_blob_purple', asset_url: '/images/items/body_blob_purple.svg' }
      ];
    }
    return [];
  })
}));

describe('POST /api/character/equip', () => {
  let mockRequest;
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = { json: vi.fn() };
    mockCookies = {
      get: vi.fn(() => JSON.stringify({ user: { id: 'user-id', displayName: 'Test' } }))
    };
    mockDb.insertRows = [{ item_id: 5 }];
  });

  it('401 si non connecté', async () => {
    mockCookies.get.mockReturnValue(null);
    mockRequest.json.mockResolvedValue({ slot: 'hat', itemId: 5 });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(401);
  });

  it('400 sur un slot invalide', async () => {
    mockRequest.json.mockResolvedValue({ slot: 'chaussettes', itemId: 5 });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
  });

  it("403 si l'item n'est pas possédé (aucune ligne retournée)", async () => {
    mockDb.insertRows = [];
    mockRequest.json.mockResolvedValue({ slot: 'hat', itemId: 999 });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(403);
  });

  it('équipe avec succès et renvoie l\'équipement résolu', async () => {
    mockRequest.json.mockResolvedValue({ slot: 'hat', itemId: 5 });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.equipment.body).toEqual({
      itemId: 1,
      code: 'body_blob_purple',
      assetUrl: '/images/items/body_blob_purple.svg'
    });
  });

  it('itemId null → déséquipe (upsert item_id NULL)', async () => {
    mockRequest.json.mockResolvedValue({ slot: 'hat', itemId: null });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body.equipment.hat).toBeNull();
  });

  it('400 si on tente de déséquiper le slot body', async () => {
    mockRequest.json.mockResolvedValue({ slot: 'body', itemId: null });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
  });
});
