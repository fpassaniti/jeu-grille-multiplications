#!/usr/bin/env node
/**
 * Script de migration Supabase → Neon
 * Extrait toutes les données de Supabase et les insère dans Neon
 */

import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🚀 Démarrage de la migration Supabase → Neon\n');

// Initialiser Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialiser Neon
const sql = neon(DATABASE_URL);

async function migrateUsers() {
  console.log('📥 Migration des utilisateurs...');

  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) throw error;

  console.log(`  Trouvé ${users.length} utilisateurs`);

  for (const user of users) {
    await sql`
      INSERT INTO users (id, username, password_char, display_name, last_login, created_at)
      VALUES (${user.id}, ${user.username}, ${user.password_char}, ${user.display_name}, ${user.last_login}, ${user.created_at})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`✅ ${users.length} utilisateurs migrés\n`);
}

async function migrateUserProgress() {
  console.log('📥 Migration des progressions utilisateur...');

  const { data: progresses, error } = await supabase
    .from('user_progress')
    .select('*');

  if (error) throw error;

  console.log(`  Trouvé ${progresses.length} progressions`);

  for (const progress of progresses) {
    await sql`
      INSERT INTO user_progress (id, user_id, xp, level, games_played, total_score, streak_days, unlocked_badges, last_played_at)
      VALUES (${progress.id}, ${progress.user_id}, ${progress.xp}, ${progress.level}, ${progress.games_played}, ${progress.total_score}, ${progress.streak_days}, ${JSON.stringify(progress.unlocked_badges)}, ${progress.last_played_at})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`✅ ${progresses.length} progressions migrées\n`);
}

async function migrateScores() {
  console.log('📥 Migration des scores...');

  const { data: scores, error } = await supabase
    .from('scores')
    .select('*')
    .order('id');

  if (error) throw error;

  console.log(`  Trouvé ${scores.length} scores`);

  // Traiter par batch de 100
  for (let i = 0; i < scores.length; i += 100) {
    const batch = scores.slice(i, i + 100);

    for (const score of batch) {
      try {
        await sql`
          INSERT INTO scores (id, name, score, date, duration, level, cells_solved, total_cells, tables_used)
          VALUES (${score.id}, ${score.name}, ${score.score}, ${score.date}, ${score.duration}, ${score.level}, ${score.cells_solved}, ${score.total_cells}, ${score.tables_used || null})
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err) {
        console.error(`Erreur pour score ${score.id}:`, err.message);
      }
    }

    console.log(`  Batch ${Math.ceil((i + 100) / 100)} traité...`);
  }

  console.log(`✅ ${scores.length} scores migrés\n`);
}

async function migrateGameSessions() {
  console.log('📥 Migration des sessions de jeu...');

  const { data: sessions, error } = await supabase
    .from('game_sessions')
    .select('*')
    .order('date');

  if (error) throw error;

  console.log(`  Trouvé ${sessions.length} sessions`);

  // Traiter par batch de 100
  for (let i = 0; i < sessions.length; i += 100) {
    const batch = sessions.slice(i, i + 100);

    for (const session of batch) {
      try {
        await sql`
          INSERT INTO game_sessions (id, user_id, name, score, xp_earned, duration, level, cells_solved, total_cells, tables_used, completed, date)
          VALUES (${session.id}, ${session.user_id}, ${session.name}, ${session.score}, ${session.xp_earned}, ${session.duration}, ${session.level}, ${session.cells_solved}, ${session.total_cells}, ${session.tables_used || null}, ${session.completed}, ${session.date})
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err) {
        console.error(`Erreur pour session ${session.id}:`, err.message);
      }
    }

    console.log(`  Batch ${Math.ceil((i + 100) / 100)} traité...`);
  }

  console.log(`✅ ${sessions.length} sessions migrées\n`);
}

async function main() {
  try {
    await migrateUsers();
    await migrateUserProgress();
    await migrateScores();
    await migrateGameSessions();

    console.log('🎉 Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

main();
