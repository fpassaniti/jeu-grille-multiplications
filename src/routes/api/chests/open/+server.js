import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';
import { getMissionStatus } from '$lib/server/missions.js';

const VALID_TYPES = ['daily', 'streak', 'levelup', 'perfect', 'welcome', 'mission'];

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

    // Le coffre mission n'est jamais revalidé côté SQL (cf. migration 017) :
    // c'est ici, en JS, qu'on vérifie que la mission du jour est réellement
    // complétée avant d'autoriser l'ouverture — un client ne peut pas la
    // déclencher en forgeant simplement {type: 'mission'}.
    if (type === 'mission') {
      const status = await getMissionStatus(sessionUser.id);
      if (!status.chestAvailable) {
        return json({ error: 'not_available' }, { status: 409 });
      }
    }

    const rows = await sql`SELECT open_chest(${sessionUser.id}, ${type}) AS result`;
    const result = rows[0].result;

    if (result.error) {
      return json({ error: result.error }, { status: result.error === 'not_available' ? 409 : 400 });
    }

    // Résout les codes de potions gagnées en {code, name} pour l'affichage
    // (générique, pas seulement pour 'mission') plutôt que de dupliquer les
    // noms de potions dans les traductions — la source de vérité reste la
    // table `potions`.
    let potions = null;
    if (Array.isArray(result.potions) && result.potions.length > 0) {
      const potionRows = await sql`
        SELECT code, name FROM potions WHERE code = ANY(${result.potions}::text[])
      `;
      potions = potionRows;
    }

    return json({
      success: true,
      chestType: type,
      coins: result.coins,
      coinsBalance: result.balance,
      milestone: result.milestone ?? null,
      level: result.level ?? null,
      potions
    });
  } catch (error) {
    console.error("Erreur lors de l'ouverture du coffre:", error);
    return json({ error: "Erreur serveur lors de l'ouverture du coffre" }, { status: 500 });
  }
}
