import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const { username, passwordChar } = await request.json();

    // Validation basique
    if (!username || !passwordChar) {
      return json({ error: 'Nom d\'utilisateur et caractère de mot de passe requis' }, { status: 400 });
    }

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier les identifiants
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, display_name, password_char')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier le caractère de mot de passe
    if (user.password_char !== passwordChar) {
      return json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Mettre à jour la date de dernière connexion
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

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
