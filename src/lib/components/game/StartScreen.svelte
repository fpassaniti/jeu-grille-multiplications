<script>
  import GameOptions from './GameOptions.svelte';

  // Props
  export let level = 'adulte';
  export let gameDuration = 3;
  export let setLevel = () => {};
  export let setGameDuration = () => {};
  export let toggleTable = () => {};
  export let selectAllTables = () => {};
  export let getSelectedTableNumbers = () => [];
  export let startGame = () => {};
</script>

<div class="start-screen card">
  <GameOptions
    {level}
    {gameDuration}
    {setLevel}
    {setGameDuration}
    {toggleTable}
    {selectAllTables}
    {getSelectedTableNumbers}
  />

  <button
    class="start-button"
    on:click={startGame}
    disabled={level === 'enfant' && getSelectedTableNumbers().length === 0}
  >
    <span class="emoji">🚀</span> Commencer
  </button>

  <div class="leaderboard-link-section">
    <h3>Envie de voir les meilleurs scores?</h3>
    <a href="/leaderboard" class="button leaderboard-link">
      <span class="emoji">🏆</span> Voir le classement complet
    </a>
  </div>
</div>

<style>
  .start-screen {
    text-align: center;
    padding: 10px 30px;
    margin: 20px auto;
    background-color: white;
  }

  .start-button {
    font-size: 1.3rem;
    padding: 15px 40px;
    background-color: var(--accent);
    color: var(--text-primary);
    margin: 20px 0;
    box-shadow: 0 6px 0 var(--accent-dark);
  }

  .start-button:hover {
    background-color: var(--accent-light);
  }

  .start-button:disabled {
    background-color: #e0e0e0;
    color: var(--text-light);
    box-shadow: 0 4px 0 #bdbdbd;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  .leaderboard-link-section {
    text-align: center;
    margin: 30px 0;
    padding: 20px;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .leaderboard-link {
    background-color: var(--primary);
    color: white;
    padding: 10px 20px;
    border-radius: var(--border-radius-md);
    margin-top: 15px;
    box-shadow: 0 4px 0 var(--primary-dark);
    white-space: nowrap;
    transition: all 0.2s;
  }

  .leaderboard-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 var(--primary-dark);
  }
</style>