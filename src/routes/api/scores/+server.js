import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { getSessionUser } from '$lib/server/auth';
import { normalizePayload } from '$lib/server/scoreValidation.js';
import { DEFAULT_PLAYER_MODE } from '$lib/utils/player-mode.js';
import { verifyAndConsumePotions } from '$lib/server/potions.js';

const MIN_PERFECT_QUESTIONS = 10;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  try {
    const body = await request.json();

    // Le jeu est réservé aux comptes connectés : plus de partie invitée.
    const sessionUser = getSessionUser(cookies);
    if (!sessionUser) {
      return json({ error: 'Authentification requise' }, { status: 401 });
    }
    const userId = sessionUser.id;
    const userDisplayName = sessionUser.displayName || sessionUser.username;

    // Le level (adulte/enfant) n'est plus fourni par le client : c'est un attribut
    // du compte (users.player_mode), lu ici pour ne pas faire confiance à un
    // payload forgé — un joueur "adulte" ne doit pas pouvoir apparaître dans le
    // classement enfant en envoyant simplement level: 'enfant'.
    const userRows = await sql`SELECT player_mode FROM users WHERE id = ${userId}`;
    const level = userRows[0]?.player_mode ?? DEFAULT_PLAYER_MODE;

    // Potions sélectionnées avant la partie (bonus de temps/grâce/multiplicateur
    // de pièces) : vérifiées ici (jamais depuis une valeur numérique du
    // payload) pour élargir le plafond de plausibilité de scoreValidation.
    // Le stock n'est décrémenté que si la partie est comptabilisée, plus bas.
    const potionCodes = Array.isArray(body.potionCodes) ? body.potionCodes : [];
    const { extraSec, coinMultiplier } = await verifyAndConsumePotions(userId, potionCodes, {
      counted: false
    });

    const normalized = normalizePayload(body, extraSec);
    if ('error' in normalized) {
      return json({ error: normalized.error }, { status: 400 });
    }
    const {
      score,
      duration,
      gameMode,
      modeOptions,
      questionsSolved,
      questionsTotal,
      errorsCount,
      elapsedSec,
      completed
    } = normalized.value;

    // Partie à 0 point (aucun calcul résolu) : ni enregistrée, ni récompensée —
    // sinon un joueur peut démarrer une partie et cliquer sur « Terminer la
    // partie » en boucle pour engranger le plancher de pièces sans jamais jouer.
    if (score === 0) {
      return json({
        success: true,
        counted: false,
        message: 'Partie non comptabilisée : aucun calcul résolu',
        gameData: null,
        gameMode,
        xpEarned: 0,
        progressUpdate: null,
        rewards: null
      });
    }

    // Anti-replay (#7) : basé sur le temps RÉELLEMENT joué (elapsedSec), pas la
    // durée nominale — une partie terminée tôt ("Finir la partie") ne doit pas
    // bloquer la suivante puisqu'elle ne prétend pas avoir duré plus longtemps.
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

    // Partie comptabilisée : on décrémente maintenant le stock des potions
    // vérifiées plus haut (pas sur une partie à 0 point, cf. early return
    // ci-dessus — pas de gaspillage sur un abandon accidentel).
    await verifyAndConsumePotions(userId, potionCodes, { counted: true });

    const playerName = body.name || userDisplayName;
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

    // Attribuer XP + pièces + streak (add_game_rewards)
    let progressUpdate = null;
    let rewards = null;
    const rewardsData = await sql`
      SELECT * FROM add_game_rewards(${userId}, ${score}, ${isPerfect}, ${completed}, ${coinMultiplier})
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

    return json({
      success: true,
      counted: true,
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
