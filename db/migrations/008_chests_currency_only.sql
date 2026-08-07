-- ============================================================
-- 008. Coffres = pièces uniquement (plus de tirage d'objet)
-- ============================================================
-- Décision produit : les objets gratuits distribués par les coffres
-- permettaient de s'équiper trop vite sans jamais passer par la boutique.
-- open_chest() ne fait plus que créditer des pièces ; plus de rareté, plus
-- de pity, plus de doublon/remboursement, plus d'exclusifs de level-up.
-- Ne touche pas aux données existantes (chest_openings/user_inventory
-- historiques restent inchangées).

CREATE OR REPLACE FUNCTION open_chest(p_user_id UUID, p_chest_type TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user user_progress%ROWTYPE;
  v_today DATE := (NOW() AT TIME ZONE 'Europe/Paris')::date;
  v_coins INTEGER := 0;
  v_milestone INTEGER;
  v_rewards JSONB;
BEGIN
  PERFORM 1 FROM user_progress WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO v_user FROM user_progress WHERE user_id = p_user_id;

  IF p_chest_type = 'daily' THEN
    IF v_user.last_daily_chest_at IS NOT NULL AND v_user.last_daily_chest_at >= v_today THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 30 + FLOOR(random() * 51)::int;
    UPDATE user_progress SET last_daily_chest_at = v_today WHERE user_id = p_user_id;

  ELSIF p_chest_type = 'streak' THEN
    SELECT MAX(m) INTO v_milestone FROM (VALUES (60), (30), (14), (7), (3)) AS milestones(m)
     WHERE v_user.streak_days >= m AND v_user.last_streak_reward < m;
    IF v_milestone IS NULL THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    IF v_milestone = 7 THEN
      v_coins := 100;
    ELSIF v_milestone = 60 THEN
      v_coins := 500;
    END IF;
    UPDATE user_progress SET last_streak_reward = v_milestone WHERE user_id = p_user_id;

  ELSIF p_chest_type = 'levelup' THEN
    IF EXISTS (
      SELECT 1 FROM chest_openings
       WHERE user_id = p_user_id AND chest_type = 'levelup'
         AND (rewards->>'level')::int = v_user.level
    ) THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 100 + 20 * v_user.level;

  ELSIF p_chest_type = 'perfect' THEN
    IF NOT EXISTS (
      SELECT 1 FROM game_sessions
       WHERE user_id = p_user_id AND errors_count = 0 AND cells_solved >= 10
         AND (date AT TIME ZONE 'Europe/Paris')::date = v_today
    ) THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    IF EXISTS (
      SELECT 1 FROM chest_openings
       WHERE user_id = p_user_id AND chest_type = 'perfect'
         AND (opened_at AT TIME ZONE 'Europe/Paris')::date = v_today
    ) THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 25 + FLOOR(random() * 51)::int;

  ELSIF p_chest_type = 'welcome' THEN
    IF EXISTS (SELECT 1 FROM chest_openings WHERE user_id = p_user_id AND chest_type = 'welcome') THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 100;

  ELSE
    RETURN jsonb_build_object('error', 'unknown_chest_type');
  END IF;

  UPDATE user_progress
     SET coins = coins + v_coins,
         coins_total_earned = coins_total_earned + v_coins
   WHERE user_id = p_user_id;

  v_rewards := jsonb_strip_nulls(jsonb_build_object(
    'coins', v_coins,
    'milestone', v_milestone,
    'level', CASE WHEN p_chest_type = 'levelup' THEN v_user.level ELSE NULL END
  ));

  INSERT INTO chest_openings (user_id, chest_type, rewards) VALUES (p_user_id, p_chest_type, v_rewards);
  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, v_coins,
          CASE p_chest_type WHEN 'daily' THEN 'daily_chest' WHEN 'streak' THEN 'streak_chest'
                            WHEN 'levelup' THEN 'levelup_chest' ELSE p_chest_type END,
          v_rewards);

  RETURN v_rewards || jsonb_build_object('balance', v_user.coins + v_coins);
END;
$$;
