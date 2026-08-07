-- ============================================================
-- 011. Palier de streak à 60 jours manquant dans add_game_rewards
-- ============================================================
-- open_chest() (008_chests_currency_only.sql) gère déjà le palier 60 jours
-- (+500 🪙), mais add_game_rewards() calculait encore v_streak_chest_due sur
-- la liste (30, 14, 7, 3) : un joueur franchissant 60 jours de série ne
-- voyait donc jamais le prompt « ouvre ton coffre » en fin de partie
-- (EndScreen.svelte, hasChestDue), seulement plus tard via le dashboard.
-- Seule la liste de paliers change ; signature et reste du corps identiques.

CREATE OR REPLACE FUNCTION add_game_rewards(
  p_user_id UUID,
  p_score INTEGER,
  p_is_perfect BOOLEAN,
  p_completed BOOLEAN DEFAULT true
)
RETURNS TABLE (
  xp INTEGER,
  level INTEGER,
  previous_level INTEGER,
  level_up BOOLEAN,
  streak_days INTEGER,
  freeze_used BOOLEAN,
  coins_earned INTEGER,
  coins_balance INTEGER,
  coins_breakdown JSONB,
  streak_chest_due INTEGER,
  perfect_chest_due BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
  v_row user_progress%ROWTYPE;
  v_today DATE;
  v_last DATE;
  v_first_today BOOLEAN;
  v_new_streak INTEGER;
  v_freeze_used BOOLEAN := false;
  v_new_freezes INTEGER;
  v_is_weekend BOOLEAN;
  v_base INTEGER;
  v_weekend_bonus INTEGER := 0;
  v_booster_bonus INTEGER := 0;
  v_new_booster JSONB;
  v_first_bonus INTEGER := 0;
  v_streak_bonus INTEGER := 0;
  v_perfect_bonus INTEGER := 0;
  v_coins_earned INTEGER;
  v_breakdown JSONB;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN;
  v_streak_chest_due INTEGER := 0;
  v_perfect_chest_due BOOLEAN := false;
BEGIN
  SELECT * INTO v_row FROM user_progress WHERE user_id = p_user_id FOR UPDATE;

  v_today := (NOW() AT TIME ZONE 'Europe/Paris')::date;
  v_last := CASE WHEN v_row.last_played_at IS NULL THEN NULL
                 ELSE (v_row.last_played_at AT TIME ZONE 'Europe/Paris')::date END;
  v_first_today := (v_last IS NULL OR v_last < v_today);
  v_is_weekend := EXTRACT(ISODOW FROM (NOW() AT TIME ZONE 'Europe/Paris')) IN (6, 7);

  -- Streak (+1 si joué hier, gel auto si 1 jour manqué et un gel dispo, reset sinon)
  v_new_freezes := v_row.streak_freezes;
  IF v_last IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last = v_today THEN
    v_new_streak := v_row.streak_days;
  ELSIF v_last = v_today - 1 THEN
    v_new_streak := v_row.streak_days + 1;
  ELSIF v_last = v_today - 2 AND v_row.streak_freezes > 0 THEN
    v_new_streak := v_row.streak_days + 1;
    v_new_freezes := v_row.streak_freezes - 1;
    v_freeze_used := true;
  ELSE
    v_new_streak := 1;
  END IF;

  v_new_booster := v_row.active_booster;

  IF NOT p_completed THEN
    -- Partie écourtée ("Terminer la partie") : ne fait ni progresser ni casser
    -- le streak, et n'accorde aucun bonus forfaitaire ci-dessous.
    v_new_streak := v_row.streak_days;
    v_new_freezes := v_row.streak_freezes;
    v_freeze_used := false;
  END IF;

  -- Pièces (SPEC §5.2)
  v_base := GREATEST(10, FLOOR(p_score / 10.0))::int;
  IF p_completed THEN
    IF v_is_weekend THEN
      v_weekend_bonus := v_base; -- ×2 sur la base
    END IF;
    IF v_row.active_booster IS NOT NULL AND (v_row.active_booster->>'games_left')::int > 0 THEN
      v_booster_bonus := v_base + v_weekend_bonus; -- double la base (+ week-end), pas les bonus fixes
      IF (v_row.active_booster->>'games_left')::int - 1 <= 0 THEN
        v_new_booster := NULL;
      ELSE
        v_new_booster := jsonb_set(v_row.active_booster, '{games_left}',
                                    to_jsonb((v_row.active_booster->>'games_left')::int - 1));
      END IF;
    END IF;
    IF v_first_today THEN
      v_first_bonus := 50;
    END IF;
    -- Bonus de streak plafonné à une fois par jour (comme le bonus "première
    -- partie") : avant ce correctif, il était recrédité à chaque partie du jour.
    IF v_first_today AND v_new_streak >= 2 THEN
      v_streak_bonus := LEAST(50, 5 * v_new_streak);
    END IF;
    IF p_is_perfect THEN
      v_perfect_bonus := 25;
    END IF;
  END IF;

  v_coins_earned := v_base + v_weekend_bonus + v_booster_bonus + v_first_bonus + v_streak_bonus + v_perfect_bonus;
  v_breakdown := jsonb_strip_nulls(jsonb_build_object(
    'base', v_base,
    'weekend', NULLIF(v_weekend_bonus, 0),
    'booster', NULLIF(v_booster_bonus, 0),
    'first_of_day', NULLIF(v_first_bonus, 0),
    'streak', NULLIF(v_streak_bonus, 0),
    'perfect', NULLIF(v_perfect_bonus, 0)
  ));

  -- XP / niveau
  v_new_xp := v_row.xp + p_score;
  SELECT MAX(ld.level) INTO v_new_level FROM level_definitions ld WHERE ld.min_xp <= v_new_xp;
  v_level_up := v_new_level > v_row.level;

  -- Un seul UPDATE
  UPDATE user_progress SET
    xp = v_new_xp,
    level = v_new_level,
    games_played = v_row.games_played + 1,
    total_score = v_row.total_score + p_score,
    streak_days = v_new_streak,
    streak_freezes = v_new_freezes,
    active_booster = v_new_booster,
    coins = v_row.coins + v_coins_earned,
    coins_total_earned = v_row.coins_total_earned + v_coins_earned,
    last_played_at = CASE WHEN p_completed THEN NOW() ELSE v_row.last_played_at END
  WHERE user_id = p_user_id;

  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, v_coins_earned, 'game', v_breakdown);

  -- Coffres dus (informatif, revalidés à l'ouverture — ne consomme rien ici)
  SELECT MAX(m) INTO v_streak_chest_due FROM (VALUES (60), (30), (14), (7), (3)) AS milestones(m)
   WHERE v_new_streak >= m AND v_row.last_streak_reward < m;
  v_streak_chest_due := COALESCE(v_streak_chest_due, 0);

  v_perfect_chest_due := p_is_perfect AND NOT EXISTS (
    SELECT 1 FROM chest_openings co
     WHERE co.user_id = p_user_id AND co.chest_type = 'perfect'
       AND (co.opened_at AT TIME ZONE 'Europe/Paris')::date = v_today
  );

  RETURN QUERY SELECT
    v_new_xp, v_new_level, v_row.level, v_level_up,
    v_new_streak, v_freeze_used,
    v_coins_earned, v_row.coins + v_coins_earned, v_breakdown,
    v_streak_chest_due, v_perfect_chest_due;
END;
$$;
