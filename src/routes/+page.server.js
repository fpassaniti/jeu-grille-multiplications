import { createClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Configuration Supabase avec les variables d'environnement serveur
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_KEY; // Clé de service plus sécurisée pour les opérations serveur

export async function load({ locals }) {
  try {
    // Créer le client Supabase côté serveur
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Charger les scores des adultes
    const { data: adultData, error: adultError } = await supabase
      .from('scores')
      .select('*')
      .eq('level', 'adulte')
      .order('score', { ascending: false })
      .limit(10);

    if (adultError) throw adultError;

    // Charger les scores des enfants
    const { data: childData, error: childError } = await supabase
      .from('scores')
      .select('*')
      .eq('level', 'enfant')
      .order('score', { ascending: false })
      .limit(10);

    if (childError) throw childError;

    // Retourner les données pour qu'elles soient disponibles à la page
    return {
      leaderboardAdult: adultData || [],
      leaderboardChild: childData || []
    };
  } catch (err) {
    console.error('Erreur lors du chargement des leaderboards:', err);

    // En cas d'erreur, retourner des tableaux vides
    // Le client tentera de charger via le endpoint API
    return {
      leaderboardAdult: [],
      leaderboardChild: []
    };
  }
}