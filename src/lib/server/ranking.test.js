import { describe, it, expect, vi, beforeEach } from 'vitest';

// `sql` (src/lib/server/db.js) est créé UNE SEULE FOIS via neon(url) à l'import
// du module — on passe par un état mutable partagé (vi.hoisted), même pattern
// que src/routes/api/scores/server.test.js.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    // Rangées déjà triées par XP desc, comme le ferait la vraie requête SQL.
    rows: []
  }
}));

vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      return async (strings) => {
        const query = typeof strings === 'string' ? strings : strings[0];
        if (query.includes('FROM users u')) {
          return mockDb.rows;
        }
        return [];
      };
    })
  };
});

const { getRanking } = await import('./ranking.js');

function makeRows(count, mode = 'adulte') {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    display_name: `Joueur ${i}`,
    xp: (count - i) * 100,
    level: 5,
    games_played: 10,
    color_theme: 'blue'
  }));
}

describe('getRanking', () => {
  beforeEach(() => {
    mockDb.rows = [];
  });

  it('classe par XP décroissant et limite le top à 20', async () => {
    mockDb.rows = makeRows(25);

    const result = await getRanking('adulte');

    expect(result.total).toBe(25);
    expect(result.top).toHaveLength(20);
    expect(result.top[0]).toMatchObject({ rank: 1, displayName: 'Joueur 0', xp: 2500 });
    expect(result.top[19]).toMatchObject({ rank: 20, displayName: 'Joueur 19' });
  });

  it("expose la position du joueur connecté même hors du top 20", async () => {
    mockDb.rows = makeRows(25);

    const result = await getRanking('adulte', 'user-24');

    expect(result.viewerEntry).toMatchObject({ rank: 25, displayName: 'Joueur 24' });
    expect(result.top.some(entry => entry.isViewer)).toBe(false);
  });

  it('retourne viewerEntry=null quand le joueur connecté ne joue pas dans ce mode', async () => {
    mockDb.rows = makeRows(5);

    const result = await getRanking('enfant', 'user-not-in-this-mode');

    expect(result.viewerEntry).toBeNull();
  });

  it('retourne un classement vide sans erreur si aucun joueur dans ce mode', async () => {
    mockDb.rows = [];

    const result = await getRanking('enfant');

    expect(result.total).toBe(0);
    expect(result.top).toEqual([]);
    expect(result.viewerEntry).toBeNull();
  });
});
