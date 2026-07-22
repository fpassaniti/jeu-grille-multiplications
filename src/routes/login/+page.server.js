import { redirect } from '@sveltejs/kit';

// Redirige côté serveur si déjà connecté (évite un GET client vers un
// endpoint qui n'existe qu'en POST — dette #8).
export function load({ locals }) {
  if (locals.user) {
    throw redirect(302, '/');
  }
  return {};
}
