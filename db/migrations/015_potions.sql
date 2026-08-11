-- 015_potions.sql — Catalogue générique de potions (TODO.md §Ajustement)
--
-- Remplace les deux consommables ad hoc de 002_gamification.sql
-- (`freeze` figé à 300🪙/cap 2, `booster` figé à x2/400🪙/3 parties,
-- gérés par buy_consumable()) par un vrai catalogue piloté par données :
-- 3 potions "bonus de temps", 1 "grâce de fin de partie", 3 "multiplicateur
-- de pièces" et 4 "gel de streak" (tiers 1/2/5/14 jours).
--
-- Deux modèles de consommation :
-- - time_bonus / time_grace / coin_multiplier : achat = +1 en stock dans
--   user_potions ; sélectionnées avant une partie, vérifiées et décrémentées
--   par le serveur à la soumission du score (cf. src/lib/server/potions.js).
-- - streak_freeze : pas de stock, l'achat crédite direct des jours dans
--   user_progress.streak_freezes (banque), consommée automatiquement par
--   add_game_rewards() en cas d'absence.
--
-- Migration additive sauf pour buy_consumable() (retirée, plus référencée
-- par aucun code après ce déploiement) et add_game_rewards() (signature
-- étendue, cf. plus bas — DROP+CREATE nécessaire car ajouter un paramètre
-- change la signature, un simple CREATE OR REPLACE créerait un doublon
-- ambigu avec l'appel à 4 arguments existant).

CREATE TABLE potions (
  code VARCHAR(30) PRIMARY KEY,
  family VARCHAR(20) NOT NULL CHECK (family IN ('time_bonus', 'time_grace', 'coin_multiplier', 'streak_freeze')),
  value INTEGER NOT NULL, -- secondes (time_bonus/time_grace) / multiplicateur (coin_multiplier) / jours (streak_freeze)
  price INTEGER NOT NULL,
  name JSONB NOT NULL, -- {"fr":..,"en":..,"es":..,"zh":..} comme items.name
  description JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE user_potions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  potion_code VARCHAR(30) NOT NULL REFERENCES potions(code),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (user_id, potion_code)
);

INSERT INTO potions (code, family, value, price, name, description, sort_order) VALUES
  ('time_bonus_10', 'time_bonus', 10, 40,
    '{"fr":"⏱️ +10 secondes","en":"⏱️ +10 seconds","es":"⏱️ +10 segundos","zh":"⏱️ +10秒"}',
    '{"fr":"Ajoute 10 secondes au chrono de la partie","en":"Adds 10 seconds to the game timer","es":"Añade 10 segundos al cronómetro de la partida","zh":"为本局游戏增加10秒"}',
    1),
  ('time_bonus_20', 'time_bonus', 20, 70,
    '{"fr":"⏱️ +20 secondes","en":"⏱️ +20 seconds","es":"⏱️ +20 segundos","zh":"⏱️ +20秒"}',
    '{"fr":"Ajoute 20 secondes au chrono de la partie","en":"Adds 20 seconds to the game timer","es":"Añade 20 segundos al cronómetro de la partida","zh":"为本局游戏增加20秒"}',
    2),
  ('time_bonus_30', 'time_bonus', 30, 100,
    '{"fr":"⏱️ +30 secondes","en":"⏱️ +30 seconds","es":"⏱️ +30 segundos","zh":"⏱️ +30秒"}',
    '{"fr":"Ajoute 30 secondes au chrono de la partie","en":"Adds 30 seconds to the game timer","es":"Añade 30 segundos al cronómetro de la partida","zh":"为本局游戏增加30秒"}',
    3),
  ('time_grace', 'time_grace', 10, 60,
    '{"fr":"⏳ Dernier calcul","en":"⏳ Last calculation","es":"⏳ Último cálculo","zh":"⏳ 最后一题"}',
    '{"fr":"Termine ton dernier calcul même si le chrono est à 0","en":"Finish your last calculation even if the timer hits 0","es":"Termina tu último cálculo aunque el cronómetro llegue a 0","zh":"即使计时器归零，也能完成最后一题"}',
    4),
  ('coin_x2', 'coin_multiplier', 2, 150,
    '{"fr":"🪙 Pièces ×2","en":"🪙 Coins ×2","es":"🪙 Monedas ×2","zh":"🪙 金币 ×2"}',
    '{"fr":"Double tes pièces gagnées lors de la prochaine partie","en":"Doubles the coins earned on your next game","es":"Duplica las monedas ganadas en tu próxima partida","zh":"下一局游戏获得的金币翻倍"}',
    5),
  ('coin_x3', 'coin_multiplier', 3, 320,
    '{"fr":"🪙 Pièces ×3","en":"🪙 Coins ×3","es":"🪙 Monedas ×3","zh":"🪙 金币 ×3"}',
    '{"fr":"Triple tes pièces gagnées lors de la prochaine partie","en":"Triples the coins earned on your next game","es":"Triplica las monedas ganadas en tu próxima partida","zh":"下一局游戏获得的金币变为3倍"}',
    6),
  ('coin_x5', 'coin_multiplier', 5, 600,
    '{"fr":"🪙 Pièces ×5","en":"🪙 Coins ×5","es":"🪙 Monedas ×5","zh":"🪙 金币 ×5"}',
    '{"fr":"Multiplie par 5 tes pièces gagnées lors de la prochaine partie","en":"Multiplies the coins earned on your next game by 5","es":"Multiplica x5 las monedas ganadas en tu próxima partida","zh":"下一局游戏获得的金币变为5倍"}',
    7),
  ('streak_freeze_1', 'streak_freeze', 1, 80,
    '{"fr":"🛡️ Gel de streak (1 jour)","en":"🛡️ Streak freeze (1 day)","es":"🛡️ Congelación de racha (1 día)","zh":"🛡️ 连续保护（1天）"}',
    '{"fr":"Protège ta série si tu rates 1 jour","en":"Protects your streak if you miss 1 day","es":"Protege tu racha si fallas 1 día","zh":"错过1天时保护你的连续记录"}',
    8),
  ('streak_freeze_2', 'streak_freeze', 2, 140,
    '{"fr":"🛡️ Gel de streak (2 jours)","en":"🛡️ Streak freeze (2 days)","es":"🛡️ Congelación de racha (2 días)","zh":"🛡️ 连续保护（2天）"}',
    '{"fr":"Protège ta série si tu rates jusqu''à 2 jours","en":"Protects your streak if you miss up to 2 days","es":"Protege tu racha si fallas hasta 2 días","zh":"错过最多2天时保护你的连续记录"}',
    9),
  ('streak_freeze_5', 'streak_freeze', 5, 300,
    '{"fr":"🛡️ Gel de streak (5 jours)","en":"🛡️ Streak freeze (5 days)","es":"🛡️ Congelación de racha (5 días)","zh":"🛡️ 连续保护（5天）"}',
    '{"fr":"Protège ta série si tu rates jusqu''à 5 jours","en":"Protects your streak if you miss up to 5 days","es":"Protege tu racha si fallas hasta 5 días","zh":"错过最多5天时保护你的连续记录"}',
    10),
  ('streak_freeze_14', 'streak_freeze', 14, 700,
    '{"fr":"🛡️ Gel de streak (2 semaines)","en":"🛡️ Streak freeze (2 weeks)","es":"🛡️ Congelación de racha (2 semanas)","zh":"🛡️ 连续保护（2周）"}',
    '{"fr":"Protège ta série si tu rates jusqu''à 14 jours","en":"Protects your streak if you miss up to 14 days","es":"Protege tu racha si fallas hasta 14 días","zh":"错过最多14天时保护你的连续记录"}',
    11);

-- buy_potion : achat générique, remplace le côté "consumable" de buy_consumable.
CREATE FUNCTION buy_potion(p_user_id UUID, p_code VARCHAR)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_potion potions%ROWTYPE;
  v_coins INTEGER;
  v_freezes INTEGER;
BEGIN
  SELECT * INTO v_potion FROM potions WHERE code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'unknown_potion');
  END IF;

  PERFORM 1 FROM user_progress WHERE user_id = p_user_id FOR UPDATE;
  SELECT coins, streak_freezes INTO v_coins, v_freezes FROM user_progress WHERE user_id = p_user_id;

  IF v_coins < v_potion.price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  IF v_potion.family = 'streak_freeze' THEN
    IF v_freezes + v_potion.value > 60 THEN
      RETURN jsonb_build_object('error', 'freeze_cap_reached');
    END IF;
    UPDATE user_progress SET coins = coins - v_potion.price, streak_freezes = streak_freezes + v_potion.value
     WHERE user_id = p_user_id;
  ELSE
    UPDATE user_progress SET coins = coins - v_potion.price WHERE user_id = p_user_id;
    INSERT INTO user_potions (user_id, potion_code, quantity) VALUES (p_user_id, p_code, 1)
      ON CONFLICT (user_id, potion_code) DO UPDATE SET quantity = user_potions.quantity + 1;
  END IF;

  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, -v_potion.price, 'purchase', jsonb_build_object('potion', p_code));

  RETURN jsonb_build_object('success', true, 'pricePaid', v_potion.price, 'coinsBalance', v_coins - v_potion.price);
END;
$$;

-- buy_consumable() est entièrement remplacée par buy_potion() : plus aucun
-- code applicatif ne l'appelle après ce déploiement.
DROP FUNCTION IF EXISTS buy_consumable(UUID, TEXT);

-- add_game_rewards : signature étendue (p_coin_multiplier) + écart de streak
-- généralisé à plusieurs jours. DROP explicite car un paramètre en plus
-- change la signature : un simple CREATE OR REPLACE créerait un second
-- overload ambigu avec l'appel existant à 4 arguments.
DROP FUNCTION IF EXISTS add_game_rewards(UUID, INTEGER, BOOLEAN, BOOLEAN);

CREATE FUNCTION add_game_rewards(
  p_user_id UUID,
  p_score INTEGER,
  p_is_perfect BOOLEAN,
  p_completed BOOLEAN DEFAULT true,
  p_coin_multiplier INTEGER DEFAULT NULL
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
  v_gap INTEGER;
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

  -- Streak (+1 si joué hier, gel auto si des jours manqués et assez de gel
  -- banqué pour couvrir l'écart complet, reset sinon). Généralisation d'un
  -- écart de 2 jours pile (un seul gel) à un écart de N jours couvert par
  -- un gel banqué de N-1 jours ou plus (potions de gel tiers 1/2/5/14).
  v_new_freezes := v_row.streak_freezes;
  IF v_last IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_gap := v_today - v_last;
    IF v_gap = 0 THEN
      v_new_streak := v_row.streak_days;
    ELSIF v_gap = 1 THEN
      v_new_streak := v_row.streak_days + 1;
    ELSIF v_gap >= 2 AND v_row.streak_freezes >= (v_gap - 1) THEN
      v_new_streak := v_row.streak_days + 1;
      v_new_freezes := v_row.streak_freezes - (v_gap - 1);
      v_freeze_used := true;
    ELSE
      v_new_streak := 1;
    END IF;
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
    IF p_coin_multiplier IS NOT NULL AND p_coin_multiplier > 1 THEN
      -- Potion de multiplicateur (usage unique, vérifiée/décrémentée côté
      -- appelant) : généralise le doublement ci-dessous à ×2/×3/×5.
      v_booster_bonus := (v_base + v_weekend_bonus) * (p_coin_multiplier - 1);
    ELSIF v_row.active_booster IS NOT NULL AND (v_row.active_booster->>'games_left')::int > 0 THEN
      -- Ancien booster multi-parties (400🪙/×2/3 parties, retiré du catalogue
      -- d'achat mais honoré jusqu'à épuisement pour les joueurs qui en
      -- avaient déjà un en cours au moment de cette migration).
      v_booster_bonus := v_base + v_weekend_bonus;
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
