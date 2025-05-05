import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const levelId = parseInt(params.id, 10);

    if (isNaN(levelId)) {
      return json({ error: 'ID de niveau invalide' }, { status: 400 });
    }

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer le niveau spécifique
    const { data, error } = await supabase
      .from('level_definitions')
      .select('*')
      .eq('level', levelId)
      .single();

    if (error) {
      return json({ error: 'Niveau non trouvé' }, { status: 404 });
    }

    return json(data);

  } catch (error) {
    console.error('Erreur lors de la récupération du niveau:', error);

    return json({
      error: 'Erreur serveur lors de la récupération du niveau'
    }, { status: 500 });
  }
}
