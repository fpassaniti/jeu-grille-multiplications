import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getChestAvailability } from '$lib/server/chests.js';

/**
 * Coffres disponibles pour l'utilisateur connecté (SPEC §5.5).
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const availability = await getChestAvailability(sessionUser.id);
    if (!availability) {
      return json({ error: 'Progression introuvable' }, { status: 404 });
    }
    return json({ success: true, ...availability });
  } catch (error) {
    console.error('Erreur lors du chargement des coffres:', error);
    return json({ error: 'Erreur serveur lors du chargement des coffres' }, { status: 500 });
  }
}
