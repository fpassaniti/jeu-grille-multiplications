import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // Redirection vers le niveau 1 par défaut
  throw redirect(302, '/debug-print/1');
}