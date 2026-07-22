-- 003_item_catalog_expansion.sql — Extension du catalogue boutique à 350 items (+3 défauts)
-- et passage de 4 à 6 raretés (common/uncommon/rare/epic/legendary/mythic).
-- Migration additive et idempotente. Ne modifie PAS 002_gamification.sql, qui reste
-- la trace figée du catalogue de lancement V2 (45 items, 4 raretés) — voir PROMPT_ASSETS.md
-- et SPEC.md §5.9 pour le contexte et le calibrage économique (prix/unlock_level par rareté).
--
-- Le bloc "GENERATED ITEMS SEED" ci-dessous est régénéré par
-- scripts/generate-item-placeholders.mjs (source de vérité : scripts/item-catalog.mjs) —
-- ne pas l'éditer à la main, relancer le script après un changement du catalogue.

-- ============================================================
-- 1. Élargissement de la contrainte de rareté (common/rare/epic/legendary → +uncommon +mythic)
-- ============================================================
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT con.conname INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
  WHERE rel.relname = 'items' AND con.contype = 'c' AND att.attname = 'rarity';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE items DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

ALTER TABLE items ADD CONSTRAINT items_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic') OR rarity IS NULL);

-- ============================================================
-- 2. add_game_rewards() — inchangée sauf l'ajout du palier de streak 60 jours
-- ============================================================
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

  v_base := GREATEST(10, FLOOR(p_score / 10.0))::int;
  IF v_is_weekend THEN
    v_weekend_bonus := v_base;
  END IF;
  IF v_row.active_booster IS NOT NULL AND (v_row.active_booster->>'games_left')::int > 0 THEN
    v_booster_bonus := v_base + v_weekend_bonus;
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

  v_new_xp := v_row.xp + p_score;
  SELECT MAX(ld.level) INTO v_new_level FROM level_definitions ld WHERE ld.min_xp <= v_new_xp;
  v_level_up := v_new_level > v_row.level;

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

  -- Paliers de streak : 3/7/14/30/60 jours (60 = nouveau, cf. §5.5 rééquilibré)
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

-- ============================================================
-- 3. open_chest() — tables de drop réajustées pour 6 raretés (SPEC §5.5 rééquilibré) :
--    - quotidien : 15% common, 5% uncommon (le "3% rare" du lancement est retiré,
--      un pool ~8x plus grand rendrait un rare gratuit quotidien trop généreux)
--    - perfect : 8% common, 2% uncommon (taux global d'item inchangé, 10%)
--    - streak : 3j commun garanti / 7j uncommon+50 / 14j rare+150 / 30j epic+300 /
--      60j (nouveau palier) legendary+500
--    - level-up : exclusif à chaque niveau PAIR (2..30, cf. item-catalog.mjs
--      EXCLUSIVE_PLAN) au lieu des seuls 5/10/15/20/25/30 du lancement
--    - mythic n'est JAMAIS tiré d'un coffre (ni ici, ni en level-up hors les 2
--      exclusifs mythic assignés aux niveaux 28/30) — uniquement achat boutique
-- ============================================================
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
    ELSIF v_roll < 0.05 THEN
      v_rarity := 'uncommon';
    ELSIF v_roll < 0.20 THEN
      v_rarity := 'common';
    END IF;
    UPDATE user_progress SET last_daily_chest_at = v_today WHERE user_id = p_user_id;

  ELSIF p_chest_type = 'streak' THEN
    SELECT MAX(m) INTO v_milestone FROM (VALUES (60), (30), (14), (7), (3)) AS milestones(m)
     WHERE v_user.streak_days >= m AND v_user.last_streak_reward < m;
    IF v_milestone IS NULL THEN
      RETURN jsonb_build_object('error', 'not_available');
    END IF;
    v_rarity := CASE v_milestone WHEN 3 THEN 'common' WHEN 7 THEN 'uncommon'
                                 WHEN 14 THEN 'rare' WHEN 30 THEN 'epic' ELSE 'legendary' END;
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
    IF v_user.level % 2 = 0 THEN
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
    v_roll := random();
    IF v_roll < 0.02 THEN
      v_rarity := 'uncommon';
    ELSIF v_roll < 0.10 THEN
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

-- ============================================================
-- 4. Seed des items : repricing des 45 du lancement + ~305 nouveaux (généré — voir en bas de fichier)
-- ============================================================

-- BEGIN GENERATED ITEMS SEED (scripts/generate-item-placeholders.mjs)

-- Repricing des 45 items du lancement V2 (déjà en base via 002_gamification.sql)
-- vers la nouvelle économie 6 raretés (prix par bande, unlock_level réparti, nouveaux exclusifs).
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = false, sort_order = 3
 WHERE code = 'body_blob_blue';
UPDATE items SET price = 150, unlock_level = 4, is_purchasable = false, sort_order = 4
 WHERE code = 'body_blob_green';
UPDATE items SET price = 900, unlock_level = 10, is_purchasable = false, sort_order = 5
 WHERE code = 'body_blob_spotted';
UPDATE items SET price = 2700, unlock_level = 16, is_purchasable = false, sort_order = 6
 WHERE code = 'body_dragon_junior';
UPDATE items SET price = 8000, unlock_level = 22, is_purchasable = false, sort_order = 7
 WHERE code = 'body_phoenix_rainbow';
UPDATE items SET price = 150, unlock_level = 1, is_purchasable = true, sort_order = 8
 WHERE code = 'outfit_tshirt_star';
UPDATE items SET price = 150, unlock_level = 1, is_purchasable = true, sort_order = 9
 WHERE code = 'outfit_overalls';
UPDATE items SET price = 900, unlock_level = 12, is_purchasable = false, sort_order = 10
 WHERE code = 'outfit_mage_tunic';
UPDATE items SET price = 900, unlock_level = 14, is_purchasable = false, sort_order = 11
 WHERE code = 'outfit_pirate_vest';
UPDATE items SET price = 2700, unlock_level = 18, is_purchasable = false, sort_order = 12
 WHERE code = 'outfit_knight_armor';
UPDATE items SET price = 2700, unlock_level = 20, is_purchasable = false, sort_order = 13
 WHERE code = 'outfit_golden_armor';
UPDATE items SET price = 8000, unlock_level = 24, is_purchasable = false, sort_order = 14
 WHERE code = 'outfit_galaxy_armor';
UPDATE items SET price = 150, unlock_level = 1, is_purchasable = true, sort_order = 15
 WHERE code = 'hat_cap';
UPDATE items SET price = 150, unlock_level = 1, is_purchasable = true, sort_order = 16
 WHERE code = 'hat_beanie';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 17
 WHERE code = 'hat_party';
UPDATE items SET price = 900, unlock_level = 7, is_purchasable = true, sort_order = 18
 WHERE code = 'hat_wizard';
UPDATE items SET price = 900, unlock_level = 7, is_purchasable = true, sort_order = 19
 WHERE code = 'hat_bandana';
UPDATE items SET price = 2700, unlock_level = 11, is_purchasable = true, sort_order = 20
 WHERE code = 'hat_viking';
UPDATE items SET price = 8000, unlock_level = 26, is_purchasable = false, sort_order = 21
 WHERE code = 'hat_crown_gold';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 22
 WHERE code = 'weapon_staff_star';
UPDATE items SET price = 900, unlock_level = 7, is_purchasable = true, sort_order = 23
 WHERE code = 'weapon_sword_wood';
UPDATE items SET price = 900, unlock_level = 7, is_purchasable = true, sort_order = 24
 WHERE code = 'weapon_wand_magic';
UPDATE items SET price = 2700, unlock_level = 11, is_purchasable = true, sort_order = 25
 WHERE code = 'weapon_trident_ice';
UPDATE items SET price = 2700, unlock_level = 11, is_purchasable = true, sort_order = 26
 WHERE code = 'weapon_hammer_thunder';
UPDATE items SET price = 8000, unlock_level = 17, is_purchasable = true, sort_order = 27
 WHERE code = 'weapon_laser_math';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 28
 WHERE code = 'back_backpack';
UPDATE items SET price = 900, unlock_level = 7, is_purchasable = true, sort_order = 29
 WHERE code = 'back_cape_red';
UPDATE items SET price = 900, unlock_level = 8, is_purchasable = true, sort_order = 30
 WHERE code = 'back_cape_blue';
UPDATE items SET price = 2700, unlock_level = 12, is_purchasable = true, sort_order = 31
 WHERE code = 'back_bat_wings';
UPDATE items SET price = 8000, unlock_level = 17, is_purchasable = true, sort_order = 32
 WHERE code = 'back_angel_wings';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 33
 WHERE code = 'pet_mouse';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 34
 WHERE code = 'pet_snail';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 35
 WHERE code = 'pet_goldfish';
UPDATE items SET price = 900, unlock_level = 8, is_purchasable = true, sort_order = 36
 WHERE code = 'pet_kitten';
UPDATE items SET price = 900, unlock_level = 8, is_purchasable = true, sort_order = 37
 WHERE code = 'pet_owl';
UPDATE items SET price = 2700, unlock_level = 12, is_purchasable = true, sort_order = 38
 WHERE code = 'pet_baby_dragon';
UPDATE items SET price = 8000, unlock_level = 18, is_purchasable = true, sort_order = 39
 WHERE code = 'pet_unicorn';
UPDATE items SET price = 150, unlock_level = 2, is_purchasable = true, sort_order = 40
 WHERE code = 'bg_meadow';
UPDATE items SET price = 900, unlock_level = 8, is_purchasable = true, sort_order = 41
 WHERE code = 'bg_forest_magic';
UPDATE items SET price = 900, unlock_level = 8, is_purchasable = true, sort_order = 42
 WHERE code = 'bg_beach';
UPDATE items SET price = 2700, unlock_level = 12, is_purchasable = true, sort_order = 43
 WHERE code = 'bg_castle';
UPDATE items SET price = 8000, unlock_level = 18, is_purchasable = true, sort_order = 44
 WHERE code = 'bg_galaxy';
UPDATE items SET price = 2700, unlock_level = 12, is_purchasable = true, sort_order = 45
 WHERE code = 'aura_sparkles';
UPDATE items SET price = 2700, unlock_level = 13, is_purchasable = true, sort_order = 46
 WHERE code = 'aura_blue_flames';
UPDATE items SET price = 8000, unlock_level = 19, is_purchasable = true, sort_order = 47
 WHERE code = 'aura_halo_rainbow';

-- Nouveaux items (extension à 350 items, SPEC §5.9 / plan 2026-07-21)
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_mountain_common', 'background', 'common', 150, '/images/items/background_mountain_common.svg', '{"fr":"Montagne de poussière","en":"Dust mountain","es":"Montaña de polvo","zh":"尘埃山脉"}'::jsonb, 2, true, false, 48)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_desert_common', 'background', 'common', 150, '/images/items/background_desert_common.svg', '{"fr":"Désert de paille","en":"Straw desert","es":"Desierto de paja","zh":"稻草沙漠"}'::jsonb, 2, true, false, 49)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_ocean_common', 'background', 'common', 150, '/images/items/background_ocean_common.svg', '{"fr":"Océan d’étincelle","en":"Spark ocean","es":"Océano de chispa","zh":"火花海洋"}'::jsonb, 2, true, false, 50)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_valley_common', 'background', 'common', 150, '/images/items/background_valley_common.svg', '{"fr":"Vallée de poussière","en":"Dust valley","es":"Valle de polvo","zh":"尘埃山谷"}'::jsonb, 2, true, false, 51)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_cave_common', 'background', 'common', 150, '/images/items/background_cave_common.svg', '{"fr":"Grotte de paille","en":"Straw cave","es":"Cueva de paja","zh":"稻草洞穴"}'::jsonb, 2, true, false, 52)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_island_common', 'background', 'common', 150, '/images/items/background_island_common.svg', '{"fr":"Île d’étincelle","en":"Spark island","es":"Isla de chispa","zh":"火花岛屿"}'::jsonb, 3, true, false, 53)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_city_common', 'background', 'common', 150, '/images/items/background_city_common.svg', '{"fr":"Cité de poussière","en":"Dust city","es":"Ciudad de polvo","zh":"尘埃城市"}'::jsonb, 3, true, false, 54)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_sky_common', 'background', 'common', 150, '/images/items/background_sky_common.svg', '{"fr":"Ciel de paille","en":"Straw sky","es":"Cielo de paja","zh":"稻草天空"}'::jsonb, 3, true, false, 55)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_volcano_common', 'background', 'common', 150, '/images/items/background_volcano_common.svg', '{"fr":"Volcan d’étincelle","en":"Spark volcano","es":"Volcán de chispa","zh":"火花火山"}'::jsonb, 3, true, false, 56)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_tundra_common', 'background', 'common', 150, '/images/items/background_tundra_common.svg', '{"fr":"Toundra de poussière","en":"Dust tundra","es":"Tundra de polvo","zh":"尘埃苔原"}'::jsonb, 3, true, false, 57)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_mountain_uncommon', 'background', 'uncommon', 350, '/images/items/background_mountain_uncommon.svg', '{"fr":"Montagne de comète","en":"Comet mountain","es":"Montaña de cometa","zh":"彗星山脉"}'::jsonb, 6, false, false, 58)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_desert_uncommon', 'background', 'uncommon', 350, '/images/items/background_desert_uncommon.svg', '{"fr":"Désert de feuille","en":"Leaf desert","es":"Desierto de hoja","zh":"树叶沙漠"}'::jsonb, 8, false, false, 59)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_ocean_uncommon', 'background', 'uncommon', 350, '/images/items/background_ocean_uncommon.svg', '{"fr":"Océan de flamme","en":"Flame ocean","es":"Océano de llama","zh":"火焰海洋"}'::jsonb, 3, true, false, 60)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_valley_uncommon', 'background', 'uncommon', 350, '/images/items/background_valley_uncommon.svg', '{"fr":"Vallée de comète","en":"Comet valley","es":"Valle de cometa","zh":"彗星山谷"}'::jsonb, 3, true, false, 61)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_cave_uncommon', 'background', 'uncommon', 350, '/images/items/background_cave_uncommon.svg', '{"fr":"Grotte de feuille","en":"Leaf cave","es":"Cueva de hoja","zh":"树叶洞穴"}'::jsonb, 4, true, false, 62)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_island_uncommon', 'background', 'uncommon', 350, '/images/items/background_island_uncommon.svg', '{"fr":"Île de flamme","en":"Flame island","es":"Isla de llama","zh":"火焰岛屿"}'::jsonb, 4, true, false, 63)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_city_uncommon', 'background', 'uncommon', 350, '/images/items/background_city_uncommon.svg', '{"fr":"Cité de comète","en":"Comet city","es":"Ciudad de cometa","zh":"彗星城市"}'::jsonb, 4, true, false, 64)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_sky_uncommon', 'background', 'uncommon', 350, '/images/items/background_sky_uncommon.svg', '{"fr":"Ciel de feuille","en":"Leaf sky","es":"Cielo de hoja","zh":"树叶天空"}'::jsonb, 4, true, false, 65)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_volcano_uncommon', 'background', 'uncommon', 350, '/images/items/background_volcano_uncommon.svg', '{"fr":"Volcan de flamme","en":"Flame volcano","es":"Volcán de llama","zh":"火焰火山"}'::jsonb, 4, true, false, 66)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_mountain_rare', 'background', 'rare', 900, '/images/items/background_mountain_rare.svg', '{"fr":"Montagne d’étoile","en":"Star mountain","es":"Montaña de estrella","zh":"星星山脉"}'::jsonb, 9, true, false, 67)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_desert_rare', 'background', 'rare', 900, '/images/items/background_desert_rare.svg', '{"fr":"Désert de fleur","en":"Flower desert","es":"Desierto de flor","zh":"花沙漠"}'::jsonb, 9, true, false, 68)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_ocean_rare', 'background', 'rare', 900, '/images/items/background_ocean_rare.svg', '{"fr":"Océan de foudre","en":"Thunder ocean","es":"Océano de trueno","zh":"雷电海洋"}'::jsonb, 9, true, false, 69)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_valley_rare', 'background', 'rare', 900, '/images/items/background_valley_rare.svg', '{"fr":"Vallée d’étoile","en":"Star valley","es":"Valle de estrella","zh":"星星山谷"}'::jsonb, 9, true, false, 70)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_cave_rare', 'background', 'rare', 900, '/images/items/background_cave_rare.svg', '{"fr":"Grotte de fleur","en":"Flower cave","es":"Cueva de flor","zh":"花洞穴"}'::jsonb, 9, true, false, 71)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_island_rare', 'background', 'rare', 900, '/images/items/background_island_rare.svg', '{"fr":"Île de foudre","en":"Thunder island","es":"Isla de trueno","zh":"雷电岛屿"}'::jsonb, 10, true, false, 72)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_mountain_epic', 'background', 'epic', 2700, '/images/items/background_mountain_epic.svg', '{"fr":"Montagne de nébuleuse","en":"Nebula mountain","es":"Montaña de nebulosa","zh":"星云山脉"}'::jsonb, 13, true, false, 73)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_desert_epic', 'background', 'epic', 2700, '/images/items/background_desert_epic.svg', '{"fr":"Désert de cristal","en":"Crystal desert","es":"Desierto de cristal","zh":"水晶沙漠"}'::jsonb, 13, true, false, 74)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_ocean_epic', 'background', 'epic', 2700, '/images/items/background_ocean_epic.svg', '{"fr":"Océan de givre","en":"Frost ocean","es":"Océano de escarcha","zh":"寒霜海洋"}'::jsonb, 14, true, false, 75)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_valley_epic', 'background', 'epic', 2700, '/images/items/background_valley_epic.svg', '{"fr":"Vallée de nébuleuse","en":"Nebula valley","es":"Valle de nebulosa","zh":"星云山谷"}'::jsonb, 14, true, false, 76)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_cave_epic', 'background', 'epic', 2700, '/images/items/background_cave_epic.svg', '{"fr":"Grotte de cristal","en":"Crystal cave","es":"Cueva de cristal","zh":"水晶洞穴"}'::jsonb, 14, true, false, 77)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_mountain_legendary', 'background', 'legendary', 8000, '/images/items/background_mountain_legendary.svg', '{"fr":"Montagne de galaxie","en":"Galaxy mountain","es":"Montaña de galaxia","zh":"银河山脉"}'::jsonb, 20, true, false, 78)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_desert_legendary', 'background', 'legendary', 8000, '/images/items/background_desert_legendary.svg', '{"fr":"Désert d’arc-en-ciel","en":"Rainbow desert","es":"Desierto de arcoíris","zh":"彩虹沙漠"}'::jsonb, 20, true, false, 79)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('background_mountain_mythic', 'background', 'mythic', 45000, '/images/items/background_mountain_mythic.svg', '{"fr":"Montagne d’univers","en":"Universe mountain","es":"Montaña de universo","zh":"宇宙山脉"}'::jsonb, 28, false, false, 80)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glow_common', 'aura', 'common', 150, '/images/items/aura_glow_common.svg', '{"fr":"Lueur d’étincelle","en":"Spark glow","es":"Resplandor de chispa","zh":"火花光辉"}'::jsonb, 3, true, false, 81)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_mist_common', 'aura', 'common', 150, '/images/items/aura_mist_common.svg', '{"fr":"Brume de poussière","en":"Dust mist","es":"Bruma de polvo","zh":"尘埃薄雾"}'::jsonb, 3, true, false, 82)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_particles_common', 'aura', 'common', 150, '/images/items/aura_particles_common.svg', '{"fr":"Particules de paille","en":"Straw particles","es":"Partículas de paja","zh":"稻草粒子"}'::jsonb, 3, true, false, 83)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_light_ring_common', 'aura', 'common', 150, '/images/items/aura_light_ring_common.svg', '{"fr":"Anneau lumineux d’étincelle","en":"Spark light ring","es":"Anillo de luz de chispa","zh":"火花光环"}'::jsonb, 3, true, false, 84)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_shimmering_veil_common', 'aura', 'common', 150, '/images/items/aura_shimmering_veil_common.svg', '{"fr":"Voile scintillant de poussière","en":"Dust shimmering veil","es":"Velo brillante de polvo","zh":"尘埃闪烁纱"}'::jsonb, 3, true, false, 85)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_pulse_common', 'aura', 'common', 150, '/images/items/aura_pulse_common.svg', '{"fr":"Pulsation de paille","en":"Straw pulse","es":"Pulso de paja","zh":"稻草脉动"}'::jsonb, 3, true, false, 86)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_trail_common', 'aura', 'common', 150, '/images/items/aura_trail_common.svg', '{"fr":"Traînée d’étincelle","en":"Spark trail","es":"Estela de chispa","zh":"火花拖尾"}'::jsonb, 4, true, false, 87)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glint_common', 'aura', 'common', 150, '/images/items/aura_glint_common.svg', '{"fr":"Éclat de poussière","en":"Dust glint","es":"Destello de polvo","zh":"尘埃光泽"}'::jsonb, 4, true, false, 88)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_energy_crown_common', 'aura', 'common', 150, '/images/items/aura_energy_crown_common.svg', '{"fr":"Couronne d’énergie de paille","en":"Straw energy crown","es":"Corona de energía de paja","zh":"稻草能量冠"}'::jsonb, 4, true, false, 89)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_breeze_aura_common', 'aura', 'common', 150, '/images/items/aura_breeze_aura_common.svg', '{"fr":"Brise d’étincelle","en":"Spark breeze aura","es":"Brisa de chispa","zh":"火花微风灵气"}'::jsonb, 4, true, false, 90)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glow_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_glow_uncommon.svg', '{"fr":"Lueur de flamme","en":"Flame glow","es":"Resplandor de llama","zh":"火焰光辉"}'::jsonb, 4, true, false, 91)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_mist_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_mist_uncommon.svg', '{"fr":"Brume de comète","en":"Comet mist","es":"Bruma de cometa","zh":"彗星薄雾"}'::jsonb, 4, true, false, 92)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_particles_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_particles_uncommon.svg', '{"fr":"Particules de feuille","en":"Leaf particles","es":"Partículas de hoja","zh":"树叶粒子"}'::jsonb, 5, true, false, 93)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_light_ring_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_light_ring_uncommon.svg', '{"fr":"Anneau lumineux de flamme","en":"Flame light ring","es":"Anillo de luz de llama","zh":"火焰光环"}'::jsonb, 5, true, false, 94)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_shimmering_veil_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_shimmering_veil_uncommon.svg', '{"fr":"Voile scintillant de comète","en":"Comet shimmering veil","es":"Velo brillante de cometa","zh":"彗星闪烁纱"}'::jsonb, 5, true, false, 95)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_pulse_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_pulse_uncommon.svg', '{"fr":"Pulsation de feuille","en":"Leaf pulse","es":"Pulso de hoja","zh":"树叶脉动"}'::jsonb, 5, true, false, 96)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_trail_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_trail_uncommon.svg', '{"fr":"Traînée de flamme","en":"Flame trail","es":"Estela de llama","zh":"火焰拖尾"}'::jsonb, 5, true, false, 97)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glint_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_glint_uncommon.svg', '{"fr":"Éclat de comète","en":"Comet glint","es":"Destello de cometa","zh":"彗星光泽"}'::jsonb, 5, true, false, 98)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_energy_crown_uncommon', 'aura', 'uncommon', 350, '/images/items/aura_energy_crown_uncommon.svg', '{"fr":"Couronne d’énergie de feuille","en":"Leaf energy crown","es":"Corona de energía de hoja","zh":"树叶能量冠"}'::jsonb, 5, true, false, 99)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glow_rare', 'aura', 'rare', 900, '/images/items/aura_glow_rare.svg', '{"fr":"Lueur de foudre","en":"Thunder glow","es":"Resplandor de trueno","zh":"雷电光辉"}'::jsonb, 10, true, false, 100)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_mist_rare', 'aura', 'rare', 900, '/images/items/aura_mist_rare.svg', '{"fr":"Brume d’étoile","en":"Star mist","es":"Bruma de estrella","zh":"星星薄雾"}'::jsonb, 10, true, false, 101)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_particles_rare', 'aura', 'rare', 900, '/images/items/aura_particles_rare.svg', '{"fr":"Particules de fleur","en":"Flower particles","es":"Partículas de flor","zh":"花粒子"}'::jsonb, 10, true, false, 102)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_light_ring_rare', 'aura', 'rare', 900, '/images/items/aura_light_ring_rare.svg', '{"fr":"Anneau lumineux de foudre","en":"Thunder light ring","es":"Anillo de luz de trueno","zh":"雷电光环"}'::jsonb, 10, true, false, 103)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_shimmering_veil_rare', 'aura', 'rare', 900, '/images/items/aura_shimmering_veil_rare.svg', '{"fr":"Voile scintillant d’étoile","en":"Star shimmering veil","es":"Velo brillante de estrella","zh":"星星闪烁纱"}'::jsonb, 11, true, false, 104)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_pulse_rare', 'aura', 'rare', 900, '/images/items/aura_pulse_rare.svg', '{"fr":"Pulsation de fleur","en":"Flower pulse","es":"Pulso de flor","zh":"花脉动"}'::jsonb, 11, true, false, 105)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_trail_rare', 'aura', 'rare', 900, '/images/items/aura_trail_rare.svg', '{"fr":"Traînée de foudre","en":"Thunder trail","es":"Estela de trueno","zh":"雷电拖尾"}'::jsonb, 11, true, false, 106)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glow_epic', 'aura', 'epic', 2700, '/images/items/aura_glow_epic.svg', '{"fr":"Lueur de givre","en":"Frost glow","es":"Resplandor de escarcha","zh":"寒霜光辉"}'::jsonb, 14, true, false, 107)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_mist_epic', 'aura', 'epic', 2700, '/images/items/aura_mist_epic.svg', '{"fr":"Brume de nébuleuse","en":"Nebula mist","es":"Bruma de nebulosa","zh":"星云薄雾"}'::jsonb, 15, true, false, 108)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_particles_epic', 'aura', 'epic', 2700, '/images/items/aura_particles_epic.svg', '{"fr":"Particules de cristal","en":"Crystal particles","es":"Partículas de cristal","zh":"水晶粒子"}'::jsonb, 15, true, false, 109)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glow_legendary', 'aura', 'legendary', 8000, '/images/items/aura_glow_legendary.svg', '{"fr":"Lueur de tempête","en":"Storm glow","es":"Resplandor de tormenta","zh":"风暴光辉"}'::jsonb, 21, true, false, 110)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('aura_glow_mythic', 'aura', 'mythic', 45000, '/images/items/aura_glow_mythic.svg', '{"fr":"Lueur de phénix","en":"Phoenix glow","es":"Resplandor de fénix","zh":"凤凰光辉"}'::jsonb, 30, false, false, 111)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_quiver_common', 'back', 'common', 150, '/images/items/back_quiver_common.svg', '{"fr":"Carquois d’étincelle","en":"Spark quiver","es":"Carcaj de chispa","zh":"火花箭袋"}'::jsonb, 4, true, false, 112)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_shield_common', 'back', 'common', 150, '/images/items/back_back_shield_common.svg', '{"fr":"Bouclier dorsal de bois","en":"Wood back shield","es":"Escudo dorsal de madera","zh":"木背盾"}'::jsonb, 4, true, false, 113)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_sail_common', 'back', 'common', 150, '/images/items/back_sail_common.svg', '{"fr":"Voile de paille","en":"Straw sail","es":"Vela de paja","zh":"稻草风帆"}'::jsonb, 4, true, false, 114)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_feather_cloak_common', 'back', 'common', 150, '/images/items/back_feather_cloak_common.svg', '{"fr":"Cape de plumes d’étincelle","en":"Spark feather cloak","es":"Capa de plumas de chispa","zh":"火花羽毛斗篷"}'::jsonb, 4, true, false, 115)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_banner_cape_common', 'back', 'common', 150, '/images/items/back_banner_cape_common.svg', '{"fr":"Cape étendard de bois","en":"Wood banner cape","es":"Capa estandarte de madera","zh":"木旗帜斗篷"}'::jsonb, 4, true, false, 116)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_pack_basket_common', 'back', 'common', 150, '/images/items/back_pack_basket_common.svg', '{"fr":"Hotte de paille","en":"Straw pack basket","es":"Cesta de paja","zh":"稻草背篓"}'::jsonb, 4, true, false, 117)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_thruster_common', 'back', 'common', 150, '/images/items/back_thruster_common.svg', '{"fr":"Propulseur d’étincelle","en":"Spark thruster","es":"Propulsor de chispa","zh":"火花推进器"}'::jsonb, 4, true, false, 118)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_fins_common', 'back', 'common', 150, '/images/items/back_fins_common.svg', '{"fr":"Ailerons de bois","en":"Wood fins","es":"Aletas de madera","zh":"木鱼鳍"}'::jsonb, 4, true, false, 119)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_crystal_common', 'back', 'common', 150, '/images/items/back_back_crystal_common.svg', '{"fr":"Cristal dorsal de paille","en":"Straw back crystal","es":"Cristal dorsal de paja","zh":"稻草背晶"}'::jsonb, 5, true, false, 120)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_scarf_cape_common', 'back', 'common', 150, '/images/items/back_scarf_cape_common.svg', '{"fr":"Cape écharpe d’étincelle","en":"Spark scarf cape","es":"Capa bufanda de chispa","zh":"火花围巾斗篷"}'::jsonb, 5, true, false, 121)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_quiver_uncommon', 'back', 'uncommon', 350, '/images/items/back_quiver_uncommon.svg', '{"fr":"Carquois de flamme","en":"Flame quiver","es":"Carcaj de llama","zh":"火焰箭袋"}'::jsonb, 5, true, false, 122)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_shield_uncommon', 'back', 'uncommon', 350, '/images/items/back_back_shield_uncommon.svg', '{"fr":"Bouclier dorsal de bronze","en":"Bronze back shield","es":"Escudo dorsal de bronce","zh":"青铜背盾"}'::jsonb, 6, true, false, 123)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_sail_uncommon', 'back', 'uncommon', 350, '/images/items/back_sail_uncommon.svg', '{"fr":"Voile de feuille","en":"Leaf sail","es":"Vela de hoja","zh":"树叶风帆"}'::jsonb, 6, true, false, 124)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_feather_cloak_uncommon', 'back', 'uncommon', 350, '/images/items/back_feather_cloak_uncommon.svg', '{"fr":"Cape de plumes de flamme","en":"Flame feather cloak","es":"Capa de plumas de llama","zh":"火焰羽毛斗篷"}'::jsonb, 6, true, false, 125)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_banner_cape_uncommon', 'back', 'uncommon', 350, '/images/items/back_banner_cape_uncommon.svg', '{"fr":"Cape étendard de bronze","en":"Bronze banner cape","es":"Capa estandarte de bronce","zh":"青铜旗帜斗篷"}'::jsonb, 6, true, false, 126)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_pack_basket_uncommon', 'back', 'uncommon', 350, '/images/items/back_pack_basket_uncommon.svg', '{"fr":"Hotte de feuille","en":"Leaf pack basket","es":"Cesta de hoja","zh":"树叶背篓"}'::jsonb, 6, true, false, 127)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_thruster_uncommon', 'back', 'uncommon', 350, '/images/items/back_thruster_uncommon.svg', '{"fr":"Propulseur de flamme","en":"Flame thruster","es":"Propulsor de llama","zh":"火焰推进器"}'::jsonb, 6, true, false, 128)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_fins_uncommon', 'back', 'uncommon', 350, '/images/items/back_fins_uncommon.svg', '{"fr":"Ailerons de bronze","en":"Bronze fins","es":"Aletas de bronce","zh":"青铜鱼鳍"}'::jsonb, 6, true, false, 129)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_crystal_uncommon', 'back', 'uncommon', 350, '/images/items/back_back_crystal_uncommon.svg', '{"fr":"Cristal dorsal de feuille","en":"Leaf back crystal","es":"Cristal dorsal de hoja","zh":"树叶背晶"}'::jsonb, 7, true, false, 130)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_quiver_rare', 'back', 'rare', 900, '/images/items/back_quiver_rare.svg', '{"fr":"Carquois de foudre","en":"Thunder quiver","es":"Carcaj de trueno","zh":"雷电箭袋"}'::jsonb, 11, true, false, 131)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_shield_rare', 'back', 'rare', 900, '/images/items/back_back_shield_rare.svg', '{"fr":"Bouclier dorsal d’acier","en":"Steel back shield","es":"Escudo dorsal de acero","zh":"钢背盾"}'::jsonb, 11, true, false, 132)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_sail_rare', 'back', 'rare', 900, '/images/items/back_sail_rare.svg', '{"fr":"Voile de fleur","en":"Flower sail","es":"Vela de flor","zh":"花风帆"}'::jsonb, 12, true, false, 133)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_feather_cloak_rare', 'back', 'rare', 900, '/images/items/back_feather_cloak_rare.svg', '{"fr":"Cape de plumes de foudre","en":"Thunder feather cloak","es":"Capa de plumas de trueno","zh":"雷电羽毛斗篷"}'::jsonb, 12, true, false, 134)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_banner_cape_rare', 'back', 'rare', 900, '/images/items/back_banner_cape_rare.svg', '{"fr":"Cape étendard d’acier","en":"Steel banner cape","es":"Capa estandarte de acero","zh":"钢旗帜斗篷"}'::jsonb, 12, true, false, 135)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_pack_basket_rare', 'back', 'rare', 900, '/images/items/back_pack_basket_rare.svg', '{"fr":"Hotte de fleur","en":"Flower pack basket","es":"Cesta de flor","zh":"花背篓"}'::jsonb, 12, true, false, 136)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_quiver_epic', 'back', 'epic', 2700, '/images/items/back_quiver_epic.svg', '{"fr":"Carquois de givre","en":"Frost quiver","es":"Carcaj de escarcha","zh":"寒霜箭袋"}'::jsonb, 15, true, false, 137)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_shield_epic', 'back', 'epic', 2700, '/images/items/back_back_shield_epic.svg', '{"fr":"Bouclier dorsal d’argent","en":"Silver back shield","es":"Escudo dorsal de plata","zh":"银背盾"}'::jsonb, 15, true, false, 138)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_sail_epic', 'back', 'epic', 2700, '/images/items/back_sail_epic.svg', '{"fr":"Voile de cristal","en":"Crystal sail","es":"Vela de cristal","zh":"水晶风帆"}'::jsonb, 16, true, false, 139)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_feather_cloak_epic', 'back', 'epic', 2700, '/images/items/back_feather_cloak_epic.svg', '{"fr":"Cape de plumes de givre","en":"Frost feather cloak","es":"Capa de plumas de escarcha","zh":"寒霜羽毛斗篷"}'::jsonb, 16, true, false, 140)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_banner_cape_epic', 'back', 'epic', 2700, '/images/items/back_banner_cape_epic.svg', '{"fr":"Cape étendard d’argent","en":"Silver banner cape","es":"Capa estandarte de plata","zh":"银旗帜斗篷"}'::jsonb, 16, true, false, 141)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_quiver_legendary', 'back', 'legendary', 8000, '/images/items/back_quiver_legendary.svg', '{"fr":"Carquois de tempête","en":"Storm quiver","es":"Carcaj de tormenta","zh":"风暴箭袋"}'::jsonb, 21, true, false, 142)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_back_shield_legendary', 'back', 'legendary', 8000, '/images/items/back_back_shield_legendary.svg', '{"fr":"Bouclier dorsal de mithril","en":"Mithril back shield","es":"Escudo dorsal de mithril","zh":"秘银背盾"}'::jsonb, 22, true, false, 143)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('back_quiver_mythic', 'back', 'mythic', 45000, '/images/items/back_quiver_mythic.svg', '{"fr":"Carquois de phénix","en":"Phoenix quiver","es":"Carcaj de fénix","zh":"凤凰箭袋"}'::jsonb, 24, true, false, 144)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_bear_cub_common', 'body', 'common', 150, '/images/items/body_bear_cub_common.svg', '{"fr":"Ourson de paille","en":"Straw bear cub","es":"Osezno de paja","zh":"稻草小熊"}'::jsonb, 5, true, false, 145)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_goblin_common', 'body', 'common', 150, '/images/items/body_goblin_common.svg', '{"fr":"Gobelin d’étincelle","en":"Spark goblin","es":"Duende de chispa","zh":"火花哥布林"}'::jsonb, 5, true, false, 146)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_imp_common', 'body', 'common', 150, '/images/items/body_imp_common.svg', '{"fr":"Lutin de poussière","en":"Dust imp","es":"Trasgo de polvo","zh":"尘埃小精灵"}'::jsonb, 5, true, false, 147)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_ghost_common', 'body', 'common', 150, '/images/items/body_ghost_common.svg', '{"fr":"Fantôme de paille","en":"Straw ghost","es":"Fantasma de paja","zh":"稻草幽灵"}'::jsonb, 5, true, false, 148)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cube_common', 'body', 'common', 150, '/images/items/body_cube_common.svg', '{"fr":"Cube d’étincelle","en":"Spark cube","es":"Cubo de chispa","zh":"火花方块"}'::jsonb, 5, true, false, 149)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_orb_common', 'body', 'common', 150, '/images/items/body_orb_common.svg', '{"fr":"Sphère de poussière","en":"Dust orb","es":"Esfera de polvo","zh":"尘埃球体"}'::jsonb, 5, true, false, 150)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cloud_common', 'body', 'common', 150, '/images/items/body_cloud_common.svg', '{"fr":"Nuage de paille","en":"Straw cloud","es":"Nube de paja","zh":"稻草云朵"}'::jsonb, 5, true, false, 151)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_star_common', 'body', 'common', 150, '/images/items/body_star_common.svg', '{"fr":"Étoile d’étincelle","en":"Spark star","es":"Estrella de chispa","zh":"火花星形"}'::jsonb, 5, true, false, 152)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_comet_common', 'body', 'common', 150, '/images/items/body_comet_common.svg', '{"fr":"Comète de poussière","en":"Dust comet","es":"Cometa de polvo","zh":"尘埃彗星形"}'::jsonb, 5, true, false, 153)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_spiral_common', 'body', 'common', 150, '/images/items/body_spiral_common.svg', '{"fr":"Spirale de paille","en":"Straw spiral","es":"Espiral de paja","zh":"稻草螺旋"}'::jsonb, 6, true, false, 154)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_prism_common', 'body', 'common', 150, '/images/items/body_prism_common.svg', '{"fr":"Prisme d’étincelle","en":"Spark prism","es":"Prisma de chispa","zh":"火花棱镜"}'::jsonb, 6, true, false, 155)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_droplet_common', 'body', 'common', 150, '/images/items/body_droplet_common.svg', '{"fr":"Goutte de poussière","en":"Dust droplet","es":"Gota de polvo","zh":"尘埃水滴"}'::jsonb, 6, true, false, 156)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_bear_cub_uncommon', 'body', 'uncommon', 350, '/images/items/body_bear_cub_uncommon.svg', '{"fr":"Ourson de feuille","en":"Leaf bear cub","es":"Osezno de hoja","zh":"树叶小熊"}'::jsonb, 7, true, false, 157)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_goblin_uncommon', 'body', 'uncommon', 350, '/images/items/body_goblin_uncommon.svg', '{"fr":"Gobelin de flamme","en":"Flame goblin","es":"Duende de llama","zh":"火焰哥布林"}'::jsonb, 7, true, false, 158)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_imp_uncommon', 'body', 'uncommon', 350, '/images/items/body_imp_uncommon.svg', '{"fr":"Lutin de comète","en":"Comet imp","es":"Trasgo de cometa","zh":"彗星小精灵"}'::jsonb, 7, true, false, 159)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_ghost_uncommon', 'body', 'uncommon', 350, '/images/items/body_ghost_uncommon.svg', '{"fr":"Fantôme de feuille","en":"Leaf ghost","es":"Fantasma de hoja","zh":"树叶幽灵"}'::jsonb, 7, true, false, 160)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cube_uncommon', 'body', 'uncommon', 350, '/images/items/body_cube_uncommon.svg', '{"fr":"Cube de flamme","en":"Flame cube","es":"Cubo de llama","zh":"火焰方块"}'::jsonb, 7, true, false, 161)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_orb_uncommon', 'body', 'uncommon', 350, '/images/items/body_orb_uncommon.svg', '{"fr":"Sphère de comète","en":"Comet orb","es":"Esfera de cometa","zh":"彗星球体"}'::jsonb, 7, true, false, 162)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cloud_uncommon', 'body', 'uncommon', 350, '/images/items/body_cloud_uncommon.svg', '{"fr":"Nuage de feuille","en":"Leaf cloud","es":"Nube de hoja","zh":"树叶云朵"}'::jsonb, 8, true, false, 163)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_star_uncommon', 'body', 'uncommon', 350, '/images/items/body_star_uncommon.svg', '{"fr":"Étoile de flamme","en":"Flame star","es":"Estrella de llama","zh":"火焰星形"}'::jsonb, 8, true, false, 164)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_comet_uncommon', 'body', 'uncommon', 350, '/images/items/body_comet_uncommon.svg', '{"fr":"Comète de comète","en":"Comet comet","es":"Cometa de cometa","zh":"彗星彗星形"}'::jsonb, 8, true, false, 165)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_spiral_uncommon', 'body', 'uncommon', 350, '/images/items/body_spiral_uncommon.svg', '{"fr":"Spirale de feuille","en":"Leaf spiral","es":"Espiral de hoja","zh":"树叶螺旋"}'::jsonb, 8, true, false, 166)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_prism_uncommon', 'body', 'uncommon', 350, '/images/items/body_prism_uncommon.svg', '{"fr":"Prisme de flamme","en":"Flame prism","es":"Prisma de llama","zh":"火焰棱镜"}'::jsonb, 8, true, false, 167)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_droplet_uncommon', 'body', 'uncommon', 350, '/images/items/body_droplet_uncommon.svg', '{"fr":"Goutte de comète","en":"Comet droplet","es":"Gota de cometa","zh":"彗星水滴"}'::jsonb, 8, true, false, 168)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_bear_cub_rare', 'body', 'rare', 900, '/images/items/body_bear_cub_rare.svg', '{"fr":"Ourson de fleur","en":"Flower bear cub","es":"Osezno de flor","zh":"花小熊"}'::jsonb, 12, true, false, 169)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_goblin_rare', 'body', 'rare', 900, '/images/items/body_goblin_rare.svg', '{"fr":"Gobelin de foudre","en":"Thunder goblin","es":"Duende de trueno","zh":"雷电哥布林"}'::jsonb, 13, true, false, 170)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_imp_rare', 'body', 'rare', 900, '/images/items/body_imp_rare.svg', '{"fr":"Lutin d’étoile","en":"Star imp","es":"Trasgo de estrella","zh":"星星小精灵"}'::jsonb, 13, true, false, 171)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_ghost_rare', 'body', 'rare', 900, '/images/items/body_ghost_rare.svg', '{"fr":"Fantôme de fleur","en":"Flower ghost","es":"Fantasma de flor","zh":"花幽灵"}'::jsonb, 13, true, false, 172)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cube_rare', 'body', 'rare', 900, '/images/items/body_cube_rare.svg', '{"fr":"Cube de foudre","en":"Thunder cube","es":"Cubo de trueno","zh":"雷电方块"}'::jsonb, 13, true, false, 173)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_orb_rare', 'body', 'rare', 900, '/images/items/body_orb_rare.svg', '{"fr":"Sphère d’étoile","en":"Star orb","es":"Esfera de estrella","zh":"星星球体"}'::jsonb, 13, true, false, 174)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cloud_rare', 'body', 'rare', 900, '/images/items/body_cloud_rare.svg', '{"fr":"Nuage de fleur","en":"Flower cloud","es":"Nube de flor","zh":"花云朵"}'::jsonb, 14, true, false, 175)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_star_rare', 'body', 'rare', 900, '/images/items/body_star_rare.svg', '{"fr":"Étoile de foudre","en":"Thunder star","es":"Estrella de trueno","zh":"雷电星形"}'::jsonb, 14, true, false, 176)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_bear_cub_epic', 'body', 'epic', 2700, '/images/items/body_bear_cub_epic.svg', '{"fr":"Ourson de cristal","en":"Crystal bear cub","es":"Osezno de cristal","zh":"水晶小熊"}'::jsonb, 16, true, false, 177)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_goblin_epic', 'body', 'epic', 2700, '/images/items/body_goblin_epic.svg', '{"fr":"Gobelin de givre","en":"Frost goblin","es":"Duende de escarcha","zh":"寒霜哥布林"}'::jsonb, 17, true, false, 178)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_imp_epic', 'body', 'epic', 2700, '/images/items/body_imp_epic.svg', '{"fr":"Lutin de nébuleuse","en":"Nebula imp","es":"Trasgo de nebulosa","zh":"星云小精灵"}'::jsonb, 17, true, false, 179)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_ghost_epic', 'body', 'epic', 2700, '/images/items/body_ghost_epic.svg', '{"fr":"Fantôme de cristal","en":"Crystal ghost","es":"Fantasma de cristal","zh":"水晶幽灵"}'::jsonb, 17, true, false, 180)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_cube_epic', 'body', 'epic', 2700, '/images/items/body_cube_epic.svg', '{"fr":"Cube de givre","en":"Frost cube","es":"Cubo de escarcha","zh":"寒霜方块"}'::jsonb, 18, true, false, 181)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_orb_epic', 'body', 'epic', 2700, '/images/items/body_orb_epic.svg', '{"fr":"Sphère de nébuleuse","en":"Nebula orb","es":"Esfera de nebulosa","zh":"星云球体"}'::jsonb, 18, true, false, 182)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_bear_cub_legendary', 'body', 'legendary', 8000, '/images/items/body_bear_cub_legendary.svg', '{"fr":"Ourson d’arc-en-ciel","en":"Rainbow bear cub","es":"Osezno de arcoíris","zh":"彩虹小熊"}'::jsonb, 22, true, false, 183)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_goblin_legendary', 'body', 'legendary', 11200, '/images/items/body_goblin_legendary.svg', '{"fr":"Gobelin de tempête","en":"Storm goblin","es":"Duende de tormenta","zh":"风暴哥布林"}'::jsonb, 23, true, false, 184)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('body_bear_cub_mythic', 'body', 'mythic', 45000, '/images/items/body_bear_cub_mythic.svg', '{"fr":"Ourson de paradis","en":"Paradise bear cub","es":"Osezno de paraíso","zh":"天堂小熊"}'::jsonb, 25, true, false, 185)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_robe_common', 'outfit', 'common', 150, '/images/items/outfit_robe_common.svg', '{"fr":"Robe de paille","en":"Straw robe","es":"Túnica larga de paja","zh":"稻草长袍"}'::jsonb, 6, true, false, 186)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jacket_common', 'outfit', 'common', 150, '/images/items/outfit_jacket_common.svg', '{"fr":"Veste de biscuit","en":"Cookie jacket","es":"Chaqueta de galleta","zh":"饼干夹克"}'::jsonb, 6, true, false, 187)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_coat_common', 'outfit', 'common', 150, '/images/items/outfit_coat_common.svg', '{"fr":"Manteau de poussière","en":"Dust coat","es":"Abrigo de polvo","zh":"尘埃大衣"}'::jsonb, 6, true, false, 188)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jumpsuit_common', 'outfit', 'common', 150, '/images/items/outfit_jumpsuit_common.svg', '{"fr":"Combinaison de paille","en":"Straw jumpsuit","es":"Mono de paja","zh":"稻草连体服"}'::jsonb, 6, true, false, 189)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_kimono_common', 'outfit', 'common', 150, '/images/items/outfit_kimono_common.svg', '{"fr":"Kimono de biscuit","en":"Cookie kimono","es":"Kimono de galleta","zh":"饼干和服"}'::jsonb, 6, true, false, 190)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_tabard_common', 'outfit', 'common', 150, '/images/items/outfit_tabard_common.svg', '{"fr":"Tabard de poussière","en":"Dust tabard","es":"Tabardo de polvo","zh":"尘埃罩袍"}'::jsonb, 6, true, false, 191)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_breastplate_common', 'outfit', 'common', 150, '/images/items/outfit_breastplate_common.svg', '{"fr":"Plastron de paille","en":"Straw breastplate","es":"Peto de paja","zh":"稻草胸甲"}'::jsonb, 6, true, false, 192)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_poncho_common', 'outfit', 'common', 150, '/images/items/outfit_poncho_common.svg', '{"fr":"Poncho de biscuit","en":"Cookie poncho","es":"Poncho de galleta","zh":"饼干雨披"}'::jsonb, 6, true, false, 193)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_long_cloak_common', 'outfit', 'common', 150, '/images/items/outfit_long_cloak_common.svg', '{"fr":"Cape longue de poussière","en":"Dust long cloak","es":"Capa larga de polvo","zh":"尘埃长斗篷"}'::jsonb, 7, true, false, 194)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_leotard_common', 'outfit', 'common', 150, '/images/items/outfit_leotard_common.svg', '{"fr":"Justaucorps de paille","en":"Straw leotard","es":"Malla de paja","zh":"稻草紧身衣"}'::jsonb, 7, true, false, 195)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_cuirass_common', 'outfit', 'common', 150, '/images/items/outfit_cuirass_common.svg', '{"fr":"Cuirasse de biscuit","en":"Cookie cuirass","es":"Coraza de galleta","zh":"饼干胸铠"}'::jsonb, 7, true, false, 196)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_greatcoat_common', 'outfit', 'common', 150, '/images/items/outfit_greatcoat_common.svg', '{"fr":"Houppelande de poussière","en":"Dust greatcoat","es":"Gabán de polvo","zh":"尘埃厚外套"}'::jsonb, 7, true, false, 197)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_sarong_common', 'outfit', 'common', 150, '/images/items/outfit_sarong_common.svg', '{"fr":"Sarong de paille","en":"Straw sarong","es":"Sarong de paja","zh":"稻草纱笼"}'::jsonb, 7, true, false, 198)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_kilt_common', 'outfit', 'common', 150, '/images/items/outfit_kilt_common.svg', '{"fr":"Kilt de biscuit","en":"Cookie kilt","es":"Falda escocesa de galleta","zh":"饼干苏格兰裙"}'::jsonb, 7, true, false, 199)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_robe_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_robe_uncommon.svg', '{"fr":"Robe de feuille","en":"Leaf robe","es":"Túnica larga de hoja","zh":"树叶长袍"}'::jsonb, 8, true, false, 200)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jacket_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_jacket_uncommon.svg', '{"fr":"Veste de caramel","en":"Caramel jacket","es":"Chaqueta de caramelo","zh":"焦糖夹克"}'::jsonb, 9, true, false, 201)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_coat_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_coat_uncommon.svg', '{"fr":"Manteau de comète","en":"Comet coat","es":"Abrigo de cometa","zh":"彗星大衣"}'::jsonb, 9, true, false, 202)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jumpsuit_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_jumpsuit_uncommon.svg', '{"fr":"Combinaison de feuille","en":"Leaf jumpsuit","es":"Mono de hoja","zh":"树叶连体服"}'::jsonb, 9, true, false, 203)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_kimono_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_kimono_uncommon.svg', '{"fr":"Kimono de caramel","en":"Caramel kimono","es":"Kimono de caramelo","zh":"焦糖和服"}'::jsonb, 9, true, false, 204)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_tabard_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_tabard_uncommon.svg', '{"fr":"Tabard de comète","en":"Comet tabard","es":"Tabardo de cometa","zh":"彗星罩袍"}'::jsonb, 9, true, false, 205)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_breastplate_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_breastplate_uncommon.svg', '{"fr":"Plastron de feuille","en":"Leaf breastplate","es":"Peto de hoja","zh":"树叶胸甲"}'::jsonb, 9, true, false, 206)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_poncho_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_poncho_uncommon.svg', '{"fr":"Poncho de caramel","en":"Caramel poncho","es":"Poncho de caramelo","zh":"焦糖雨披"}'::jsonb, 9, true, false, 207)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_long_cloak_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_long_cloak_uncommon.svg', '{"fr":"Cape longue de comète","en":"Comet long cloak","es":"Capa larga de cometa","zh":"彗星长斗篷"}'::jsonb, 9, true, false, 208)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_leotard_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_leotard_uncommon.svg', '{"fr":"Justaucorps de feuille","en":"Leaf leotard","es":"Malla de hoja","zh":"树叶紧身衣"}'::jsonb, 10, true, false, 209)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_cuirass_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_cuirass_uncommon.svg', '{"fr":"Cuirasse de caramel","en":"Caramel cuirass","es":"Coraza de caramelo","zh":"焦糖胸铠"}'::jsonb, 10, true, false, 210)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_greatcoat_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_greatcoat_uncommon.svg', '{"fr":"Houppelande de comète","en":"Comet greatcoat","es":"Gabán de cometa","zh":"彗星厚外套"}'::jsonb, 10, true, false, 211)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_sarong_uncommon', 'outfit', 'uncommon', 350, '/images/items/outfit_sarong_uncommon.svg', '{"fr":"Sarong de feuille","en":"Leaf sarong","es":"Sarong de hoja","zh":"树叶纱笼"}'::jsonb, 10, true, false, 212)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_robe_rare', 'outfit', 'rare', 900, '/images/items/outfit_robe_rare.svg', '{"fr":"Robe de fleur","en":"Flower robe","es":"Túnica larga de flor","zh":"花长袍"}'::jsonb, 14, true, false, 213)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jacket_rare', 'outfit', 'rare', 900, '/images/items/outfit_jacket_rare.svg', '{"fr":"Veste de guimauve","en":"Marshmallow jacket","es":"Chaqueta de malvavisco","zh":"棉花糖夹克"}'::jsonb, 14, true, false, 214)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_coat_rare', 'outfit', 'rare', 1260, '/images/items/outfit_coat_rare.svg', '{"fr":"Manteau d’étoile","en":"Star coat","es":"Abrigo de estrella","zh":"星星大衣"}'::jsonb, 14, true, false, 215)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jumpsuit_rare', 'outfit', 'rare', 1260, '/images/items/outfit_jumpsuit_rare.svg', '{"fr":"Combinaison de fleur","en":"Flower jumpsuit","es":"Mono de flor","zh":"花连体服"}'::jsonb, 15, true, false, 216)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_kimono_rare', 'outfit', 'rare', 1260, '/images/items/outfit_kimono_rare.svg', '{"fr":"Kimono de guimauve","en":"Marshmallow kimono","es":"Kimono de malvavisco","zh":"棉花糖和服"}'::jsonb, 15, true, false, 217)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_tabard_rare', 'outfit', 'rare', 1260, '/images/items/outfit_tabard_rare.svg', '{"fr":"Tabard d’étoile","en":"Star tabard","es":"Tabardo de estrella","zh":"星星罩袍"}'::jsonb, 15, true, false, 218)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_breastplate_rare', 'outfit', 'rare', 1260, '/images/items/outfit_breastplate_rare.svg', '{"fr":"Plastron de fleur","en":"Flower breastplate","es":"Peto de flor","zh":"花胸甲"}'::jsonb, 15, true, false, 219)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_poncho_rare', 'outfit', 'rare', 1260, '/images/items/outfit_poncho_rare.svg', '{"fr":"Poncho de guimauve","en":"Marshmallow poncho","es":"Poncho de malvavisco","zh":"棉花糖雨披"}'::jsonb, 15, true, false, 220)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_robe_epic', 'outfit', 'epic', 2700, '/images/items/outfit_robe_epic.svg', '{"fr":"Robe de cristal","en":"Crystal robe","es":"Túnica larga de cristal","zh":"水晶长袍"}'::jsonb, 18, true, false, 221)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jacket_epic', 'outfit', 'epic', 3780, '/images/items/outfit_jacket_epic.svg', '{"fr":"Veste de chocolat","en":"Chocolate jacket","es":"Chaqueta de chocolate","zh":"巧克力夹克"}'::jsonb, 18, true, false, 222)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_coat_epic', 'outfit', 'epic', 3780, '/images/items/outfit_coat_epic.svg', '{"fr":"Manteau de nébuleuse","en":"Nebula coat","es":"Abrigo de nebulosa","zh":"星云大衣"}'::jsonb, 19, true, false, 223)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jumpsuit_epic', 'outfit', 'epic', 3780, '/images/items/outfit_jumpsuit_epic.svg', '{"fr":"Combinaison de cristal","en":"Crystal jumpsuit","es":"Mono de cristal","zh":"水晶连体服"}'::jsonb, 19, true, false, 224)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_kimono_epic', 'outfit', 'epic', 3780, '/images/items/outfit_kimono_epic.svg', '{"fr":"Kimono de chocolat","en":"Chocolate kimono","es":"Kimono de chocolate","zh":"巧克力和服"}'::jsonb, 19, true, false, 225)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_tabard_epic', 'outfit', 'epic', 3780, '/images/items/outfit_tabard_epic.svg', '{"fr":"Tabard de nébuleuse","en":"Nebula tabard","es":"Tabardo de nebulosa","zh":"星云罩袍"}'::jsonb, 19, true, false, 226)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_robe_legendary', 'outfit', 'legendary', 11200, '/images/items/outfit_robe_legendary.svg', '{"fr":"Robe d’arc-en-ciel","en":"Rainbow robe","es":"Túnica larga de arcoíris","zh":"彩虹长袍"}'::jsonb, 23, true, false, 227)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_jacket_legendary', 'outfit', 'legendary', 11200, '/images/items/outfit_jacket_legendary.svg', '{"fr":"Veste de barbe à papa","en":"Cotton candy jacket","es":"Chaqueta de algodón de azúcar","zh":"棉花糖云夹克"}'::jsonb, 24, true, false, 228)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_coat_legendary', 'outfit', 'legendary', 11200, '/images/items/outfit_coat_legendary.svg', '{"fr":"Manteau de galaxie","en":"Galaxy coat","es":"Abrigo de galaxia","zh":"银河大衣"}'::jsonb, 25, true, false, 229)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('outfit_robe_mythic', 'outfit', 'mythic', 45000, '/images/items/outfit_robe_mythic.svg', '{"fr":"Robe de paradis","en":"Paradise robe","es":"Túnica larga de paraíso","zh":"天堂长袍"}'::jsonb, 26, true, false, 230)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_dagger_common', 'weapon', 'common', 150, '/images/items/weapon_dagger_common.svg', '{"fr":"Dague de bois","en":"Wood dagger","es":"Daga de madera","zh":"木匕首"}'::jsonb, 7, true, false, 231)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_axe_common', 'weapon', 'common', 150, '/images/items/weapon_axe_common.svg', '{"fr":"Hache d’étincelle","en":"Spark axe","es":"Hacha de chispa","zh":"火花斧头"}'::jsonb, 7, true, false, 232)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_spear_common', 'weapon', 'common', 150, '/images/items/weapon_spear_common.svg', '{"fr":"Lance de poussière","en":"Dust spear","es":"Lanza de polvo","zh":"尘埃长矛"}'::jsonb, 7, true, false, 233)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_bow_common', 'weapon', 'common', 150, '/images/items/weapon_bow_common.svg', '{"fr":"Arc de bois","en":"Wood bow","es":"Arco de madera","zh":"木弓"}'::jsonb, 7, true, false, 234)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_whip_common', 'weapon', 'common', 150, '/images/items/weapon_whip_common.svg', '{"fr":"Fouet d’étincelle","en":"Spark whip","es":"Látigo de chispa","zh":"火花鞭子"}'::jsonb, 7, true, false, 235)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_halberd_common', 'weapon', 'common', 150, '/images/items/weapon_halberd_common.svg', '{"fr":"Hallebarde de poussière","en":"Dust halberd","es":"Alabarda de polvo","zh":"尘埃戟"}'::jsonb, 7, true, false, 236)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_rapier_common', 'weapon', 'common', 150, '/images/items/weapon_rapier_common.svg', '{"fr":"Rapière de bois","en":"Wood rapier","es":"Estoque de madera","zh":"木细剑"}'::jsonb, 8, true, false, 237)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_gauntlet_common', 'weapon', 'common', 150, '/images/items/weapon_gauntlet_common.svg', '{"fr":"Gantelet d’étincelle","en":"Spark gauntlet","es":"Guantelete de chispa","zh":"火花护手"}'::jsonb, 8, true, false, 238)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_flail_common', 'weapon', 'common', 150, '/images/items/weapon_flail_common.svg', '{"fr":"Fléau de poussière","en":"Dust flail","es":"Mangual de polvo","zh":"尘埃连枷"}'::jsonb, 8, true, false, 239)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_javelin_common', 'weapon', 'common', 150, '/images/items/weapon_javelin_common.svg', '{"fr":"Javelot de bois","en":"Wood javelin","es":"Jabalina de madera","zh":"木标枪"}'::jsonb, 8, true, false, 240)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_scimitar_common', 'weapon', 'common', 150, '/images/items/weapon_scimitar_common.svg', '{"fr":"Cimeterre d’étincelle","en":"Spark scimitar","es":"Cimitarra de chispa","zh":"火花弯刀"}'::jsonb, 8, true, false, 241)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_mace_common', 'weapon', 'common', 150, '/images/items/weapon_mace_common.svg', '{"fr":"Masse de poussière","en":"Dust mace","es":"Maza de polvo","zh":"尘埃狼牙棒"}'::jsonb, 8, true, false, 242)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_boomerang_common', 'weapon', 'common', 150, '/images/items/weapon_boomerang_common.svg', '{"fr":"Boomerang de bois","en":"Wood boomerang","es":"Bumerán de madera","zh":"木回旋镖"}'::jsonb, 8, true, false, 243)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_dagger_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_dagger_uncommon.svg', '{"fr":"Dague de bronze","en":"Bronze dagger","es":"Daga de bronce","zh":"青铜匕首"}'::jsonb, 10, true, false, 244)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_axe_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_axe_uncommon.svg', '{"fr":"Hache de flamme","en":"Flame axe","es":"Hacha de llama","zh":"火焰斧头"}'::jsonb, 10, true, false, 245)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_spear_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_spear_uncommon.svg', '{"fr":"Lance de comète","en":"Comet spear","es":"Lanza de cometa","zh":"彗星长矛"}'::jsonb, 10, true, false, 246)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_bow_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_bow_uncommon.svg', '{"fr":"Arc de bronze","en":"Bronze bow","es":"Arco de bronce","zh":"青铜弓"}'::jsonb, 11, true, false, 247)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_whip_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_whip_uncommon.svg', '{"fr":"Fouet de flamme","en":"Flame whip","es":"Látigo de llama","zh":"火焰鞭子"}'::jsonb, 11, true, false, 248)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_halberd_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_halberd_uncommon.svg', '{"fr":"Hallebarde de comète","en":"Comet halberd","es":"Alabarda de cometa","zh":"彗星戟"}'::jsonb, 11, true, false, 249)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_rapier_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_rapier_uncommon.svg', '{"fr":"Rapière de bronze","en":"Bronze rapier","es":"Estoque de bronce","zh":"青铜细剑"}'::jsonb, 11, true, false, 250)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_gauntlet_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_gauntlet_uncommon.svg', '{"fr":"Gantelet de flamme","en":"Flame gauntlet","es":"Guantelete de llama","zh":"火焰护手"}'::jsonb, 11, true, false, 251)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_flail_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_flail_uncommon.svg', '{"fr":"Fléau de comète","en":"Comet flail","es":"Mangual de cometa","zh":"彗星连枷"}'::jsonb, 11, true, false, 252)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_javelin_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_javelin_uncommon.svg', '{"fr":"Javelot de bronze","en":"Bronze javelin","es":"Jabalina de bronce","zh":"青铜标枪"}'::jsonb, 11, true, false, 253)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_scimitar_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_scimitar_uncommon.svg', '{"fr":"Cimeterre de flamme","en":"Flame scimitar","es":"Cimitarra de llama","zh":"火焰弯刀"}'::jsonb, 12, true, false, 254)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_mace_uncommon', 'weapon', 'uncommon', 490, '/images/items/weapon_mace_uncommon.svg', '{"fr":"Masse de comète","en":"Comet mace","es":"Maza de cometa","zh":"彗星狼牙棒"}'::jsonb, 12, true, false, 255)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_dagger_rare', 'weapon', 'rare', 1260, '/images/items/weapon_dagger_rare.svg', '{"fr":"Dague d’acier","en":"Steel dagger","es":"Daga de acero","zh":"钢匕首"}'::jsonb, 16, true, false, 256)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_axe_rare', 'weapon', 'rare', 1260, '/images/items/weapon_axe_rare.svg', '{"fr":"Hache de foudre","en":"Thunder axe","es":"Hacha de trueno","zh":"雷电斧头"}'::jsonb, 16, true, false, 257)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_spear_rare', 'weapon', 'rare', 1260, '/images/items/weapon_spear_rare.svg', '{"fr":"Lance d’étoile","en":"Star spear","es":"Lanza de estrella","zh":"星星长矛"}'::jsonb, 16, true, false, 258)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_bow_rare', 'weapon', 'rare', 1260, '/images/items/weapon_bow_rare.svg', '{"fr":"Arc d’acier","en":"Steel bow","es":"Arco de acero","zh":"钢弓"}'::jsonb, 16, true, false, 259)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_whip_rare', 'weapon', 'rare', 1260, '/images/items/weapon_whip_rare.svg', '{"fr":"Fouet de foudre","en":"Thunder whip","es":"Látigo de trueno","zh":"雷电鞭子"}'::jsonb, 16, true, false, 260)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_halberd_rare', 'weapon', 'rare', 1260, '/images/items/weapon_halberd_rare.svg', '{"fr":"Hallebarde d’étoile","en":"Star halberd","es":"Alabarda de estrella","zh":"星星戟"}'::jsonb, 17, true, false, 261)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_rapier_rare', 'weapon', 'rare', 1260, '/images/items/weapon_rapier_rare.svg', '{"fr":"Rapière d’acier","en":"Steel rapier","es":"Estoque de acero","zh":"钢细剑"}'::jsonb, 17, true, false, 262)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_dagger_epic', 'weapon', 'epic', 3780, '/images/items/weapon_dagger_epic.svg', '{"fr":"Dague d’argent","en":"Silver dagger","es":"Daga de plata","zh":"银匕首"}'::jsonb, 20, true, false, 263)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_axe_epic', 'weapon', 'epic', 3780, '/images/items/weapon_axe_epic.svg', '{"fr":"Hache de givre","en":"Frost axe","es":"Hacha de escarcha","zh":"寒霜斧头"}'::jsonb, 20, true, false, 264)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_spear_epic', 'weapon', 'epic', 3780, '/images/items/weapon_spear_epic.svg', '{"fr":"Lance de nébuleuse","en":"Nebula spear","es":"Lanza de nebulosa","zh":"星云长矛"}'::jsonb, 20, true, false, 265)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_bow_epic', 'weapon', 'epic', 3780, '/images/items/weapon_bow_epic.svg', '{"fr":"Arc d’argent","en":"Silver bow","es":"Arco de plata","zh":"银弓"}'::jsonb, 21, true, false, 266)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_whip_epic', 'weapon', 'epic', 3780, '/images/items/weapon_whip_epic.svg', '{"fr":"Fouet de givre","en":"Frost whip","es":"Látigo de escarcha","zh":"寒霜鞭子"}'::jsonb, 21, true, false, 267)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_dagger_legendary', 'weapon', 'legendary', 11200, '/images/items/weapon_dagger_legendary.svg', '{"fr":"Dague de mithril","en":"Mithril dagger","es":"Daga de mithril","zh":"秘银匕首"}'::jsonb, 25, true, false, 268)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_axe_legendary', 'weapon', 'legendary', 11200, '/images/items/weapon_axe_legendary.svg', '{"fr":"Hache de tempête","en":"Storm axe","es":"Hacha de tormenta","zh":"风暴斧头"}'::jsonb, 26, true, false, 269)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('weapon_dagger_mythic', 'weapon', 'mythic', 45000, '/images/items/weapon_dagger_mythic.svg', '{"fr":"Dague de dragon","en":"Dragon dagger","es":"Daga de dragón","zh":"龙匕首"}'::jsonb, 26, true, false, 270)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beret_common', 'hat', 'common', 150, '/images/items/hat_beret_common.svg', '{"fr":"Béret de bois","en":"Wood beret","es":"Boina de madera","zh":"木贝雷帽"}'::jsonb, 8, true, false, 271)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_hood_common', 'hat', 'common', 150, '/images/items/hat_hood_common.svg', '{"fr":"Capuche de poussière","en":"Dust hood","es":"Capucha de polvo","zh":"尘埃兜帽"}'::jsonb, 8, true, false, 272)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_turban_common', 'hat', 'common', 150, '/images/items/hat_turban_common.svg', '{"fr":"Turban d’étincelle","en":"Spark turban","es":"Turbante de chispa","zh":"火花缠头巾"}'::jsonb, 8, true, false, 273)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_tiara_common', 'hat', 'common', 150, '/images/items/hat_tiara_common.svg', '{"fr":"Diadème de bois","en":"Wood tiara","es":"Diadema de madera","zh":"木头冠"}'::jsonb, 8, true, false, 274)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helm_common', 'hat', 'common', 150, '/images/items/hat_helm_common.svg', '{"fr":"Heaume de poussière","en":"Dust helm","es":"Yelmo de polvo","zh":"尘埃盔"}'::jsonb, 9, true, false, 275)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_visor_common', 'hat', 'common', 150, '/images/items/hat_visor_common.svg', '{"fr":"Visière d’étincelle","en":"Spark visor","es":"Visera de chispa","zh":"火花护目镜"}'::jsonb, 9, true, false, 276)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_headdress_common', 'hat', 'common', 150, '/images/items/hat_headdress_common.svg', '{"fr":"Coiffe de bois","en":"Wood headdress","es":"Tocado de madera","zh":"木头饰"}'::jsonb, 9, true, false, 277)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helmet_common', 'hat', 'common', 150, '/images/items/hat_helmet_common.svg', '{"fr":"Casque de poussière","en":"Dust helmet","es":"Casco de polvo","zh":"尘埃头盔"}'::jsonb, 9, true, false, 278)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_fez_common', 'hat', 'common', 150, '/images/items/hat_fez_common.svg', '{"fr":"Fez d’étincelle","en":"Spark fez","es":"Fez de chispa","zh":"火花土耳其帽"}'::jsonb, 9, true, false, 279)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_balaclava_common', 'hat', 'common', 150, '/images/items/hat_balaclava_common.svg', '{"fr":"Cagoule de bois","en":"Wood balaclava","es":"Pasamontañas de madera","zh":"木巴拉克拉法帽"}'::jsonb, 9, true, false, 280)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_bowler_hat_common', 'hat', 'common', 150, '/images/items/hat_bowler_hat_common.svg', '{"fr":"Chapeau melon de poussière","en":"Dust bowler hat","es":"Bombín de polvo","zh":"尘埃圆顶礼帽"}'::jsonb, 9, true, false, 281)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beret_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_beret_uncommon.svg', '{"fr":"Béret de bronze","en":"Bronze beret","es":"Boina de bronce","zh":"青铜贝雷帽"}'::jsonb, 12, true, false, 282)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_hood_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_hood_uncommon.svg', '{"fr":"Capuche de comète","en":"Comet hood","es":"Capucha de cometa","zh":"彗星兜帽"}'::jsonb, 12, true, false, 283)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_turban_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_turban_uncommon.svg', '{"fr":"Turban de flamme","en":"Flame turban","es":"Turbante de llama","zh":"火焰缠头巾"}'::jsonb, 12, true, false, 284)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_tiara_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_tiara_uncommon.svg', '{"fr":"Diadème de bronze","en":"Bronze tiara","es":"Diadema de bronce","zh":"青铜头冠"}'::jsonb, 12, true, false, 285)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helm_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_helm_uncommon.svg', '{"fr":"Heaume de comète","en":"Comet helm","es":"Yelmo de cometa","zh":"彗星盔"}'::jsonb, 12, true, false, 286)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_visor_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_visor_uncommon.svg', '{"fr":"Visière de flamme","en":"Flame visor","es":"Visera de llama","zh":"火焰护目镜"}'::jsonb, 13, true, false, 287)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_headdress_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_headdress_uncommon.svg', '{"fr":"Coiffe de bronze","en":"Bronze headdress","es":"Tocado de bronce","zh":"青铜头饰"}'::jsonb, 13, true, false, 288)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helmet_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_helmet_uncommon.svg', '{"fr":"Casque de comète","en":"Comet helmet","es":"Casco de cometa","zh":"彗星头盔"}'::jsonb, 13, true, false, 289)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_fez_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_fez_uncommon.svg', '{"fr":"Fez de flamme","en":"Flame fez","es":"Fez de llama","zh":"火焰土耳其帽"}'::jsonb, 13, true, false, 290)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_balaclava_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_balaclava_uncommon.svg', '{"fr":"Cagoule de bronze","en":"Bronze balaclava","es":"Pasamontañas de bronce","zh":"青铜巴拉克拉法帽"}'::jsonb, 13, true, false, 291)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_bowler_hat_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_bowler_hat_uncommon.svg', '{"fr":"Chapeau melon de comète","en":"Comet bowler hat","es":"Bombín de cometa","zh":"彗星圆顶礼帽"}'::jsonb, 13, true, false, 292)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_sombrero_uncommon', 'hat', 'uncommon', 490, '/images/items/hat_sombrero_uncommon.svg', '{"fr":"Sombrero de flamme","en":"Flame sombrero","es":"Sombrero de llama","zh":"火焰宽边帽"}'::jsonb, 13, true, false, 293)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beret_rare', 'hat', 'rare', 1260, '/images/items/hat_beret_rare.svg', '{"fr":"Béret d’acier","en":"Steel beret","es":"Boina de acero","zh":"钢贝雷帽"}'::jsonb, 17, true, false, 294)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_hood_rare', 'hat', 'rare', 1260, '/images/items/hat_hood_rare.svg', '{"fr":"Capuche d’étoile","en":"Star hood","es":"Capucha de estrella","zh":"星星兜帽"}'::jsonb, 17, true, false, 295)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_turban_rare', 'hat', 'rare', 1260, '/images/items/hat_turban_rare.svg', '{"fr":"Turban de foudre","en":"Thunder turban","es":"Turbante de trueno","zh":"雷电缠头巾"}'::jsonb, 17, true, false, 296)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_tiara_rare', 'hat', 'rare', 1260, '/images/items/hat_tiara_rare.svg', '{"fr":"Diadème d’acier","en":"Steel tiara","es":"Diadema de acero","zh":"钢头冠"}'::jsonb, 18, true, false, 297)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helm_rare', 'hat', 'rare', 1260, '/images/items/hat_helm_rare.svg', '{"fr":"Heaume d’étoile","en":"Star helm","es":"Yelmo de estrella","zh":"星星盔"}'::jsonb, 18, true, false, 298)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_visor_rare', 'hat', 'rare', 1260, '/images/items/hat_visor_rare.svg', '{"fr":"Visière de foudre","en":"Thunder visor","es":"Visera de trueno","zh":"雷电护目镜"}'::jsonb, 18, true, false, 299)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_headdress_rare', 'hat', 'rare', 1260, '/images/items/hat_headdress_rare.svg', '{"fr":"Coiffe d’acier","en":"Steel headdress","es":"Tocado de acero","zh":"钢头饰"}'::jsonb, 18, true, false, 300)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helmet_rare', 'hat', 'rare', 1260, '/images/items/hat_helmet_rare.svg', '{"fr":"Casque d’étoile","en":"Star helmet","es":"Casco de estrella","zh":"星星头盔"}'::jsonb, 18, true, false, 301)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beret_epic', 'hat', 'epic', 3780, '/images/items/hat_beret_epic.svg', '{"fr":"Béret d’argent","en":"Silver beret","es":"Boina de plata","zh":"银贝雷帽"}'::jsonb, 21, true, false, 302)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_hood_epic', 'hat', 'epic', 3780, '/images/items/hat_hood_epic.svg', '{"fr":"Capuche de nébuleuse","en":"Nebula hood","es":"Capucha de nebulosa","zh":"星云兜帽"}'::jsonb, 21, true, false, 303)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_turban_epic', 'hat', 'epic', 3780, '/images/items/hat_turban_epic.svg', '{"fr":"Turban de givre","en":"Frost turban","es":"Turbante de escarcha","zh":"寒霜缠头巾"}'::jsonb, 22, true, false, 304)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_tiara_epic', 'hat', 'epic', 3780, '/images/items/hat_tiara_epic.svg', '{"fr":"Diadème d’argent","en":"Silver tiara","es":"Diadema de plata","zh":"银头冠"}'::jsonb, 22, true, false, 305)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_helm_epic', 'hat', 'epic', 3780, '/images/items/hat_helm_epic.svg', '{"fr":"Heaume de nébuleuse","en":"Nebula helm","es":"Yelmo de nebulosa","zh":"星云盔"}'::jsonb, 22, true, false, 306)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_visor_epic', 'hat', 'epic', 3780, '/images/items/hat_visor_epic.svg', '{"fr":"Visière de givre","en":"Frost visor","es":"Visera de escarcha","zh":"寒霜护目镜"}'::jsonb, 22, true, false, 307)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beret_legendary', 'hat', 'legendary', 11200, '/images/items/hat_beret_legendary.svg', '{"fr":"Béret de mithril","en":"Mithril beret","es":"Boina de mithril","zh":"秘银贝雷帽"}'::jsonb, 26, true, false, 308)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_hood_legendary', 'hat', 'legendary', 16000, '/images/items/hat_hood_legendary.svg', '{"fr":"Capuche de galaxie","en":"Galaxy hood","es":"Capucha de galaxia","zh":"银河兜帽"}'::jsonb, 27, true, false, 309)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_beret_mythic', 'hat', 'mythic', 63000, '/images/items/hat_beret_mythic.svg', '{"fr":"Béret de dragon","en":"Dragon beret","es":"Boina de dragón","zh":"龙贝雷帽"}'::jsonb, 27, true, false, 310)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('hat_hood_mythic', 'hat', 'mythic', 63000, '/images/items/hat_hood_mythic.svg', '{"fr":"Capuche d’univers","en":"Universe hood","es":"Capucha de universo","zh":"宇宙兜帽"}'::jsonb, 28, true, false, 311)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_fox_common', 'pet', 'common', 150, '/images/items/pet_fox_common.svg', '{"fr":"Renard d’étincelle","en":"Spark fox","es":"Zorro de chispa","zh":"火花狐狸"}'::jsonb, 9, true, false, 312)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_wolf_common', 'pet', 'common', 150, '/images/items/pet_wolf_common.svg', '{"fr":"Loup de poussière","en":"Dust wolf","es":"Lobo de polvo","zh":"尘埃狼"}'::jsonb, 9, true, false, 313)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_bear_common', 'pet', 'common', 150, '/images/items/pet_bear_common.svg', '{"fr":"Ours de biscuit","en":"Cookie bear","es":"Oso de galleta","zh":"饼干熊"}'::jsonb, 9, true, false, 314)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_rabbit_common', 'pet', 'common', 150, '/images/items/pet_rabbit_common.svg', '{"fr":"Lapin d’étincelle","en":"Spark rabbit","es":"Conejo de chispa","zh":"火花兔子"}'::jsonb, 9, true, false, 315)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_dog_common', 'pet', 'common', 150, '/images/items/pet_dog_common.svg', '{"fr":"Chien de poussière","en":"Dust dog","es":"Perro de polvo","zh":"尘埃狗"}'::jsonb, 9, true, false, 316)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_tiger_common', 'pet', 'common', 150, '/images/items/pet_tiger_common.svg', '{"fr":"Tigre de biscuit","en":"Cookie tiger","es":"Tigre de galleta","zh":"饼干老虎"}'::jsonb, 10, true, false, 317)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_panda_common', 'pet', 'common', 150, '/images/items/pet_panda_common.svg', '{"fr":"Panda d’étincelle","en":"Spark panda","es":"Panda de chispa","zh":"火花熊猫"}'::jsonb, 10, true, false, 318)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_koala_common', 'pet', 'common', 150, '/images/items/pet_koala_common.svg', '{"fr":"Koala de poussière","en":"Dust koala","es":"Koala de polvo","zh":"尘埃考拉"}'::jsonb, 10, true, false, 319)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_hedgehog_common', 'pet', 'common', 150, '/images/items/pet_hedgehog_common.svg', '{"fr":"Hérisson de biscuit","en":"Cookie hedgehog","es":"Erizo de galleta","zh":"饼干刺猬"}'::jsonb, 10, true, false, 320)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_squirrel_common', 'pet', 'common', 150, '/images/items/pet_squirrel_common.svg', '{"fr":"Écureuil d’étincelle","en":"Spark squirrel","es":"Ardilla de chispa","zh":"火花松鼠"}'::jsonb, 10, true, false, 321)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_falcon_common', 'pet', 'common', 150, '/images/items/pet_falcon_common.svg', '{"fr":"Faucon de poussière","en":"Dust falcon","es":"Halcón de polvo","zh":"尘埃猎鹰"}'::jsonb, 10, true, false, 322)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_fox_uncommon', 'pet', 'uncommon', 490, '/images/items/pet_fox_uncommon.svg', '{"fr":"Renard de flamme","en":"Flame fox","es":"Zorro de llama","zh":"火焰狐狸"}'::jsonb, 13, true, false, 323)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_wolf_uncommon', 'pet', 'uncommon', 490, '/images/items/pet_wolf_uncommon.svg', '{"fr":"Loup de comète","en":"Comet wolf","es":"Lobo de cometa","zh":"彗星狼"}'::jsonb, 14, true, false, 324)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_bear_uncommon', 'pet', 'uncommon', 490, '/images/items/pet_bear_uncommon.svg', '{"fr":"Ours de caramel","en":"Caramel bear","es":"Oso de caramelo","zh":"焦糖熊"}'::jsonb, 14, true, false, 325)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_rabbit_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_rabbit_uncommon.svg', '{"fr":"Lapin de flamme","en":"Flame rabbit","es":"Conejo de llama","zh":"火焰兔子"}'::jsonb, 14, true, false, 326)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_dog_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_dog_uncommon.svg', '{"fr":"Chien de comète","en":"Comet dog","es":"Perro de cometa","zh":"彗星狗"}'::jsonb, 14, true, false, 327)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_tiger_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_tiger_uncommon.svg', '{"fr":"Tigre de caramel","en":"Caramel tiger","es":"Tigre de caramelo","zh":"焦糖老虎"}'::jsonb, 14, true, false, 328)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_panda_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_panda_uncommon.svg', '{"fr":"Panda de flamme","en":"Flame panda","es":"Panda de llama","zh":"火焰熊猫"}'::jsonb, 14, true, false, 329)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_koala_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_koala_uncommon.svg', '{"fr":"Koala de comète","en":"Comet koala","es":"Koala de cometa","zh":"彗星考拉"}'::jsonb, 14, true, false, 330)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_hedgehog_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_hedgehog_uncommon.svg', '{"fr":"Hérisson de caramel","en":"Caramel hedgehog","es":"Erizo de caramelo","zh":"焦糖刺猬"}'::jsonb, 15, true, false, 331)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_squirrel_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_squirrel_uncommon.svg', '{"fr":"Écureuil de flamme","en":"Flame squirrel","es":"Ardilla de llama","zh":"火焰松鼠"}'::jsonb, 15, true, false, 332)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_falcon_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_falcon_uncommon.svg', '{"fr":"Faucon de comète","en":"Comet falcon","es":"Halcón de cometa","zh":"彗星猎鹰"}'::jsonb, 15, true, false, 333)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_turtle_uncommon', 'pet', 'uncommon', 700, '/images/items/pet_turtle_uncommon.svg', '{"fr":"Tortue de caramel","en":"Caramel turtle","es":"Tortuga de caramelo","zh":"焦糖乌龟"}'::jsonb, 15, true, false, 334)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_fox_rare', 'pet', 'rare', 1800, '/images/items/pet_fox_rare.svg', '{"fr":"Renard de foudre","en":"Thunder fox","es":"Zorro de trueno","zh":"雷电狐狸"}'::jsonb, 19, true, false, 335)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_wolf_rare', 'pet', 'rare', 1800, '/images/items/pet_wolf_rare.svg', '{"fr":"Loup d’étoile","en":"Star wolf","es":"Lobo de estrella","zh":"星星狼"}'::jsonb, 19, true, false, 336)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_bear_rare', 'pet', 'rare', 1800, '/images/items/pet_bear_rare.svg', '{"fr":"Ours de guimauve","en":"Marshmallow bear","es":"Oso de malvavisco","zh":"棉花糖熊"}'::jsonb, 19, true, false, 337)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_rabbit_rare', 'pet', 'rare', 1800, '/images/items/pet_rabbit_rare.svg', '{"fr":"Lapin de foudre","en":"Thunder rabbit","es":"Conejo de trueno","zh":"雷电兔子"}'::jsonb, 19, true, false, 338)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_dog_rare', 'pet', 'rare', 1800, '/images/items/pet_dog_rare.svg', '{"fr":"Chien d’étoile","en":"Star dog","es":"Perro de estrella","zh":"星星狗"}'::jsonb, 19, true, false, 339)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_tiger_rare', 'pet', 'rare', 1800, '/images/items/pet_tiger_rare.svg', '{"fr":"Tigre de guimauve","en":"Marshmallow tiger","es":"Tigre de malvavisco","zh":"棉花糖老虎"}'::jsonb, 20, true, false, 340)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_panda_rare', 'pet', 'rare', 1800, '/images/items/pet_panda_rare.svg', '{"fr":"Panda de foudre","en":"Thunder panda","es":"Panda de trueno","zh":"雷电熊猫"}'::jsonb, 20, true, false, 341)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_koala_rare', 'pet', 'rare', 1800, '/images/items/pet_koala_rare.svg', '{"fr":"Koala d’étoile","en":"Star koala","es":"Koala de estrella","zh":"星星考拉"}'::jsonb, 20, true, false, 342)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_fox_epic', 'pet', 'epic', 5400, '/images/items/pet_fox_epic.svg', '{"fr":"Renard de givre","en":"Frost fox","es":"Zorro de escarcha","zh":"寒霜狐狸"}'::jsonb, 23, true, false, 343)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_wolf_epic', 'pet', 'epic', 5400, '/images/items/pet_wolf_epic.svg', '{"fr":"Loup de nébuleuse","en":"Nebula wolf","es":"Lobo de nebulosa","zh":"星云狼"}'::jsonb, 23, true, false, 344)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_bear_epic', 'pet', 'epic', 5400, '/images/items/pet_bear_epic.svg', '{"fr":"Ours de chocolat","en":"Chocolate bear","es":"Oso de chocolate","zh":"巧克力熊"}'::jsonb, 23, true, false, 345)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_rabbit_epic', 'pet', 'epic', 5400, '/images/items/pet_rabbit_epic.svg', '{"fr":"Lapin de givre","en":"Frost rabbit","es":"Conejo de escarcha","zh":"寒霜兔子"}'::jsonb, 23, true, false, 346)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_dog_epic', 'pet', 'epic', 5400, '/images/items/pet_dog_epic.svg', '{"fr":"Chien de nébuleuse","en":"Nebula dog","es":"Perro de nebulosa","zh":"星云狗"}'::jsonb, 24, true, false, 347)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_tiger_epic', 'pet', 'epic', 5400, '/images/items/pet_tiger_epic.svg', '{"fr":"Tigre de chocolat","en":"Chocolate tiger","es":"Tigre de chocolate","zh":"巧克力老虎"}'::jsonb, 24, true, false, 348)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_fox_legendary', 'pet', 'legendary', 16000, '/images/items/pet_fox_legendary.svg', '{"fr":"Renard de tempête","en":"Storm fox","es":"Zorro de tormenta","zh":"风暴狐狸"}'::jsonb, 27, true, false, 349)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_wolf_legendary', 'pet', 'legendary', 16000, '/images/items/pet_wolf_legendary.svg', '{"fr":"Loup de galaxie","en":"Galaxy wolf","es":"Lobo de galaxia","zh":"银河狼"}'::jsonb, 28, true, false, 350)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_fox_mythic', 'pet', 'mythic', 63000, '/images/items/pet_fox_mythic.svg', '{"fr":"Renard de phénix","en":"Phoenix fox","es":"Zorro de fénix","zh":"凤凰狐狸"}'::jsonb, 29, true, false, 351)
ON CONFLICT (code) DO NOTHING;
INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES ('pet_wolf_mythic', 'pet', 'mythic', 90000, '/images/items/pet_wolf_mythic.svg', '{"fr":"Loup d’univers","en":"Universe wolf","es":"Lobo de universo","zh":"宇宙狼"}'::jsonb, 30, true, false, 352)
ON CONFLICT (code) DO NOTHING;

-- END GENERATED ITEMS SEED
