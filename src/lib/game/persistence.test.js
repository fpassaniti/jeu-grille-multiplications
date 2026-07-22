import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { defaultSettings, loadSettings, saveSettings, optionsFor } from './persistence.js';

// localStorage factice pour l'environnement node
function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear()
  };
}

const KEY = 'multyfun.gameSettings.v2';
const LEGACY_KEY = 'selectedMultiplicationTables';

beforeEach(() => {
  globalThis.localStorage = makeStorage();
});

afterAll(() => {
  delete globalThis.localStorage;
});

describe('persistence des réglages', () => {
  it('sans rien en stock : défauts', () => {
    expect(loadSettings()).toEqual(defaultSettings());
  });

  it('aller-retour save/load', () => {
    const settings = {
      lastMode: 'addition',
      level: 'enfant',
      duration: 5,
      optionsByMode: { addition: { tiers: ['A1', 'A2'] } }
    };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('JSON corrompu → défauts', () => {
    localStorage.setItem(KEY, '{pas du json');
    expect(loadSettings()).toEqual(defaultSettings());
  });

  it('champs invalides ignorés champ par champ', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        lastMode: 'nawak',
        level: 'expert',
        duration: 42,
        optionsByMode: { addition: { tiers: ['Z9'] }, subtraction: { tiers: ['S1'] } }
      })
    );
    const settings = loadSettings();
    expect(settings.lastMode).toBe('tables');
    expect(settings.level).toBe('adulte');
    expect(settings.duration).toBe(3);
    expect(settings.optionsByMode).toEqual({ subtraction: { tiers: ['S1'] } });
  });

  it('migre la clé V1 selectedMultiplicationTables (boolean[10])', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify([false, true, true, false, true, false, false, false, false, true])
    );
    const settings = loadSettings();
    expect(settings.optionsByMode.tables).toEqual({ selectedTables: [2, 3, 5, 10] });
    // migration écrite en V2, clé V1 laissée en place (PWA en cache)
    expect(localStorage.getItem(KEY)).not.toBeNull();
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
    // la V2 fait foi ensuite
    expect(loadSettings().optionsByMode.tables).toEqual({ selectedTables: [2, 3, 5, 10] });
  });

  it('optionsFor : réglages sauvegardés sinon défauts du mode (copies)', () => {
    const settings = defaultSettings();
    expect(optionsFor(settings, 'addition')).toEqual({ tiers: ['A1', 'A2', 'A3'] });
    settings.optionsByMode.addition = { tiers: ['A5'] };
    const opts = optionsFor(settings, 'addition');
    expect(opts).toEqual({ tiers: ['A5'] });
    opts.tiers.push('A6');
    expect(settings.optionsByMode.addition.tiers).toHaveLength(1);
  });

  it('optionsFor : ne plante pas avec un objet réactif Svelte 5 ($state)', () => {
    // Régression : `settings` vient d'un $state() dans /play/+page.svelte, donc ses
    // valeurs imbriquées sont des Proxy. structuredClone() rejette tout Proxy
    // ("could not be cloned"), même transparent — ce qui cassait le $derived
    // currentOptions dès la 1re sélection de difficulté et gelait tous les boutons.
    const reactiveOptions = new Proxy({ tiers: ['A5'] }, {});
    const settings = { ...defaultSettings(), optionsByMode: { addition: reactiveOptions } };
    expect(() => optionsFor(settings, 'addition')).not.toThrow();
    expect(optionsFor(settings, 'addition')).toEqual({ tiers: ['A5'] });
  });
});
