import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';
import { PLAYER_MODES } from '$lib/utils/player-mode.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Authentification requise' }, { status: 401 });
  }

  const { playerMode } = await request.json();
  if (!PLAYER_MODES.includes(playerMode)) {
    return json({ error: 'Mode adulte/enfant invalide' }, { status: 400 });
  }

  await sql`UPDATE users SET player_mode = ${playerMode} WHERE id = ${sessionUser.id}`;

  return json({ success: true, playerMode });
}
