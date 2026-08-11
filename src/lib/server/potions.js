import { sql } from '$lib/server/db';

const STOCKABLE_FAMILIES = ['time_bonus', 'time_grace', 'coin_multiplier'];

/**
 * Catalogue complet des potions, groupé par famille.
 */
export async function getPotionsCatalog() {
  const rows = await sql`SELECT * FROM potions ORDER BY sort_order`;
  return rows.map((row) => ({
    code: row.code,
    family: row.family,
    value: row.value,
    price: row.price,
    name: row.name,
    description: row.description
  }));
}

/**
 * Potions possédées par un joueur (stock des familles sélectionnables avant
 * partie) + banque de gel de streak (jours en réserve, jamais stockée dans
 * user_potions — créditée directement à l'achat).
 * @param {string} userId
 */
export async function getUserPotions(userId) {
  const rows = await sql`
    SELECT p.*, COALESCE(up.quantity, 0) AS quantity
    FROM potions p
    LEFT JOIN user_potions up ON up.potion_code = p.code AND up.user_id = ${userId}
    ORDER BY p.sort_order
  `;
  const progress = await sql`SELECT streak_freezes FROM user_progress WHERE user_id = ${userId}`;

  return {
    catalog: rows.map((row) => ({
      code: row.code,
      family: row.family,
      value: row.value,
      price: row.price,
      name: row.name,
      description: row.description,
      quantity: row.quantity
    })),
    streakFreezeDays: progress?.[0]?.streak_freezes ?? 0
  };
}

/**
 * Achat générique (cosmétique = buy_item, potion = buy_potion).
 * @param {string} userId
 * @param {string} code
 */
export async function buyPotion(userId, code) {
  const rows = await sql`SELECT buy_potion(${userId}, ${code}) AS result`;
  return rows[0].result;
}

/**
 * Vérifie la possession des potions sélectionnées pour une partie et, si
 * `counted`, décrémente leur stock. Ne fait jamais confiance à une valeur
 * numérique venue du client : `extraSec`/`coinMultiplier` sont dérivés du
 * catalogue en base à partir des codes vérifiés.
 *
 * Au plus une potion par famille "sélectionnable" est retenue (la première
 * rencontrée) — défensif contre une sélection UI incohérente, pas un rejet
 * dur : dédoublonner en silence plutôt que faire échouer toute la soumission.
 * @param {string} userId
 * @param {string[]} codes
 * @param {{counted: boolean}} options
 * @returns {Promise<{extraSec: number, coinMultiplier: number|null, consumedCodes: string[]}>}
 */
export async function verifyAndConsumePotions(userId, codes, { counted }) {
  const uniqueCodes = [...new Set(Array.isArray(codes) ? codes : [])];
  if (uniqueCodes.length === 0) {
    return { extraSec: 0, coinMultiplier: null, consumedCodes: [] };
  }

  const owned = await sql`
    SELECT p.code, p.family, p.value
    FROM potions p
    JOIN user_potions up ON up.potion_code = p.code AND up.user_id = ${userId}
    WHERE p.code = ANY(${uniqueCodes}::text[]) AND p.family = ANY(${STOCKABLE_FAMILIES}::text[]) AND up.quantity > 0
  `;

  const seenFamilies = new Set();
  const selected = [];
  for (const row of owned) {
    if (seenFamilies.has(row.family)) continue;
    seenFamilies.add(row.family);
    selected.push(row);
  }

  let extraSec = 0;
  let coinMultiplier = null;
  for (const row of selected) {
    if (row.family === 'time_bonus' || row.family === 'time_grace') {
      extraSec += row.value;
    } else if (row.family === 'coin_multiplier') {
      coinMultiplier = row.value;
    }
  }

  const consumedCodes = selected.map((row) => row.code);
  if (counted && consumedCodes.length > 0) {
    await sql`
      UPDATE user_potions SET quantity = quantity - 1
      WHERE user_id = ${userId} AND potion_code = ANY(${consumedCodes}::text[]) AND quantity > 0
    `;
  }

  return { extraSec, coinMultiplier, consumedCodes };
}
