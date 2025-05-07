<script>
  import { selectedTables } from '$lib/stores/gameStore';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let toggleTable;
  export let selectAllTables;
  export let selectedNumbers = [];
</script>

<div class="table-selector">
  <h2>{_('tableSelector.title')}</h2>
  
  <div class="tables-selection">
    {#each Array(10) as _, i}
      <div 
        class="table-checkbox" 
        class:selected={$selectedTables[i]}
      >
        <label>
          <input
            type="checkbox"
            checked={$selectedTables[i]}
            on:change={() => toggleTable(i)}
          />
          <span class="table-number">{i + 1}</span>
          <span class="table-symbol">×</span>
        </label>
      </div>
    {/each}
  </div>
  
  <div class="selection-actions">
    <button on:click={() => selectAllTables(true)}>
      <span class="emoji">✅</span> {_('tableSelector.selectAll')}
    </button>
    <button on:click={() => selectAllTables(false)}>
      <span class="emoji">❌</span> {_('tableSelector.deselectAll')}
    </button>
  </div>
  
  <p class="selection-info">
    {selectedNumbers.length === 0
      ? _('tableSelector.errorMessage')
      : `${_('tableSelector.selectedTables')} ${selectedNumbers.join(', ')}`}
  </p>
</div>

<style>
  .table-selector {
    text-align: center;
  }

  .tables-selection {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin: 15px 0;
  }

  .table-checkbox {
    background-color: white;
    border-radius: var(--border-radius-md);
    padding: 10px 15px;
    transition: all 0.2s;
    position: relative;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.08);
    border: 2px solid var(--bg-secondary);
  }
  
  .table-checkbox.selected {
    border-color: var(--primary-light);
    background-color: var(--bg-primary);
    transform: translateY(-2px);
    box-shadow: 0 5px 0 rgba(0, 0, 0, 0.08);
  }

  .table-checkbox label {
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: 8px;
  }

  .table-checkbox input {
    margin: 0;
  }
  
  .table-number {
    font-weight: bold;
    font-size: 1.2rem;
    color: var(--primary-dark);
  }
  
  .table-symbol {
    font-size: 1rem;
    color: var(--text-light);
  }

  .selection-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 15px;
  }

  .selection-actions button {
    padding: 8px 15px;
    font-size: 0.9rem;
  }
  
  .emoji {
    font-size: 1.1em;
    margin-right: 5px;
  }

  .selection-info {
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  
  /* Responsive */
  @media (max-width: 767px) {
    .tables-selection {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    
    .table-checkbox {
      padding: 8px 10px;
    }
    
    .selection-actions {
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
    
    .selection-actions button {
      width: 100%;
      max-width: 250px;
    }
  }
</style>