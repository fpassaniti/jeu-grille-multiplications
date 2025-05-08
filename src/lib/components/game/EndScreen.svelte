<script>
  import SaveScoreForm from './SaveScoreForm.svelte';
  import LevelUpModal from './LevelUpModal.svelte';

  // Props
  export let score = 0;
  export let level = 'adulte';
  export let solvedCountAdult = 0;
  export let solvedCountChild = { count: 0, total: 0 };
  export let totalSolvedCountAdult = 0;
  export let totalSolvedCountChild = { count: 0, total: 0 };
  export let getSelectedTableNumbers = () => [];
  export let isLoggedIn = false;
  export let playerName = '';
  export let saveScore = () => {};
  export let isLoading = false;
  export let scoreSaved = false;
  export let gameResults = null;
  export let levelUp = false;
  export let reloadPageOnDashboard = () => {};
  export let restartGame = () => {};
  export let resetGame = () => {};
</script>

<div class="end-screen card">
  <h1>🎉 Partie terminée! 🎉</h1>

  <div class="results-container">
    <div class="result-card">
      <div class="result-icon">🏆</div>
      <p>Ton score: <span class="final-score">{score}</span></p>
    </div>

    <div class="result-card">
      <div class="result-icon">{level === 'adulte' ? '👨‍💼' : '🧒'}</div>
      <p>Niveau: <span class="final-level">{level === 'adulte' ? 'Adulte' : 'Enfant'}</span></p>
    </div>

    <div class="result-card">
      <div class="result-icon">✅</div>
      {#if level === 'adulte'}
        <p>Multiplications résolues: <span class="final-solved">{totalSolvedCountAdult + solvedCountAdult}/100</span></p>
      {:else}
        <p>Multiplications résolues: <span class="final-solved">{totalSolvedCountChild.count + solvedCountChild.count}/{solvedCountChild.total}</span></p>
      {/if}
    </div>

    {#if level === 'enfant'}
      <div class="result-card">
        <div class="result-icon">📚</div>
        <p>Tables pratiquées: <span class="final-tables">{getSelectedTableNumbers().join(', ')}</span></p>
      </div>
    {/if}

    {#if isLoggedIn}
      <div class="result-card xp-card">
        <div class="result-icon">⭐</div>
        <p>XP gagnée: <span class="final-xp">+{score}</span></p>
      </div>
    {/if}
  </div>

  {#if isLoggedIn && !scoreSaved}
    <div class="adventure-progress">
      <h2>Progression dans l'aventure</h2>
      <p class="adventure-info">Ton score est en cours de sauvegarde...</p>
    </div>
  {/if}

  {#if levelUp && scoreSaved}
    <LevelUpModal {gameResults} {reloadPageOnDashboard} />
  {/if}

  <SaveScoreForm
    {isLoggedIn}
    {playerName}
    {saveScore}
    {isLoading}
    {scoreSaved}
    {gameResults}
  />

  <div class="end-buttons">
    <button class="restart-button" on:click={restartGame}>
      <span class="emoji">🔄</span> Nouvelle partie
    </button>

    <button class="home-button" on:click={resetGame}>
      <span class="emoji">🏠</span> Retour à l'accueil
    </button>

    {#if isLoggedIn && scoreSaved}
      <a href="/dashboard" class="button dashboard-button">
        <span class="emoji">📊</span> Tableau de bord
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

  .final-level {
    font-weight: bold;
    color: var(--primary);
  }

  .final-solved {
    font-weight: bold;
    color: var(--info);
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

  .end-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
  }

  .restart-button, .home-button, .dashboard-button {
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