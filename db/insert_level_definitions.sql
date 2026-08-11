-- Seed des 30 niveaux de progression — extrait de la base de production Neon
-- (square-water-55208846) le 2026-07-18. Résout la dette #1 (SPEC.md §3) :
-- le fichier précédent ne versionnait que 10 niveaux alors que la prod en a 30.
-- Idempotent (ON CONFLICT DO UPDATE).

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (1, 'Explorateur des Nombres', 'Tu as commencé ton voyage dans le monde des mathématiques. Une aventure passionnante t''attend!', 0, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (2, 'Apprenti Calculateur', 'Tu maîtrises maintenant les bases du calcul. Continue à t''entraîner!', 1000, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (3, 'Chasseur de Solutions', 'Tu sais repérer et résoudre rapidement les multiplications. Bravo!', 2200, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (4, 'Éclaireur des Tables', 'Tu explores avec aisance les tables de multiplication.', 3600, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (5, 'Rêveur Numérique', 'Tu imagines des connexions entre les nombres et trouves des solutions créatives.', 5200, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (6, 'Gardien des Multiplications', 'Tu protèges et préserves la connaissance des multiplications.', 7000, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (7, 'Aventurier du Calcul', 'Tu t''aventures maintenant dans des calculs plus complexes.', 10250, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (8, 'Mage des Chiffres', 'Tu manipules les nombres avec une habileté presque magique.', 13500, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (9, 'Chevalier des Tables', 'Tu défends vaillamment ta maîtrise des tables face à tous les défis.', 16750, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (10, 'Alchimiste des Formules', 'Tu transformes des problèmes complexes en solutions élégantes.', 20000, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (11, 'Architecte Mathématique', 'Tu construis des fondations mathématiques solides pour ta réussite future.', 24000, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (12, 'Dompteur d''Équations', 'Les multiplications les plus difficiles n''ont plus de secrets pour toi.', 28000, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (13, 'Maître des Tables', 'Ta maîtrise des tables de multiplication est exemplaire.', 32000, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (14, 'Chroniqueur des Nombres', 'Tu enregistres et te souviens des faits mathématiques avec précision.', 42000, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (15, 'Oracle des Solutions', 'Tu prédis les résultats des calculs avant même de les terminer.', 50000, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (16, 'Ninja Mathématique', 'Ta rapidité et ta précision sont impressionnantes.', 58750, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (17, 'Champion des Calculs', 'Tu excelles dans l''arène des défis mathématiques.', 67500, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (18, 'Sage des Multiplications', 'Ta sagesse mathématique inspire les autres.', 76250, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (19, 'Sorcier des Algorithmes', 'Tu comprends les logiques cachées des opérations mathématiques.', 95000, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (20, 'Légende des Nombres', 'Tes exploits de calcul font de toi une véritable légende.', 100000, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (21, 'Gardien des Théorèmes', 'Tu protèges et appliques les principes mathématiques fondamentaux.', 110000, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (22, 'Érudit des Tables', 'Ta connaissance approfondie dépasse la simple mémorisation.', 120000, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (23, 'Grand Maître Calculateur', 'Tu as atteint un niveau d''excellence rare en calcul mental.', 130000, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (24, 'Virtuose des Équations', 'Tu jonglais avec les nombres avec l''aisance d''un virtuose.', 135000, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (25, 'Titan des Multiplications', 'Ta puissance de calcul est impressionnante et fiable.', 150000, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (26, 'Commandant de la Logique', 'Tu diriges tes pensées mathématiques avec stratégie et précision.', 160000, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (27, 'Archimage Numérique', 'Tu maîtrises les aspects les plus profonds du calcul.', 170000, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (28, 'Souverain des Mathématiques', 'Tu règnes sur le royaume des nombres avec bienveillance.', 180000, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (29, 'Génie Universel', 'Ton intelligence mathématique s''étend à tous les domaines.', 190000, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (30, 'Légende du Multivers', 'Ta maîtrise mathématique transcende les limites ordinaires. Tu es un exemple pour tous!', 200000, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;
