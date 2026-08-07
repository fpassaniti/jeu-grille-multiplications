import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';

const VALID_TYPES = ['daily', 'streak', 'levelup', 'perfect', 'welcome'];

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const { type } = await request.json();
    if (!VALID_TYPES.includes(type)) {
      return json({ error: 'Type de coffre inconnu' }, { status: 400 });
    }

    const rows = await sql`SELECT open_chest(${sessionUser.id}, ${type}) AS result`;
    const result = rows[0].result;

    if (result.error) {
      return json({ error: result.error }, { status: result.error === 'not_available' ? 409 : 400 });
    }

    return json({
      success: true,
      chestType: type,
      coins: result.coins,
      coinsBalance: result.balance,
      milestone: result.milestone ?? null,
      level: result.level ?? null
    });
  } catch (error) {
    console.error("Erreur lors de l'ouverture du coffre:", error);
    return json({ error: "Erreur serveur lors de l'ouverture du coffre" }, { status: 500 });
  }
}
