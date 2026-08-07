import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.js';

vi.mock('$lib/server/shop.js', () => ({
  getEquipment: vi.fn(async () => ({ body: null }))
}));

vi.mock('$lib/server/chests.js', () => ({
  getChestAvailability: vi.fn(async () => ({ daily: { available: true } }))
}));

// Mock de Neon
vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      return async (strings, ...values) => {
        const query = typeof strings === 'string' ? strings : strings[0];

        if (query.includes('FROM user_progress')) {
          return [{
            user_id: 'user-id',
            level: 3,
            xp: 4500,
            games_played: 25,
            streak_days: 3,
            total_score: 12500,
            last_played_at: new Date().toISOString()
          }];
        } else if (query.includes('FROM level_definitions')) {
          if (values[0] === 3 || query.includes('level = 3')) {
            return [{
              level: 3,
              title: 'Mathématicien Amateur',
              description: 'Tu es maintenant capable de résoudre des problèmes plus complexes.',
              min_xp: 3000,
              rewards: []
            }];
          } else if (values[0] === 4 || query.includes('level = 4')) {
            return [{
              level: 4,
              title: 'Expert en Multiplication',
              description: 'Tu maîtrises les multiplications à grande vitesse.',
              min_xp: 6000,
              rewards: []
            }];
          }
          return [];
        } else if (query.includes('DISTINCT') && query.includes('game_sessions')) {
          return [{ d: new Date().toISOString().slice(0, 10) }];
        } else if (query.includes('MIN(date)')) {
          return [{ d: new Date().toISOString().slice(0, 7) }];
        } else if (query.includes('FROM game_sessions')) {
          return [
            {
              id: 'game-1',
              score: 500,
              level: 'adulte',
              duration: 5,
              date: new Date().toISOString()
            },
            {
              id: 'game-2',
              score: 300,
              level: 'enfant',
              duration: 5,
              date: new Date(Date.now() - 86400000).toISOString()
            }
          ];
        }

        return [];
      };
    })
  };
});

describe('Home Page Server (fusion avec le dashboard)', () => {
  let mockLocals;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocals = {
      user: {
        id: 'user-id',
        username: 'testuser',
        displayName: 'Test User'
      },
      authenticated: true
    };
  });

  it('ne redirige pas et renvoie des données vides pour un invité', async () => {
    const result = await load({ locals: { user: null } });

    expect(result).toEqual({ user: null, userProgress: null, equipment: null });
  });

  it('charge les données utilisateur et progression pour un utilisateur connecté', async () => {
    const result = await load({ locals: mockLocals });

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('userProgress');
    expect(result.user).toEqual(mockLocals.user);
    expect(result.userProgress).toHaveProperty('currentLevel');
    expect(result.userProgress.currentLevel).toHaveProperty('title', 'Mathématicien Amateur');
    expect(result.userProgress).toHaveProperty('nextLevel');
    expect(result.userProgress.nextLevel).toHaveProperty('title', 'Expert en Multiplication');
  });

  it('charge le calendrier de série (mois courant, plancher de navigation, projections de palier)', async () => {
    const result = await load({ locals: mockLocals });

    expect(result).toHaveProperty('currentMonth');
    expect(result.currentMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(Array.isArray(result.playedDays)).toBe(true);
    expect(result).toHaveProperty('earliestMonth');
    expect(result.earliestMonth).toMatch(/^\d{4}-\d{2}$/);
    expect(Array.isArray(result.milestoneProjections)).toBe(true);
  });

  it('charge les parties récentes', async () => {
    const result = await load({ locals: mockLocals });

    expect(result).toHaveProperty('recentGames');
    expect(Array.isArray(result.recentGames)).toBe(true);
    expect(result.recentGames.length).toBeGreaterThan(0);
    expect(result.recentGames[0]).toHaveProperty('score');
    expect(result.recentGames[0]).toHaveProperty('level');
  });

  it('calcule la progression vers le niveau suivant', async () => {
    const result = await load({ locals: mockLocals });

    expect(result.userProgress).toHaveProperty('levelProgress');
    expect(result.userProgress).toHaveProperty('xpForNextLevel');
    expect(result.userProgress).toHaveProperty('xpUntilNextLevel');

    // Niveau actuel: 3, XP: 4500, min_xp: 3000 ; niveau suivant min_xp: 6000
    // Différence: 3000 XP, progression actuelle: 1500 XP → 50%
    expect(result.userProgress.xpForNextLevel).toBe(3000);
    expect(result.userProgress.xpUntilNextLevel).toBe(1500);
    expect(result.userProgress.levelProgress).toBe(50);
  });

  it('charge l\'équipement et les coffres disponibles', async () => {
    const result = await load({ locals: mockLocals });

    expect(result).toHaveProperty('equipment');
    expect(result).toHaveProperty('chests');
    expect(result.chests).toEqual({ daily: { available: true } });
  });
});
