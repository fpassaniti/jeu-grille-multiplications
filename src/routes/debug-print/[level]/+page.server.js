import { sql } from '$lib/server/db';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  try {
    const levelId = parseInt(params.level, 10);

    if (isNaN(levelId)) {
      throw error(400, 'ID de niveau invalide');
    }

    // Récupérer les informations sur le niveau spécifié
    const levelResult = await sql`
      SELECT * FROM level_definitions WHERE level = ${levelId}
    `;

    if (!levelResult || levelResult.length === 0) {
      console.error('Niveau non trouvé:', levelId);
      throw error(404, 'Niveau non trouvé');
    }

    const levelData = levelResult[0];

    return {
      level: levelData
    };
  } catch (err) {
    console.error('Erreur dans load:', err);
    throw error(500, 'Erreur lors du chargement des données du niveau');
  }
}