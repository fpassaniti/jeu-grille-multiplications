// src/lib/stores/languageStore.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {defaultLanguage} from "$lib/translations/index.js";

// Initialiser la langue depuis localStorage ou utiliser la langue par défaut
const storedLanguage = browser && localStorage.getItem('language');
const initialLanguage = storedLanguage || defaultLanguage || 'fr';

// Créer le store writable
const language = writable(initialLanguage);

// Exporter un store personnalisé
const languageStore = {
  subscribe: language.subscribe,

  // Définir une nouvelle langue
  set: (newLanguage) => {
    if (browser) {
      try {
        localStorage.setItem('language', newLanguage);
      } catch (e) {
        console.warn('Could not save language to localStorage', e);
      }
    }
    language.set(newLanguage);
  },

  // Méthode d'aide pour obtenir la valeur actuelle
  get: () => {
    let currentLanguage;
    const unsubscribe = language.subscribe(value => {
      currentLanguage = value;
    });
    unsubscribe();
    return currentLanguage || defaultLanguage || 'fr';
  }
};

// Pour le débogage
if (browser) {
  console.log('Initial language:', initialLanguage);
}

export default languageStore;