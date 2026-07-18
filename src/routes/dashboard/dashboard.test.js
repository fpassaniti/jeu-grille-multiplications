import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.server.js';
import { redirect } from '@sveltejs/kit';

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

// Mock de la fonction redirect
vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit');
  return {
    ...actual,
    redirect: vi.fn((code, path) => {
      throw new Error(`Redirect ${code} to ${path}`);
    })
  };
});

describe('Dashboard Page Server', () => {
  let mockLocals;

  beforeEach(() => {
    vi.clearAllMocks();

    // Créer un mock des locals
    mockLocals = {
      user: {
        id: 'user-id',
        username: 'testuser',
        displayName: 'Test User'
      },
      authenticated: true
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rediriger vers la page de login si non connecté', async () => {
    mockLocals.user = null;
    mockLocals.authenticated = false;

    try {
      await load({ locals: mockLocals });
      // Si load ne génère pas d'erreur, le test échoue
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Redirect 302 to /login');
      expect(redirect).toHaveBeenCalledWith(302, '/login');
    }
  });

  it('devrait charger les données utilisateur et progression', async () => {
    const result = await load({ locals: mockLocals });

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('userProgress');
    expect(result.user).toEqual(mockLocals.user);
    expect(result.userProgress).toHaveProperty('currentLevel');
    expect(result.userProgress.currentLevel).toHaveProperty('title', 'Mathématicien Amateur');
    expect(result.userProgress).toHaveProperty('nextLevel');
    expect(result.userProgress.nextLevel).toHaveProperty('title', 'Expert en Multiplication');
  });

  it('devrait charger les parties récentes', async () => {
    const result = await load({ locals: mockLocals });

    expect(result).toHaveProperty('recentGames');
    expect(Array.isArray(result.recentGames)).toBe(true);
    expect(result.recentGames.length).toBeGreaterThan(0);
    expect(result.recentGames[0]).toHaveProperty('score');
    expect(result.recentGames[0]).toHaveProperty('level');
  });

  it('devrait calculer la progression vers le niveau suivant', async () => {
    const result = await load({ locals: mockLocals });

    expect(result.userProgress).toHaveProperty('levelProgress');
    expect(result.userProgress).toHaveProperty('xpForNextLevel');
    expect(result.userProgress).toHaveProperty('xpUntilNextLevel');

    // Vérifier les calculs de progression
    // Niveau actuel: 3, XP: 4500
    // Niveau actuel min_xp: 3000
    // Niveau suivant min_xp: 6000
    // Différence: 3000 XP pour passer au niveau suivant
    // Progression actuelle: 4500 - 3000 = 1500 XP
    // Pourcentage: (1500 / 3000) * 100 = 50%

    expect(result.userProgress.xpForNextLevel).toBe(3000);
    expect(result.userProgress.xpUntilNextLevel).toBe(1500);
    expect(result.userProgress.levelProgress).toBe(50);
  });

});