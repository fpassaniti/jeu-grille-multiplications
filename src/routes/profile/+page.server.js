import { redirect } from '@sveltejs/kit';
import { sql } from '$lib/server/db';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const rows = await sql`
    SELECT username, display_name, player_mode FROM users WHERE id = ${locals.user.id}
  `;
  const account = rows[0];

  return {
    account: {
      username: account.username,
      displayName: account.display_name,
      playerMode: account.player_mode
    }
  };
}
