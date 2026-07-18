-- Fonction historiquement non versionnée (dette #3) — extraite de la base de
-- production Neon (square-water-55208846) le 2026-07-18, sans modification.
-- Crée un utilisateur et sa ligne user_progress initiale (niveau 1, 0 XP).

CREATE OR REPLACE FUNCTION public.create_new_user(p_username character varying, p_password_char character, p_display_name character varying)
 RETURNS TABLE(user_id uuid, username character varying, display_name character varying, xp integer, level integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert new user
  INSERT INTO users (username, password_char, display_name)
  VALUES (p_username, p_password_char, p_display_name)
  RETURNING users.id INTO v_user_id;

  -- Create user progress record
  INSERT INTO user_progress (user_id, xp, level, games_played, total_score)
  VALUES (v_user_id, 0, 1, 0, 0);

  -- Return user data
  RETURN QUERY
  SELECT
    v_user_id,
    p_username,
    p_display_name,
    0,
    1;
END;
$function$
