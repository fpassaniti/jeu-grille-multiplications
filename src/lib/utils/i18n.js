import { getTranslation as getTranslationFromFile } from '$lib/translations';
import languageStore from '$lib/stores/languageStore';
import { get } from 'svelte/store';

// Custom Svelte action for translations
export function t(node, options) {
  const update = (key, params = {}) => {
    const lang = get(languageStore);
    node.textContent = getTranslationFromFile(lang, key, params);
  };

  if (typeof options === 'string') {
    // If options is a string, it's the translation key
    update(options);
  } else if (options && options.key) {
    // If options is an object with a key property
    update(options.key, options.params || {});
  }

  // Subscribe to language changes
  const unsubscribe = languageStore.subscribe(() => {
    if (typeof options === 'string') {
      update(options);
    } else if (options && options.key) {
      update(options.key, options.params || {});
    }
  });

  return {
    update(newOptions) {
      if (typeof newOptions === 'string') {
        update(newOptions);
      } else if (newOptions && newOptions.key) {
        update(newOptions.key, newOptions.params || {});
      }
    },
    destroy() {
      unsubscribe();
    }
  };
}

// Helper function to get a translation
export function _(key, params = {}) {
  const lang = get(languageStore);
  return getTranslationFromFile(lang, key, params);
}

// Function to change the language
export function setLanguage(lang) {
  languageStore.set(lang);
}

// Function to get the current language
export function getLanguage() {
  return get(languageStore);
}

// Function to get translations for a specific locale
export function getTranslation(locale) {
  return (key, params = {}) => getTranslationFromFile(locale, key, params);
}