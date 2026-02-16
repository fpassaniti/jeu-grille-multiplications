import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
  try {
    // Récupérer tous les niveaux
    const levels = await sql`
      SELECT * FROM level_definitions
      ORDER BY level ASC
    `;

    // Déterminer le niveau actuel de l'utilisateur s'il est connecté
    let userLevel = 0;
    const sessionCookie = cookies.get('session');

    if (sessionCookie) {
      const session = JSON.parse(sessionCookie);
      const userId = session.user.id;

      const progress = await sql`
        SELECT level, xp FROM user_progress WHERE user_id = ${userId}
      `;

      if (progress && progress.length > 0) {
        userLevel = progress[0].level;
      }
    }

    // Structurer les données pour l'affichage
    const levelData = levels.map(level => ({
      ...level,
      unlocked: level.level <= userLevel,
      current: level.level === userLevel
    }));

    return json({
      success: true,
      levels: levelData,
      userLevel
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error);

    return json({
      error: 'Erreur lors de la récupération des niveaux'
    }, { status: 500 });
  }
}
