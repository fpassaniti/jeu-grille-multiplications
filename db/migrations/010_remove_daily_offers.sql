-- ============================================================
-- 010. Suppression de la mécanique de promotion (offres du jour)
-- ============================================================
-- Décision produit : plus de remise automatique -20% sur 3 items/jour.
-- Les prix sont désormais fixes ; buy_item() facture toujours items.price.

CREATE OR REPLACE FUNCTION buy_item(p_user_id UUID, p_item_id INTEGER)
RETURNS TABLE (success BOOLEAN, error_code TEXT, price_paid INTEGER, coins_balance INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_user user_progress%ROWTYPE;
  v_item items%ROWTYPE;
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

  v_price := v_item.price;

  UPDATE user_progress SET coins = coins - v_price
   WHERE user_id = p_user_id AND coins >= v_price
   RETURNING coins INTO v_balance;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'insufficient_coins', NULL::int, v_user.coins; RETURN;
  END IF;

  INSERT INTO user_inventory (user_id, item_id, source) VALUES (p_user_id, p_item_id, 'shop');
  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, -v_price, 'purchase', jsonb_build_object('item_id', p_item_id));

  RETURN QUERY SELECT true, NULL::text, v_price, v_balance;
END;
$$;
