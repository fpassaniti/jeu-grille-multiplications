import { sql } from '$lib/server/db';

const EQUIPMENT_SLOTS = ['background', 'aura', 'back', 'body', 'outfit', 'weapon', 'hat', 'pet'];
// Slots avec un équipement de départ (résolution virtuelle, aucune ligne user_equipment seedée)
const DEFAULT_SLOTS = ['body', 'outfit', 'weapon'];

/**
 * Catalogue complet joint à l'inventaire/l'équipement de l'utilisateur et aux
 * offres du jour (décote -20%, sélection déterministe par date, SPEC §5.4).
 * @param {string} userId
 */
export async function getShopData(userId) {
  const items = await sql`
    WITH offers AS (
      SELECT id FROM items WHERE is_purchasable
      ORDER BY md5(((NOW() AT TIME ZONE 'Europe/Paris')::date)::text || code) LIMIT 3
    )
    SELECT
      i.*,
      (ui.item_id IS NOT NULL OR i.is_default) AS owned,
      (ue.item_id IS NOT NULL) AS equipped,
      (o.id IS NOT NULL) AS is_daily_offer
    FROM items i
    LEFT JOIN user_inventory ui ON ui.item_id = i.id AND ui.user_id = ${userId}
    LEFT JOIN user_equipment ue ON ue.item_id = i.id AND ue.user_id = ${userId}
    LEFT JOIN offers o ON o.id = i.id
    ORDER BY i.sort_order
  `;

  const progress = await sql`SELECT coins, level FROM user_progress WHERE user_id = ${userId}`;
  const { coins = 0, level = 1 } = progress?.[0] ?? {};

  return {
    coins,
    level,
    items: items.map((item) => ({
      id: item.id,
      code: item.code,
      slot: item.slot,
      rarity: item.rarity,
      price: item.price,
      finalPrice: item.is_daily_offer ? Math.floor(item.price * 0.8) : item.price,
      isDailyOffer: item.is_daily_offer,
      assetUrl: item.asset_url,
      name: item.name,
      unlockLevel: item.unlock_level,
      isPurchasable: item.is_purchasable,
      isDefault: item.is_default,
      owned: item.owned,
      equipped: item.equipped
    }))
  };
}

/**
 * Équipement résolu d'un utilisateur : ce qu'il a équipé, complété par les
 * défauts virtuels (body/outfit/weapon) pour les slots vides — aucune ligne
 * user_equipment seedée, couvre aussi bien les comptes historiques que les
 * nouveaux inscrits.
 * @param {string} userId
 * @returns {Promise<Record<string, {itemId: number, code: string, assetUrl: string}|null>>}
 */
export async function getEquipment(userId) {
  const equipped = await sql`
    SELECT ue.slot, i.id AS item_id, i.code, i.asset_url
    FROM user_equipment ue
    JOIN items i ON i.id = ue.item_id
    WHERE ue.user_id = ${userId}
  `;
  const defaults = await sql`
    SELECT slot, id AS item_id, code, asset_url FROM items WHERE is_default = true
  `;

  const bySlot = {};
  for (const slot of EQUIPMENT_SLOTS) {
    bySlot[slot] = null;
  }
  for (const row of defaults) {
    if (DEFAULT_SLOTS.includes(row.slot)) {
      bySlot[row.slot] = { itemId: row.item_id, code: row.code, assetUrl: row.asset_url };
    }
  }
  for (const row of equipped) {
    bySlot[row.slot] = { itemId: row.item_id, code: row.code, assetUrl: row.asset_url };
  }
  return bySlot;
}

export { EQUIPMENT_SLOTS };
