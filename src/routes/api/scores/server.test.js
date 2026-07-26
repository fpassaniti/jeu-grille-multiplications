// src/routes/api/scores/server.test.js - mise à jour des tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './+server.js';

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

// `sql` (src/lib/server/db.js) est créé UNE SEULE FOIS via neon(url) à l'import
// du module : mockImplementationOnce sur `neon` n'a donc aucun effet après le
// premier appel. On passe par un état mutable partagé (vi.hoisted) que les
// tests ajustent, lu dynamiquement à chaque requête par la même closure.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    recentGame: false,
    replayCalls: [],
    rewardsCalls: [],
    rewardsResponse: {
      xp: 600,
      level: 2,
      previous_level: 1,
      level_up: true,
      streak_days: 1,
      freeze_used: false,
      coins_earned: 50,
      coins_balance: 150,
      coins_breakdown: { base: 50 },
      streak_chest_due: 0,
      perfect_chest_due: false
    }
  }
}));

// Mock de Neon
vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      return async (strings, ...values) => {
        const query = typeof strings === 'string' ? strings : strings[0];

        if (query.includes('SELECT 1 FROM game_sessions')) {
          mockDb.replayCalls.push(values);
          return mockDb.recentGame ? [{ '?column?': 1 }] : [];
        }
        if (query.includes('INSERT INTO game_sessions')) {
          return [{ id: 'mock-id', user_id: 'user-id', score: 100, date: new Date() }];
        }
        if (query.includes('INSERT INTO scores')) {
          return [{ id: 1, name: 'Test Player', score: 100, date: new Date() }];
        }
        if (query.includes('SELECT * FROM add_user_xp')) {
          return [{ user_id: 'user-id', total_xp: 100, current_level: 1, games_played: 1, total_score: 100, streak_days: 1 }];
        }
        if (query.includes('SELECT * FROM add_game_rewards')) {
          mockDb.rewardsCalls.push(values);
          return [mockDb.rewardsResponse];
        }
        if (query.includes('SELECT title FROM level_definitions')) {
          return [{ title: 'Apprenti Calculateur' }];
        }

        return [];
      };
    })
  };
});

describe('Endpoint API /api/scores', () => {
  let mockRequest;
  let mockCookies;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();
    mockDb.recentGame = false;
    mockDb.replayCalls = [];
    mockDb.rewardsCalls = [];
    mockDb.rewardsResponse = {
      xp: 600,
      level: 2,
      previous_level: 1,
      level_up: true,
      streak_days: 1,
      freeze_used: false,
      coins_earned: 50,
      coins_balance: 150,
      coins_breakdown: { base: 50 },
      streak_chest_due: 0,
      perfect_chest_due: false
    };

    // Créer un mock de la requête
    mockRequest = {
      json: vi.fn()
    };

    // Créer un mock des cookies — authentifié par défaut (le jeu n'a plus de
    // mode invité) ; les tests qui veulent simuler un visiteur non connecté
    // surchargent explicitement avec mockReturnValue(null).
    mockCookies = {
      get: vi.fn().mockReturnValue(
        JSON.stringify({ user: { id: 'user-id', displayName: 'Joueur Test' } })
      )
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner une erreur 400 si des données requises sont manquantes', async () => {
    // Configurer le mock pour retourner des données incomplètes
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 100,
      // duration manquant
      level: 'adulte'
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Informations manquantes');
  });

  it('devrait rejeter un score trop élevé par rapport aux cellules résolues', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 10000, // Score trop élevé pour seulement 2 cellules (au-delà du plafond de plausibilité)
      duration: 5,
      level: 'adulte',
      solvedCells: 2, // Peu de cellules
      totalPossibleCells: 20,
      selectedTables: [2, 3, 4]
    });

    // Vérifier que l'implémentation vérifie le rapport score/cellules
    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  // Test modifié pour refléter la nouvelle fonctionnalité : on accepte les solvedCells > totalPossibleCells
  it('devrait accepter les scores quand le nombre de cellules résolues dépasse le total possible', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 1000,
      duration: 5,
      level: 'adulte',
      solvedCells: 130, // Plus que le total possible (grille remplie plusieurs fois)
      totalPossibleCells: 100,
      selectedTables: [2, 3, 4]
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    // Désormais on accepte ce cas, donc le statut devrait être 200 (succès)
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('devrait rejeter une soumission de score sans session (authentification requise)', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 500,
      duration: 5,
      level: 'adulte',
      solvedCells: 20,
      totalPossibleCells: 20,
      selectedTables: []
    });

    // Simuler aucun cookie de session (plus de mode invité)
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('devrait accepter un score et mettre à jour la progression pour un utilisateur connecté', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 500,
      duration: 5,
      level: 'adulte',
      solvedCells: 20,
      totalPossibleCells: 20,
      selectedTables: []
    });

    // Simuler un cookie de session (utilisateur connecté)
    mockCookies.get.mockReturnValue(JSON.stringify({
      user: {
        id: 'user-id',
        displayName: 'Joueur Test'
      }
    }));

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('progressUpdate');
    expect(response.body.progressUpdate).not.toBeNull();
    // Compat V1 (bug #2) : le client détecte le level-up sur ces champs précis
    expect(response.body.progressUpdate.returned_level).toBe(2);
    expect(response.body.progressUpdate.returned_previous_level).toBe(1);
    expect(response.body.progressUpdate.returned_level_title).toBe('Apprenti Calculateur');
    // Bloc rewards (pièces d'or, streak, coffres dus)
    expect(response.body.rewards).toEqual({
      coinsEarned: 50,
      coinsBalance: 150,
      coinsBreakdown: { base: 50 },
      streakDays: 1,
      freezeUsed: false,
      levelUp: true,
      chests: { levelup: true, streak: 0, perfect: false }
    });
  });

  it('devrait rejeter une seconde partie trop rapprochée (anti-replay)', async () => {
    mockRequest.json.mockResolvedValue({
      score: 200,
      duration: 3,
      level: 'adulte',
      gameMode: 'tables'
    });
    mockCookies.get.mockReturnValue(
      JSON.stringify({ user: { id: 'user-id', displayName: 'Joueur Test' } })
    );

    // Une partie récente existe déjà pour cet utilisateur
    mockDb.recentGame = true;

    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty('error');
  });

  it("l'anti-replay se base sur le temps réellement joué (elapsedSec), pas la durée nominale", async () => {
    mockRequest.json.mockResolvedValue({
      score: 50,
      duration: 3, // 180s nominal...
      elapsedSec: 15, // ...mais partie terminée tôt après 15s réelles
      level: 'adulte',
      gameMode: 'tables'
    });
    mockCookies.get.mockReturnValue(
      JSON.stringify({ user: { id: 'user-id', displayName: 'Joueur Test' } })
    );

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200); // pas de faux positif malgré une durée nominale de 3 min
    expect(mockDb.replayCalls).toHaveLength(1);
    expect(mockDb.replayCalls[0][1]).toBe(15); // make_interval(secs => 15), pas 180
  });

  it('devrait détecter une partie parfaite (errorsCount=0, >=10 questions) et la transmettre à add_game_rewards', async () => {
    mockRequest.json.mockResolvedValue({
      score: 400,
      duration: 3,
      level: 'adulte',
      gameMode: 'addition',
      modeOptions: { tiers: ['A1'] },
      questionsSolved: 15,
      errorsCount: 0
    });
    mockCookies.get.mockReturnValue(
      JSON.stringify({ user: { id: 'user-id', displayName: 'Joueur Test' } })
    );
    mockDb.rewardsResponse = {
      xp: 400,
      level: 1,
      previous_level: 1,
      level_up: false,
      streak_days: 1,
      freeze_used: false,
      coins_earned: 65,
      coins_balance: 65,
      coins_breakdown: { base: 40, perfect: 25 },
      streak_chest_due: 0,
      perfect_chest_due: true
    };

    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    // isPerfect calculé côté serveur (errorsCount===0 && >=10) et passé en 3e paramètre
    expect(mockDb.rewardsCalls).toHaveLength(1);
    expect(mockDb.rewardsCalls[0][2]).toBe(true);
    expect(response.body.rewards.chests.perfect).toBe(true);
  });

  it('devrait ignorer une partie à 0 point (aucun calcul résolu) : ni enregistrée, ni récompensée', async () => {
    mockRequest.json.mockResolvedValue({
      score: 0,
      duration: 3,
      level: 'adulte',
      gameMode: 'tables',
      questionsSolved: 0
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      counted: false,
      message: 'Partie non comptabilisée : aucun calcul résolu',
      gameData: null,
      gameMode: 'tables',
      xpEarned: 0,
      progressUpdate: null,
      rewards: null
    });
    // Ni requête anti-replay, ni appel à add_game_rewards.
    expect(mockDb.replayCalls).toHaveLength(0);
    expect(mockDb.rewardsCalls).toHaveLength(0);
  });

  it('devrait transmettre completed=false à add_game_rewards pour une fin anticipée ("Terminer la partie")', async () => {
    mockRequest.json.mockResolvedValue({
      score: 40,
      duration: 3,
      level: 'adulte',
      gameMode: 'tables',
      questionsSolved: 3,
      completed: false
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(mockDb.rewardsCalls).toHaveLength(1);
    expect(mockDb.rewardsCalls[0][3]).toBe(false);
  });

  it('devrait transmettre completed=true par défaut (fin naturelle / anciens clients)', async () => {
    mockRequest.json.mockResolvedValue({
      score: 400,
      duration: 3,
      level: 'adulte',
      gameMode: 'tables',
      questionsSolved: 20
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(mockDb.rewardsCalls).toHaveLength(1);
    expect(mockDb.rewardsCalls[0][3]).toBe(true);
  });

  it('devrait accepter un score avec plus de cellules résolues que possible (plusieurs grilles remplies)', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Excellent',
      score: 3000,
      duration: 5,
      level: 'adulte',
      solvedCells: 200, // Le joueur a rempli la grille deux fois (2 x 100 cellules)
      totalPossibleCells: 100,
      selectedTables: []
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Score enregistré avec succès');
  });

  // --- Tests V2 : multi-modes ---

  it('devrait accepter le nouveau payload V2 (gameMode + modeOptions)', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 400,
      duration: 3,
      level: 'adulte',
      gameMode: 'addition',
      modeOptions: { tiers: ['A1', 'A2', 'A3'] },
      questionsSolved: 25,
      questionsTotal: null,
      errorsCount: 2
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('gameMode', 'addition');
  });

  it('devrait accepter le mode division (activé)', async () => {
    mockRequest.json.mockResolvedValue({
      score: 100,
      duration: 3,
      level: 'adulte',
      gameMode: 'division',
      modeOptions: { tiers: ['D1'] }
    });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('gameMode', 'division');
  });

  it('devrait rejeter les modes inconnus', async () => {
    mockRequest.json.mockResolvedValue({
      score: 100,
      duration: 3,
      level: 'adulte',
      gameMode: 'nawak'
    });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('inconnu');
  });

  it('devrait rejeter des options de mode invalides (paliers inconnus)', async () => {
    mockRequest.json.mockResolvedValue({
      score: 100,
      duration: 3,
      level: 'adulte',
      gameMode: 'addition',
      modeOptions: { tiers: ['Z9'] }
    });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Options de mode invalides');
  });

  it('devrait accepter l\'ancien payload V1 sans gameMode (PWA en cache)', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Vieux Client',
      score: 300,
      duration: 3,
      level: 'enfant',
      solvedCells: 15,
      totalPossibleCells: 36,
      selectedTables: [2, 5]
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('gameMode', 'tables');
  });

  it('devrait rejeter un niveau invalide', async () => {
    mockRequest.json.mockResolvedValue({
      score: 100,
      duration: 3,
      level: 'expert'
    });
    const response = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response.status).toBe(400);
  });
});