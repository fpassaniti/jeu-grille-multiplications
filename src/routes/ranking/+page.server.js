import { sql } from '$lib/server/db';
import { getRanking } from '$lib/server/ranking.js';
import { DEFAULT_PLAYER_MODE } from '$lib/utils/player-mode.js';

export async function load({ locals }) {
  let defaultMode = DEFAULT_PLAYER_MODE;

  if (locals.user) {
    const rows = await sql`SELECT player_mode FROM users WHERE id = ${locals.user.id}`;
    defaultMode = rows[0]?.player_mode ?? DEFAULT_PLAYER_MODE;
  }

  const ranking = await getRanking(defaultMode, locals.user?.id ?? null);

  return { defaultMode, ranking };
}
