-- Schéma de level_definitions — réconcilié avec la base de production Neon
-- (square-water-55208846) le 2026-07-18 (dette #1, SPEC.md §3). Le schéma
-- versionné précédemment (id UUID + colonne rewards) ne correspondait plus à
-- la prod, où `level` est directement la clé primaire et `color_theme`
-- existe sans `rewards`. Colonne `image_url` supprimée (migration 013) :
-- plus consommée par l'UI depuis le retrait de LevelAvatar.svelte.
-- Le seed des niveaux 1-30 vit dans db/insert_level_definitions.sql,
-- et 31-100 dans db/migrations/014_level_definitions_31_100.sql.
CREATE TABLE IF NOT EXISTS level_definitions (
  level INTEGER PRIMARY KEY CHECK (level >= 1),
  title VARCHAR(100) NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  min_xp INTEGER NOT NULL CHECK (min_xp >= 0),
  color_theme VARCHAR(50)
);
