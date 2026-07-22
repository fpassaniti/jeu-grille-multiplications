import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server.js';

vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit');
  return {
    ...actual,
    redirect: vi.fn((code, path) => {
      throw new Error(`Redirect ${code} to ${path}`);
    })
  };
});

describe('Dashboard Page Server (route retirée)', () => {
  it('redirige toujours vers la nouvelle page d\'accueil (dashboard fusionné dans /)', () => {
    expect(() => load()).toThrow('Redirect 301 to /');
  });
});
