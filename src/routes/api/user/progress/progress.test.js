import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './+server.js';
import { json } from '@sveltejs/kit';

// Mock des fonctions de SvelteKit
vi.mock('@sveltejs/kit', async () => {
  return {
    json: vi.fn((data, options = {}) => {
      return {
        status: options.status || 200,
        body: data
      };
    })
  };
});

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
        }
        if (query.includes('FROM level_definitions')) {
          if (values[0] === 3 || (query.includes('level = 3'))) {
            return [{
              level: 3,
            title: 'Mathématicien Amateur',
            description: 'Tu es maintenant capable de résoudre des problèmes plus complexes.',
            min_xp: 3000,
            rewards: []
          }];
          } else if (values[0] === 4 || (query.includes('level = 4'))) {
            return [{
              level: 4,
              title: 'Expert en Multiplication',
              description: 'Tu maîtrises les multiplications à grande vitesse.',
              min_xp: 6000,
              rewards: []
            }];
          }
          return [];
        }

        return [];
      };
    })
  };
});

describe('API Progression Utilisateur', () => {
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();

    // Créer un mock des cookies
    mockCookies = {
      get: vi.fn()
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('devrait retourner une erreur 401 si l\'utilisateur n\'est pas connecté', async () => {
    mockCookies.get.mockReturnValue(null);

    const response = await GET({ cookies: mockCookies });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Non authentifié');
  });

  it('devrait retourner les données de progression d\'un utilisateur connecté', async () => {
    // Simuler un cookie de session avec un utilisateur connecté
    mockCookies.get.mockReturnValue(JSON.stringify({
      user: {
        id: 'user-id',
        username: 'testuser',
        displayName: 'Test User'
      }
    }));

    const response = await GET({ cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('progress');

    // Vérifier le contenu des données de progression
    const { progress } = response.body;
    expect(progress).toHaveProperty('level', 3);
    expect(progress).toHaveProperty('xp', 4500);
    expect(progress).toHaveProperty('currentLevel');
    expect(progress.currentLevel).toHaveProperty('title', 'Mathématicien Amateur');
    expect(progress).toHaveProperty('nextLevel');
    expect(progress.nextLevel).toHaveProperty('title', 'Expert en Multiplication');
    expect(progress).toHaveProperty('levelProgress');
    expect(typeof progress.levelProgress).toBe('number');
  });

  it('devrait calculer correctement la progression vers le niveau suivant', async () => {
    // Simuler un cookie de session avec un utilisateur connecté
    mockCookies.get.mockReturnValue(JSON.stringify({
      user: {
        id: 'user-id',
        username: 'testuser',
        displayName: 'Test User'
      }
    }));

    const response = await GET({ cookies: mockCookies });

    const { progress } = response.body;

    // Niveau actuel: 3, XP: 4500
    // Niveau actuel min_xp: 3000
    // Niveau suivant min_xp: 6000
    // Différence: 3000 XP pour passer au niveau suivant
    // Progression actuelle: 4500 - 3000 = 1500 XP
    // Pourcentage: (1500 / 3000) * 100 = 50%

    expect(progress.xpForNextLevel).toBe(3000);
    expect(progress.xpUntilNextLevel).toBe(1500);
    expect(progress.levelProgress).toBe(50);
  });

});