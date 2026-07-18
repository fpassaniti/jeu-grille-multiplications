-- 001_game_modes.sql — V2 Volet A (SPEC §4.6)
-- Migration additive, idempotente et rétrocompatible :
-- les enregistrements existants deviennent game_mode = 'tables' via DEFAULT.
-- Appliquée sur Neon (project square-water-55208846) le 2026-07-18.

-- Nouvelles colonnes
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS game_mode    text  NOT NULL DEFAULT 'tables',
  ADD COLUMN IF NOT EXISTS mode_options jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS game_mode    text  NOT NULL DEFAULT 'tables',
  ADD COLUMN IF NOT EXISTS mode_options jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Les modes génériques ont un pool infini : questionsTotal = null
ALTER TABLE game_sessions
  ALTER COLUMN cells_solved DROP NOT NULL,
  ALTER COLUMN total_cells DROP NOT NULL;

-- Contraintes CHECK (pas de ADD CONSTRAINT IF NOT EXISTS en PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scores_game_mode_check') THEN
    ALTER TABLE scores ADD CONSTRAINT scores_game_mode_check
      CHECK (game_mode IN ('tables', 'addition', 'subtraction', 'multiplication', 'division'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_sessions_game_mode_check') THEN
    ALTER TABLE game_sessions ADD CONSTRAINT game_sessions_game_mode_check
      CHECK (game_mode IN ('tables', 'addition', 'subtraction', 'multiplication', 'division'));
  END IF;
END $$;

-- Backfill : tables_used (int[]) → mode_options.selectedTables
UPDATE scores
   SET mode_options = jsonb_build_object('selectedTables', to_jsonb(tables_used))
 WHERE tables_used IS NOT NULL
   AND array_length(tables_used, 1) > 0
   AND mode_options = '{}'::jsonb;

UPDATE game_sessions
   SET mode_options = jsonb_build_object('selectedTables', to_jsonb(tables_used))
 WHERE tables_used IS NOT NULL
   AND array_length(tables_used, 1) > 0
   AND mode_options = '{}'::jsonb;

-- Index leaderboard : WHERE game_mode/level/duration + ORDER BY score DESC
CREATE INDEX IF NOT EXISTS idx_scores_mode_level_duration_score
  ON scores (game_mode, level, duration, score DESC);
