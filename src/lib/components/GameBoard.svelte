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
  // Réduire davantage la taille pour s'assurer que tout tient dans la fenêtre
  $: gridSize = Math.min(windowWidth - 40, windowHeight - 230, 680) / 11;
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
            <span class="solved-result">{grid[rowIndex][colIndex]}</span>
            <div class="confetti-explosion"></div>
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
    padding: 5px; /* Réduit le padding pour gagner de l'espace vertical */
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(11, var(--grid-size)); /* Utilise une variable CSS pour la taille */
    gap: 1px; /* Réduit davantage l'espacement entre les cellules */
    margin: 0 auto;
  }

  .grid-header-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-secondary);
    border-radius: calc(var(--border-radius-sm) - 2px); /* Réduit davantage le border-radius */
    font-weight: bold;
    color: var(--primary-dark);
    width: var(--grid-size);
    height: var(--grid-size);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.03); /* Réduit davantage l'ombre */
    font-size: calc(var(--grid-size) * 0.42); /* Ajuste légèrement la taille de police */
  }

  .grid-header-cell.inactive {
    background-color: var(--bg-primary);
    color: var(--text-light);
  }

  .grid-cell {
    width: var(--grid-size);
    height: var(--grid-size);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: calc(var(--border-radius-sm) - 2px); /* Réduit davantage le border-radius */
    font-weight: bold;
    position: relative;
    box-sizing: border-box;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.03); /* Réduit davantage l'ombre */
    border: 1px solid var(--bg-secondary); /* Conserve l'épaisseur de la bordure minimale */
    transition: all 0.2s;
  }
  
  .grid-cell:hover:not(.inactive):not(.current):not(.solved) {
    transform: translateY(-1px); /* Réduit l'effet de survol pour un design plus compact */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .grid-cell.current {
    background-color: var(--info-light);
    border: 1px solid var(--info);
    animation: pulse 2s infinite;
    box-shadow: 0 0 6px rgba(79, 179, 255, 0.4); /* Réduit l'ombre */
    z-index: 1;
  }

  .grid-cell.solved {
    background-color: var(--success-light);
    color: var(--success-dark);
    border-color: var(--success);
  }
  
  .solved-result {
    font-size: min(20px, calc(var(--grid-size) / 2));
    font-weight: bold;
  }
  
  .confetti-explosion {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  .grid-cell.inactive {
    background-color: var(--bg-primary);
    color: var(--text-light);
    border-color: var(--bg-primary);
    opacity: 0.6;
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
    font-size: min(12px, calc(var(--grid-size) / 3.5));
    color: var(--text-secondary);
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
    border: 2px solid var(--primary-light);
    border-radius: var(--border-radius-sm);
    padding: 0;
    box-sizing: border-box;
  }

  input.correct {
    border-color: var(--success);
    background-color: rgba(67, 215, 135, 0.1);
  }

  input.incorrect {
    border-color: var(--secondary);
    background-color: rgba(255, 107, 107, 0.1);
  }
  
  @keyframes confetti {
    0% { 
      transform: translateY(0) rotate(0deg); 
      opacity: 1;
    }
    100% { 
      transform: translateY(-100px) rotate(720deg); 
      opacity: 0;
    }
  }
</style>