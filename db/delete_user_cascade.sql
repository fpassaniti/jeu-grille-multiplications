-- Supprime un utilisateur et toutes ses données liées, atomiquement.
-- user_progress et game_sessions ont une FK NO ACTION vers users (pas de
-- cascade native) : on les vide explicitement avant de supprimer la ligne
-- users, qui déclenche ensuite le ON DELETE CASCADE existant sur
-- user_inventory, user_equipment, coin_transactions et chest_openings.
-- La table scores n'a pas de user_id (seulement un champ name libre) et
-- n'est volontairement pas touchée.

CREATE OR REPLACE FUNCTION delete_user_cascade(p_user_id UUID)
RETURNS TABLE(deleted_user_id UUID, deleted_username VARCHAR)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_username VARCHAR;
BEGIN
  SELECT username INTO v_username FROM users WHERE id = p_user_id;

  IF v_username IS NULL THEN
    RETURN; -- utilisateur inexistant : aucune ligne retournée, pas d'erreur
  END IF;

  DELETE FROM game_sessions WHERE user_id = p_user_id;
  DELETE FROM user_progress WHERE user_id = p_user_id;
  DELETE FROM users WHERE id = p_user_id;
  -- cascade automatique : user_inventory, user_equipment, coin_transactions, chest_openings

  RETURN QUERY SELECT p_user_id, v_username;
END;
$function$;
