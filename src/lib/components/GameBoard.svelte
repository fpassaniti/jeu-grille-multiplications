<script>
  // Props
  export let grid = [];
  export let solvedCells = [];
  export let currentRow = 0;
  export let currentCol = 0;
  export let userAnswer = '';
  export let handleAnswerChange = () => {
  };
  export let handleSubmit = () => {
  };
  export let inputRef;
  export let lastAnswerCorrect = null;
  export let isSelectedTableCell = () => {
  };
  export let level = 'adulte';
  export let getSelectedTableNumbers = () => [];
  export let windowWidth = 0;
  export let windowHeight = 0;

  // Calculer la taille de la grille en fonction de la fenêtre
  $: gridSize = Math.min(windowWidth - 40, windowHeight - 200, 650);
  $: cellSize = Math.max(gridSize / 11, 30); // 10 cellules + 1 pour les en-têtes, mais au moins 30px
</script>

<div class="grid-container" style="max-width: {gridSize}px;">
  <form on:submit|preventDefault={handleSubmit} class="cell-form">
    <div class="grid" style="grid-template-columns: repeat(11, {cellSize}px); grid-template-rows: repeat(11, {cellSize}px);">
      <!-- Cellule vide en haut à gauche -->
      <div class="grid-header-cell empty-cell"></div>

      <!-- En-têtes des colonnes -->
      {#each Array(10) as _, i}
        <div
          class="grid-header-cell column-header"
          class:selected-table={level === 'enfant' && getSelectedTableNumbers().includes(i + 1)}
        >
          {i + 1}
        </div>
      {/each}

      <!-- Contenu de la grille avec en-têtes de lignes -->
      {#each Array(10) as _, rowIndex}
        <!-- En-tête de ligne -->
        <div
          class="grid-header-cell row-header"
          class:selected-table={level === 'enfant' && getSelectedTableNumbers().includes(rowIndex + 1)}
        >
          {rowIndex + 1}
        </div>

        <!-- Cellules de la grille -->
        {#each Array(10) as _, colIndex}
          <div
            class="grid-cell"
            class:current={rowIndex + 1 === currentRow && colIndex + 1 === currentCol}
            class:solved={solvedCells[rowIndex][colIndex]}
            class:not-selected={level === 'enfant' && !isSelectedTableCell(rowIndex, colIndex)}
          >
            {#if solvedCells[rowIndex][colIndex]}
              <span class="result">{grid[rowIndex][colIndex]}</span>
            {:else if rowIndex + 1 === currentRow && colIndex + 1 === currentCol}
              <input
                type="number"
                bind:value={userAnswer}
                on:input={handleAnswerChange}
                bind:this={inputRef}
                class:correct={lastAnswerCorrect === true}
                class:incorrect={lastAnswerCorrect === false}
                min="1"
                max="100"
                autocomplete="off"
                inputmode="numeric"
              />
            {:else}
              <span class="multiplication-text">{rowIndex + 1}×{colIndex + 1}</span>
            {/if}
          </div>
        {/each}
      {/each}
    </div>
  </form>
</div>

<style>
  .grid-container {
    margin: 0 auto;
    overflow: auto;
  }

  .grid {
    display: grid;
    gap: 1px;
    background-color: var(--bg-secondary);
    padding: 1px;
    border-radius: var(--border-radius-md);
    margin: 0 auto;
  }

  .grid-header-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    font-weight: bold;
    border-radius: var(--border-radius-sm);
  }

  .row-header, .column-header {
    color: #4d57ff;
    font-size: 1.2rem;
    background-color: #f8f9ff;
  }

  .grid-header-cell.selected-table {
    background-color: #e6e9ff;
    color: #2c3ddf;
  }

  .grid-header-cell.empty-cell {
    background-color: var(--bg-secondary);
  }

  .grid-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: var(--border-radius-sm);
    font-size: 0.85rem;
    color: #555;
  }

  .grid-cell.current {
    background-color: #e6f4ff;
    box-shadow: 0 0 0 2px #4fb3ff;
  }

  .grid-cell.solved {
    background-color: #f5f8ff;
  }

  .grid-cell.not-selected {
    background-color: #f0f0f0;
    color: #aaa;
  }

  .result {
    font-weight: bold;
    color: var(--success-dark);
    font-size: 1.1rem;
  }

  .multiplication-text {
    color: #777;
    font-size: 0.85rem;
  }

  input {
    width: 90%;
    height: 80%;
    text-align: center;
    font-weight: bold;
    font-size: 1.1rem;
    border: 2px solid var(--primary);
    border-radius: var(--border-radius-sm);
  }

  input:focus {
    outline: none;
    border-color: var(--primary-dark);
    box-shadow: 0 0 0 3px rgba(77, 87, 255, 0.2);
  }

  input.correct {
    border-color: var(--success);
    background-color: rgba(67, 215, 135, 0.1);
  }

  input.incorrect {
    border-color: var(--secondary);
    background-color: rgba(255, 107, 107, 0.1);
  }

  /* Ensure the grid is responsive but readable */
  @media (max-width: 767px) {
    .grid-container {
      overflow-x: auto;
      max-width: 100%;
    }

    .row-header, .column-header {
      font-size: 1rem;
    }

    .multiplication-text {
      font-size: 0.75rem;
    }
  }
</style>