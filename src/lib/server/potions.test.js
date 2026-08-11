import { describe, it, expect, vi, beforeEach } from 'vitest';

// Même pattern que ranking.test.js/server.test.js : `sql` est créé une seule
// fois à l'import de db.js, donc un état mutable partagé (vi.hoisted) piloté
// par ces tests plutôt qu'un mock par appel.
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    ownedRows: [],
    updateCalls: [],
    buyPotionResult: null
  }
}));

vi.mock('@neondatabase/serverless', () => {
  return {
    neon: vi.fn(() => {
      return async (strings, ...values) => {
        const query = typeof strings === 'string' ? strings : strings[0];
        if (query.includes('JOIN user_potions up ON up.potion_code = p.code AND up.user_id')) {
          return mockDb.ownedRows;
        }
        if (query.includes('UPDATE user_potions SET quantity')) {
          mockDb.updateCalls.push(values);
          return [];
        }
        if (query.includes('SELECT buy_potion')) {
          return [{ result: mockDb.buyPotionResult }];
        }
        return [];
      };
    })
  };
});

const { verifyAndConsumePotions, buyPotion } = await import('./potions.js');

describe('verifyAndConsumePotions', () => {
  beforeEach(() => {
    mockDb.ownedRows = [];
    mockDb.updateCalls = [];
  });

  it("ne touche pas la base si aucun code n'est fourni", async () => {
    const result = await verifyAndConsumePotions('user-1', [], { counted: true });
    expect(result).toEqual({ extraSec: 0, coinMultiplier: null, consumedCodes: [] });
    expect(mockDb.updateCalls).toHaveLength(0);
  });

  it('dérive extraSec depuis les potions time_bonus/time_grace possédées', async () => {
    mockDb.ownedRows = [
      { code: 'time_bonus_20', family: 'time_bonus', value: 20 },
      { code: 'time_grace', family: 'time_grace', value: 10 }
    ];
    const result = await verifyAndConsumePotions('user-1', ['time_bonus_20', 'time_grace'], {
      counted: false
    });
    expect(result.extraSec).toBe(30);
    expect(result.coinMultiplier).toBeNull();
    expect(result.consumedCodes.sort()).toEqual(['time_bonus_20', 'time_grace']);
    // Pas de décrément en mode "dry" (counted: false)
    expect(mockDb.updateCalls).toHaveLength(0);
  });

  it('dérive coinMultiplier depuis une potion coin_multiplier possédée', async () => {
    mockDb.ownedRows = [{ code: 'coin_x3', family: 'coin_multiplier', value: 3 }];
    const result = await verifyAndConsumePotions('user-1', ['coin_x3'], { counted: false });
    expect(result.coinMultiplier).toBe(3);
    expect(result.extraSec).toBe(0);
  });

  it('ne garde qu\'une potion par famille (dédoublonnage défensif)', async () => {
    mockDb.ownedRows = [
      { code: 'time_bonus_10', family: 'time_bonus', value: 10 },
      { code: 'time_bonus_30', family: 'time_bonus', value: 30 }
    ];
    const result = await verifyAndConsumePotions('user-1', ['time_bonus_10', 'time_bonus_30'], {
      counted: false
    });
    expect(result.extraSec).toBe(10);
    expect(result.consumedCodes).toEqual(['time_bonus_10']);
  });

  it('ignore silencieusement un code non possédé (absent de la jointure)', async () => {
    mockDb.ownedRows = [];
    const result = await verifyAndConsumePotions('user-1', ['coin_x5'], { counted: true });
    expect(result).toEqual({ extraSec: 0, coinMultiplier: null, consumedCodes: [] });
    expect(mockDb.updateCalls).toHaveLength(0);
  });

  it('décrémente le stock uniquement quand counted=true', async () => {
    mockDb.ownedRows = [{ code: 'coin_x2', family: 'coin_multiplier', value: 2 }];
    await verifyAndConsumePotions('user-1', ['coin_x2'], { counted: true });
    expect(mockDb.updateCalls).toHaveLength(1);
  });
});

describe('buyPotion', () => {
  it('renvoie le résultat de buy_potion()', async () => {
    mockDb.buyPotionResult = { success: true, pricePaid: 150, coinsBalance: 850 };
    const result = await buyPotion('user-1', 'coin_x2');
    expect(result).toEqual({ success: true, pricePaid: 150, coinsBalance: 850 });
  });
});
