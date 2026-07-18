import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';
import { normalizePayload } from '$lib/server/scoreValidation.js';

const MIN_PERFECT_QUESTIONS = 10;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const body = await request.json();
    const normalized = normalizePayload(body);
    if ('error' in normalized) {
      return json({ error: normalized.error }, { status: 400 });
    }
    const {
      score,
      duration,
      level,
      gameMode,
      modeOptions,
      questionsSolved,
      questionsTotal,
      errorsCount,
      elapsedSec
    } = normalized.value;

    // Vérifier si l'utilisateur est connecté
    const sessionUser = getSessionUser(cookies);
    const userId = sessionUser?.id ?? null;
    const userDisplayName = sessionUser ? sessionUser.displayName || sessionUser.username : null;

    // Anti-replay (#7) : basé sur le temps RÉELLEMENT joué (elapsedSec), pas la
    // durée nominale — une partie terminée tôt ("Finir la partie") ne doit pas
    // bloquer la suivante puisqu'elle ne prétend pas avoir duré plus longtemps.
    if (userId) {
      const recent = await sql`
        SELECT 1 FROM game_sessions
         WHERE user_id = ${userId} AND date > NOW() - make_interval(secs => ${elapsedSec})
         LIMIT 1
      `;
      if (recent && recent.length > 0) {
        return json(
          { error: 'Partie trop rapprochée de la précédente, réessaie dans un instant' },
          { status: 429 }
        );
      }
    }

    // Nom : celui de la requête, sinon le nom d'affichage, sinon "Invité"
    const playerName = body.name || (userId ? userDisplayName : 'Invité');
    const isPerfect = errorsCount === 0 && questionsSolved >= MIN_PERFECT_QUESTIONS;

    // tables_used conservé pour compat (leaderboard V1, anciens clients)
    const tablesUsed =
      gameMode === 'tables' && level === 'enfant' ? (modeOptions.selectedTables ?? []) : [];
    const tablesUsedPg = `{${tablesUsed.join(',')}}`;
    const modeOptionsJson = JSON.stringify(modeOptions);

    // Sauvegarder la session de jeu dans la table game_sessions
    const gameData = await sql`
      INSERT INTO game_sessions (user_id, name, score, xp_earned, duration, level, cells_solved, total_cells, tables_used, game_mode, mode_options, errors_count, date)
      VALUES (${userId}, ${playerName}, ${score}, ${score}, ${duration}, ${level}, ${questionsSolved}, ${questionsTotal}, ${tablesUsedPg}, ${gameMode}, ${modeOptionsJson}, ${errorsCount}, NOW())
      RETURNING id, user_id, name, score, duration, level, game_mode, date
    `;

    // Sauvegarder également dans la table scores pour le leaderboard
    await sql`
      INSERT INTO scores (name, score, duration, level, cells_solved, total_cells, tables_used, game_mode, mode_options, date)
      VALUES (${playerName}, ${score}, ${duration}, ${level}, ${questionsSolved}, ${questionsTotal}, ${tablesUsedPg}, ${gameMode}, ${modeOptionsJson}, NOW())
      RETURNING id
    `;

    // Si l'utilisateur est connecté, attribuer XP + pièces + streak (add_game_rewards)
    let progressUpdate = null;
    let rewards = null;
    if (userId) {
      const rewardsData = await sql`
        SELECT * FROM add_game_rewards(${userId}, ${score}, ${isPerfect})
      `;
      if (rewardsData && rewardsData.length > 0) {
        const r = rewardsData[0];

        let levelTitle = null;
        if (r.level_up) {
          const titleRows = await sql`SELECT title FROM level_definitions WHERE level = ${r.level}`;
          levelTitle = titleRows?.[0]?.title ?? null;
        }

        // Compat client V1 (corrige le bug #2 : add_user_xp ne retournait pas ces champs)
        progressUpdate = {
          returned_user_id: userId,
          returned_xp: r.xp,
          returned_level: r.level,
          returned_previous_level: r.previous_level,
          returned_level_title: levelTitle,
          returned_streak_days: r.streak_days,
          returned_total_xp: r.xp
        };

        rewards = {
          coinsEarned: r.coins_earned,
          coinsBalance: r.coins_balance,
          coinsBreakdown: r.coins_breakdown,
          streakDays: r.streak_days,
          freezeUsed: r.freeze_used,
          levelUp: r.level_up,
          chests: {
            levelup: r.level_up,
            streak: r.streak_chest_due,
            perfect: r.perfect_chest_due
          }
        };
      }
    }

    return json({
      success: true,
      message: 'Score enregistré avec succès',
      gameData: gameData && gameData[0] ? gameData[0] : null,
      gameMode,
      xpEarned: score,
      progressUpdate,
      rewards
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du score:", error);

    return json(
      {
        error: "Erreur serveur lors de l'enregistrement du score"
      },
      { status: 500 }
    );
  }
}
