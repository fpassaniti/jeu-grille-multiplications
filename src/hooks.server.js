/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Récupérer la session depuis les cookies
  const sessionCookie = event.cookies.get('session');

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
