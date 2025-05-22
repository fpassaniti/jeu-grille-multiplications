import { checkRateLimit } from '$lib/server/rateLimiter.js'; // Adjust path if necessary
import { json } from '@sveltejs/kit';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { request, url, getClientAddress, cookies } = event; // Added cookies here for existing logic
  const ip = getClientAddress();

  // Rate limit POST requests to /api/session/start
  if (url.pathname === '/api/session/start' && request.method === 'POST') {
    if (!checkRateLimit(ip, false)) {
      return json({ error: 'Too many requests to create session. Please try again later.' }, { status: 429 });
    }
  }

  // Rate limit POST requests to /api/scores
  if (url.pathname === '/api/scores' && request.method === 'POST') {
    if (!checkRateLimit(ip, true)) { // true indicates it's a score submission, using stricter limits
      return json({ error: 'Too many score submissions. Please try again later.' }, { status: 429 });
    }
  }

  // Récupérer la session depuis les cookies (existing logic)
  const sessionCookie = cookies.get('session'); // Used event.cookies before, now directly from destructured 'cookies'

  if (sessionCookie) {
    try {
      // Décoder la session
      const session = JSON.parse(sessionCookie);

      // Ajouter les données de l'utilisateur à l'objet locals
      event.locals.user = session.user;
      event.locals.authenticated = true;
    } catch (error) {
      // Si erreur dans le parsing du cookie, considérer que l'utilisateur n'est pas connecté
      event.locals.authenticated = false;
      event.locals.user = null;
    }
  } else {
    event.locals.authenticated = false;
    event.locals.user = null;
  }

  // Continuer vers le handler de la route
  return await resolve(event);
}
