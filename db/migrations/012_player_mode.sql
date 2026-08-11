-- 012_player_mode.sql — Simplification adulte/enfant (TODO.md §Ajustement)
-- Le mode adulte/enfant devient un attribut permanent du compte (users.player_mode),
-- fixé à l'inscription et modifiable en page profil, au lieu d'un choix refait à
-- chaque lancement de partie. Migration additive et idempotente.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS player_mode VARCHAR(10) NOT NULL DEFAULT 'adulte'
    CHECK (player_mode IN ('adulte', 'enfant'));

-- Backfill : pour les comptes existants, on reprend le level de leur dernière
-- partie jouée plutôt que d'imposer 'adulte' par défaut à tout le monde.
UPDATE users u
SET player_mode = last_game.level
FROM (
  SELECT DISTINCT ON (user_id) user_id, level
  FROM game_sessions
  WHERE level IN ('adulte', 'enfant')
  ORDER BY user_id, date DESC
) AS last_game
WHERE last_game.user_id = u.id;

-- create_new_user gagne un paramètre player_mode (choisi à l'inscription).
-- CREATE OR REPLACE avec une signature élargie crée un second overload
-- (identité de fonction Postgres = nom + types d'arguments) plutôt que de
-- remplacer l'ancien — on le supprime explicitement, le seul appelant
-- (POST /api/auth/register) passe désormais toujours player_mode.
DROP FUNCTION IF EXISTS public.create_new_user(character varying, character, character varying);

CREATE OR REPLACE FUNCTION public.create_new_user(
  p_username character varying,
  p_password_char character,
  p_display_name character varying,
  p_player_mode character varying DEFAULT 'adulte'
)
 RETURNS TABLE(user_id uuid, username character varying, display_name character varying, xp integer, level integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO users (username, password_char, display_name, player_mode)
  VALUES (p_username, p_password_char, p_display_name, p_player_mode)
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
