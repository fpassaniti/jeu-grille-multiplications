import { vi } from 'vitest';

// Mock des variables d'environnement Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: [{ id: 1, name: 'Test', score: 100 }],
            error: null
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [
                  { id: 1, name: 'Joueur 1', score: 100, duration: 5, level: 'adulte', date: '2023-01-01' },
                  { id: 2, name: 'Joueur 2', score: 90, duration: 5, level: 'adulte', date: '2023-01-01' }
                ],
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  };
});

// Mock des variables d'environnement
process.env.VITE_SUPABASE_URL = 'https://fake-supabase-url.com';
process.env.VITE_SUPABASE_SERVICE_KEY = 'fake-supabase-service-key';