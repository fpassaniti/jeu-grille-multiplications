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

    // Vérifications de sécurité comme dans l'original...
    // (code de vérification existant)

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
      duration,
      level,
      cells_solved: solvedCells,
      total_cells: totalPossibleCells,
      tables_used: level === 'enfant' ? selectedTables : [],
      date: new Date().toISOString()
    };

    // Sauvegarder la session de jeu
    const { data: gameData, error: gameError } = await supabase
      .from('game_sessions')
      .insert([gameSession])
      .select();

    if (gameError) throw gameError;

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
