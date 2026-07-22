import { sql } from '$lib/server/db';
import { getEquipment } from '$lib/server/shop.js';
import { getChestAvailability } from '$lib/server/chests.js';

export async function load({ locals }) {
  if (!locals.user) {
    return { user: null, userProgress: null, equipment: null };
  }

  try {
    // Récupérer les données de progression
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

    // Récupérer les 5 dernières parties de l'utilisateur
    const recentGames = await sql`
      SELECT * FROM game_sessions
      WHERE user_id = ${locals.user.id}
      ORDER BY date DESC
      LIMIT 5
    `;

    // Jours joués sur les 7 derniers jours (calendrier streak, SPEC §5.6)
    const playedDaysResult = await sql`
      SELECT DISTINCT (date AT TIME ZONE 'Europe/Paris')::date AS d
      FROM game_sessions
      WHERE user_id = ${locals.user.id} AND date > NOW() - INTERVAL '7 days'
    `;
    const playedDays = (playedDaysResult ?? []).map((r) => new Date(r.d).toISOString().slice(0, 10));

    // Prochain palier de streak (3/7/14/30) → coffre à gagner
    const STREAK_MILESTONES = [3, 7, 14, 30];
    const streakDays = progressData.streak_days ?? 0;
    const nextStreakMilestone = STREAK_MILESTONES.find((m) => m > streakDays) ?? null;

    const equipment = await getEquipment(locals.user.id);
    const chests = await getChestAvailability(locals.user.id);

    return {
      user: locals.user,
      userProgress: {
        ...progressData,
        currentLevel: levelData,
        nextLevel: nextLevelData || null,
        levelProgress,
        xpForNextLevel,
        xpUntilNextLevel
      },
      recentGames: recentGames && recentGames.length > 0 ? recentGames : [],
      playedDays,
      nextStreakMilestone,
      equipment,
      chests
    };
  } catch (err) {
    console.error("Erreur lors du chargement de l'accueil:", err);

    return {
      user: locals.user,
      userProgress: null,
      recentGames: [],
      playedDays: [],
      nextStreakMilestone: null,
      equipment: null,
      chests: null
    };
  }
}