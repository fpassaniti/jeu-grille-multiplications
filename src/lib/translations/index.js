// src/lib/translations/index.js
import fr from './fr';
import en from './en';
import es from './es';

// Définition des langues disponibles avec leurs noms d'affichage
export const languages = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸'
};

// Langue par défaut
export const defaultLanguage = 'fr';

// Traductions complètes
export const translations = {
  fr,
  en,
  es
};

/**
 * Récupère une traduction spécifique
 * @param {string} locale - Code de langue (fr, en, es...)
 * @param {string} key - Clé de traduction (peut être imbriquée avec des points)
 * @param {Object} params - Paramètres à remplacer dans la traduction
 * @returns {string} - Traduction ou clé si non trouvée
 */
export function getTranslation(locale, key, params = {}) {
  // Vérifier si la langue existe
  if (!locale || !translations[locale]) {
    locale = defaultLanguage;
  }

  // Diviser la clé pour naviguer dans l'objet de traductions
  const keys = key.split('.');
  let value = translations[locale];

  // Naviguer dans la structure imbriquée
  for (const k of keys) {
    if (!value || typeof value[k] === 'undefined') {
      // Si la clé n'est pas trouvée dans la langue courante, essayer la langue par défaut
      if (locale !== defaultLanguage) {
        return getTranslationFromDefault(key, params);
      }

      // Si la clé n'existe pas même dans la langue par défaut, retourner la clé
      console.warn(`Translation key "${key}" not found`);
      return key;
    }

    value = value[k];
  }

  // Si la valeur n'est pas une chaîne, retourner la clé
  if (typeof value !== 'string') {
    return key;
  }

  // Remplacer les paramètres dans la traduction
  return replaceParams(value, params);
}

// Fonction auxiliaire pour récupérer une traduction de la langue par défaut
function getTranslationFromDefault(key, params) {
  const keys = key.split('.');
  let value = translations[defaultLanguage];

  for (const k of keys) {
    if (!value || typeof value[k] === 'undefined') {
      console.warn(`Translation key "${key}" not found in default language`);
      return key;
    }

    value = value[k];
  }

  return typeof value === 'string' ? replaceParams(value, params) : key;
}

// Fonction pour remplacer les paramètres dans une chaîne
function replaceParams(text, params) {
  return text.replace(/{([^}]+)}/g, (match, name) => {
    return params[name] !== undefined ? params[name] : match;
  });
}