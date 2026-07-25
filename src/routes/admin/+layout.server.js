import { redirect } from '@sveltejs/kit';

// Accès admin réservé au compte 'Fred' : pas de notion de rôle en base, on filtre par username.
export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  if (locals.user.username !== 'Fred') {
    throw redirect(302, '/');
  }
  return { user: locals.user };
}
