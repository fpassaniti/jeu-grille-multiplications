import { sql } from '$lib/server/db';

/**
 * Paliers de série ouvrant un coffre (SPEC §5.5/§5.6).
 * Source unique — partagée entre chests.js et +page.server.js pour éviter
 * qu'un tableau local diverge de la liste utilisée côté SQL (open_chest,
 * add_game_rewards), comme cela s'est produit pour le palier 60 jours.
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60];

/**
 * Date du jour (Europe/Paris), sans dépendance à une lib de date.
 * @returns {string} 'YYYY-MM-DD'
 */
export function getParisToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/**
 * Jours joués (Europe/Paris) sur un mois donné, déduits de game_sessions.
 * Les bornes du mois et le formatage de date sont calculés entièrement côté
 * SQL (to_char) : un driver Postgres qui reparse une valeur DATE en objet
 * Date JS le fait à minuit dans le fuseau du serveur, pas en UTC — un
 * .toISOString() derrière décale alors la date d'un jour dès que ce fuseau
 * a un offset non nul (ex. Europe/Paris l'été). Renvoyer du texte évite
 * complètement ce piège.
 * @param {string} userId
 * @param {string} yyyyMm - mois au format 'YYYY-MM'
 * @returns {Promise<string[]>} dates ISO ('YYYY-MM-DD')
 */
export async function getPlayedDays(userId, yyyyMm) {
  const monthStart = `${yyyyMm}-01`;
  const rows = await sql`
    SELECT DISTINCT to_char(date AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') AS d
    FROM game_sessions
    WHERE user_id = ${userId}
      AND date >= (${monthStart}::date AT TIME ZONE 'Europe/Paris')
      AND date < ((${monthStart}::date + INTERVAL '1 month') AT TIME ZONE 'Europe/Paris')
  `;
  return (rows ?? []).map((r) => r.d);
}

/**
 * Mois (Europe/Paris) de la première partie jamais jouée par l'utilisateur.
 * Sert de plancher de navigation pour le calendrier — null pour un compte neuf.
 * @param {string} userId
 * @returns {Promise<string|null>} 'YYYY-MM' ou null
 */
export async function getEarliestPlayedMonth(userId) {
  const rows = await sql`
    SELECT to_char(MIN(date) AT TIME ZONE 'Europe/Paris', 'YYYY-MM') AS d
    FROM game_sessions WHERE user_id = ${userId}
  `;
  return rows?.[0]?.d ?? null;
}

/**
 * Projette, pour chaque palier de série pas encore réclamé, la date future
 * (en supposant une série ininterrompue) à laquelle il serait atteint.
 * @param {{ streakDays: number, lastStreakReward: number, today: string }} params - today au format 'YYYY-MM-DD'
 * @returns {{ milestone: number, date: string }[]}
 */
export function projectMilestoneDates({ streakDays, lastStreakReward, today }) {
  const todayDate = new Date(`${today}T00:00:00Z`);
  return STREAK_MILESTONES.filter((m) => m > streakDays && lastStreakReward < m).map((m) => {
    const date = new Date(todayDate);
    date.setUTCDate(date.getUTCDate() + (m - streakDays));
    return { milestone: m, date: date.toISOString().slice(0, 10) };
  });
}
