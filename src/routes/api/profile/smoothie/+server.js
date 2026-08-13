import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';
import { isValidSmoothie, smoothieKey } from '$lib/utils/smoothie.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Authentification requise' }, { status: 401 });
  }

  const { smoothie } = await request.json();
  if (!isValidSmoothie(smoothie)) {
    return json({ error: 'Le smoothie doit contenir 1 à 3 emoji distincts de la palette' }, { status: 400 });
  }

  await sql`UPDATE users SET password_emojis = ${smoothieKey(smoothie)} WHERE id = ${sessionUser.id}`;

  return json({ success: true });
}
