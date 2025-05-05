import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

export async function load({ locals }) {
  // Données utilisateur par défaut
  let userData = {
    user: null
  };

  // Si l'utilisateur est connecté, récupérer des informations supplémentaires
  if (locals.user) {
    userData.user = locals.user;

    try {
      // Créer le client Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Récupérer la progression de l'utilisateur
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('level, xp')
        .eq('user_id', locals.user.id)
        .single();

      if (progressData) {
        userData.userLevel = progressData.level;
        userData.userXp = progressData.xp;
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données utilisateur:', err);
    }
  }

  return userData;
}
