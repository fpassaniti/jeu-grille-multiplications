import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

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
    const tablesUsed = level === 'enfant' ? selectedTables : [];
    const tablesUsedPg = `{${tablesUsed.join(',')}}`;

    // Sauvegarder la session de jeu dans la table game_sessions
    const gameData = await sql`
      INSERT INTO game_sessions (user_id, name, score, xp_earned, duration, level, cells_solved, total_cells, tables_used, date)
      VALUES (${userId}, ${playerName}, ${score}, ${score}, ${parseInt(duration, 10)}, ${level}, ${solvedCells}, ${totalPossibleCells}, ${tablesUsedPg}, NOW())
      RETURNING id, user_id, name, score, duration, level, date
    `;

    // Sauvegarder également dans la table scores pour le leaderboard
    const leaderboardData = await sql`
      INSERT INTO scores (name, score, duration, level, cells_solved, total_cells, tables_used, date)
      VALUES (${playerName}, ${score}, ${parseInt(duration, 10)}, ${level}, ${solvedCells}, ${totalPossibleCells}, ${tablesUsedPg}, NOW())
      RETURNING id, name, score, duration, level, date
    `;

    // Si l'utilisateur est connecté, mettre à jour sa progression
    let progressUpdate = null;
    if (userId) {
      const progressData = await sql`
        SELECT * FROM add_user_xp(${userId}, ${xpEarned}, true)
      `;

      if (progressData && progressData.length > 0) {
        progressUpdate = progressData[0];
      }
    }

    return json({
      success: true,
      message: 'Score enregistré avec succès',
      gameData: gameData && gameData[0] ? gameData[0] : null,
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