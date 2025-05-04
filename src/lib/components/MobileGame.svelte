<script>
  // Props
  export let currentRow;
  export let currentCol;
  export let userAnswer = '';
  export let handleAnswerChange;
  export let handleSubmit;
  export let inputRef;
  export let lastAnswerCorrect = null;
  export let cellTimer;
  export let maxCellTimer;
  export let lastSolvedMultiplications = [];
</script>

<div class="mobile-game">
  <div class="current-multiplication-mobile">
    <div class="multiplication-question">
      {currentRow} × {currentCol} = ?
    </div>

    <form on:submit={handleSubmit} class="mobile-form">
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
        placeholder="Votre réponse"
      />
    </form>

    <div class="cell-timer-container">
      <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
    </div>
  </div>

  <div class="mobile-solved-info">
    <h3>Dernières multiplications résolues</h3>
    <div class="solved-list">
      {#if lastSolvedMultiplications.length === 0}
        <p>Aucune multiplication résolue pour le moment.</p>
      {:else}
        <div class="solved-grid">
          {#each lastSolvedMultiplications as solved}
            <div class="solved-item">
              {solved.row} × {solved.col} = {solved.result}
              {#if solved.points !== undefined}
                <div class="points-earned">+{solved.points} pts</div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Version mobile du jeu */
  .mobile-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .current-multiplication-mobile {
    width: 100%;
    max-width: 300px;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    margin-bottom: 10px;
  }

  .multiplication-question {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }

  .mobile-form {
    margin-bottom: 15px;
  }

  .mobile-form input {
    width: 100%;
    padding: 15px;
    font-size: 24px;
    text-align: center;
    border: 2px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
  }

  .mobile-form input.correct {
    border-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.1);
  }

  .mobile-form input.incorrect {
    border-color: #f44336;
    background-color: rgba(244, 67, 54, 0.1);
  }

  .cell-timer-container {
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    margin-top: 10px;
    overflow: hidden;
  }

  .cell-timer {
    height: 100%;
    background-color: #f44336;
    transition: width 0.1s linear;
  }

  .mobile-solved-info {
    width: 100%;
    max-width: 400px;
    padding: 15px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 10px;
  }

  .solved-list {
    max-height: 200px;
    overflow-y: auto;
    padding: 5px;
  }

  .solved-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }

  .solved-item {
    background-color: #e8f5e9;
    padding: 8px;
    border-radius: 5px;
    font-size: 14px;
    color: #2e7d32;
    min-width: 100px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .points-earned {
    font-size: 12px;
    font-weight: bold;
    color: #4caf50;
    margin-top: 3px;
  }
</style>