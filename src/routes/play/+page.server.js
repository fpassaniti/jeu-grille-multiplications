import { redirect } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { DEFAULT_PLAYER_MODE } from '$lib/utils/player-mode.js';
import { getUserPotions } from '$lib/server/potions.js';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  // player_mode n'est plus un choix fait au lancement de la partie : c'est un
  // attribut du compte (TODO.md §Ajustement), lu ici plutôt que dans le cookie
  // de session (qui peut être périmé si le mode a été changé sur /profile).
  const rows = await sql`SELECT player_mode FROM users WHERE id = ${locals.user.id}`;
  const playerMode = rows[0]?.player_mode ?? DEFAULT_PLAYER_MODE;

  const { catalog } = await getUserPotions(locals.user.id);
  const ownedPotions = catalog.filter((p) => p.quantity > 0);

  return { playerMode, potions: ownedPotions };
}
