import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { smoothieKey } from '$lib/utils/smoothie.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const { username, smoothie } = await request.json();

    // Validation basique
    if (!username || !smoothie) {
      return json({ error: 'Nom d\'utilisateur et smoothie requis' }, { status: 400 });
    }

    // Vérifier les identifiants
    const users = await sql`
      SELECT id, username, display_name, password_emojis
      FROM users
      WHERE username = ${username}
    `;

    const user = users[0];

    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier le smoothie (ordre libre : on compare les représentations triées)
    if (user.password_emojis !== smoothieKey(smoothie)) {
      return json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Mettre à jour la date de dernière connexion
    await sql`
      UPDATE users
      SET last_login = NOW()
      WHERE id = ${user.id}
    `;

    // Créer une session pour l'utilisateur
    const sessionId = crypto.randomUUID();
    const userData = {
      id: user.id,
      username: user.username,
      displayName: user.display_name
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
      message: 'Connexion réussie',
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);

    return json({
      error: 'Erreur lors de la connexion'
    }, { status: 500 });
  }
}
