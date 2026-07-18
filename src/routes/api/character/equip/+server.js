import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';
import { getEquipment, EQUIPMENT_SLOTS } from '$lib/server/shop.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const { slot, itemId } = await request.json();
    if (!EQUIPMENT_SLOTS.includes(slot)) {
      return json({ error: 'Slot invalide' }, { status: 400 });
    }

    if (itemId === null || itemId === undefined) {
      await sql`DELETE FROM user_equipment WHERE user_id = ${sessionUser.id} AND slot = ${slot}`;
    } else {
      const parsedItemId = parseInt(itemId, 10);
      const rows = await sql`
        INSERT INTO user_equipment (user_id, slot, item_id)
        SELECT ${sessionUser.id}, i.slot, i.id FROM items i
        WHERE i.id = ${parsedItemId} AND i.slot = ${slot}
          AND (i.is_default OR EXISTS (
            SELECT 1 FROM user_inventory ui WHERE ui.user_id = ${sessionUser.id} AND ui.item_id = i.id
          ))
        ON CONFLICT (user_id, slot) DO UPDATE SET item_id = EXCLUDED.item_id
        RETURNING item_id
      `;
      if (!rows || rows.length === 0) {
        return json({ error: "Cet item n'est pas possédé ou ne correspond pas au slot" }, { status: 403 });
      }
    }

    const equipment = await getEquipment(sessionUser.id);
    return json({ success: true, equipment });
  } catch (error) {
    console.error("Erreur lors de l'équipement:", error);
    return json({ error: "Erreur serveur lors de l'équipement" }, { status: 500 });
  }
}
