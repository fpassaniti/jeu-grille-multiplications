/**
 * Catalogue de missions quotidiennes — piloté à la main (comme
 * src/lib/modes/index.js), pas de génération procédurale. Étendre en
 * ajoutant une entrée à MISSIONS.
 *
 * Toutes les missions se calculent à partir du même agrégat des parties du
 * jour (GROUP BY game_mode, duration, cf. getDailySessionsAgg) :
 * - 'each_mode'    : une case par mode ACTIVÉ, cochée dès ≥1 partie de ce
 *                    mode aujourd'hui (n'importe quelle durée).
 * - 'same_mode_x5' : 5 cases génériques, cochées selon le nombre de parties
 *                    du mode le plus joué aujourd'hui (peu importe lequel).
 * - 'duration_x4'  : 4 cases génériques, cochées selon le nombre de parties
 *                    à durée nominale 5 minutes aujourd'hui.
 */

/**
 * @typedef {{game_mode: string, duration: number, count: number}} DailyAggRow
 * @typedef {{enabledModeIds: string[]}} MissionCtx
 * @typedef {{key: string, done: boolean}} MissionSlot
 */

export const MISSIONS = [
  {
    id: 'each_mode',
    titleKey: 'mission.each_mode.title',
    descriptionKey: 'mission.each_mode.description',
    /**
     * @param {DailyAggRow[]} rows
     * @param {MissionCtx} ctx
     */
    computeObjectives(rows, ctx) {
      const playedModes = new Set(rows.filter((r) => r.count > 0).map((r) => r.game_mode));
      const slots = ctx.enabledModeIds.map((modeId) => ({
        key: modeId,
        done: playedModes.has(modeId)
      }));
      return { slots, completed: slots.length > 0 && slots.every((s) => s.done) };
    }
  },
  {
    id: 'same_mode_x5',
    goal: 5,
    titleKey: 'mission.same_mode_x5.title',
    descriptionKey: 'mission.same_mode_x5.description',
    /** @param {DailyAggRow[]} rows */
    computeObjectives(rows) {
      const byMode = new Map();
      for (const row of rows) {
        byMode.set(row.game_mode, (byMode.get(row.game_mode) ?? 0) + row.count);
      }
      const best = Math.max(0, ...byMode.values());
      const progress = Math.min(best, this.goal);
      const slots = Array.from({ length: this.goal }, (_, i) => ({
        key: `slot_${i}`,
        done: i < progress
      }));
      return { slots, completed: progress >= this.goal };
    }
  },
  {
    id: 'duration_x4',
    goal: 4,
    durationMinutes: 5,
    titleKey: 'mission.duration_x4.title',
    descriptionKey: 'mission.duration_x4.description',
    /** @param {DailyAggRow[]} rows */
    computeObjectives(rows) {
      const count = rows
        .filter((r) => r.duration === this.durationMinutes)
        .reduce((sum, r) => sum + r.count, 0);
      const progress = Math.min(count, this.goal);
      const slots = Array.from({ length: this.goal }, (_, i) => ({
        key: `slot_${i}`,
        done: i < progress
      }));
      return { slots, completed: progress >= this.goal };
    }
  }
];

/**
 * Hash déterministe simple d'une chaîne, sans lib externe (dans l'esprit de
 * getParisToday()) — mod avant dépassement, pas après.
 * @param {string} str
 */
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 2147483647;
  }
  return h;
}

/**
 * Mission du jour, identique pour tous les joueurs (tirage déterministe par
 * date, pas de tirage par utilisateur, pas de table de rotation en base).
 * @param {string} dateISO - 'YYYY-MM-DD' (cf. getParisToday())
 * @param {typeof MISSIONS} [catalog]
 */
export function pickMissionForDate(dateISO, catalog = MISSIONS) {
  return catalog[hashString(dateISO) % catalog.length];
}
