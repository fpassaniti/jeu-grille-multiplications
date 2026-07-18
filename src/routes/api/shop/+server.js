import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getShopData } from '$lib/server/shop.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const data = await getShopData(sessionUser.id);
    return json({ success: true, ...data });
  } catch (error) {
    console.error('Erreur lors du chargement de la boutique:', error);
    return json({ error: 'Erreur serveur lors du chargement de la boutique' }, { status: 500 });
  }
}
