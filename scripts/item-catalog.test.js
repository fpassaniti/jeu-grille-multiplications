import { describe, it, expect } from 'vitest';
import { ITEMS, PRICES, priceOf } from './item-catalog.mjs';

const SLOTS = ['background', 'aura', 'back', 'body', 'outfit', 'weapon', 'hat', 'pet'];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];

describe('catalogue d\'items (SPEC §5.9)', () => {
  it('45 items au total (42 catalogue + 3 défauts)', () => {
    const defaults = ITEMS.filter((i) => i.isDefault);
    const catalogue = ITEMS.filter((i) => !i.isDefault);
    expect(defaults.length).toBe(3);
    expect(catalogue.length).toBe(45);
  });

  it('codes uniques', () => {
    const codes = ITEMS.map((i) => i.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('chaque item a un slot et (rareté ou défaut) valides', () => {
    for (const item of ITEMS) {
      expect(SLOTS).toContain(item.slot);
      if (item.isDefault) {
        expect(item.rarity).toBeNull();
        expect(priceOf(item)).toBe(0);
      } else {
        expect(RARITIES).toContain(item.rarity);
        expect(priceOf(item)).toBe(PRICES[item.rarity]);
      }
    }
  });

  it('les 3 défauts sont non-achetables et sur les slots body/outfit/weapon', () => {
    const defaults = ITEMS.filter((i) => i.isDefault);
    expect(defaults.map((i) => i.slot).sort()).toEqual(['body', 'outfit', 'weapon']);
    defaults.forEach((i) => expect(i.isPurchasable).toBe(false));
  });

  it('6 items exclusifs (is_purchasable=false, hors défauts) couvrant les niveaux 5/10/15/20/25/30', () => {
    const exclusive = ITEMS.filter((i) => !i.isDefault && !i.isPurchasable);
    expect(exclusive.length).toBe(6);
    expect(exclusive.map((i) => i.unlockLevel).sort((a, b) => a - b)).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it('chaque nom est traduit dans les 4 langues', () => {
    for (const item of ITEMS) {
      for (const lang of ['fr', 'en', 'es', 'zh']) {
        expect(item.names[lang], `${item.code}.${lang}`).toBeTruthy();
      }
    }
  });

  it('respecte les quantités par slot de la SPEC (hors défauts)', () => {
    const counts = {};
    for (const item of ITEMS.filter((i) => !i.isDefault)) {
      counts[item.slot] = (counts[item.slot] ?? 0) + 1;
    }
    expect(counts).toEqual({
      body: 5,
      outfit: 7,
      hat: 7,
      weapon: 6,
      back: 5,
      pet: 7,
      background: 5,
      aura: 3
    });
  });
});
