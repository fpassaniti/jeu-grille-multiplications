import { redirect } from '@sveltejs/kit';
import { getShopData, getEquipment } from '$lib/server/shop.js';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const [shop, equipment] = await Promise.all([
    getShopData(locals.user.id),
    getEquipment(locals.user.id)
  ]);

  return { user: locals.user, shop, equipment };
}
