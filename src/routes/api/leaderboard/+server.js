import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { isKnownMode } from '$lib/modes/index.js';
import { DEFAULT_PLAYER_MODE } from '$lib/utils/player-mode.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    // Extraire les paramètres de requête
    const level = url.searchParams.get('level') || DEFAULT_PLAYER_MODE;
    const duration = url.searchParams.get('duration') || '5'; // Par défaut 5 minutes
    // Défaut 'tables' : l'historique V1 reste le classement des tables
    const mode = url.searchParams.get('mode') || 'tables';

    if (!isKnownMode(mode)) {
      return json({ error: 'Mode de jeu inconnu' }, { status: 400 });
    }

    // Récupérer tous les scores filtrés par mode, niveau et durée
    const allScores = await sql`
      SELECT id, name, score, duration, level, date, tables_used
      FROM scores
      WHERE game_mode = ${mode} AND level = ${level} AND duration = ${parseInt(duration, 10)}
      ORDER BY score DESC
    `;

    // Grouper les scores par nom et garder uniquement le meilleur score pour chaque joueur
    const bestScoresByPlayer = {};

    // Pour chaque score, vérifier s'il s'agit du meilleur score du joueur
    allScores?.forEach(score => {
      const playerName = score.name;

      // Si nous n'avons pas encore vu ce joueur, ou si ce score est meilleur que ce que nous avons déjà
      if (!bestScoresByPlayer[playerName] || score.score > bestScoresByPlayer[playerName].score) {
        bestScoresByPlayer[playerName] = score;
      }
    });

    // Convertir l'objet en tableau
    const uniqueScores = Object.values(bestScoresByPlayer);

    // Trier par score, du plus élevé au plus bas
    uniqueScores.sort((a, b) => b.score - a.score);

    // Limiter à 10 résultats
    const topScores = uniqueScores.slice(0, 10);

    // S'assurer que les tables_used sont parsées correctement
    const processedScores = topScores.map(score => {
      // Avec Neon, les tableaux INTEGER[] sont retournés directement comme tableaux
      // ou parfois comme chaînes JSON, donc on gère les deux cas
      if (score.tables_used && typeof score.tables_used === 'string') {
        try {
          score.tables_used = JSON.parse(score.tables_used);
        } catch (e) {
          console.error("Erreur de parsing tables_used:", e);
          score.tables_used = [];
        }
      }
      // Si tables_used est null ou undefined, mettre un tableau vide
      else if (!score.tables_used) {
        score.tables_used = [];
      }

      return score;
    });

    // Retourner les données
    return json({
      scores: processedScores,
      mode,
      level,
      duration: parseInt(duration, 10)
    });
  } catch (err) {
    console.error('Erreur lors du chargement des leaderboards:', err);

    return json({
      error: 'Erreur serveur lors du chargement des classements'
    }, { status: 500 });
  }
}