// src/routes/leaderboard/+page.server.js
import { error } from '@sveltejs/kit';

// Fonction chargée côté serveur pour récupérer les données initiales
export async function load({ fetch, url }) {
  try {
    // Récupérer les paramètres de l'URL (ou utiliser les valeurs par défaut)
    const level = url.searchParams.get('level') || 'adulte';
    const duration = url.searchParams.get('duration') || '5';

    // Préparer les URL pour récupérer différents jeux de données
    const durations = ['2', '3', '5'];
    const results = {};

    // Récupérer les scores pour le niveau et la durée actuels
    const leaderboardResponse = await fetch(`/api/leaderboard?level=${level}&duration=${duration}`);

    if (!leaderboardResponse.ok) {
      throw new Error('Erreur lors de la récupération des scores');
    }

    const leaderboardData = await leaderboardResponse.json();

    // Préparer les données pour les différents niveaux et la durée actuelle
    results.adultData = level === 'adulte' ? leaderboardData.scores : [];
    results.childData = level === 'enfant' ? leaderboardData.scores : [];

    // Ajouter le niveau et la durée sélectionnés aux données
    results.currentLevel = level;
    results.currentDuration = parseInt(duration, 10);
    results.tables_used = leaderboardData.tables_used

    return {
      leaderboardAdult: results.adultData,
      leaderboardChild: results.childData,
      currentLevel: level,
      currentDuration: parseInt(duration, 10)
    };

  } catch (err) {
    console.error('Erreur lors du chargement des classements:', err);
    throw error(500, 'Erreur lors du chargement des classements');
  }
}