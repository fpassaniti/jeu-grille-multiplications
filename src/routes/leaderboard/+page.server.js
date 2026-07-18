// src/routes/leaderboard/+page.server.js
import { error } from '@sveltejs/kit';

// Fonction chargée côté serveur pour récupérer les données initiales
export async function load({ fetch, url }) {
  try {
    // Récupérer les paramètres de l'URL (ou utiliser les valeurs par défaut)
    const mode = url.searchParams.get('mode') || 'tables';
    const level = url.searchParams.get('level') || 'adulte';
    const duration = url.searchParams.get('duration') || '5';

    // Récupérer les scores pour le mode, le niveau et la durée actuels
    const leaderboardResponse = await fetch(
      `/api/leaderboard?mode=${mode}&level=${level}&duration=${duration}`
    );

    if (!leaderboardResponse.ok) {
      throw new Error('Erreur lors de la récupération des scores');
    }

    const leaderboardData = await leaderboardResponse.json();

    return {
      leaderboardAdult: level === 'adulte' ? leaderboardData.scores : [],
      leaderboardChild: level === 'enfant' ? leaderboardData.scores : [],
      currentMode: mode,
      currentLevel: level,
      currentDuration: parseInt(duration, 10)
    };
  } catch (err) {
    console.error('Erreur lors du chargement des classements:', err);
    throw error(500, 'Erreur lors du chargement des classements');
  }
}
