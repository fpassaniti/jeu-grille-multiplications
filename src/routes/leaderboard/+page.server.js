import { createClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

export async function load() {
  try {
    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Charger les scores des adultes
    const { data: adultData, error: adultError } = await supabase
      .from('scores')
      .select('id, name, score, duration, level, date')
      .eq('level', 'adulte')
      .order('score', { ascending: false })
      .limit(10);

    if (adultError) throw adultError;

    // Charger les scores des enfants
    const { data: childData, error: childError } = await supabase
      .from('scores')
      .select('id, name, score, duration, level, date')
      .eq('level', 'enfant')
      .order('score', { ascending: false })
      .limit(10);

    if (childError) throw childError;

    return {
      leaderboardAdult: adultData || [],
      leaderboardChild: childData || []
    };

  } catch (err) {
    console.error('Erreur lors du chargement des classements:', err);
    throw error(500, 'Erreur lors du chargement des classements');
  }
}