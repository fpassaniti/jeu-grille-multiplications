<script>
  import { _ } from '$lib/utils/i18n';

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
  <div class="current-multiplication-mobile card">
    <div class="multiplication-icon">✨</div>
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
        placeholder="Ta réponse"
      />
    </form>

    <div class="cell-timer-container">
      <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
    </div>
  </div>

  <div class="mobile-solved-info card">
    <h3><span class="emoji">🎯</span> {_('game.recentlySolved')}</h3>
    <div class="solved-list">
      {#if lastSolvedMultiplications.length === 0}
        <p class="no-solved">{_('game.noSolved')}</p>
      {:else}
        <div class="solved-grid">
          {#each lastSolvedMultiplications as solved}
            <div class="solved-item">
              <span class="solved-operation">{solved.row} × {solved.col} = {solved.result}</span>
              {#if solved.points !== undefined}
                <div class="points-earned">{_('game.pointsEarned', { points: solved.points })}</div>
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
    max-width: 320px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .multiplication-icon {
    font-size: 2rem;
    position: absolute;
    top: 10px;
    right: 15px;
    opacity: 0.3;
    animation: spin 10s linear infinite;
  }

  .multiplication-question {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 24px;
    color: var(--primary-dark);
    animation: pulse 2s infinite;
  }

  .mobile-form {
    margin-bottom: 20px;
  }

  .mobile-form input {
    width: 100%;
    padding: 15px;
    font-size: 1.5rem;
    text-align: center;
    border: 3px solid var(--primary-light);
    border-radius: var(--border-radius-md);
    box-sizing: border-box;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
  }

  .mobile-form input.correct {
    border-color: var(--success);
    background-color: rgba(67, 215, 135, 0.1);
  }

  .mobile-form input.incorrect {
    border-color: var(--secondary);
    background-color: rgba(255, 107, 107, 0.1);
  }

  .cell-timer-container {
    height: 10px;
    background-color: var(--bg-secondary);
    border-radius: 5px;
    margin-top: 15px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .cell-timer {
    height: 100%;
    background-color: var(--secondary);
    transition: width 0.1s linear;
  }

  .mobile-solved-info {
    width: 100%;
    max-width: 400px;
    padding: 20px;
  }
  
  .mobile-solved-info h3 {
    margin-top: 0;
    text-align: center;
  }
  
  .emoji {
    margin-right: 5px;
  }

  .solved-list {
    max-height: 250px;
    overflow-y: auto;
    padding: 5px;
  }
  
  .no-solved {
    text-align: center;
    color: var(--text-light);
    font-style: italic;
    padding: 15px 0;
  }

  .solved-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .solved-item {
    background-color: var(--success-light);
    padding: 12px;
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    color: var(--success-dark);
    min-width: 120px;
    text-align: center;
    box-shadow: 0 3px 0 var(--success-dark);
    position: relative;
    overflow: hidden;
    transition: transform 0.2s;
  }
  
  .solved-item:hover {
    transform: translateY(-3px);
  }
  
  .solved-operation {
    font-weight: bold;
  }

  .points-earned {
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--success-dark);
    margin-top: 5px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    padding: 2px 8px;
    display: inline-block;
  }
</style>