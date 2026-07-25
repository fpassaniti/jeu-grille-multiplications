import { getAllItems, getEquipment } from '$lib/server/shop.js';

export async function load({ locals }) {
  const [items, equipment] = await Promise.all([
    getAllItems(),
    getEquipment(locals.user.id)
  ]);

  return { items, equipment };
}
