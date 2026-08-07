-- ============================================================
-- 009. Suppression de la colonne items.is_purchasable
-- ============================================================
-- Plus aucun mécanisme ne réserve un item à un tirage de coffre (008) : tous
-- les items sont achetables par construction. is_default reste seule
-- responsable de marquer un item comme offert gratuitement par défaut
-- (géré manuellement en base). Ne supprime aucune ligne, seulement la
-- colonne devenue inutile.

CREATE OR REPLACE FUNCTION buy_item(p_user_id UUID, p_item_id INTEGER)
RETURNS TABLE (success BOOLEAN, error_code TEXT, price_paid INTEGER, coins_balance INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_user user_progress%ROWTYPE;
  v_item items%ROWTYPE;
  v_today DATE := (NOW() AT TIME ZONE 'Europe/Paris')::date;
  v_is_offer BOOLEAN;
  v_price INTEGER;
  v_balance INTEGER;
BEGIN
  PERFORM 1 FROM user_progress WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO v_user FROM user_progress WHERE user_id = p_user_id;

  SELECT * INTO v_item FROM items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'item_not_found', NULL::int, v_user.coins; RETURN;
  END IF;
  IF v_item.is_default THEN
    RETURN QUERY SELECT false, 'already_owned', NULL::int, v_user.coins; RETURN;
  END IF;
  IF v_item.unlock_level > v_user.level THEN
    RETURN QUERY SELECT false, 'level_locked', NULL::int, v_user.coins; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND item_id = p_item_id) THEN
    RETURN QUERY SELECT false, 'already_owned', NULL::int, v_user.coins; RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT id FROM items WHERE NOT is_default
      ORDER BY md5(v_today::text || code) LIMIT 3
    ) offers WHERE offers.id = p_item_id
  ) INTO v_is_offer;
  v_price := CASE WHEN v_is_offer THEN FLOOR(v_item.price * 0.8)::int ELSE v_item.price END;

  UPDATE user_progress SET coins = coins - v_price
   WHERE user_id = p_user_id AND coins >= v_price
   RETURNING coins INTO v_balance;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'insufficient_coins', NULL::int, v_user.coins; RETURN;
  END IF;

  INSERT INTO user_inventory (user_id, item_id, source) VALUES (p_user_id, p_item_id, 'shop');
  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, -v_price, 'purchase', jsonb_build_object('item_id', p_item_id, 'discounted', v_is_offer));

  RETURN QUERY SELECT true, NULL::text, v_price, v_balance;
END;
$$;

ALTER TABLE items DROP COLUMN is_purchasable;
