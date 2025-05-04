import { writable, derived } from 'svelte/store';

// Store pour les tables sélectionnées
export const selectedTables = writable(Array(10).fill(true));

// Getter pour obtenir les nombres des tables sélectionnées
export const getSelectedTableNumbers = () => {
  let storeValue;

  // Récupérer la valeur actuelle du store
  selectedTables.subscribe(value => {
    storeValue = value;
  })();

  // Extraire les nombres des tables sélectionnées
  return storeValue
    .map((selected, index) => selected ? index + 1 : null)
    .filter(num => num !== null);
};

// Calcul dérivé du nombre de tables sélectionnées
export const selectedTablesCount = derived(
  selectedTables,
  $selectedTables => $selectedTables.filter(Boolean).length
);