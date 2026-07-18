import { vi } from 'vitest';

// Mock des variables d'environnement Neon
vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      // Return a sql template function
      return async (strings, ...values) => {
        // Return mock data based on the query
        const query = typeof strings === 'string' ? strings : strings.join('?');

        // Mock responses for common queries
        if (query.includes('SELECT') && query.includes('user_progress')) {
          return [{ id: 1, user_id: 'test-user', xp: 100, level: 1 }];
        }
        if (query.includes('SELECT') && query.includes('scores')) {
          return [
            { id: 1, name: 'Joueur 1', score: 100, duration: 5, level: 'adulte', date: '2023-01-01' },
            { id: 2, name: 'Joueur 2', score: 90, duration: 5, level: 'adulte', date: '2023-01-01' }
          ];
        }
        if (query.includes('INSERT')) {
          return [{ id: 1, name: 'Test', score: 100 }];
        }
        if (query.includes('SELECT') && query.includes('level_definitions')) {
          return [{ level: 1, title: 'Novice', min_xp: 0 }];
        }

        return [];
      };
    })
  };
});

// Mock des variables d'environnement
process.env.DATABASE_URL = 'postgresql://fake:fake@fake.neon.tech/fake';

// jsdom sous Vitest 1.6 n'expose pas localStorage : stub minimal pour les
// modules qui y accèdent à l'import (languageStore). Les tests qui pilotent
// localStorage (persistence.test.js) posent leur propre stub par-dessus.
if (typeof globalThis.localStorage === 'undefined') {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear()
  };
}