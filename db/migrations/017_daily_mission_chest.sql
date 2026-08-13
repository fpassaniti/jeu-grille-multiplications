-- ============================================================
-- 017. Coffre "mission du jour"
-- ============================================================
-- Nouveau chest_type 'mission', ouvert quand le joueur a complété la
-- mission unique du jour. La mission (catalogue de 3 entrées, cf.
-- src/lib/missions/catalog.js) est tirée de façon déterministe par la
-- date, IDENTIQUE pour tous les joueurs — pas de table de mission en base,
-- pas de state à synchroniser.
--
-- open_chest('mission', ...) ne fait QUE la dédup anti-double-réclamation
-- du jour (comme 'perfect') : il ne revalide JAMAIS la complétion de la
-- mission elle-même, pour ne pas dupliquer en SQL la logique du catalogue
-- JS. C'est à l'appelant (POST /api/chests/open) de vérifier la complétion
-- via src/lib/server/missions.js AVANT d'appeler cette fonction.
--
-- EXCEPTION SCOPÉE au coffre 'mission' : la décision "coffres = pièces
-- uniquement" (008_chests_currency_only.sql, mémoire projet
-- "chest-currency-only-and-is-purchasable-removal") reste en vigueur pour
-- TOUS les autres chest_type (daily/streak/levelup/perfect/welcome), qui
-- ne distribuent toujours QUE des pièces. Le coffre 'mission' est la SEULE
-- exception : il récompense un effort ponctuel et mérité (plusieurs
-- parties dans la même journée, pas un tirage gratuit répété) avec, en
-- plus des pièces, 1 à 2 potions tirées parmi les familles stockables
-- time_bonus/time_grace/coin_multiplier — jamais streak_freeze, jugée trop
-- forte pour un tirage gratuit quotidien.

CREATE OR REPLACE FUNCTION open_chest(p_user_id UUID, p_chest_type TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user user_progress%ROWTYPE;
  v_today DATE := (NOW() AT TIME ZONE 'Europe/Paris')::date;
  v_coins INTEGER := 0;
  v_milestone INTEGER;
  v_rewards JSONB;
  v_potion_codes TEXT[];
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

  ELSIF p_chest_type = 'mission' THEN
    -- Dédup anti-double-réclamation du jour uniquement — la complétion de
    -- la mission est vérifiée en JS par l'appelant (voir en-tête).
    IF EXISTS (
      SELECT 1 FROM chest_openings
       WHERE user_id = p_user_id AND chest_type = 'mission'
         AND (opened_at AT TIME ZONE 'Europe/Paris')::date = v_today
    ) THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 40 + FLOOR(random() * 41)::int;

    SELECT COALESCE(array_agg(code), '{}') INTO v_potion_codes FROM (
      SELECT code FROM potions
       WHERE family = ANY(ARRAY['time_bonus', 'time_grace', 'coin_multiplier'])
       ORDER BY random()
       LIMIT (1 + FLOOR(random() * 2))::int
    ) drawn;

    IF array_length(v_potion_codes, 1) > 0 THEN
      INSERT INTO user_potions (user_id, potion_code, quantity)
      SELECT p_user_id, code, 1 FROM unnest(v_potion_codes) AS code
      ON CONFLICT (user_id, potion_code) DO UPDATE SET quantity = user_potions.quantity + 1;
    END IF;

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
    'level', CASE WHEN p_chest_type = 'levelup' THEN v_user.level ELSE NULL END,
    'potions', CASE WHEN array_length(v_potion_codes, 1) > 0 THEN to_jsonb(v_potion_codes) ELSE NULL END
  ));

  INSERT INTO chest_openings (user_id, chest_type, rewards) VALUES (p_user_id, p_chest_type, v_rewards);
  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, v_coins,
          CASE p_chest_type WHEN 'daily' THEN 'daily_chest' WHEN 'streak' THEN 'streak_chest'
                            WHEN 'levelup' THEN 'levelup_chest' WHEN 'mission' THEN 'mission_chest'
                            ELSE p_chest_type END,
          v_rewards);

  RETURN v_rewards || jsonb_build_object('balance', v_user.coins + v_coins);
END;
$$;
