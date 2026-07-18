<script>
  import { listEnabledModes } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let selected = 'tables';
  export let onSelect = () => {};

  const modes = listEnabledModes();
</script>

<div class="mode-selector">
  <h2>{_('modes.chooseMode')}</h2>
  <div class="mode-cards">
    {#each modes as mode}
      <button
        class="mode-card"
        class:active={selected === mode.id}
        on:click={() => onSelect(mode.id)}
      >
        <span class="mode-icon">{mode.icon}</span>
        <span class="mode-label">{_(mode.labelKey)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .mode-selector {
    text-align: center;
  }

  .mode-cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
    margin: 15px 0;
  }

  .mode-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 110px;
    padding: 15px 20px;
    background-color: white;
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.08);
    transition: all 0.2s;
    cursor: pointer;
  }

  .mode-card:hover {
    transform: translateY(-2px);
  }

  .mode-card.active {
    border-color: var(--primary);
    background-color: var(--bg-primary);
    box-shadow: 0 4px 0 var(--primary-dark);
  }

  .mode-icon {
    font-size: 2rem;
  }

  .mode-label {
    font-weight: bold;
    color: var(--primary-dark);
  }

  @media (max-width: 767px) {
    .mode-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .mode-card {
      min-width: 0;
      padding: 12px 10px;
    }
  }
</style>
