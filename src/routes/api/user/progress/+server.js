import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, cookies, locals }) {
  try {
    // Vérifier si l'utilisateur est connecté
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const userId = session.user.id;

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la progression de l'utilisateur
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError) throw progressError;

    // Récupérer les informations sur le niveau actuel
    const { data: levelData, error: levelError } = await supabase
      .from('level_definitions')
      .select('*')
      .eq('level', progressData.level)
      .single();

    if (levelError) throw levelError;

    // Récupérer les informations sur le prochain niveau
    const { data: nextLevelData, error: nextLevelError } = await supabase
      .from('level_definitions')
      .select('*')
      .eq('level', progressData.level + 1)
      .maybeSingle();

    // Calculer la progression vers le prochain niveau
    let levelProgress = 0;
    let xpForNextLevel = null;

    if (nextLevelData) {
      const currentLevelXP = levelData.min_xp;
      const nextLevelXP = nextLevelData.min_xp;
      const userXP = progressData.xp;

      xpForNextLevel = nextLevelXP - currentLevelXP;
      const userProgressXP = userXP - currentLevelXP;
      levelProgress = Math.floor((userProgressXP / xpForNextLevel) * 100);
    }

    return json({
      success: true,
      progress: {
        ...progressData,
        currentLevel: levelData,
        nextLevel: nextLevelData || null,
        levelProgress: levelProgress,
        xpForNextLevel: xpForNextLevel,
        xpUntilNextLevel: nextLevelData ? nextLevelData.min_xp - progressData.xp : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la progression:', error);

    return json({
      error: 'Erreur lors de la récupération de la progression'
    }, { status: 500 });
  }
}
