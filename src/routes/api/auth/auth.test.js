import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as loginPost } from './login/+server.js';
import { POST as registerPost } from './register/+server.js';
import { POST as logoutPost } from './logout/+server.js';

// Mock des fonctions de SvelteKit
vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit');
  return {
    ...actual,
    json: vi.fn((data, options) => ({ status: options?.status || 200, body: data }))
  };
});

// Mock de Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: { id: 'user-id', username: 'test', display_name: 'Test User', password_char: '🍎' },
              error: null
            })),
            single: vi.fn(() => Promise.resolve({
              data: { id: 'user-id', username: 'test', display_name: 'Test User', password_char: '🍎' },
              error: null
            }))
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: [{ id: 'new-user-id' }],
            error: null
          }))
        })),
        update: vi.fn(() => Promise.resolve({
          data: { success: true },
          error: null
        }))
      })),
      rpc: vi.fn(() => Promise.resolve({
        data: 'new-user-id',
        error: null
      }))
    }))
  };
});

describe('API d\'authentification', () => {
  let mockRequest;
  let mockCookies;

  beforeEach(() => {
    vi.clearAllMocks();

    // Créer un mock de la requête
    mockRequest = {
      json: vi.fn()
    };

    // Créer un mock des cookies
    mockCookies = {
      set: vi.fn(),
      delete: vi.fn()
    };

    // Restaurer la fonction crypto.randomUUID si elle a été mockée
    if (global.crypto && global.crypto.randomUUID) {
      const originalRandomUUID = global.crypto.randomUUID;
      global.crypto.randomUUID = originalRandomUUID;
    } else {
      global.crypto = {
        ...global.crypto,
        randomUUID: vi.fn(() => 'mock-uuid')
      };
    }
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Endpoint login', () => {
    it('devrait retourner une erreur 400 si les données de connexion sont manquantes', async () => {
      mockRequest.json.mockResolvedValue({
        // username et passwordChar manquants
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Nom d\'utilisateur et caractère de mot de passe requis');
    });

    it('devrait retourner une erreur 401 si le mot de passe est incorrect', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'test',
        passwordChar: '🍌' // Différent de celui stocké (🍎)
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Mot de passe incorrect');
    });

    it('devrait réussir la connexion avec les bonnes informations', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'test',
        passwordChar: '🍎'
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body).toHaveProperty('user');
      expect(mockCookies.set).toHaveBeenCalled();
    });
  });

  describe('Endpoint register', () => {
    it('devrait retourner une erreur 400 si les données d\'inscription sont incomplètes', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        // passwordChar manquant
      });

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Nom d\'utilisateur et caractère de mot de passe requis');
    });

    it('devrait retourner une erreur 400 si le mot de passe n\'est pas un caractère unique', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        passwordChar: '🍎🍌' // Plus d'un caractère
      });

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Le mot de passe doit être un seul caractère');
    });

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        passwordChar: '🍎',
        displayName: 'New User'
      });

      // Modifier le comportement du mock pour simuler un utilisateur inexistant
      const supabaseModule = await import('@supabase/supabase-js');
      const originalCreateClient = supabaseModule.createClient;

      supabaseModule.createClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: null, // Aucun utilisateur existant
                error: null
              }))
            }))
          }))
        })),
        rpc: vi.fn(() => Promise.resolve({
          data: 'new-user-id',
          error: null
        }))
      }));

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      // Restaurer le mock original
      supabaseModule.createClient = originalCreateClient;

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Compte créé avec succès');
      expect(response.body).toHaveProperty('user');
      expect(mockCookies.set).toHaveBeenCalled();
    });

    it('devrait retourner une erreur 409 si le nom d\'utilisateur existe déjà', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'existinguser',
        passwordChar: '🍎',
        displayName: 'Existing User'
      });

      // Modifier le comportement du mock pour simuler un utilisateur existant
      const supabaseModule = await import('@supabase/supabase-js');
      const originalCreateClient = supabaseModule.createClient;

      supabaseModule.createClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: { id: 'existing-id' }, // Utilisateur existant
                error: null
              }))
            }))
          }))
        }))
      }));

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      // Restaurer le mock original
      supabaseModule.createClient = originalCreateClient;

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Ce nom d\'utilisateur est déjà pris');
    });
  });

  describe('Endpoint logout', () => {
    it('devrait déconnecter l\'utilisateur et supprimer le cookie de session', async () => {
      const response = await logoutPost({ cookies: mockCookies });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Déconnexion réussie');
      expect(mockCookies.delete).toHaveBeenCalledWith('session', { path: '/' });
    });
  });
});