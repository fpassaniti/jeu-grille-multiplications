import { sql } from '$lib/server/db';
import { STREAK_MILESTONES } from '$lib/server/streakCalendar.js';
import { getMissionStatus } from '$lib/server/missions.js';

/**
 * Disponibilité des coffres pour un utilisateur (SPEC §5.5/§5.6ter).
 * Partagé entre GET /api/chests et le dashboard (coffre quotidien + bienvenue).
 * @param {string} userId
 */
export async function getChestAvailability(userId) {
  const progressRows = await sql`
    SELECT level, streak_days, last_streak_reward, last_daily_chest_at
    FROM user_progress WHERE user_id = ${userId}
  `;
  if (!progressRows || progressRows.length === 0) {
    return null;
  }
  const progress = progressRows[0];

  const [dailyDone, welcomeDone, levelupDone, perfectPlayedToday, perfectDone, missionStatus] =
    await Promise.all([
      sql`SELECT 1 FROM user_progress WHERE user_id = ${userId}
          AND last_daily_chest_at IS NOT NULL
          AND last_daily_chest_at >= (NOW() AT TIME ZONE 'Europe/Paris')::date`,
      sql`SELECT 1 FROM chest_openings WHERE user_id = ${userId} AND chest_type = 'welcome'`,
      sql`SELECT 1 FROM chest_openings
          WHERE user_id = ${userId} AND chest_type = 'levelup'
            AND (rewards->>'level')::int = ${progress.level}`,
      sql`SELECT 1 FROM game_sessions
          WHERE user_id = ${userId} AND errors_count = 0 AND cells_solved >= 10
            AND (date AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date`,
      sql`SELECT 1 FROM chest_openings
          WHERE user_id = ${userId} AND chest_type = 'perfect'
            AND (opened_at AT TIME ZONE 'Europe/Paris')::date = (NOW() AT TIME ZONE 'Europe/Paris')::date`,
      getMissionStatus(userId)
    ]);

  const streakMilestone =
    STREAK_MILESTONES.filter((m) => progress.streak_days >= m && progress.last_streak_reward < m).pop() ??
    null;

  return {
    daily: { available: dailyDone.length === 0 },
    streak: { available: streakMilestone !== null, milestone: streakMilestone },
    levelup: { available: levelupDone.length === 0, level: progress.level },
    perfect: { available: perfectPlayedToday.length > 0 && perfectDone.length === 0 },
    welcome: { available: welcomeDone.length === 0 },
    mission: { available: missionStatus.chestAvailable, missionId: missionStatus.missionId }
  };
}
