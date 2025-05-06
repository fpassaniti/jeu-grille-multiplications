import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

export async function load({ locals }) {
  // Données utilisateur par défaut
  let userData = {
    user: null,
    userProgress: null
  };

  // Si l'utilisateur est connecté, récupérer des informations supplémentaires
  if (locals.user) {
    userData.user = locals.user;

    try {
      // Créer le client Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Récupérer la progression de l'utilisateur
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', locals.user.id)
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
      let xpUntilNextLevel = null;

      if (nextLevelData) {
        const currentLevelXP = levelData.min_xp;
        const nextLevelXP = nextLevelData.min_xp;
        const userXP = progressData.xp;

        xpForNextLevel = nextLevelXP - currentLevelXP;
        const userProgressXP = userXP - currentLevelXP;
        levelProgress = Math.floor((userProgressXP / xpForNextLevel) * 100);
        xpUntilNextLevel = nextLevelXP - userXP;
      }

      userData.userProgress = {
        ...progressData,
        currentLevel: levelData,
        nextLevel: nextLevelData || null,
        levelProgress,
        xpForNextLevel,
        xpUntilNextLevel
      };
    } catch (err) {
      console.error('Erreur lors du chargement des données utilisateur:', err);
    }
  }

  return userData;
}