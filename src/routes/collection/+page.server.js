import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

export async function load({ locals }) {
  // Rediriger si non connecté
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  try {
    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les données de progression
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', locals.user.id)
      .single();

    if (progressError) throw progressError;

    // Récupérer tous les niveaux
    const { data: levels, error: levelsError } = await supabase
      .from('level_definitions')
      .select('*')
      .order('level', { ascending: true });

    if (levelsError) throw levelsError;

    // Marquer les niveaux comme débloqués ou courants
    const userLevel = progressData?.level || 1;
    const userXp = progressData?.xp || 0;

    const processedLevels = levels.map(level => ({
      ...level,
      unlocked: level.level <= userLevel,
      current: level.level === userLevel
    }));

    // Compter le nombre de niveaux débloqués
    const unlockedLevels = processedLevels.filter(level => level.unlocked).length;

    return {
      user: locals.user,
      userProgress: progressData,
      userLevel,
      levels: processedLevels,
      unlockedLevels
    };

  } catch (err) {
    console.error('Erreur lors du chargement de la collection:', err);

    return {
      user: locals.user,
      userProgress: null,
      userLevel: 1,
      levels: [],
      unlockedLevels: 0
    };
  }
}
