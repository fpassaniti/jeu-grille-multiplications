-- Création de la table level_definitions
CREATE TABLE IF NOT EXISTS level_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  min_xp INTEGER NOT NULL,
  rewards JSON DEFAULT '[]',
  
  -- Contraintes
  CONSTRAINT level_positive CHECK (level >= 1),
  CONSTRAINT min_xp_positive CHECK (min_xp >= 0)
);

-- Insertion des données de niveau
INSERT INTO level_definitions (level, title, description, min_xp) VALUES
(1, 'Explorateur des Nombres', 'Tu commences ton voyage mathématique. Résous des opérations simples pour progresser.', 0),
(2, 'Apprenti Calculateur', 'Tu maîtrises les bases du calcul. Continue pour améliorer ta rapidité.', 1000),
(3, 'Mathématicien Amateur', 'Tu es maintenant capable de résoudre des problèmes plus complexes.', 3000),
(4, 'Expert en Multiplication', 'Tu maîtrises les multiplications à grande vitesse.', 6000),
(5, 'Maître des Tables', 'Tu connais toutes les tables de multiplication sur le bout des doigts.', 10000),
(6, 'Génie Mathématique', 'Tes compétences en mathématiques sont impressionnantes!', 15000),
(7, 'Calculateur Suprême', 'Tu calcules plus vite qu'une calculatrice!', 21000),
(8, 'Champion des Chiffres', 'Tu as atteint un niveau exceptionnel. Ton cerveau est une machine à calculer.', 28000),
(9, 'Prodige Numérique', 'Tes compétences en calcul mental sont légendaires.', 36000),
(10, 'Virtuose Mathématique', 'Tu as atteint le sommet. Tu es maintenant un virtuose des mathématiques!', 45000)
ON CONFLICT (level) DO UPDATE 
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_xp = EXCLUDED.min_xp;