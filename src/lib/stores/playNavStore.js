// src/lib/stores/playNavStore.js
import { writable } from 'svelte/store';

// Incrémenté quand l'utilisateur clique sur "Jouer" dans le menu alors qu'il est déjà sur /play,
// pour que la page /play puisse revenir à l'écran de sélection de mode.
export const playNavRequested = writable(0);

export function requestPlayReset() {
  playNavRequested.update((n) => n + 1);
}
