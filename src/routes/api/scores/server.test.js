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
      score: 5000, // Score trop élevé pour seulement 2 cellules
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

  it('devrait accepter un score valide et retourner un succès pour un utilisateur non connecté', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 500, // Score raisonnable
      duration: 5,
      level: 'adulte',
      solvedCells: 20,
      totalPossibleCells: 20,
      selectedTables: []
    });

    // Simuler aucun cookie de session (utilisateur non connecté)
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Score enregistré avec succès');
    expect(response.body).toHaveProperty('gameData');
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

    // Simuler aucun cookie de session (utilisateur non connecté)
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Score enregistré avec succès');
  });

  // Les autres tests restent identiques...
});