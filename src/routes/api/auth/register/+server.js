import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { PLAYER_MODES } from '$lib/utils/player-mode.js';
import { isValidSmoothie, smoothieKey } from '$lib/utils/smoothie.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const { username, smoothie, displayName, playerMode } = await request.json();

    // Validation basique
    if (!username || !smoothie) {
      return json({ error: 'Nom d\'utilisateur et smoothie requis' }, { status: 400 });
    }

    if (!isValidSmoothie(smoothie)) {
      return json({ error: 'Le smoothie doit contenir 1 à 3 emoji distincts de la palette' }, { status: 400 });
    }

    if (!PLAYER_MODES.includes(playerMode)) {
      return json({ error: 'Mode adulte/enfant requis' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existingUsers.length > 0) {
      return json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 409 });
    }

    // Créer le nouvel utilisateur avec la fonction SQL
    const result = await sql`
      SELECT * FROM create_new_user(${username}, ${smoothieKey(smoothie)}, ${displayName || username}, ${playerMode})
    `;

    if (!result || result.length === 0) throw new Error('Failed to create user');
    const data = result[0];

    // Créer une session pour l'utilisateur
    const sessionId = crypto.randomUUID();
    const userData = {
      id: data.user_id,
      username: data.username,
      displayName: data.display_name
    };

    // Stocker la session dans un cookie sécurisé (1 semaine d'expiration)
    cookies.set('session', JSON.stringify({
      id: sessionId,
      user: userData
    }), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 semaine
    });

    return json({
      success: true,
      message: 'Compte créé avec succès',
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);

    return json({
      error: 'Erreur lors de la création du compte'
    }, { status: 500 });
  }
}
