<script>
  import LevelUpModal from './LevelUpModal.svelte';
  import CoinCounter from '$lib/components/CoinCounter.svelte';
  import ChestModal from '$lib/components/chest/ChestModal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { getMode } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let results = null; // engine.results : {modeId, options, level, score, questionsSolved, questionsTotal, errorsCount}
  export let scoreSaved = false;
  export let saveError = null;
  export let gameResults = null;
  export let levelUp = false;
  export let reloadPageOnDashboard = () => {};
  export let restartGame = () => {};
  export let resetGame = () => {};

  $: mode = getMode(results?.modeId ?? 'tables');
  $: rewards = scoreSaved ? gameResults?.rewards : null;
  $: hasChestDue = rewards?.chests && (rewards.chests.streak > 0 || rewards.chests.perfect);
  // Priorité perfect > streak si les deux sont dus le même jour (rare)
  $: dueChestType = rewards?.chests?.perfect ? 'perfect' : rewards?.chests?.streak ? 'streak' : null;

  let openChest = false;
  let chestClaimed = false;

  function closeChest() {
    openChest = false;
    chestClaimed = true;
  }

  const BONUS_LABELS = {
    base: 'rewards.base',
    weekend: 'rewards.weekend',
    booster: 'rewards.booster',
    first_of_day: 'rewards.firstOfDay',
    streak: 'rewards.streakBonus',
    perfect: 'rewards.perfectBonus'
  };
</script>

<div class="end-screen card">
  <h1>🎉 {_('play.gameOver')} 🎉</h1>

  {#if results}
    <div class="results-container">
      <div class="result-card">
        <div class="result-icon">🏆</div>
        <p>{_('play.yourScore')} <span class="final-score">{results.score}</span></p>
      </div>

      <div class="result-card">
        <div class="result-icon">{mode.icon}</div>
        <p>
          <span class="final-mode">{_(mode.labelKey)}</span> —
          <span class="final-level"
            >{results.level === 'adulte' ? _('common.adult') : _('common.child')}</span
          >
        </p>
      </div>

      <div class="result-card">
        <div class="result-icon">✅</div>
        <p>
          {_('play.solvedLabel', { mode: _(mode.labelKey) })}
          <span class="final-solved"
            >{results.questionsSolved}{results.questionsTotal !== null
              ? `/${results.questionsTotal}`
              : ''}</span
          >
        </p>
      </div>

      {#if typeof results.errorsCount === 'number'}
        <div class="result-card">
          <div class="result-icon">❌</div>
          <p>
            {_('play.errorsLabel')}
            <span class="final-errors">{results.errorsCount}</span>
          </p>
        </div>
      {/if}

      {#if mode.boardType === 'grid' && results.level === 'enfant' && results.options?.selectedTables?.length}
        <div class="result-card">
          <div class="result-icon">📚</div>
          <p>
            {_('play.practicedTables')}
            <span class="final-tables">{results.options.selectedTables.join(', ')}</span>
          </p>
        </div>
      {/if}

      <div class="result-card xp-card">
        <div class="result-icon">⭐</div>
        <p>{_('play.earnedXp')} <span class="final-xp">+{results.score}</span></p>
      </div>
    </div>
  {/if}

  {#if rewards}
    <div class="rewards-card">
      {#if rewards.freezeUsed}
        <p class="freeze-used-banner">{_('streak.freezeUsed')}</p>
      {/if}
      <div class="rewards-title">
        <CoinCounter value={rewards.coinsEarned} />
      </div>
      {#if rewards.coinsBreakdown}
        <ul class="rewards-breakdown">
          {#each Object.entries(rewards.coinsBreakdown) as [key, amount]}
            <li>{_(BONUS_LABELS[key] ?? 'rewards.base')} <strong>+{amount} 🪙</strong></li>
          {/each}
        </ul>
      {/if}
      {#if hasChestDue && !chestClaimed}
        <button class="chest-due-button" on:click={() => (openChest = true)}>
          🎁 {_('rewards.openChest')}
        </button>
      {/if}
    </div>
  {/if}

  {#if openChest && dueChestType}
    <ChestModal chestType={dueChestType} onClose={closeChest} onOpened={invalidateAll} />
  {/if}

  {#if !scoreSaved}
    <div class="adventure-progress">
      <h2>{_('play.progressionTitle')}</h2>
      {#if saveError}
        <p class="adventure-error">⚠️ {saveError}</p>
      {:else}
        <p class="adventure-info">{_('play.savingScore')}</p>
      {/if}
    </div>
  {:else if gameResults?.counted === false}
    <div class="save-score card-inset">
      <div class="score-saved-message">
        <span class="emoji">ℹ️</span> {_('play.gameNotCounted')}
      </div>
    </div>
  {:else if gameResults}
    <div class="save-score card-inset saved">
      <div class="score-saved-message">
        <span class="emoji">✅</span> {_('play.scoreSaved')}
        <p class="xp-confirmation">{_('play.xpEarned', { xp: gameResults.xpEarned })}</p>
      </div>
    </div>
  {/if}

  {#if levelUp && scoreSaved}
    <LevelUpModal {gameResults} {reloadPageOnDashboard} />
  {/if}

  <div class="end-buttons">
    <button class="restart-button" on:click={restartGame}>
      <span class="emoji">🔄</span> {_('play.newGame')}
    </button>

    <button class="home-button" on:click={resetGame}>
      <span class="emoji">🏠</span> {_('play.backToHome')}
    </button>

    <button class="leaderboard-button" on:click={resetGame}>
      <span class="emoji">🏆</span> {_('play.viewLeaderboardButton')}
    </button>

    {#if scoreSaved}
      <a href="/" class="button dashboard-button">
        <span class="emoji">📊</span> {_('play.dashboardButton')}
      </a>
    {/if}
  </div>
</div>

<style>
  .end-screen {
    text-align: center;
    padding: 30px;
    margin: 20px auto;
    width: 100%;
    box-sizing: border-box;
  }

  .results-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin: 30px 0;
  }

  .result-card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    min-width: 200px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s;
  }

  .result-card:hover {
    transform: translateY(-5px);
  }

  .result-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
    animation: pulse 2s infinite;
  }

  .final-score {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--success);
  }

  .final-mode,
  .final-level {
    font-weight: bold;
    color: var(--primary);
  }

  .final-solved {
    font-weight: bold;
    color: var(--info);
  }

  .final-errors {
    font-weight: bold;
    color: var(--secondary-dark, #c62828);
  }

  .freeze-used-banner {
    font-weight: bold;
    color: var(--info-dark, #01579b);
    margin: 0 0 12px;
  }

  .final-tables {
    font-weight: bold;
    color: var(--secondary);
  }

  .xp-card {
    background-color: #fff8e1;
    border: 2px solid #ffca28;
  }

  .final-xp {
    color: #ff8f00;
    font-weight: bold;
  }

  .rewards-card {
    background-color: #fff8e1;
    border: 2px solid #ffca28;
    border-radius: var(--border-radius-md);
    padding: 20px;
    margin: 20px auto;
    max-width: 400px;
  }

  .rewards-title {
    font-size: 1.6rem;
    text-align: center;
  }

  .rewards-breakdown {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .rewards-breakdown li {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
  }

  .chest-due-button {
    display: block;
    width: 100%;
    text-align: center;
    font-weight: bold;
    color: white;
    background-color: var(--accent);
    box-shadow: 0 4px 0 var(--accent-dark);
    margin-top: 12px;
    padding: 10px;
    border-radius: var(--border-radius-md);
    animation: pulse 2s infinite;
  }

  .adventure-progress {
    margin: 20px 0;
    padding: 15px;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .adventure-info {
    color: var(--text-secondary);
    font-style: italic;
  }

  .adventure-error {
    color: var(--secondary-dark, #c62828);
    font-weight: bold;
  }

  .save-score {
    margin: 30px auto;
    max-width: 500px;
    width: 100%;
    box-sizing: border-box;
  }

  .save-score.saved {
    background-color: var(--success-light);
    transition: background-color 0.3s ease;
  }

  .score-saved-message {
    padding: 15px;
    color: var(--success-dark);
    font-weight: bold;
  }

  .xp-confirmation {
    margin-top: 10px;
    font-weight: normal;
  }

  .end-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
  }

  .restart-button,
  .home-button,
  .leaderboard-button,
  .dashboard-button {
    padding: 12px 20px;
    font-size: 1rem;
    border-radius: var(--border-radius-md);
  }

  .restart-button {
    background-color: var(--primary);
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 6px 0 var(--primary-dark);
  }

  .restart-button:hover {
    background-color: var(--primary-light);
  }

  .home-button {
    background-color: var(--primary);
    color: white;
    box-shadow: 0 4px 0 var(--primary-dark);
  }

  .dashboard-button {
    background-color: var(--info);
    color: white;
    box-shadow: 0 4px 0 var(--info-dark);
  }

  .leaderboard-button {
    background-color: var(--secondary, #7b5cff);
    color: white;
    box-shadow: 0 4px 0 var(--secondary-dark, #5a3fc0);
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @media (max-width: 767px) {
    .results-container {
      flex-direction: column;
      align-items: center;
    }

    .result-card {
      width: 90%;
    }

    .end-buttons {
      flex-direction: column;
    }
  }
</style>
