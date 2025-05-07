import { writable } from 'svelte/store';

// Store pour la langue actuelle
// Par défaut en français
const languageStore = writable('fr');

export default languageStore;