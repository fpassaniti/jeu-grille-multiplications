/**
 * Lecture de la session utilisateur depuis le cookie.
 * Centralise le parsing dupliqué dans les endpoints API.
 */

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @returns {{id: string, username: string, displayName?: string}|null}
 */
export function getSessionUser(cookies) {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) {
    return null;
  }
  try {
    const session = JSON.parse(sessionCookie);
    if (!session?.user?.id) {
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}
