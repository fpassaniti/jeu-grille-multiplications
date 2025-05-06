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

// Mock de Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table) => {
        // Simuler différentes réponses en fonction de la table
        if (table === 'user_progress') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    user_id: 'user-id',
                    level: 3,
                    xp: 4500,
                    games_played: 25,
                    streak_days: 3,
                    total_score: 12500,
                    last_played_at: new Date().toISOString()
                  },
                  error: null
                }))
              }))
            }))
          };
        } else if (table === 'level_definitions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field, value) => {
                if (value === 3) {
                  return {
                    single: vi.fn(() => Promise.resolve({
                      data: {
                        level: 3,
                        title: 'Mathématicien Amateur',
                        description: 'Tu es maintenant capable de résoudre des problèmes plus complexes.',
                        min_xp: 3000,
                        rewards: []
                      },
                      error: null
                    }))
                  };
                } else if (value === 4) {
                  return {
                    maybeSingle: vi.fn(() => Promise.resolve({
                      data: {
                        level: 4,
                        title: 'Expert en Multiplication',
                        description: 'Tu maîtrises les multiplications à grande vitesse.',
                        min_xp: 6000,
                        rewards: []
                      },
                      error: null
                    }))
                  };
                } else if (value === 11) {
                  return {
                    maybeSingle: vi.fn(() => Promise.resolve({
                      data: null,
                      error: null
                    }))
                  };
                }
                return {
                  maybeSingle: vi.fn(() => Promise.resolve({
                    data: null,
                    error: null
                  }))
                };
              })
            }))
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: null
              }))
            }))
          }))
        };
      })
    }))
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

  it('devrait gérer correctement les erreurs de la base de données', async () => {
    // Simuler un cookie de session avec un utilisateur connecté
    mockCookies.get.mockReturnValue(JSON.stringify({
      user: {
        id: 'user-id',
        username: 'testuser',
        displayName: 'Test User'
      }
    }));

    // Mock spécifique pour ce test qui lance une erreur
    vi.mock('@supabase/supabase-js', () => {
      return {
        createClient: vi.fn(() => ({
          from: vi.fn(() => {
            throw new Error('Erreur de base de données simulée');
          })
        }))
      };
    }, { virtual: true });

    const response = await GET({ cookies: mockCookies });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Erreur lors de la récupération de la progression');
  }, { retry: 0 });

  it('devrait gérer le cas où l\'utilisateur est au niveau maximum', async () => {
    // Remplacer le mock pour ce test spécifique
    vi.mock('@supabase/supabase-js', () => {
      return {
        createClient: vi.fn(() => ({
          from: vi.fn((table) => {
            if (table === 'user_progress') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                      data: {
                        user_id: 'user-id',
                        level: 10, // Niveau max
                        xp: 50000,
                        games_played: 100,
                        streak_days: 30,
                        total_score: 100000,
                        last_played_at: new Date().toISOString()
                      },
                      error: null
                    }))
                  }))
                }))
              };
            } else if (table === 'level_definitions') {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn((field, value) => {
                    if (value === 10) {
                      return {
                        single: vi.fn(() => Promise.resolve({
                          data: {
                            level: 10,
                            title: 'Virtuose Mathématique',
                            description: 'Tu as atteint le sommet!',
                            min_xp: 45000,
                            rewards: []
                          },
                          error: null
                        }))
                      };
                    } else if (value === 11) {
                      return {
                        maybeSingle: vi.fn(() => Promise.resolve({
                          data: null, // Aucun niveau supérieur
                          error: null
                        }))
                      };
                    }
                    return {
                      maybeSingle: vi.fn(() => Promise.resolve({
                        data: null,
                        error: null
                      }))
                    };
                  })
                }))
              };
            }
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: null,
                    error: null
                  }))
                }))
              }))
            };
          })
        }))
      };
    }, { virtual: true });

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
    expect(response.body.progress.nextLevel).toBeNull();
    expect(response.body.progress.xpForNextLevel).toBeNull();
    expect(response.body.progress.xpUntilNextLevel).toBeNull();
    expect(response.body.progress.levelProgress).toBe(0);
  }, { retry: 0 });
});