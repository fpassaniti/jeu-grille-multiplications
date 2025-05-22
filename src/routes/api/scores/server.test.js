// src/routes/api/scores/server.test.js - mise à jour des tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './+server.js';

// Mock for tokenStore
let mockActiveTokens;
vi.mock('../../../lib/server/tokenStore.js', () => {
  mockActiveTokens = new Set();
  return {
    activeGameTokens: mockActiveTokens
  };
});

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
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    rpc: vi.fn(() => mockSupabase),
    data: [{ id: 'mock-id', score: 100 }],
    error: null
  };

  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => mockSupabase),
      rpc: vi.fn(() => Promise.resolve({ data: [{ returned_user_id: 'user-id', returned_xp: 100, returned_level: 1, returned_streak_days: 1, returned_total_score: 100 }], error: null }))
    }))
  };
});

describe('Endpoint API /api/scores', () => {
  let mockRequest;
  let mockCookies;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();
    mockActiveTokens.clear(); // Clear the token set

    // Créer un mock de la requête
    mockRequest = {
      json: vi.fn()
    };

    // Créer un mock des cookies
    mockCookies = {
      get: vi.fn()
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
    mockActiveTokens.clear();
  });

  it('devrait retourner une erreur 400 si des données requises sont manquantes (hors token)', async () => {
    const token = 'valid-token-for-missing-data';
    mockActiveTokens.add(token);
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 100,
      // duration manquant
      level: 'adulte',
      sessionToken: token
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Informations manquantes');
  });

  // This test case is commented out because the underlying logic in +server.js for rejecting
  // scores based on solvedCells vs totalPossibleCells (score too high for cells solved)
  // was intentionally removed, as noted by the comment:
  // "Modification: On permet maintenant que solvedCells > totalPossibleCells"
  // "Nous n'imposons plus la contrainte solvedCells <= totalPossibleCells"
  // Therefore, this test as originally written would fail because the check it's testing no longer exists.
  // To make it pass now, it would need a valid token and would result in a 200.
  /*
  it('devrait rejeter un score trop élevé par rapport aux cellules résolues', async () => {
    const token = 'token-for-high-score-test';
    mockActiveTokens.add(token);
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 5000, // Score trop élevé pour seulement 2 cellules
      duration: 5,
      level: 'adulte',
      solvedCells: 2, // Peu de cellules
      totalPossibleCells: 20,
      selectedTables: [2, 3, 4],
      sessionToken: token
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    // This would now be a 200 if the token is valid, as the specific score check is removed.
    // If the intent was to test *other* 400 errors, that should be a different test.
    // For now, keeping it commented to reflect its obsolete nature.
    // expect(response.status).toBe(400);
    // expect(response.body).toHaveProperty('error');
  });
  */

  // Test modifié pour refléter la nouvelle fonctionnalité : on accepte les solvedCells > totalPossibleCells
  it('devrait accepter les scores quand le nombre de cellules résolues dépasse le total possible (avec token valide)', async () => {
    const token = 'valid-token-for-many-cells';
    mockActiveTokens.add(token);
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 1000,
      duration: 5,
      level: 'adulte',
      solvedCells: 130, // Plus que le total possible (grille remplie plusieurs fois)
      totalPossibleCells: 100,
      selectedTables: [2, 3, 4],
      sessionToken: token
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(mockActiveTokens.has(token)).toBe(false);
  });

  it('devrait accepter un score valide et retourner un succès pour un utilisateur non connecté (avec token valide)', async () => {
    const token = 'valid-token-guest';
    mockActiveTokens.add(token);
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 500, // Score raisonnable
      duration: 5,
      level: 'adulte',
      solvedCells: 20,
      totalPossibleCells: 20,
      selectedTables: [],
      sessionToken: token
    });

    mockCookies.get.mockReturnValue(null); // Simuler aucun cookie de session

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Score enregistré avec succès');
    expect(response.body).toHaveProperty('gameData');
    expect(mockActiveTokens.has(token)).toBe(false);
  });

  it('devrait accepter un score et mettre à jour la progression pour un utilisateur connecté (avec token valide)', async () => {
    const token = 'valid-token-user';
    mockActiveTokens.add(token);
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 500,
      duration: 5,
      level: 'adulte',
      solvedCells: 20,
      totalPossibleCells: 20,
      selectedTables: [],
      sessionToken: token
    });

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
    expect(mockActiveTokens.has(token)).toBe(false);
  });

  it('devrait accepter un score avec plus de cellules résolues que possible (plusieurs grilles remplies, avec token valide)', async () => {
    const token = 'valid-token-many-cells-again';
    mockActiveTokens.add(token);
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Excellent',
      score: 3000,
      duration: 5,
      level: 'adulte',
      solvedCells: 200, // Le joueur a rempli la grille deux fois (2 x 100 cellules)
      totalPossibleCells: 100,
      selectedTables: [],
      sessionToken: token
    });

    mockCookies.get.mockReturnValue(null); // Simuler aucun cookie de session

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Score enregistré avec succès');
    expect(mockActiveTokens.has(token)).toBe(false);
  });

  // Nouveaux tests pour la validation du token de session
  it('devrait rejeter avec 400 si le sessionToken est manquant', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 100,
      duration: 3,
      level: 'adulte',
      solvedCells: 10,
      totalPossibleCells: 100
      // sessionToken est manquant
    });
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Session token manquant');
  });

  it('devrait rejeter avec 403 si le sessionToken est invalide ou non enregistré', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 100,
      duration: 3,
      level: 'adulte',
      solvedCells: 10,
      totalPossibleCells: 100,
      sessionToken: 'token-invalide-non-enregistre'
    });
    mockCookies.get.mockReturnValue(null);
    // mockActiveTokens ne contient pas 'token-invalide-non-enregistre'

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', 'Jeton de session invalide ou expiré');
  });

  it('devrait accepter le score avec un sessionToken valide et supprimer le token', async () => {
    const tokenValide = 'token-valide-pour-test';
    mockActiveTokens.add(tokenValide);

    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 100,
      duration: 3,
      level: 'adulte',
      solvedCells: 10,
      totalPossibleCells: 100,
      sessionToken: tokenValide
    });
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(mockActiveTokens.has(tokenValide)).toBe(false); // Vérifier que le token a été supprimé
  });

  it('devrait rejeter avec 403 si un sessionToken est réutilisé', async () => {
    const tokenReutilise = 'token-a-reutiliser';
    mockActiveTokens.add(tokenReutilise);

    // Premier appel avec le token (devrait réussir et consommer le token)
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test 1',
      score: 100,
      duration: 3,
      level: 'adulte',
      solvedCells: 10,
      totalPossibleCells: 100,
      sessionToken: tokenReutilise
    });
    mockCookies.get.mockReturnValue(null);
    const response1 = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response1.status).toBe(200);
    expect(mockActiveTokens.has(tokenReutilise)).toBe(false); // Token consommé

    // Deuxième appel avec le même token (devrait échouer)
    mockRequest.json.mockResolvedValue({ // Configurer pour le deuxième appel
      name: 'Joueur Test 2',
      score: 150,
      duration: 3,
      level: 'adulte',
      solvedCells: 15,
      totalPossibleCells: 100,
      sessionToken: tokenReutilise
    });
    const response2 = await POST({ request: mockRequest, cookies: mockCookies });
    expect(response2.status).toBe(403);
    expect(response2.body).toHaveProperty('error', 'Jeton de session invalide ou expiré');
  });
});