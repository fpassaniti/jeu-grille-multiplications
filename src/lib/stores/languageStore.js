import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { defaultLanguage } from '$lib/translations';

// Initialize the language from localStorage or default to 'fr'
const storedLanguage = browser && localStorage.getItem('language');
const initialLanguage = storedLanguage || defaultLanguage;

// Create the writable store
const language = writable(initialLanguage);

// Export a custom store
const languageStore = {
  subscribe: language.subscribe,
  set: (newLanguage) => {
    if (browser) {
      localStorage.setItem('language', newLanguage);
    }
    language.set(newLanguage);
  },
  // Helper method to get the current language value
  get: () => {
    let currentLanguage;
    const unsubscribe = language.subscribe(value => {
      currentLanguage = value;
    });
    unsubscribe();
    return currentLanguage;
  }
};

export default languageStore;