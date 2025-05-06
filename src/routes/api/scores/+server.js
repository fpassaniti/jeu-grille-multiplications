// src/routes/api/scores/+server.js
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

// Le score est directement utilisé comme XP

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const {
      name,
      score,
      duration,
      level,
      solvedCells,
      totalPossibleCells,
      selectedTables
    } = await request.json();

    // Validation des données
    if (!score || !duration || !level) {
      return json({ error: 'Informations manquantes' }, { status: 400 });
    }

    // Valider que la durée est l'une des valeurs acceptées
    const validDurations = [2, 3, 5];
    if (!validDurations.includes(parseInt(duration, 10))) {
      return json({ error: 'Durée de jeu invalide' }, { status: 400 });
    }

    // Vérifications de sécurité supplémentaires
    // Vérifier que le score est cohérent avec le nombre de cellules résolues
    const maxScorePerCell = 30; // Score maximum estimé par cellule
    const maxPossibleScore = solvedCells * maxScorePerCell;

    if (score > maxPossibleScore) {
      return json({ error: 'Score anormalement élevé détecté' }, { status: 400 });
    }

    if (solvedCells > totalPossibleCells) {
      return json({ error: 'Nombre de cellules résolues incohérent' }, { status: 400 });
    }

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    let sessionCookie = cookies.get('session');
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie);
      userId = session.user.id;
    }

    // Le score est directement utilisé comme XP
    const xpEarned = score;

    // Créer l'objet de session de jeu
    const gameSession = {
      user_id: userId,
      name: name || (userId ? null : 'Invité'),  // Nom uniquement pour parties sans compte
      score,
      xp_earned: score, // Le score est l'XP
      duration: parseInt(duration, 10), // S'assurer que la durée est un entier
      level,
      cells_solved: solvedCells,
      total_cells: totalPossibleCells,
      tables_used: level === 'enfant' ? selectedTables : [],
      date: new Date().toISOString()
    };

    // Sauvegarder la session de jeu dans la table game_sessions
    const { data: gameData, error: gameError } = await supabase
      .from('game_sessions')
      .insert([gameSession])
      .select();

    if (gameError) throw gameError;

    // Sauvegarder également dans la table scores pour le leaderboard
    // S'assurer que les tables_used sont bien un tableau JSON
    const scoreData = {
      user_id: userId,
      name: name || (userId ? null : 'Invité'),
      score,
      duration: parseInt(duration, 10),
      level,
      cells_solved: solvedCells,
      total_cells: totalPossibleCells,
      tables_used: level === 'enfant' ? selectedTables : [],
      date: new Date().toISOString()
    };

    // Logguer les données pour débogage
    console.log('Enregistrement du score avec tables_used:', scoreData.tables_used);

    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('scores')
      .insert([scoreData])
      .select();

    if (leaderboardError) {
      console.error('Erreur lors de l\'enregistrement du score dans la table scores:', leaderboardError);
      throw leaderboardError;
    }

    // Si l'utilisateur est connecté, mettre à jour sa progression
    let progressUpdate = null;
    if (userId) {
      const { data: progressData, error: progressError } = await supabase.rpc(
        'add_user_xp',
        {
          p_user_id: userId,
          p_xp_earned: xpEarned,
          p_game_score: score,
          p_update_streak: true
        }
      );

      if (progressError) throw progressError;
      progressUpdate = progressData[0];
    }

    return json({
      success: true,
      message: 'Score enregistré avec succès',
      gameData: gameData[0],
      xpEarned,
      progressUpdate
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du score:', error);

    return json({
      error: 'Erreur serveur lors de l\'enregistrement du score'
    }, { status: 500 });
  }
}