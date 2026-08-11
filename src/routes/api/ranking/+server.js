import { json } from '@sveltejs/kit';
import { getRanking } from '$lib/server/ranking.js';
import { PLAYER_MODES, DEFAULT_PLAYER_MODE } from '$lib/utils/player-mode.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  const requested = url.searchParams.get('playerMode');
  const playerMode = PLAYER_MODES.includes(requested) ? requested : DEFAULT_PLAYER_MODE;
  const result = await getRanking(playerMode, locals.user?.id ?? null);
  return json(result);
}
