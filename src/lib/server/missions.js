import { sql } from '$lib/server/db';
import { getParisToday } from '$lib/server/streakCalendar.js';
import { MISSIONS, pickMissionForDate } from '$lib/missions/catalog.js';
import { listEnabledModes } from '$lib/modes/index.js';

/**
 * Mission du jour — déterministe par date, identique pour tous les joueurs
 * (cf. src/lib/missions/catalog.js).
 * @param {string} [todayISO]
 */
export function getTodayMission(todayISO = getParisToday()) {
  return pickMissionForDate(todayISO, MISSIONS);
}

/**
 * Agrégat des parties du jour (Europe/Paris), groupé par mode+durée — une
 * seule requête réutilisée par les 3 types de mission (cf. catalog.js).
 * @param {string} userId
 * @param {string} todayISO - 'YYYY-MM-DD'
 * @returns {Promise<{game_mode: string, duration: number, count: number}[]>}
 */
export async function getDailySessionsAgg(userId, todayISO) {
  return sql`
    SELECT game_mode, duration, COUNT(*)::int AS count
    FROM game_sessions
    WHERE user_id = ${userId}
      AND (date AT TIME ZONE 'Europe/Paris')::date = ${todayISO}::date
    GROUP BY game_mode, duration
  `;
}

/**
 * Statut complet de la mission du jour pour un joueur : objectifs cochés,
 * complétion, et disponibilité du coffre (complété + pas déjà réclamé
 * aujourd'hui). Consommé par +page.server.js (carte) et par la route
 * d'ouverture de coffre (revalidation avant open_chest).
 * @param {string} userId
 * @param {string} [todayISO]
 */
export async function getMissionStatus(userId, todayISO = getParisToday()) {
  const mission = getTodayMission(todayISO);
  const [rows, claimed] = await Promise.all([
    getDailySessionsAgg(userId, todayISO),
    sql`
      SELECT 1 FROM chest_openings
       WHERE user_id = ${userId} AND chest_type = 'mission'
         AND (opened_at AT TIME ZONE 'Europe/Paris')::date = ${todayISO}::date
    `
  ]);
  const enabledModeIds = listEnabledModes().map((m) => m.id);
  const { slots, completed } = mission.computeObjectives(rows, { enabledModeIds });

  return {
    missionId: mission.id,
    titleKey: mission.titleKey,
    descriptionKey: mission.descriptionKey,
    slots,
    completed,
    chestAvailable: completed && claimed.length === 0
  };
}
