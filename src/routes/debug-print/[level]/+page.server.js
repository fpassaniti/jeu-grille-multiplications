import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  try {
    const levelId = parseInt(params.level, 10);

    if (isNaN(levelId)) {
      throw error(400, 'ID de niveau invalide');
    }

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les informations sur le niveau spécifié
    const { data: levelData, error: levelError } = await supabase
      .from('level_definitions')
      .select('*')
      .eq('level', levelId)
      .single();

    if (levelError) {
      console.error('Erreur lors de la récupération du niveau:', levelError);
      throw error(404, 'Niveau non trouvé');
    }

    return {
      level: levelData
    };
  } catch (err) {
    console.error('Erreur dans load:', err);
    throw error(500, 'Erreur lors du chargement des données du niveau');
  }
}