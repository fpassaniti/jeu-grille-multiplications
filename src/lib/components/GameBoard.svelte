<script>
  // Props
  export let grid;
  export let solvedCells;
  export let currentRow;
  export let currentCol;
  export let userAnswer = '';
  export let handleAnswerChange;
  export let handleSubmit;
  export let inputRef;
  export let lastAnswerCorrect = null;
  export let isSelectedTableCell;
  export let level;
  export let getSelectedTableNumbers;
  export let windowWidth;
  export let windowHeight;

  // Calculer la taille optimale de la grille en fonction de la fenêtre
  $: gridSize = Math.min(windowWidth - 40, windowHeight - 250, 900) / 11;
</script>

<div class="grid-container">
  <div class="grid" style="--grid-size: {gridSize}px;">
    <!-- En-tête des colonnes -->
    <div class="grid-header-cell"></div>
    {#each Array(10) as _, colIndex}
      <div
        class="grid-header-cell"
        class:inactive={level === 'enfant' && !getSelectedTableNumbers().includes(colIndex + 1)}
      >
        {colIndex + 1}
      </div>
    {/each}

    <!-- Lignes avec en-têtes -->
    {#each Array(10) as _, rowIndex}
      <!-- En-tête de ligne -->
      <div
        class="grid-header-cell"
        class:inactive={level === 'enfant' && !getSelectedTableNumbers().includes(rowIndex + 1)}
      >
        {rowIndex + 1}
      </div>

      <!-- Cellules de la grille -->
      {#each Array(10) as _, colIndex}
        {@const isSelected = isSelectedTableCell(rowIndex, colIndex)}
        <div
          class="grid-cell"
          class:current={rowIndex + 1 === currentRow && colIndex + 1 === currentCol}
          class:solved={solvedCells[rowIndex][colIndex]}
          class:inactive={!isSelected}
        >
          {#if solvedCells[rowIndex][colIndex]}
            <span>{grid[rowIndex][colIndex]}</span>
          {:else if rowIndex + 1 === currentRow && colIndex + 1 === currentCol}
            <form on:submit={handleSubmit} class="cell-form">
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
              />
            </form>
          {:else if isSelected}
            <div class="cell-content">
              <span class="multiplication-text">{rowIndex + 1}×{colIndex + 1}</span>
            </div>
          {/if}
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  /* Grille - Optimisée pour responsive */
  .grid-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    overflow: hidden; /* Supprime les barres de défilement */
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(11, var(--grid-size)); /* Utilise une variable CSS pour la taille */
    gap: 3px;
    margin: 0 auto;
  }

  .grid-header-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 5px;
    font-weight: bold;
    color: #555;
    width: var(--grid-size);
    height: var(--grid-size);
  }

  .grid-header-cell.inactive {
    background-color: #e0e0e0;
    color: #999;
  }

  .grid-cell {
    width: var(--grid-size);
    height: var(--grid-size);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e0e0e0;
    border-radius: 5px;
    font-weight: bold;
    position: relative;
    box-sizing: border-box;
  }

  .grid-cell.current {
    background-color: #bbdefb;
    border: 2px solid #2196f3;
  }

  .grid-cell.solved {
    background-color: #c8e6c9;
    color: #2e7d32;
  }

  .grid-cell.inactive {
    background-color: #f0f0f0;
    color: #bdbdbd;
  }

  .cell-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .multiplication-text {
    font-size: min(12px, calc(var(--grid-size) / 4));
    color: #757575;
  }

  .cell-form {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  input[type="number"] {
    width: 90%;
    height: 80%;
    font-size: min(16px, calc(var(--grid-size) / 3));
    text-align: center;
    border: 2px solid #ccc;
    border-radius: 5px;
    padding: 0;
    box-sizing: border-box;
  }

  input.correct {
    border-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.1);
  }

  input.incorrect {
    border-color: #f44336;
    background-color: rgba(244, 67, 54, 0.1);
  }
</style>