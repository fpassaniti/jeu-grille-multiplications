import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
  // Supprimer le cookie de session
  cookies.delete('session', { path: '/' });

  return json({
    success: true,
    message: 'Déconnexion réussie'
  });
}
