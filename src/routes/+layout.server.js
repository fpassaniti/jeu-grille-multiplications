import { sql } from '$lib/server/db';

export async function load({ locals }) {
  // Données utilisateur par défaut
  let userData = {
    user: null,
    userProgress: null
  };

  // Si l'utilisateur est connecté, récupérer des informations supplémentaires
  if (locals.user) {
    userData.user = locals.user;

    try {
      // Récupérer la progression de l'utilisateur
      const progressResult = await sql`
        SELECT * FROM user_progress WHERE user_id = ${locals.user.id}
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
        const currentLevelXP = levelData.min_xp;
        const nextLevelXP = nextLevelData.min_xp;
        const userXP = progressData.xp;

        xpForNextLevel = nextLevelXP - currentLevelXP;
        const userProgressXP = userXP - currentLevelXP;
        levelProgress = Math.floor((userProgressXP / xpForNextLevel) * 100);
        xpUntilNextLevel = nextLevelXP - userXP;
      }

      userData.userProgress = {
        ...progressData,
        currentLevel: levelData,
        nextLevel: nextLevelData || null,
        levelProgress,
        xpForNextLevel,
        xpUntilNextLevel
      };
    } catch (err) {
      console.error('Erreur lors du chargement des données utilisateur:', err);
    }
  }

  return userData;
}