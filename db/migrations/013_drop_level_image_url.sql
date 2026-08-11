-- image_url n'est plus consommée par l'UI depuis la suppression de
-- LevelAvatar.svelte et src/lib/utils/image-paths.js. On retire la colonne
-- plutôt que de la traîner pour les 70 niveaux ajoutés en migration 014.
ALTER TABLE level_definitions DROP COLUMN IF EXISTS image_url;
