<script>
  import { selectedTables } from '$lib/stores/gameStore';

  // Props
  export let toggleTable;
  export let selectAllTables;
  export let selectedNumbers = [];
</script>

<div class="option-section">
  <h2>Sélectionnez les tables à pratiquer:</h2>
  <div class="tables-selection">
    {#each Array(10) as _, i}
      <div class="table-checkbox">
        <label>
          <input
            type="checkbox"
            checked={$selectedTables[i]}
            on:change={() => toggleTable(i)}
          />
          <span>x {i + 1}</span>
        </label>
      </div>
    {/each}
  </div>
  <div class="selection-actions">
    <button on:click={() => selectAllTables(true)}>Tout sélectionner</button>
    <button on:click={() => selectAllTables(false)}>Tout désélectionner</button>
  </div>
  <p class="option-description">
    {selectedNumbers.length === 0
      ? 'Veuillez sélectionner au moins une table.'
      : `Tables sélectionnées: ${selectedNumbers.join(', ')}`}
  </p>
</div>

<style>
  /* Style pour la sélection des tables */
  .tables-selection {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .table-checkbox {
    background-color: #f0f0f0;
    border-radius: 5px;
    padding: 8px 12px;
    transition: all 0.2s;
  }

  .table-checkbox label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .table-checkbox input {
    margin-right: 8px;
  }

  .selection-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .selection-actions button {
    padding: 8px 15px;
    background-color: #e0e0e0;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .selection-actions button:hover {
    background-color: #d0d0d0;
  }

  .option-description {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }

  /* Responsive */
  @media (max-width: 767px) {
    .tables-selection {
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .table-checkbox {
      width: 80%;
      max-width: 250px;
    }
  }
</style>