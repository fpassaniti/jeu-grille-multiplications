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

// Mock de Neon
vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      return async (strings, ...values) => {
        const query = typeof strings === 'string' ? strings : strings[0];

        if (query.includes('SELECT') && query.includes('FROM users')) {
          // L'utilisateur 'newuser' n'existe pas (cas register) ; les autres existent (cas login)
          if (values.includes('newuser')) {
            return [];
          }
          if (values.includes('multi')) {
            // Smoothie stocké sous sa forme canonique (triée) : 🍎,🍇
            return [{ id: 'user-id', username: 'multi', display_name: 'Multi User', password_emojis: '🍎,🍇' }];
          }
          return [{ id: 'user-id', username: 'test', display_name: 'Test User', password_emojis: '🍎' }];
        }
        if (query.includes('UPDATE users')) {
          return [];
        }
        if (query.includes('SELECT * FROM create_new_user')) {
          return [{ user_id: 'new-user-id', username: 'newuser', display_name: 'New User' }];
        }

        return [];
      };
    })
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
    vi.clearAllMocks();
  });

  describe('Endpoint login', () => {
    it('devrait retourner une erreur 400 si les données de connexion sont manquantes', async () => {
      mockRequest.json.mockResolvedValue({
        // username et smoothie manquants
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Nom d\'utilisateur et smoothie requis');
    });

    it('devrait retourner une erreur 401 si le mot de passe est incorrect', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'test',
        smoothie: ['🍌'] // Différent de celui stocké (🍎)
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Mot de passe incorrect');
    });

    it('devrait réussir la connexion avec les bonnes informations', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'test',
        smoothie: ['🍎']
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body).toHaveProperty('user');
      expect(mockCookies.set).toHaveBeenCalled();
    });

    it('devrait réussir la connexion avec un smoothie multi-emoji cliqué dans le désordre', async () => {
      // L'utilisateur mocké a pour smoothie stocké la clé triée de 🍎+🍇 (voir smoothieKey)
      mockRequest.json.mockResolvedValue({
        username: 'multi',
        smoothie: ['🍇', '🍎'] // ordre inverse de la sélection d'origine, doit tout de même matcher
      });

      const response = await loginPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Endpoint register', () => {
    it('devrait retourner une erreur 400 si les données d\'inscription sont incomplètes', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        // smoothie manquant
      });

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Nom d\'utilisateur et smoothie requis');
    });

    it('devrait retourner une erreur 400 si le smoothie contient plus de 3 emoji', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        smoothie: ['🍎', '🍌', '🍇', '🍓'] // 4 emoji, au-delà de la limite
      });

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Le smoothie doit contenir 1 à 3 emoji distincts de la palette');
    });

    it('devrait retourner une erreur 400 si le mode adulte/enfant est manquant', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        smoothie: ['🍎']
        // playerMode manquant
      });

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Mode adulte/enfant requis');
    });

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      mockRequest.json.mockResolvedValue({
        username: 'newuser',
        smoothie: ['🍎', '🍇'],
        displayName: 'New User',
        playerMode: 'adulte'
      });

      const response = await registerPost({ request: mockRequest, cookies: mockCookies });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Compte créé avec succès');
      expect(response.body).toHaveProperty('user');
      expect(mockCookies.set).toHaveBeenCalled();
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