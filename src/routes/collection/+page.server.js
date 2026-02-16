import { sql } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  // Rediriger si non connecté
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  try {
    // Récupérer les données de progression
    const progressResult = await sql`
      SELECT * FROM user_progress WHERE user_id = ${locals.user.id}
    `;

    const progressData = progressResult && progressResult.length > 0 ? progressResult[0] : null;

    // Récupérer tous les niveaux
    const levels = await sql`
      SELECT * FROM level_definitions
      ORDER BY level ASC
    `;

    // Marquer les niveaux comme débloqués ou courants
    const userLevel = progressData?.level || 1;
    const userXp = progressData?.xp || 0;

    const processedLevels = levels.map(level => ({
      ...level,
      unlocked: level.level <= userLevel,
      current: level.level === userLevel
    }));

    // Compter le nombre de niveaux débloqués
    const unlockedLevels = processedLevels.filter(level => level.unlocked).length;

    return {
      user: locals.user,
      userProgress: progressData,
      userLevel,
      levels: processedLevels,
      unlockedLevels
    };

  } catch (err) {
    console.error('Erreur lors du chargement de la collection:', err);

    return {
      user: locals.user,
      userProgress: null,
      userLevel: 1,
      levels: [],
      unlockedLevels: 0
    };
  }
}
