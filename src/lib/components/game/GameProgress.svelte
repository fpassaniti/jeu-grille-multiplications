<script>
  // Props
  export let level = 'adulte';
  export let solvedCountAdult = 0;
  export let solvedCountChild = { count: 0, total: 0 };
  export let totalSolvedCountAdult = 0;
  export let totalSolvedCountChild = { count: 0, total: 0 };
  export let getSelectedTableNumbers = () => [];
  export let progressPercentage = 0;
  export let showingGridReset = false;
</script>

<div class="progress-container">
  {#if showingGridReset}
    <div class="grid-reset-notification">
      <span class="emoji">🔄</span> Nouvelle grille! Continue à jouer!
    </div>
  {/if}

  {#if level === 'adulte'}
    <div class="progress-label">
      Multiplications résolues: {totalSolvedCountAdult + solvedCountAdult}/100
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progressPercentage}%"></div>
    </div>
  {:else}
    {#if getSelectedTableNumbers().length > 0}
      <div class="progress-label">
        Multiplications résolues: {totalSolvedCountChild.count + solvedCountChild.count}/{solvedCountChild.total}
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progressPercentage}%"></div>
      </div>
    {:else}
      <div class="progress-label">Aucune table sélectionnée</div>
    {/if}
  {/if}
</div>

<style>
  .progress-container {
    margin-bottom: 5px;
  }

  .progress-label {
    font-size: 0.85rem;
    margin-bottom: 3px;
    color: var(--text-secondary);
  }

  .progress-bar {
    height: 8px;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .progress-fill {
    height: 100%;
    background-color: var(--success);
    transition: width 0.3s ease;
  }

  .grid-reset-notification {
    background-color: var(--accent-light);
    color: var(--accent-dark);
    padding: 5px 10px;
    border-radius: var(--border-radius-md);
    text-align: center;
    margin-bottom: 8px;
    font-weight: bold;
    animation: fadeInOut 1.5s ease;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    15% { opacity: 1; transform: translateY(0); }
    85% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
</style>