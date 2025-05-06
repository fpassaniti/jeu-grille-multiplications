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

  it('devrait rejeter si le nombre de cellules résolues dépasse le total possible', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 1000,
      duration: 5,
      level: 'adulte',
      solvedCells: 30, // Plus que le total possible
      totalPossibleCells: 20,
      selectedTables: [2, 3, 4]
    });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('devrait accepter un score valide et retourner un succès pour un utilisateur non connecté', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Joueur Test',
      score: 500, // Score raisonnable
      duration: 5,
      level: 'adulte',
      solvedCells: 10,
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
      solvedCells: 10,
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

  it('devrait gérer correctement les scores pour le niveau enfant avec tables sélectionnées', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Enfant Test',
      score: 300,
      duration: 5,
      level: 'enfant',
      solvedCells: 8,
      totalPossibleCells: 15,
      selectedTables: [2, 5, 10]
    });

    // Simuler aucun cookie de session (utilisateur non connecté)
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    // Vérifier que les tables sélectionnées sont bien enregistrées
    expect(response.body.gameData).toHaveProperty('tables_used');
    expect(Array.isArray(response.body.gameData.tables_used)).toBe(true);
  });

  it('devrait ignorer les tables sélectionnées pour le niveau adulte', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Adulte Test',
      score: 400,
      duration: 5,
      level: 'adulte',
      solvedCells: 10,
      totalPossibleCells: 20,
      selectedTables: [3, 4, 5] // Ces tables devraient être ignorées en mode adulte
    });

    // Simuler aucun cookie de session (utilisateur non connecté)
    mockCookies.get.mockReturnValue(null);

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    // Vérifier que les tables sélectionnées sont ignorées (tableau vide)
    expect(response.body.gameData.tables_used).toEqual([]);
  });

  it('devrait gérer les erreurs de base de données correctement', async () => {
    mockRequest.json.mockResolvedValue({
      name: 'Test Error',
      score: 200,
      duration: 5,
      level: 'adulte',
      solvedCells: 5,
      totalPossibleCells: 20,
      selectedTables: []
    });

    // Mock spécifique pour ce test qui lance une erreur
    vi.mock('@supabase/supabase-js', () => {
      return {
        createClient: vi.fn(() => ({
          from: vi.fn(() => {
            throw new Error('Erreur de base de données simulée');
          }),
          rpc: vi.fn(() => {
            throw new Error('Erreur de fonction RPC simulée');
          })
        }))
      };
    }, { virtual: true });

    const response = await POST({ request: mockRequest, cookies: mockCookies });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  }, { retry: 0 });
});