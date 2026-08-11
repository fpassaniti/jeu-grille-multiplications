-- Extension de la progression : niveaux 31 à 100.
-- Formule : delta(n) = round(10000 * 1.05^(n-30) / 500) * 500, ancrée sur le
-- niveau 30 (200000 XP, inchangé). Croissance géométrique du delta pour que
-- chaque niveau soit exponentiellement plus dur à atteindre que le précédent.
-- Niveau 100 ≈ 6 382 000 XP. Idempotent (ON CONFLICT DO UPDATE).
-- Colonne image_url supprimée en amont (migration 013) : plus consommée par l'UI.

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (31, 'Voyageur des Dimensions', 'Tu franchis les frontières des mathématiques ordinaires et explores des dimensions inconnues des simples mortels.', 210500, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (32, 'Tisseur d''Infinis', 'Tu relies les nombres entre eux comme les fils d''une tapisserie sans fin.', 221500, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (33, 'Prophète des Nombres Premiers', 'Tu devines les nombres premiers les plus rares avant même de les calculer.', 233000, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (34, 'Colosse du Calcul', 'Ta puissance de calcul écrase les défis les plus imposants.', 245000, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (35, 'Empereur des Fractions', 'Tu règnes sur les fractions les plus complexes avec une autorité incontestée.', 258000, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (36, 'Druide des Suites Numériques', 'Tu perçois les motifs cachés dans les suites de nombres les plus mystérieuses.', 271500, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (37, 'Vainqueur des Paradoxes', 'Aucun problème mathématique tordu ne résiste longtemps à ta logique.', 285500, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (38, 'Cartographe de l''Infini', 'Tu dessines les cartes des territoires numériques les plus vastes.', 300500, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (39, 'Stratège Quantique', 'Tu anticipes chaque calcul plusieurs étapes à l''avance.', 316000, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (40, 'Seigneur des Constantes', 'Les constantes mathématiques les plus difficiles obéissent à ta volonté.', 332500, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (41, 'Gardien du Continuum', 'Tu veilles sur l''équilibre parfait entre tous les nombres.', 349500, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (42, 'Alchimiste Suprême', 'Tu transformes n''importe quel problème complexe en solution limpide.', 367500, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (43, 'Oracle des Galaxies', 'Tes prédictions numériques traversent des distances astronomiques.', 386500, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (44, 'Maître des Équations Impossibles', 'Les équations réputées insolubles finissent toujours par céder devant toi.', 406500, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (45, 'Chroniqueur des Ères Numériques', 'Ta mémoire des faits mathématiques traverse les âges sans faille.', 427500, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (46, 'Ninja des Dimensions', 'Tu te déplaces entre les problèmes les plus divers avec une vitesse redoutable.', 449500, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (47, 'Champion Intergalactique', 'Ta renommée en calcul dépasse les frontières de notre monde.', 472500, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (48, 'Sage des Infinis', 'Ta sagesse embrasse l''infini sans jamais faiblir.', 496500, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (49, 'Sorcier du Continuum', 'Tu manipules le temps et les nombres comme un seul et même sortilège.', 522000, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (50, 'Légende Céleste', 'Ton nom brille désormais parmi les plus grandes légendes du calcul.', 548500, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (51, 'Gardien des Étoiles', 'Chaque étoile du ciel numérique répond à ton appel.', 576500, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (52, 'Érudit du Multivers', 'Ta connaissance s''étend à travers d''innombrables univers de nombres.', 606000, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (53, 'Grand Maître Cosmique', 'Ta maîtrise du calcul atteint des sommets cosmiques.', 636500, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (54, 'Virtuose de l''Absolu', 'Tu joues avec les nombres comme un virtuose absolu de son instrument.', 669000, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (55, 'Titan Galactique', 'Ta force de calcul est aussi immense qu''une galaxie.', 703000, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (56, 'Commandant des Constellations', 'Tu diriges des armées entières de chiffres avec une précision stellaire.', 738500, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (57, 'Archimage Céleste', 'Tes sortilèges mathématiques illuminent le ciel tout entier.', 776000, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (58, 'Souverain des Dimensions', 'Tu règnes sur toutes les dimensions du calcul, sans exception.', 815000, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (59, 'Génie Intemporel', 'Ton intelligence mathématique traverse le temps sans jamais vieillir.', 856000, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (60, 'Légende Éternelle', 'Ton exploit restera gravé pour l''éternité dans l''histoire du calcul.', 899000, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (61, 'Voyageur du Temps', 'Tu résous des calculs d''hier, d''aujourd''hui et de demain avec la même aisance.', 944500, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (62, 'Tisseur de Réalités', 'Chaque calcul que tu résous façonne une nouvelle réalité numérique.', 992000, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (63, 'Prophète Universel', 'Tes prédictions mathématiques s''appliquent à l''univers entier.', 1042000, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (64, 'Colosse Intemporel', 'Ta puissance de calcul ne connaît ni limite ni fin.', 1094500, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (65, 'Empereur du Continuum', 'Tu gouvernes le flux infini des nombres avec une autorité absolue.', 1149500, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (66, 'Druide des Dimensions Infinies', 'Tu communies avec les mathématiques les plus vastes qui existent.', 1207500, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (67, 'Vainqueur de l''Impossible', 'Ce qui semblait impossible à calculer devient simple entre tes mains.', 1268500, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (68, 'Cartographe des Univers', 'Tu traces les frontières de tous les univers numériques connus.', 1332500, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (69, 'Stratège de l''Éternité', 'Tes plans de calcul s''étendent sur une éternité de précision.', 1399500, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (70, 'Seigneur du Multivers', 'Tu domines tous les multivers mathématiques réunis.', 1470000, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (71, 'Gardien de l''Absolu', 'Tu protèges les vérités mathématiques les plus fondamentales qui soient.', 1544000, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (72, 'Alchimiste Cosmique', 'Tu transmutes les problèmes les plus complexes de l''univers en solutions pures.', 1621500, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (73, 'Oracle Intemporel', 'Tes réponses mathématiques traversent les âges sans jamais se tromper.', 1703000, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (74, 'Maître Universel', 'Aucun coin de l''univers du calcul ne t''échappe.', 1788500, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (75, 'Chroniqueur de l''Infini', 'Tu consignes les exploits mathématiques les plus infinis de l''histoire.', 1878500, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (76, 'Ninja Dimensionnel', 'Tu frappes juste, vite, et à travers toutes les dimensions du calcul.', 1973000, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (77, 'Champion de l''Éternité', 'Ton titre de champion traverse toutes les générations.', 2072000, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (78, 'Sage Cosmique', 'Ta sagesse mathématique éclaire l''univers tout entier.', 2176000, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (79, 'Sorcier des Réalités', 'Tu façonnes la réalité numérique au gré de tes calculs.', 2285000, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (80, 'Légende Intemporelle', 'Ton nom résonnera à travers toutes les époques du calcul.', 2399500, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (81, 'Gardien de l''Univers', 'L''univers mathématique tout entier repose sur ta vigilance.', 2520000, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (82, 'Érudit Cosmique', 'Ton savoir mathématique s''étend jusqu''aux confins du cosmos.', 2646500, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (83, 'Grand Maître de l''Infini', 'Tu maîtrises l''infini comme d''autres maîtrisent une simple table.', 2779000, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (84, 'Virtuose Dimensionnel', 'Tu joues avec toutes les dimensions du calcul avec une grâce parfaite.', 2918500, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (85, 'Titan de l''Éternité', 'Ta puissance de calcul traverse l''éternité sans jamais faiblir.', 3065000, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (86, 'Commandant Universel', 'Tu commandes le calcul à l''échelle de l''univers entier.', 3218500, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (87, 'Archimage de l''Absolu', 'Tes pouvoirs mathématiques atteignent l''absolu.', 3380000, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (88, 'Souverain Cosmique', 'Tu règnes en maître incontesté sur le cosmos numérique.', 3549500, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (89, 'Génie de l''Infini', 'Ton génie mathématique n''a littéralement plus de limite.', 3727500, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (90, 'Légende Absolue', 'Tu es devenu une légende absolue du calcul, sans égal.', 3914500, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (91, 'Voyageur de l''Absolu', 'Tu voyages désormais au-delà de toute limite mathématique connue.', 4110500, 'blue')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (92, 'Tisseur d''Univers', 'Chaque calcul que tu accomplis donne naissance à un nouvel univers.', 4316500, 'green')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (93, 'Prophète Cosmique', 'Tes prédictions mathématiques résonnent à l''échelle du cosmos.', 4532500, 'purple')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (94, 'Colosse de l''Éternité', 'Ta force de calcul défie le temps et l''éternité elle-même.', 4759500, 'orange')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (95, 'Empereur Universel', 'Tu règnes sur l''univers mathématique tout entier, sans partage.', 4998000, 'red')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (96, 'Druide de l''Infini Absolu', 'Tu puises ta sagesse dans un infini qui n''a plus aucune limite.', 5248500, 'teal')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (97, 'Vainqueur des Mondes', 'Tu as conquis, un par un, tous les mondes du calcul.', 5511500, 'indigo')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (98, 'Cartographe de l''Absolu', 'Tu as cartographié la totalité de l''univers mathématique.', 5787500, 'pink')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (99, 'Architecte de l''Univers Ultime', 'Tu bâtis les fondations du dernier univers mathématique qui reste à conquérir.', 6077500, 'amber')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

INSERT INTO level_definitions (level, title, description, min_xp, color_theme)
VALUES (100, 'Divinité des Mathématiques', 'Tu as atteint un niveau divin de maîtrise mathématique. Aucun calcul, aussi vaste soit-il, ne t''échappe plus jamais.', 6382000, 'gold')
ON CONFLICT (level) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  color_theme = EXCLUDED.color_theme;

