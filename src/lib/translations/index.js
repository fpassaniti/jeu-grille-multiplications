import fr from './fr';
import en from './en';
import es from './es';

export const languages = {
  fr: 'Français',
  en: 'English',
  es: 'Español'
};

export const translations = {
  fr,
  en,
  es
};

export const defaultLanguage = 'fr';

export const getTranslation = (lang, key, params = {}) => {
  // Split the key by dots to navigate the nested structure
  const keys = key.split('.');
  let value = translations[lang] || translations[defaultLanguage];
  
  // Navigate through the nested structure
  for (const k of keys) {
    if (!value[k]) {
      console.warn(`Translation missing for key: ${key} in language: ${lang}`);
      // Try to get the translation from the default language
      value = translations[defaultLanguage];
      for (const defaultK of keys) {
        if (!value[defaultK]) {
          return key; // Return the key if the translation is not found in the default language
        }
        value = value[defaultK];
      }
      break;
    }
    value = value[k];
  }
  
  // If the value is not a string, return the key
  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string for key: ${key} in language: ${lang}`);
    return key;
  }
  
  // Replace parameters in the translation
  return value.replace(/{([^}]+)}/g, (match, name) => {
    return params[name] !== undefined ? params[name] : match;
  });
};