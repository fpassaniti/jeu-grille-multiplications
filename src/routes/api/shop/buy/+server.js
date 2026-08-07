import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';

const ERROR_STATUS = {
  item_not_found: 404,
  unknown_consumable: 404,
  level_locked: 403,
  already_owned: 409,
  already_active: 409,
  freeze_cap_reached: 409,
  insufficient_coins: 402
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.consumable) {
      if (!['freeze', 'booster'].includes(body.consumable)) {
        return json({ error: 'Consommable inconnu' }, { status: 400 });
      }
      const rows = await sql`SELECT buy_consumable(${sessionUser.id}, ${body.consumable}) AS result`;
      const result = rows[0].result;
      if (result.error) {
        return json({ error: result.error }, { status: ERROR_STATUS[result.error] ?? 400 });
      }
      return json({ success: true, coinsBalance: result.coinsBalance, pricePaid: result.pricePaid });
    }

    const itemId = parseInt(body.itemId, 10);
    if (!Number.isInteger(itemId)) {
      return json({ error: 'itemId invalide' }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM buy_item(${sessionUser.id}, ${itemId})`;
    const result = rows[0];
    if (!result.success) {
      return json(
        { error: result.error_code },
        { status: ERROR_STATUS[result.error_code] ?? 400 }
      );
    }

    return json({
      success: true,
      coinsBalance: result.coins_balance,
      pricePaid: result.price_paid
    });
  } catch (error) {
    console.error("Erreur lors de l'achat:", error);
    return json({ error: "Erreur serveur lors de l'achat" }, { status: 500 });
  }
}
