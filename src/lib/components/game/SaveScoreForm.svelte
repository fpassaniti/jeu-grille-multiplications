<script>
  // Props
  export let isLoggedIn = false;
  export let playerName = '';
  export let saveScore = () => {};
  export let isLoading = false;
  export let scoreSaved = false;
  export let gameResults = null;
</script>

{#if !isLoggedIn}
  <div class="save-score card-inset" class:saved={scoreSaved}>
    <h2>Enregistre ton score</h2>
    <form on:submit|preventDefault={saveScore}>
      <div class="save-score-wrapper">
        <input
          type="text"
          bind:value={playerName}
          placeholder="Ton prénom"
          required
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  </div>
{:else if scoreSaved && gameResults}
  <div class="save-score card-inset saved">
    <div class="score-saved-message">
      <span class="emoji">✅</span> Score sauvegardé avec succès!
      <p class="xp-confirmation">Tu as gagné {gameResults.xpEarned} points d'expérience.</p>
    </div>
  </div>
{/if}

<style>
  .save-score {
    margin: 30px auto;
    max-width: 500px;
    width: 100%;
    box-sizing: border-box;
  }

  .save-score form {
    margin-top: 15px;
    width: 100%;
    box-sizing: border-box;
  }

  .save-score-wrapper {
    display: flex;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .save-score input {
    flex: 1;
    padding: 12px 16px;
    font-size: 1rem;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .save-score button {
    padding: 12px 20px;
    background-color: var(--success);
    color: white;
    box-shadow: 0 4px 0 var(--success-dark);
    white-space: nowrap;
    min-width: 110px;
  }

  .save-score button:hover {
    background-color: var(--success-light);
  }

  .save-score button:disabled {
    background-color: #e0e0e0;
    box-shadow: 0 4px 0 #bdbdbd;
  }

  .save-score.saved {
    background-color: var(--success-light);
    transition: background-color 0.3s ease;
  }

  .score-saved-message {
    padding: 15px;
    color: var(--success-dark);
    font-weight: bold;
  }

  .xp-confirmation {
    margin-top: 10px;
    font-weight: normal;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  @media (max-width: 767px) {
    .save-score {
      padding: 15px;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .save-score form {
      width: 100%;
      padding: 0;
    }

    .save-score-wrapper {
      flex-direction: column;
      width: 100%;
    }

    .save-score input, .save-score button {
      width: 100%;
      margin: 5px 0;
      box-sizing: border-box;
    }
  }
</style>