// src/routes/api/leaderboard/+server.js
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase avec les variables d'environnement serveur
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY; // Clé de service plus sécurisée

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    // Extraire les paramètres de requête
    const level = url.searchParams.get('level') || 'adulte';
    const duration = url.searchParams.get('duration') || '5'; // Par défaut 5 minutes

    // Créer le client Supabase côté serveur
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer tous les scores filtré par niveau et durée
    const { data: allScores, error: scoresError } = await supabase
      .from('scores')
      .select('id, name, score, duration, level, date, tables_used')
      .eq('level', level)
      .eq('duration', parseInt(duration, 10))
      .order('score', { ascending: false });

    if (scoresError) throw scoresError;

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
      // Si tables_used est une chaîne JSON, la parser
      if (score.tables_used && typeof score.tables_used === 'string') {
        try {
          score.tables_used = JSON.parse(score.tables_used);
        } catch (e) {
          console.error("Erreur de parsing tables_used:", e);
          score.tables_used = [];
        }
      }
      // Si tables_used est null, mettre un tableau vide
      else if (score.tables_used === null) {
        score.tables_used = [];
      }

      return score;
    });

    // Retourner les données
    return json({
      scores: processedScores,
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