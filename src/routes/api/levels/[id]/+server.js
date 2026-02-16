import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const levelId = parseInt(params.id, 10);

    if (isNaN(levelId)) {
      return json({ error: 'ID de niveau invalide' }, { status: 400 });
    }

    // Récupérer le niveau spécifique
    const data = await sql`
      SELECT * FROM level_definitions WHERE level = ${levelId}
    `;

    if (!data || data.length === 0) {
      return json({ error: 'Niveau non trouvé' }, { status: 404 });
    }

    return json(data[0]);

  } catch (error) {
    console.error('Erreur lors de la récupération du niveau:', error);

    return json({
      error: 'Erreur serveur lors de la récupération du niveau'
    }, { status: 500 });
  }
}
