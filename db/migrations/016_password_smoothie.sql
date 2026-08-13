-- 016_password_smoothie.sql — Mot de passe "smoothie" (1 à 3 emoji, ordre libre)
-- Remplace le mot de passe à 1 emoji (password_char, character(1), dette #4 SPEC.md)
-- par un "smoothie" de 1 à 3 emoji choisis dans la même palette. Stocké comme une
-- chaîne des emoji triés selon leur position dans la palette canonique et joints
-- par une virgule (ex. "🍎,🍓") — voir src/lib/utils/smoothie.js#smoothieKey.
-- Un compte existant (1 seul emoji) migre tel quel, sans virgule : aucune rupture.

ALTER TABLE users ADD COLUMN password_emojis TEXT;

UPDATE users SET password_emojis = TRIM(password_char) WHERE password_char IS NOT NULL;

ALTER TABLE users ALTER COLUMN password_emojis SET NOT NULL;

ALTER TABLE users ADD CONSTRAINT users_password_emojis_check
  CHECK (password_emojis <> '' AND array_length(string_to_array(password_emojis, ','), 1) BETWEEN 1 AND 3);

ALTER TABLE users DROP COLUMN password_char;

-- create_new_user gagne un paramètre élargi (text au lieu de character) — DROP
-- explicite requis car changer le type d'un paramètre crée un overload plutôt
-- que de remplacer l'existant (cf. 012_player_mode.sql).
DROP FUNCTION IF EXISTS public.create_new_user(character varying, character, character varying, character varying);

CREATE OR REPLACE FUNCTION public.create_new_user(
  p_username character varying,
  p_password_emojis text,
  p_display_name character varying,
  p_player_mode character varying DEFAULT 'adulte'
)
 RETURNS TABLE(user_id uuid, username character varying, display_name character varying, xp integer, level integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO users (username, password_emojis, display_name, player_mode)
  VALUES (p_username, p_password_emojis, p_display_name, p_player_mode)
  RETURNING users.id INTO v_user_id;

  INSERT INTO user_progress (user_id, xp, level, games_played, total_score)
  VALUES (v_user_id, 0, 1, 0, 0);

  RETURN QUERY
  SELECT
    v_user_id,
    p_username,
    p_display_name,
    0,
    1;
END;
$function$;
