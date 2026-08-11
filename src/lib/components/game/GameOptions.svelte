<script>
  import TableSelector from '$lib/components/TableSelector.svelte';
  import DifficultySelector from '$lib/components/DifficultySelector.svelte';
  import { getMode } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let modeId = 'tables';
  export let level = 'adulte';
  export let duration = 3;
  export let options = {};
  export let onDurationSelect = () => {};
  export let onOptionsChange = () => {};

  $: mode = getMode(modeId);

  function toggleTable(n) {
    const current = options.selectedTables ?? [];
    const selectedTables = current.includes(n)
      ? current.filter((t) => t !== n)
      : [...current, n].sort((a, b) => a - b);
    onOptionsChange({ selectedTables });
  }

  function selectAllTables(select) {
    onOptionsChange({ selectedTables: select ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [] });
  }
</script>

<div class="game-options">
  {#if mode.boardType === 'grid'}
    {#if level === 'enfant'}
      <div class="option-section card-inset">
        <TableSelector
          selectedNumbers={options.selectedTables ?? []}
          onToggle={toggleTable}
          onSelectAll={selectAllTables}
        />
      </div>
    {/if}
  {:else}
    <div class="option-section card-inset">
      <DifficultySelector {mode} {options} {level} onChange={onOptionsChange} />
    </div>
  {/if}

  <div class="option-section card-inset">
    <h2>{_('play.chooseDuration')}</h2>
    <div class="option-buttons">
      <button class:active={duration === 2} on:click={() => onDurationSelect(2)}>
        <span class="emoji">⏱️</span> 2 {_('common.min')}
      </button>
      <button class:active={duration === 3} on:click={() => onDurationSelect(3)}>
        <span class="emoji">⏱️</span> 3 {_('common.min')}
      </button>
      <button class:active={duration === 5} on:click={() => onDurationSelect(5)}>
        <span class="emoji">⏱️</span> 5 {_('common.min')}
      </button>
    </div>
  </div>
</div>

<style>
  .game-options {
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin: 30px 0;
  }

  .option-section {
    margin-bottom: 10px;
  }

  .card-inset {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .option-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 15px 0;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  button.active {
    background-color: var(--primary);
    color: white;
  }

  /* Responsive */
  @media (max-width: 767px) {
    .option-buttons {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>
