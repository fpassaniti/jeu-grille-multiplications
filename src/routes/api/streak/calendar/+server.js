import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getPlayedDays, getEarliestPlayedMonth } from '$lib/server/streakCalendar.js';

const MONTH_RE = /^\d{4}-\d{2}$/;

/**
 * Jours joués d'un mois donné, pour la navigation du calendrier de série
 * (le mois courant est déjà chargé côté SSR par le dashboard).
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ cookies, url }) {
  const sessionUser = getSessionUser(cookies);
  if (!sessionUser) {
    return json({ error: 'Non authentifié' }, { status: 401 });
  }

  const month = url.searchParams.get('month');
  if (!month || !MONTH_RE.test(month)) {
    return json({ error: 'Paramètre month invalide (attendu YYYY-MM)' }, { status: 400 });
  }

  try {
    const [playedDays, earliestMonth] = await Promise.all([
      getPlayedDays(sessionUser.id, month),
      getEarliestPlayedMonth(sessionUser.id)
    ]);
    return json({ success: true, month, playedDays, earliestMonth });
  } catch (error) {
    console.error('Erreur lors du chargement du calendrier de série:', error);
    return json({ error: 'Erreur serveur lors du chargement du calendrier' }, { status: 500 });
  }
}
