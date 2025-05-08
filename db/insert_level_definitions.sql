-- Insertion des données de niveau
INSERT INTO level_definitions (level, title, description, min_xp, image_url, color_theme) VALUES
(1, 'Explorateur des Nombres', 'Tu commences ton voyage mathématique. Résous des opérations simples pour progresser.', 0, NULL, 'blue'),
(2, 'Apprenti Calculateur', 'Tu maîtrises les bases du calcul. Continue pour améliorer ta rapidité.', 1000, NULL, 'green'),
(3, 'Mathématicien Amateur', 'Tu es maintenant capable de résoudre des problèmes plus complexes.', 3000, NULL, 'purple'),
(4, 'Expert en Multiplication', 'Tu maîtrises les multiplications à grande vitesse.', 6000, NULL, 'orange'),
(5, 'Maître des Tables', 'Tu connais toutes les tables de multiplication sur le bout des doigts.', 10000, NULL, 'red'),
(6, 'Génie Mathématique', 'Tes compétences en mathématiques sont impressionnantes!', 15000, NULL, 'teal'),
(7, 'Calculateur Suprême', 'Tu calcules plus vite qu''une calculatrice!', 21000, NULL, 'indigo'),
(8, 'Champion des Chiffres', 'Tu as atteint un niveau exceptionnel. Ton cerveau est une machine à calculer.', 28000, NULL, 'pink'),
(9, 'Prodige Numérique', 'Tes compétences en calcul mental sont légendaires.', 36000, NULL, 'amber'),
(10, 'Virtuose Mathématique', 'Tu as atteint le sommet. Tu es maintenant un virtuose des mathématiques!', 45000, NULL, 'gold')
ON CONFLICT (level) DO UPDATE 
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp,
  image_url = EXCLUDED.image_url,
  color_theme = EXCLUDED.color_theme;