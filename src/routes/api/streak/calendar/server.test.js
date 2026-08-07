import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server.js';

vi.mock('@sveltejs/kit', () => ({
  json: vi.fn((data, options = {}) => ({ status: options.status || 200, body: data }))
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => async (strings) => {
    const query = typeof strings === 'string' ? strings : strings.join('?');
    if (query.includes('DISTINCT') && query.includes('game_sessions')) {
      return [{ d: '2026-08-05' }, { d: '2026-08-06' }];
    }
    if (query.includes('MIN(date)')) {
      return [{ d: '2026-06' }];
    }
    return [];
  })
}));

function makeUrl(month) {
  const search = month ? `?month=${month}` : '';
  return new URL(`http://localhost/api/streak/calendar${search}`);
}

describe('GET /api/streak/calendar', () => {
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      get: vi.fn(() => JSON.stringify({ user: { id: 'user-id', displayName: 'Test' } }))
    };
  });

  it('401 si non connecté', async () => {
    mockCookies.get.mockReturnValue(null);
    const response = await GET({ cookies: mockCookies, url: makeUrl('2026-08') });
    expect(response.status).toBe(401);
  });

  it('400 si le paramètre month est absent', async () => {
    const response = await GET({ cookies: mockCookies, url: makeUrl() });
    expect(response.status).toBe(400);
  });

  it('400 si le paramètre month est mal formé', async () => {
    const response = await GET({ cookies: mockCookies, url: makeUrl('2026-8') });
    expect(response.status).toBe(400);
  });

  it('renvoie les jours joués du mois et le mois le plus ancien', async () => {
    const response = await GET({ cookies: mockCookies, url: makeUrl('2026-08') });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      month: '2026-08',
      playedDays: ['2026-08-05', '2026-08-06'],
      earliestMonth: '2026-06'
    });
  });
});
