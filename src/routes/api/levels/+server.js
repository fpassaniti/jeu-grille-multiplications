import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
  try {
    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer tous les niveaux
    const { data: levels, error } = await supabase
      .from('level_definitions')
      .select('*')
      .order('level', { ascending: true });

    if (error) throw error;

    // Déterminer le niveau actuel de l'utilisateur s'il est connecté
    let userLevel = 0;
    const sessionCookie = cookies.get('session');

    if (sessionCookie) {
      const session = JSON.parse(sessionCookie);
      const userId = session.user.id;

      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('level, xp')
        .eq('user_id', userId)
        .single();

      if (!progressError && progress) {
        userLevel = progress.level;
      }
    }

    // Structurer les données pour l'affichage
    const levelData = levels.map(level => ({
      ...level,
      unlocked: level.level <= userLevel,
      current: level.level === userLevel
    }));

    return json({
      success: true,
      levels: levelData,
      userLevel
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error);

    return json({
      error: 'Erreur lors de la récupération des niveaux'
    }, { status: 500 });
  }
}
