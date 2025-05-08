<script>
  // Props
  export let level = 'adulte';
  export let solvedCountAdult = 0;
  export let solvedCountChild = { count: 0, total: 0 };
  export let getSelectedTableNumbers = () => [];
  export let progressPercentage = 0;
</script>

<div class="progress-container">
  {#if level === 'adulte'}
    <div class="progress-label">Multiplications résolues: {solvedCountAdult}/100</div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progressPercentage}%"></div>
    </div>
  {:else}
    {#if getSelectedTableNumbers().length > 0}
      <div class="progress-label">Multiplications résolues: {solvedCountChild.count}/{solvedCountChild.total}</div>
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
</style>