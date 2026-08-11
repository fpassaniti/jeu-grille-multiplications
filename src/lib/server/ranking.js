import { sql } from '$lib/server/db';

/**
 * Classement général des joueurs d'un mode (adulte/enfant) par XP.
 * @param {string} playerMode
 * @param {string|null} viewerUserId
 */
export async function getRanking(playerMode, viewerUserId = null) {
  const rows = await sql`
    SELECT u.id, u.display_name, up.xp, up.level, up.games_played, ld.color_theme
    FROM users u
    JOIN user_progress up ON up.user_id = u.id
    LEFT JOIN level_definitions ld ON ld.level = up.level
    WHERE u.player_mode = ${playerMode}
    ORDER BY up.xp DESC, u.display_name ASC
  `;

  const ranked = rows.map((row, index) => ({
    rank: index + 1,
    displayName: row.display_name,
    xp: row.xp,
    level: row.level,
    colorTheme: row.color_theme,
    gamesPlayed: row.games_played,
    isViewer: row.id === viewerUserId
  }));

  return {
    mode: playerMode,
    top: ranked.slice(0, 20),
    total: ranked.length,
    viewerEntry: viewerUserId ? (ranked.find(entry => entry.isViewer) ?? null) : null
  };
}
