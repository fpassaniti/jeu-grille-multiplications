// src/routes/api/scores/+server.js avec mise à jour pour gérer les grilles multiples

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
    if (score == undefined || !duration || !level) {
      return json({ error: 'Informations manquantes' }, { status: 400 });
    }

    // Valider que la durée est l'une des valeurs acceptées
    const validDurations = [2, 3, 5];
    if (!validDurations.includes(parseInt(duration, 10))) {
      return json({ error: 'Durée de jeu invalide' }, { status: 400 });
    }

    // Modification: On permet maintenant que solvedCells > totalPossibleCells
    // car la grille peut être réinitialisée et remplie plusieurs fois
    // Nous n'imposons plus la contrainte solvedCells <= totalPossibleCells

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    let userDisplayName = null;
    let sessionCookie = cookies.get('session');
    if (sessionCookie) {
      const session = JSON.parse(sessionCookie);
      userId = session.user.id;
      userDisplayName = session.user.displayName || session.user.username;
    }

    // Déterminer le nom à utiliser:
    // - Si un nom spécifique est fourni dans la requête, l'utiliser
    // - Sinon, pour les utilisateurs connectés, utiliser leur nom d'affichage
    // - Pour les invités, utiliser "Invité"
    const playerName = name || (userId ? userDisplayName : 'Invité');

    // Le score est directement utilisé comme XP
    const xpEarned = score;

    // Créer l'objet de session de jeu
    const gameSession = {
      user_id: userId,
      name: playerName,
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
      name: playerName,
      score,
      duration: parseInt(duration, 10),
      level,
      cells_solved: solvedCells,
      total_cells: totalPossibleCells,
      tables_used: level === 'enfant' ? selectedTables : [],
      date: new Date().toISOString()
    };

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