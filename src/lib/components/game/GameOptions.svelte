<script>
  import TableSelector from '$lib/components/TableSelector.svelte';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let level = 'adulte';
  export let gameDuration = 3;
  export let setLevel = () => {};
  export let setGameDuration = () => {};
  export let toggleTable = () => {};
  export let selectAllTables = () => {};
  export let getSelectedTableNumbers = () => [];
</script>

<div class="game-options">
  <div class="option-section card-inset">
    <h2>{_('play.chooseLevel')}</h2>
    <div class="option-buttons">
      <button class:active={level === 'adulte'} on:click={() => setLevel('adulte')}>
        <span class="emoji">👨‍💼</span> {_('common.adult')}
      </button>
      <button class:active={level === 'enfant'} on:click={() => setLevel('enfant')}>
        <span class="emoji">🧒</span> {_('common.child')}
      </button>
    </div>
    <p class="option-description">
      {level === 'adulte' ? _('play.adultResponseTime') : _('play.childResponseTime')}
    </p>
  </div>

  {#if level === 'enfant'}
    <div class="option-section card-inset">
      <TableSelector
        {toggleTable}
        {selectAllTables}
        selectedNumbers={getSelectedTableNumbers()}
      />
    </div>
  {/if}

  <div class="option-section card-inset">
    <h2>{_('play.chooseDuration')}</h2>
    <div class="option-buttons">
      <button class:active={gameDuration === 2} on:click={() => setGameDuration(2)}>
        <span class="emoji">⏱️</span> 2 {_('common.min')}
      </button>
      <button class:active={gameDuration === 3} on:click={() => setGameDuration(3)}>
        <span class="emoji">⏱️</span> 3 {_('common.min')}
      </button>
      <button class:active={gameDuration === 5} on:click={() => setGameDuration(5)}>
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

  .option-description {
    font-size: 0.9rem;
    color: var(--text-light);
    margin-top: 10px;
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