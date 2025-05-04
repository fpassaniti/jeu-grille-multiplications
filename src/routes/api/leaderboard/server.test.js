import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server.js';

// Mock des fonctions de SvelteKit
vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit');
  return {
    ...actual,
    json: vi.fn((data, options) => ({ status: options?.status || 200, body: data }))
  };
});

describe('Endpoint API /api/leaderboard', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();
  });

  it('devrait retourner les classements des adultes et des enfants', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('adult');
    expect(response.body).toHaveProperty('child');
    
    // Vérifier que les données ont le bon format
    expect(Array.isArray(response.body.adult)).toBe(true);
    expect(Array.isArray(response.body.child)).toBe(true);
  });

  it('devrait contenir les propriétés requises pour chaque entrée du classement', async () => {
    const response = await GET();

    // Vérifier les données des adultes
    if (response.body.adult.length > 0) {
      const adultEntry = response.body.adult[0];
      expect(adultEntry).toHaveProperty('id');
      expect(adultEntry).toHaveProperty('name');
      expect(adultEntry).toHaveProperty('score');
      expect(adultEntry).toHaveProperty('duration');
      expect(adultEntry).toHaveProperty('level');
      expect(adultEntry).toHaveProperty('date');
    }

    // Vérifier les données des enfants
    if (response.body.child.length > 0) {
      const childEntry = response.body.child[0];
      expect(childEntry).toHaveProperty('id');
      expect(childEntry).toHaveProperty('name');
      expect(childEntry).toHaveProperty('score');
      expect(childEntry).toHaveProperty('duration');
      expect(childEntry).toHaveProperty('level');
      expect(childEntry).toHaveProperty('date');
    }
  });

  it('devrait limiter les résultats à 10 entrées par catégorie', async () => {
    const response = await GET();

    // S'assurer que le nombre d'entrées ne dépasse pas 10
    expect(response.body.adult.length).toBeLessThanOrEqual(10);
    expect(response.body.child.length).toBeLessThanOrEqual(10);
  });

  it('devrait gérer les erreurs de la base de données correctement', async () => {
    // Modifier le mock pour simuler une erreur de base de données
    const mockSupabase = await import('@supabase/supabase-js');
    
    // Sauvegarde de l'implémentation actuelle
    const originalCreateClient = mockSupabase.createClient;
    
    // Remplacer par une implémentation qui génère une erreur
    mockSupabase.createClient = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: null,
                error: { message: 'Erreur de base de données simulée' }
              }))
            }))
          }))
        }))
      }))
    }));

    // Exécuter le test
    const response = await GET();

    // Restaurer l'implémentation d'origine
    mockSupabase.createClient = originalCreateClient;

    // Vérifier que l'erreur est gérée correctement
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Erreur serveur lors du chargement des classements');
  });

  it('devrait retourner des tableaux vides si aucun score n\'existe', async () => {
    // Modifier le mock pour simuler une base de données vide
    const mockSupabase = await import('@supabase/supabase-js');
    
    // Sauvegarde de l'implémentation actuelle
    const originalCreateClient = mockSupabase.createClient;
    
    // Remplacer par une implémentation qui retourne des tableaux vides
    mockSupabase.createClient = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      }))
    }));

    // Exécuter le test
    const response = await GET();

    // Restaurer l'implémentation d'origine
    mockSupabase.createClient = originalCreateClient;

    // Vérifier que des tableaux vides sont retournés
    expect(response.status).toBe(200);
    expect(response.body.adult).toEqual([]);
    expect(response.body.child).toEqual([]);
  });
});