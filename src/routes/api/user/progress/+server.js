import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
  try {
    // Vérifier si l'utilisateur est connecté
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) {
      return json({ error: 'Non authentifié' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const userId = session.user.id;

    // Récupérer la progression de l'utilisateur
    const progressResult = await sql`
      SELECT * FROM user_progress WHERE user_id = ${userId}
    `;

    if (!progressResult || progressResult.length === 0) {
      throw new Error('User progress not found');
    }

    const progressData = progressResult[0];

    // Récupérer les informations sur le niveau actuel
    const levelResult = await sql`
      SELECT * FROM level_definitions WHERE level = ${progressData.level}
    `;

    if (!levelResult || levelResult.length === 0) {
      throw new Error('Level not found');
    }

    const levelData = levelResult[0];

    // Récupérer les informations sur le prochain niveau
    const nextLevelResult = await sql`
      SELECT * FROM level_definitions WHERE level = ${progressData.level + 1}
    `;

    const nextLevelData = nextLevelResult && nextLevelResult.length > 0 ? nextLevelResult[0] : null;

    // Calculer la progression vers le prochain niveau
    let levelProgress = 0;
    let xpForNextLevel = null;
    let xpUntilNextLevel = null;

    if (nextLevelData) {
      // Calculer la quantité d'XP nécessaire pour passer du niveau actuel au niveau suivant
      xpForNextLevel = nextLevelData.min_xp - levelData.min_xp;

      // Calculer la progression du joueur dans le niveau actuel
      const userProgressXP = progressData.xp - levelData.min_xp;

      // Calculer le pourcentage de progression vers le niveau suivant
      levelProgress = Math.floor((userProgressXP / xpForNextLevel) * 100);

      // Calculer l'XP restante pour atteindre le niveau suivant
      xpUntilNextLevel = nextLevelData.min_xp - progressData.xp;
    }

    return json({
      success: true,
      progress: {
        ...progressData,
        currentLevel: levelData,
        nextLevel: nextLevelData || null,
        levelProgress: levelProgress,
        xpForNextLevel: xpForNextLevel,
        xpUntilNextLevel: xpUntilNextLevel
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la progression:', error);

    return json({
      error: 'Erreur lors de la récupération de la progression'
    }, { status: 500 });
  }
}