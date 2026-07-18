-- 002_gamification.sql — V2 Volet B : gamification (SPEC §5.7)
-- Migration additive et idempotente. Appliquée sur Neon (project square-water-55208846).
-- Le bloc de seed des items est généré par scripts/generate-item-placeholders.mjs —
-- ne pas l'éditer à la main, relancer le script après un changement de item-catalog.mjs.

-- ============================================================
-- 1. Colonnes gamification sur user_progress
-- ============================================================
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  ADD COLUMN IF NOT EXISTS coins_total_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS active_booster JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_daily_chest_at DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_streak_reward INTEGER NOT NULL DEFAULT 0;

-- errors_count : nécessaire pour valider le coffre "perfect" côté serveur (§5.5)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS errors_count INTEGER DEFAULT NULL;

-- ============================================================
-- 2. Tables gamification
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  slot VARCHAR(20) NOT NULL CHECK (slot IN ('background','aura','back','body','outfit','weapon','hat','pet')),
  rarity VARCHAR(20) CHECK (rarity IN ('common','rare','epic','legendary') OR rarity IS NULL),
  price INTEGER NOT NULL DEFAULT 0,
  asset_url VARCHAR(255) NOT NULL,
  name JSONB NOT NULL,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  is_purchasable BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_inventory (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  source VARCHAR(20) NOT NULL DEFAULT 'shop',
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS user_equipment (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot VARCHAR(20) NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(id),
  PRIMARY KEY (user_id, slot)
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(30) NOT NULL,
  ref JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chest_openings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chest_type VARCHAR(20) NOT NULL,
  rewards JSONB NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON coin_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chest_user_type ON chest_openings (user_id, chest_type, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_date ON game_sessions (user_id, date DESC);

-- ============================================================
-- 3. Seed des items : 45 du catalogue + 3 défauts (généré — voir en bas de fichier)
-- ============================================================

-- ============================================================
-- 4. Crédit rétroactif au lancement (SPEC §5.2) — idempotent
-- ============================================================
WITH credited AS (
  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  SELECT up.user_id, LEAST(800, FLOOR(up.xp / 50.0))::int, 'retro', jsonb_build_object('xp', up.xp)
  FROM user_progress up
  WHERE LEAST(800, FLOOR(up.xp / 50.0)) > 0
    AND NOT EXISTS (SELECT 1 FROM coin_transactions ct WHERE ct.user_id = up.user_id AND ct.reason = 'retro')
  RETURNING user_id, amount
)
UPDATE user_progress up
   SET coins = up.coins + c.amount,
       coins_total_earned = up.coins_total_earned + c.amount
  FROM credited c
 WHERE up.user_id = c.user_id;

-- ============================================================
-- 5. Fonctions PL/pgSQL
-- ============================================================

-- add_game_rewards : remplace add_user_xp dans /api/scores pour les connectés
-- (l'ancienne fonction reste en place pendant la transition, cf. invités/rollback).
-- FOR UPDATE + un seul UPDATE user_progress (corrige les 4 UPDATE fragiles
-- d'add_user_xp, dette #2).
CREATE OR REPLACE FUNCTION add_game_rewards(
  p_user_id UUID,
  p_score INTEGER,
  p_is_perfect BOOLEAN
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

  -- Pièces (SPEC §5.2)
  v_base := GREATEST(10, FLOOR(p_score / 10.0))::int;
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
  ELSE
    v_new_booster := v_row.active_booster;
  END IF;
  IF v_first_today THEN
    v_first_bonus := 50;
  END IF;
  IF v_new_streak >= 2 THEN
    v_streak_bonus := LEAST(50, 5 * v_new_streak);
  END IF;
  IF p_is_perfect THEN
    v_perfect_bonus := 25;
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
    last_played_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, v_coins_earned, 'game', v_breakdown);

  -- Coffres dus (informatif, revalidés à l'ouverture — ne consomme rien ici)
  SELECT MAX(m) INTO v_streak_chest_due FROM (VALUES (30), (14), (7), (3)) AS milestones(m)
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

-- buy_item : atomique, jamais de solde négatif (double-clic sûr)
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
  IF NOT v_item.is_purchasable THEN
    RETURN QUERY SELECT false, 'not_purchasable', NULL::int, v_user.coins; RETURN;
  END IF;
  IF v_item.unlock_level > v_user.level THEN
    RETURN QUERY SELECT false, 'level_locked', NULL::int, v_user.coins; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND item_id = p_item_id) THEN
    RETURN QUERY SELECT false, 'already_owned', NULL::int, v_user.coins; RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT id FROM items WHERE is_purchasable
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

-- buy_consumable : gel de streak (cap 2) ou potion ×2 (400, 3 parties)
CREATE OR REPLACE FUNCTION buy_consumable(p_user_id UUID, p_kind TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user user_progress%ROWTYPE;
  v_price INTEGER;
BEGIN
  PERFORM 1 FROM user_progress WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO v_user FROM user_progress WHERE user_id = p_user_id;

  IF p_kind = 'freeze' THEN
    IF v_user.streak_freezes >= 2 THEN
      RETURN jsonb_build_object('error', 'freeze_cap_reached');
    END IF;
    v_price := 300;
  ELSIF p_kind = 'booster' THEN
    IF v_user.active_booster IS NOT NULL AND (v_user.active_booster->>'games_left')::int > 0 THEN
      RETURN jsonb_build_object('error', 'already_active');
    END IF;
    v_price := 400;
  ELSE
    RETURN jsonb_build_object('error', 'unknown_consumable');
  END IF;

  IF v_user.coins < v_price THEN
    RETURN jsonb_build_object('error', 'insufficient_coins');
  END IF;

  IF p_kind = 'freeze' THEN
    UPDATE user_progress SET coins = coins - v_price, streak_freezes = streak_freezes + 1
     WHERE user_id = p_user_id;
  ELSE
    UPDATE user_progress SET coins = coins - v_price,
           active_booster = jsonb_build_object('multiplier', 2, 'games_left', 3)
     WHERE user_id = p_user_id;
  END IF;

  INSERT INTO coin_transactions (user_id, amount, reason, ref)
  VALUES (p_user_id, -v_price, 'purchase', jsonb_build_object('consumable', p_kind));

  RETURN jsonb_build_object('success', true, 'pricePaid', v_price, 'coinsBalance', v_user.coins - v_price);
END;
$$;

-- open_chest : tirage exclusivement serveur, pity, doublons remboursés à 50%
CREATE OR REPLACE FUNCTION open_chest(p_user_id UUID, p_chest_type TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user user_progress%ROWTYPE;
  v_today DATE := (NOW() AT TIME ZONE 'Europe/Paris')::date;
  v_coins INTEGER := 0;
  v_rarity TEXT := NULL;
  v_item items%ROWTYPE;
  v_duplicate BOOLEAN := false;
  v_refund INTEGER := 0;
  v_milestone INTEGER;
  v_roll NUMERIC;
  v_recent_empty_daily INTEGER;
  v_rewards JSONB;
BEGIN
  PERFORM 1 FROM user_progress WHERE user_id = p_user_id FOR UPDATE;
  SELECT * INTO v_user FROM user_progress WHERE user_id = p_user_id;

  IF p_chest_type = 'daily' THEN
    IF v_user.last_daily_chest_at IS NOT NULL AND v_user.last_daily_chest_at >= v_today THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 30 + FLOOR(random() * 51)::int;
    SELECT count(*) INTO v_recent_empty_daily FROM (
      SELECT rewards FROM chest_openings
       WHERE user_id = p_user_id AND chest_type = 'daily'
       ORDER BY opened_at DESC LIMIT 9
    ) recent WHERE recent.rewards->>'item_id' IS NULL;

    v_roll := random();
    IF v_recent_empty_daily >= 9 THEN
      v_rarity := 'common'; -- pity
    ELSIF v_roll < 0.03 THEN
      v_rarity := 'rare';
    ELSIF v_roll < 0.18 THEN
      v_rarity := 'common';
    END IF;
    UPDATE user_progress SET last_daily_chest_at = v_today WHERE user_id = p_user_id;

  ELSIF p_chest_type = 'streak' THEN
    SELECT MAX(m) INTO v_milestone FROM (VALUES (30), (14), (7), (3)) AS milestones(m)
     WHERE v_user.streak_days >= m AND v_user.last_streak_reward < m;
    IF v_milestone IS NULL THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_rarity := CASE v_milestone WHEN 3 THEN 'common' WHEN 7 THEN 'rare'
                                 WHEN 14 THEN 'epic' ELSE 'legendary' END;
    IF v_milestone = 7 THEN
      v_coins := 100;
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
    IF v_user.level IN (5, 10, 15, 20, 25, 30) THEN
      SELECT * INTO v_item FROM items
       WHERE is_purchasable = false AND unlock_level = v_user.level LIMIT 1;
    END IF;

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
    IF random() < 0.10 THEN
      v_rarity := 'common';
    END IF;

  ELSIF p_chest_type = 'welcome' THEN
    IF EXISTS (SELECT 1 FROM chest_openings WHERE user_id = p_user_id AND chest_type = 'welcome') THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_coins := 100;
    v_rarity := 'common';

  ELSE
    RETURN jsonb_build_object('error', 'unknown_chest_type');
  END IF;

  -- Tirage d'item (sauf levelup, déjà résolu ci-dessus)
  IF v_rarity IS NOT NULL AND p_chest_type != 'levelup' THEN
    SELECT * INTO v_item FROM items
     WHERE rarity = v_rarity AND is_purchasable = true
     ORDER BY random() LIMIT 1;
  END IF;

  IF v_item.id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND item_id = v_item.id) THEN
      v_duplicate := true;
      v_refund := FLOOR(v_item.price * 0.5)::int;
      v_coins := v_coins + v_refund;
    ELSE
      INSERT INTO user_inventory (user_id, item_id, source)
      VALUES (p_user_id, v_item.id, CASE WHEN p_chest_type = 'levelup' THEN 'level' ELSE 'chest' END);
    END IF;
  END IF;

  UPDATE user_progress
     SET coins = coins + v_coins,
         coins_total_earned = coins_total_earned + v_coins
   WHERE user_id = p_user_id;

  v_rewards := jsonb_strip_nulls(jsonb_build_object(
    'coins', v_coins,
    'item_id', v_item.id,
    'item_code', v_item.code,
    'rarity', v_item.rarity,
    'duplicate', v_duplicate,
    'refund', NULLIF(v_refund, 0),
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

-- BEGIN GENERATED ITEMS SEED (scripts/generate-item-placeholders.mjs)

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_blob_purple', 'body', NULL, 0, '/images/items/body_blob_purple.svg', '{"fr":"Blob violet","en":"Purple blob","es":"Blob morado","zh":"紫色史莱姆"}'::jsonb, 1, false, true, 0)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_tshirt_torn', 'outfit', NULL, 0, '/images/items/outfit_tshirt_torn.svg', '{"fr":"T-shirt troué","en":"Torn t-shirt","es":"Camiseta rota","zh":"破T恤"}'::jsonb, 1, false, true, 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_stick_wood', 'weapon', NULL, 0, '/images/items/weapon_stick_wood.svg', '{"fr":"Bâton de bois","en":"Wooden stick","es":"Palo de madera","zh":"木棍"}'::jsonb, 1, false, true, 2)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_blob_blue', 'body', 'common', 150, '/images/items/body_blob_blue.svg', '{"fr":"Blob bleu","en":"Blue blob","es":"Blob azul","zh":"蓝色史莱姆"}'::jsonb, 1, true, false, 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_blob_green', 'body', 'common', 150, '/images/items/body_blob_green.svg', '{"fr":"Blob vert","en":"Green blob","es":"Blob verde","zh":"绿色史莱姆"}'::jsonb, 1, true, false, 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_blob_spotted', 'body', 'rare', 500, '/images/items/body_blob_spotted.svg', '{"fr":"Blob à taches","en":"Spotted blob","es":"Blob con manchas","zh":"斑点史莱姆"}'::jsonb, 1, true, false, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_dragon_junior', 'body', 'epic', 1500, '/images/items/body_dragon_junior.svg', '{"fr":"Dragon junior","en":"Junior dragon","es":"Dragón junior","zh":"幼龙"}'::jsonb, 1, true, false, 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_phoenix_rainbow', 'body', 'legendary', 4500, '/images/items/body_phoenix_rainbow.svg', '{"fr":"Phénix arc-en-ciel","en":"Rainbow phoenix","es":"Fénix arcoíris","zh":"彩虹凤凰"}'::jsonb, 1, true, false, 7)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_tshirt_star', 'outfit', 'common', 150, '/images/items/outfit_tshirt_star.svg', '{"fr":"T-shirt étoile","en":"Star t-shirt","es":"Camiseta estrella","zh":"星星T恤"}'::jsonb, 1, true, false, 8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_overalls', 'outfit', 'common', 150, '/images/items/outfit_overalls.svg', '{"fr":"Salopette","en":"Overalls","es":"Peto","zh":"背带裤"}'::jsonb, 1, true, false, 9)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_mage_tunic', 'outfit', 'rare', 500, '/images/items/outfit_mage_tunic.svg', '{"fr":"Tunique de mage","en":"Mage tunic","es":"Túnica de mago","zh":"法师长袍"}'::jsonb, 1, true, false, 10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_pirate_vest', 'outfit', 'rare', 500, '/images/items/outfit_pirate_vest.svg', '{"fr":"Gilet de pirate","en":"Pirate vest","es":"Chaleco pirata","zh":"海盗背心"}'::jsonb, 10, false, false, 11)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_knight_armor', 'outfit', 'epic', 1500, '/images/items/outfit_knight_armor.svg', '{"fr":"Armure de chevalier","en":"Knight armor","es":"Armadura de caballero","zh":"骑士盔甲"}'::jsonb, 1, true, false, 12)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_golden_armor', 'outfit', 'epic', 1500, '/images/items/outfit_golden_armor.svg', '{"fr":"Armure dorée","en":"Golden armor","es":"Armadura dorada","zh":"黄金盔甲"}'::jsonb, 1, true, false, 13)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_galaxy_armor', 'outfit', 'legendary', 4500, '/images/items/outfit_galaxy_armor.svg', '{"fr":"Armure galactique","en":"Galactic armor","es":"Armadura galáctica","zh":"银河盔甲"}'::jsonb, 15, true, false, 14)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_cap', 'hat', 'common', 150, '/images/items/hat_cap.svg', '{"fr":"Casquette","en":"Cap","es":"Gorra","zh":"棒球帽"}'::jsonb, 1, true, false, 15)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beanie', 'hat', 'common', 150, '/images/items/hat_beanie.svg', '{"fr":"Bonnet","en":"Beanie","es":"Gorro","zh":"毛线帽"}'::jsonb, 1, true, false, 16)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_party', 'hat', 'common', 150, '/images/items/hat_party.svg', '{"fr":"Chapeau de fête","en":"Party hat","es":"Sombrero de fiesta","zh":"派对帽"}'::jsonb, 5, false, false, 17)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_wizard', 'hat', 'rare', 500, '/images/items/hat_wizard.svg', '{"fr":"Chapeau de sorcier","en":"Wizard hat","es":"Sombrero de mago","zh":"巫师帽"}'::jsonb, 1, true, false, 18)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_bandana', 'hat', 'rare', 500, '/images/items/hat_bandana.svg', '{"fr":"Bandana","en":"Bandana","es":"Bandana","zh":"头巾"}'::jsonb, 1, true, false, 19)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_viking', 'hat', 'epic', 1500, '/images/items/hat_viking.svg', '{"fr":"Casque viking","en":"Viking helmet","es":"Casco vikingo","zh":"维京头盔"}'::jsonb, 1, true, false, 20)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_crown_gold', 'hat', 'legendary', 4500, '/images/items/hat_crown_gold.svg', '{"fr":"Couronne dorée","en":"Golden crown","es":"Corona dorada","zh":"黄金皇冠"}'::jsonb, 20, true, false, 21)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_staff_star', 'weapon', 'common', 150, '/images/items/weapon_staff_star.svg', '{"fr":"Bâton étoilé","en":"Star staff","es":"Bastón estelar","zh":"星星法杖"}'::jsonb, 1, true, false, 22)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_sword_wood', 'weapon', 'rare', 500, '/images/items/weapon_sword_wood.svg', '{"fr":"Épée en bois","en":"Wooden sword","es":"Espada de madera","zh":"木剑"}'::jsonb, 1, true, false, 23)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_wand_magic', 'weapon', 'rare', 500, '/images/items/weapon_wand_magic.svg', '{"fr":"Baguette magique","en":"Magic wand","es":"Varita mágica","zh":"魔杖"}'::jsonb, 1, true, false, 24)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_trident_ice', 'weapon', 'epic', 1500, '/images/items/weapon_trident_ice.svg', '{"fr":"Trident de glace","en":"Ice trident","es":"Tridente de hielo","zh":"冰之三叉戟"}'::jsonb, 1, true, false, 25)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_hammer_thunder', 'weapon', 'epic', 1500, '/images/items/weapon_hammer_thunder.svg', '{"fr":"Marteau du tonnerre","en":"Thunder hammer","es":"Martillo del trueno","zh":"雷霆之锤"}'::jsonb, 1, true, false, 26)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_laser_math', 'weapon', 'legendary', 4500, '/images/items/weapon_laser_math.svg', '{"fr":"Épée laser des maths","en":"Math laser sword","es":"Espada láser de matemáticas","zh":"数学激光剑"}'::jsonb, 10, true, false, 27)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_backpack', 'back', 'common', 150, '/images/items/back_backpack.svg', '{"fr":"Sac à dos","en":"Backpack","es":"Mochila","zh":"背包"}'::jsonb, 1, true, false, 28)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_cape_red', 'back', 'rare', 500, '/images/items/back_cape_red.svg', '{"fr":"Cape rouge","en":"Red cape","es":"Capa roja","zh":"红色斗篷"}'::jsonb, 1, true, false, 29)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_cape_blue', 'back', 'rare', 500, '/images/items/back_cape_blue.svg', '{"fr":"Cape bleue","en":"Blue cape","es":"Capa azul","zh":"蓝色斗篷"}'::jsonb, 1, true, false, 30)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_bat_wings', 'back', 'epic', 1500, '/images/items/back_bat_wings.svg', '{"fr":"Ailes de chauve-souris","en":"Bat wings","es":"Alas de murciélago","zh":"蝙蝠翅膀"}'::jsonb, 15, false, false, 31)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_angel_wings', 'back', 'legendary', 4500, '/images/items/back_angel_wings.svg', '{"fr":"Ailes d''ange dorées","en":"Golden angel wings","es":"Alas de ángel doradas","zh":"金色天使之翼"}'::jsonb, 1, true, false, 32)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_mouse', 'pet', 'common', 150, '/images/items/pet_mouse.svg', '{"fr":"Souris","en":"Mouse","es":"Ratón","zh":"老鼠"}'::jsonb, 1, true, false, 33)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_snail', 'pet', 'common', 150, '/images/items/pet_snail.svg', '{"fr":"Escargot","en":"Snail","es":"Caracol","zh":"蜗牛"}'::jsonb, 1, true, false, 34)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_goldfish', 'pet', 'common', 150, '/images/items/pet_goldfish.svg', '{"fr":"Poisson rouge","en":"Goldfish","es":"Pez dorado","zh":"金鱼"}'::jsonb, 1, true, false, 35)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_kitten', 'pet', 'rare', 500, '/images/items/pet_kitten.svg', '{"fr":"Chaton","en":"Kitten","es":"Gatito","zh":"小猫"}'::jsonb, 1, true, false, 36)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_owl', 'pet', 'rare', 500, '/images/items/pet_owl.svg', '{"fr":"Hibou","en":"Owl","es":"Búho","zh":"猫头鹰"}'::jsonb, 1, true, false, 37)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_baby_dragon', 'pet', 'epic', 1500, '/images/items/pet_baby_dragon.svg', '{"fr":"Bébé dragon","en":"Baby dragon","es":"Bebé dragón","zh":"龙宝宝"}'::jsonb, 25, false, false, 38)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_unicorn', 'pet', 'legendary', 4500, '/images/items/pet_unicorn.svg', '{"fr":"Licorne","en":"Unicorn","es":"Unicornio","zh":"独角兽"}'::jsonb, 25, true, false, 39)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('bg_meadow', 'background', 'common', 150, '/images/items/bg_meadow.svg', '{"fr":"Prairie","en":"Meadow","es":"Pradera","zh":"草原"}'::jsonb, 1, true, false, 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('bg_forest_magic', 'background', 'rare', 500, '/images/items/bg_forest_magic.svg', '{"fr":"Forêt magique","en":"Magic forest","es":"Bosque mágico","zh":"魔法森林"}'::jsonb, 1, true, false, 41)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('bg_beach', 'background', 'rare', 500, '/images/items/bg_beach.svg', '{"fr":"Plage","en":"Beach","es":"Playa","zh":"海滩"}'::jsonb, 1, true, false, 42)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('bg_castle', 'background', 'epic', 1500, '/images/items/bg_castle.svg', '{"fr":"Château","en":"Castle","es":"Castillo","zh":"城堡"}'::jsonb, 1, true, false, 43)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('bg_galaxy', 'background', 'legendary', 4500, '/images/items/bg_galaxy.svg', '{"fr":"Galaxie","en":"Galaxy","es":"Galaxia","zh":"银河"}'::jsonb, 30, true, false, 44)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_sparkles', 'aura', 'epic', 1500, '/images/items/aura_sparkles.svg', '{"fr":"Étincelles","en":"Sparkles","es":"Destellos","zh":"闪光"}'::jsonb, 1, true, false, 45)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_blue_flames', 'aura', 'epic', 1500, '/images/items/aura_blue_flames.svg', '{"fr":"Flammes bleues","en":"Blue flames","es":"Llamas azules","zh":"蓝色火焰"}'::jsonb, 20, false, false, 46)
ON CONFLICT (code) DO NOTHING;

INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_halo_rainbow', 'aura', 'legendary', 4500, '/images/items/aura_halo_rainbow.svg', '{"fr":"Halo doré arc-en-ciel","en":"Golden rainbow halo","es":"Halo dorado arcoíris","zh":"金色彩虹光环"}'::jsonb, 30, false, false, 47)
ON CONFLICT (code) DO NOTHING;

-- END GENERATED ITEMS SEED
