import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Configuration Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const { username, passwordChar, displayName } = await request.json();

    // Validation basique
    if (!username || !passwordChar) {
      return json({ error: 'Nom d\'utilisateur et caractère de mot de passe requis' }, { status: 400 });
    }

    if (passwordChar.length > 2) {
      return json({ error: 'Le mot de passe doit être un seul caractère' }, { status: 400 });
    }

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return json({ error: 'Ce nom d\'utilisateur est déjà pris' }, { status: 409 });
    }

    // Créer le nouvel utilisateur avec la fonction SQL
    const { data, error } = await supabase.rpc(
      'create_new_user',
      {
        p_username: username,
        p_password_char: passwordChar,
        p_display_name: displayName || username
      }
    );

    if (error) throw error;

    // Créer une session pour l'utilisateur
    const sessionId = crypto.randomUUID();
    const userData = {
      id: data,
      username,
      displayName: displayName || username
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
