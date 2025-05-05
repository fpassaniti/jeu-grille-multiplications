import { createClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

export async function load({ locals }) {
  try {
    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Données par défaut
    let userData = {
      leaderboardAdult: [],
      leaderboardChild: [],
      user: null,
      userProgress: null
    };

    // Chargement des leaderboards comme avant
    const { data: adultData, error: adultError } = await supabase
      .from('scores')
      .select('*')
      .eq('level', 'adulte')
      .order('score', { ascending: false })
      .limit(10);

    if (adultError) throw adultError;
    userData.leaderboardAdult = adultData || [];

    const { data: childData, error: childError } = await supabase
      .from('scores')
      .select('*')
      .eq('level', 'enfant')
      .order('score', { ascending: false })
      .limit(10);

    if (childError) throw childError;
    userData.leaderboardChild = childData || [];

    // Si l'utilisateur est connecté, récupérer ses informations de progression
    if (locals.user) {
      userData.user = locals.user;

      // Récupérer la progression
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', locals.user.id)
        .single();

      if (!progressError && progressData) {
        // Récupérer les infos du niveau actuel
        const { data: levelData } = await supabase
          .from('level_definitions')
          .select('*')
          .eq('level', progressData.level)
          .single();

        userData.userProgress = {
          ...progressData,
          currentLevel: levelData
        };
      }
    }

    return userData;

  } catch (err) {
    console.error('Erreur lors du chargement des données:', err);

    return {
      leaderboardAdult: [],
      leaderboardChild: [],
      user: null,
      userProgress: null
    };
  }
}
