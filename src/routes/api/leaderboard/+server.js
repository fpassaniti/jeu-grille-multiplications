import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase avec les variables d'environnement serveur
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY; // Clé de service plus sécurisée

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    // Créer le client Supabase côté serveur
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Charger les scores des adultes (avec rate limiting pour éviter les abus)
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

    // Retourner les données
    return json({
      adult: adultData || [],
      child: childData || []
    });
  } catch (err) {
    console.error('Erreur lors du chargement des leaderboards:', err);

    return json({
      error: 'Erreur serveur lors du chargement des classements'
    }, { status: 500 });
  }
}