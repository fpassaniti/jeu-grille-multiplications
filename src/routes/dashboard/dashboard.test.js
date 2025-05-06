import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.server.js';
import { redirect } from '@sveltejs/kit';

// Mock de Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table) => {
        if (table === 'user_progress') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
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
                    single: vi.fn(() => ({
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
                    maybeSingle: vi.fn(() => ({
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
                }
              })
            }))
          };
        } else if (table === 'game_sessions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [
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
                        date: new Date(Date.now() - 86400000).toISOString() // 1 jour avant
                      }
                    ],
                    error: null
                  }))
                }))
              }))
            }))
          };
        }
      })
    }))
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
    vi.resetAllMocks();
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

  it('devrait gérer les erreurs de base de données', async () => {
    // Modifier temporairement le mock pour simuler une erreur
    const supabaseModule = await import('@supabase/supabase-js');
    const originalCreateClient = supabaseModule.createClient;

    supabaseModule.createClient = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => {
            throw new Error('Erreur de base de données simulée');
          })
        }))
      }))
    }));

    const result = await load({ locals: mockLocals });

    // Restaurer le mock original
    supabaseModule.createClient = originalCreateClient;

    // Même en cas d'erreur, nous devrions toujours avoir des valeurs par défaut
    expect(result).toHaveProperty('user', mockLocals.user);
    expect(result).toHaveProperty('userProgress', null);
    expect(result).toHaveProperty('recentGames', []);
  });
});