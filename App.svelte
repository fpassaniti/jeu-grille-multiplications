<script>
  import { onMount, onDestroy } from 'svelte';
  import { createClient } from '@supabase/supabase-js';

  // Configuration Supabase avec les variables d'environnement de Vercel
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // États du jeu
  let gameState = 'notStarted'; // notStarted, playing, finished
  let gameDuration = 3; // minutes (options: 2, 3, 5)
  let gameTimer = gameDuration * 60; // en secondes
  let score = 0;
  let currentRow = 0;
  let currentCol = 0;
  let cellTimer = 0;
  let maxCellTimer = 0;
  let userAnswer = '';
  let gameTimerInterval;
  let cellTimerInterval;
  let leaderboardAdult = [];
  let leaderboardChild = [];
  let playerName = '';
  let inputRef;
  let lastAnswerCorrect = null;
  let isSelectingNewCell = false; // Flag pour éviter les sélections multiples
  let level = 'adulte'; // 'adulte' ou 'enfant'
  let isMobile = false;
  let isLoading = false;

  // Grille de jeu (10x10)
  let grid = Array(10).fill().map(() => Array(10).fill(null));
  // Grille pour suivre les cellules déjà résolues
  let solvedCells = Array(10).fill().map(() => Array(10).fill(false));

  // Vérifier si l'appareil est mobile
  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }

  // Chargement des leaderboards depuis Supabase
  async function loadLeaderboards() {
    try {
      isLoading = true;

      // Charger les scores des adultes
      const {data: adultData, error: adultError} = await supabase
        .from('scores')
        .select('*')
        .eq('level', 'adulte')
        .order('score', {ascending: false})
        .limit(10);

      if (adultError) throw adultError;
      leaderboardAdult = adultData || [];

      // Charger les scores des enfants
      const {data: childData, error: childError} = await supabase
        .from('scores')
        .select('*')
        .eq('level', 'enfant')
        .order('score', {ascending: false})
        .limit(10);

      if (childError) throw childError;
      leaderboardChild = childData || [];

    } catch (e) {
      console.error('Erreur lors du chargement des leaderboards:', e);
      // Fallback sur localStorage si Supabase échoue
      try {
        const savedLeaderboardAdult = localStorage.getItem('multiplicationLeaderboardAdult');
        const savedLeaderboardChild = localStorage.getItem('multiplicationLeaderboardChild');

        if (savedLeaderboardAdult) {
          leaderboardAdult = JSON.parse(savedLeaderboardAdult);
        }

        if (savedLeaderboardChild) {
          leaderboardChild = JSON.parse(savedLeaderboardChild);
        }
      } catch (localError) {
        console.error('Erreur lors du chargement du leaderboard local:', localError);
      }
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    loadLeaderboards();

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

  // Fonction pour démarrer le jeu
  function startGame() {
    gameState = 'playing';
    score = 0;
    gameTimer = gameDuration * 60;

    // Réinitialiser la grille et les cellules résolues
    grid = Array(10).fill().map(() => Array(10).fill(null));
    solvedCells = Array(10).fill().map(() => Array(10).fill(false));

    startGameTimer();
    selectNewMultiplication();
  }

  // Fonction pour le timer global du jeu
  function startGameTimer() {
    gameTimerInterval = setInterval(() => {
      gameTimer--;
      if (gameTimer <= 0) {
        endGame();
      }
    }, 1000);
  }

  // Fonction pour sélectionner une nouvelle multiplication non résolue
  function selectNewMultiplication() {
    // Éviter les sélections multiples
    if (isSelectingNewCell) return;
    isSelectingNewCell = true;

    // Vérifier s'il reste des cellules non résolues
    const unsolvedCells = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (!solvedCells[r][c]) {
          unsolvedCells.push({row: r, col: c});
        }
      }
    }

    // Si toutes les cellules sont résolues, terminer le jeu
    if (unsolvedCells.length === 0) {
      endGame();
      isSelectingNewCell = false;
      return;
    }

    // Sélectionner aléatoirement une cellule non résolue
    const randomIndex = Math.floor(Math.random() * unsolvedCells.length);
    const selectedCell = unsolvedCells[randomIndex];

    currentRow = selectedCell.row + 1; // +1 car les indices commencent à 0
    currentCol = selectedCell.col + 1;

    // Calcul du temps pour cette cellule (5-15 secondes selon la difficulté)
    const difficulty = (currentRow + currentCol) / 20; // 0.1 à 1
    let baseTimer = Math.floor(5 + difficulty * 10);

    // Ajuster le timer selon le niveau
    maxCellTimer = level === 'enfant' ? baseTimer * 3 : baseTimer;
    cellTimer = maxCellTimer;

    // Démarrer le timer pour cette cellule
    if (cellTimerInterval) clearInterval(cellTimerInterval);
    cellTimerInterval = setInterval(() => {
      cellTimer--;
      if (cellTimer <= 0) {
        // Temps écoulé pour cette cellule
        clearInterval(cellTimerInterval);
        lastAnswerCorrect = false;
        userAnswer = '';

        // Attendre un moment avant de passer à la cellule suivante
        setTimeout(() => {
          lastAnswerCorrect = null;
          selectNewMultiplication();
        }, 1000);
      }
    }, 1000);

    // Réinitialiser la réponse de l'utilisateur
    userAnswer = '';

    // Focus sur l'input
    setTimeout(() => {
      if (inputRef) inputRef.focus();
      isSelectingNewCell = false; // Réinitialiser le flag
    }, 0);
  }

  // Fonction pour vérifier la réponse
  function checkAnswer() {
    const correctAnswer = currentRow * currentCol;
    const userAnswerNum = parseInt(userAnswer, 10);

    if (userAnswerNum === correctAnswer) {
      // Réponse correcte
      // Nouveau calcul du score basé sur le temps restant
      score += cellTimer; // Ajoute le nombre de secondes restantes au score

      lastAnswerCorrect = true;

      // Marquer la cellule comme résolue et afficher le résultat
      solvedCells[currentRow - 1][currentCol - 1] = true;
      grid[currentRow - 1][currentCol - 1] = correctAnswer;

      clearInterval(cellTimerInterval);

      // Attendre un moment avant de passer à la cellule suivante
      setTimeout(() => {
        lastAnswerCorrect = null;
        selectNewMultiplication();
      }, 500);
    } else {
      // Réponse incorrecte
      lastAnswerCorrect = false;
    }
  }

  // Fonction pour surveiller les changements de réponse
  function handleAnswerChange() {
    // Vérifier automatiquement si la réponse est correcte
    if (userAnswer) {
      checkAnswer();
    }
  }

  // Fonction pour terminer le jeu
  function endGame() {
    clearInterval(gameTimerInterval);
    clearInterval(cellTimerInterval);
    gameState = 'finished';
  }

  // Fonction pour sauvegarder le score
  async function saveScore() {
    if (playerName.trim() === '') return;

    const newScore = {
      name: playerName,
      score: score,
      date: new Date().toISOString(),
      duration: gameDuration,
      level: level
    };

    try {
      isLoading = true;

      // Sauvegarder le score dans Supabase
      const {error} = await supabase
        .from('scores')
        .insert([newScore]);

      if (error) throw error;

      // Mettre à jour le leaderboard local
      if (level === 'adulte') {
        leaderboardAdult = [...leaderboardAdult, newScore]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        localStorage.setItem('multiplicationLeaderboardAdult', JSON.stringify(leaderboardAdult));
      } else {
        leaderboardChild = [...leaderboardChild, newScore]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        localStorage.setItem('multiplicationLeaderboardChild', JSON.stringify(leaderboardChild));
      }

      // Recharger les leaderboards depuis le serveur
      await loadLeaderboards();

    } catch (e) {
      console.error('Erreur lors de la sauvegarde du score:', e);

      // Fallback sur localStorage si Supabase échoue
      if (level === 'adulte') {
        leaderboardAdult = [...leaderboardAdult, newScore]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        localStorage.setItem('multiplicationLeaderboardAdult', JSON.stringify(leaderboardAdult));
      } else {
        leaderboardChild = [...leaderboardChild, newScore]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        localStorage.setItem('multiplicationLeaderboardChild', JSON.stringify(leaderboardChild));
      }

      alert('Impossible de sauvegarder le score en ligne. Le score a été sauvegardé localement.');
    } finally {
      isLoading = false;
      playerName = '';
      gameState = 'notStarted';
    }
  }

  // Nettoyage des intervalles à la destruction du composant
  onDestroy(() => {
    clearInterval(gameTimerInterval);
    clearInterval(cellTimerInterval);
  });

  // Formatage du temps (mm:ss)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Gestion de la soumission du formulaire (pour éviter le rechargement de la page)
  function handleSubmit(event) {
    event.preventDefault();
  }

  // Gestion du changement de durée du jeu
  function setGameDuration(duration) {
    gameDuration = duration;
  }

  // Gestion du changement de niveau
  function setLevel(newLevel) {
    level = newLevel;
  }

  // Fonction pour obtenir le leaderboard actuel selon le niveau
  function getCurrentLeaderboard() {
    return level === 'adulte' ? leaderboardAdult : leaderboardChild;
  }

  // Calcul du nombre de multiplications résolues
  function getSolvedCount() {
    let count = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (solvedCells[r][c]) count++;
      }
    }
    return count;
  }
</script>

<main class="container">
  {#if gameState === 'notStarted'}
    <div class="start-screen">
      <h1>Jeu de Multiplication</h1>
      <p>Résolvez autant de multiplications que possible avant la fin du temps!</p>

      <div class="game-options">
        <div class="option-section">
          <h2>Choisissez le niveau:</h2>
          <div class="option-buttons">
            <button class:active={level === 'adulte'} on:click={() => setLevel('adulte')}>Adulte</button>
            <button class:active={level === 'enfant'} on:click={() => setLevel('enfant')}>Enfant</button>
          </div>
          <p class="option-description">
            {level === 'adulte' ? 'Temps de réponse: 5-15 secondes' : 'Temps de réponse: 15-45 secondes'}
          </p>
        </div>

        <div class="option-section">
          <h2>Choisissez la durée:</h2>
          <div class="option-buttons">
            <button class:active={gameDuration === 2} on:click={() => setGameDuration(2)}>2 minutes</button>
            <button class:active={gameDuration === 3} on:click={() => setGameDuration(3)}>3 minutes</button>
            <button class:active={gameDuration === 5} on:click={() => setGameDuration(5)}>5 minutes</button>
          </div>
        </div>
      </div>

      <button class="start-button" on:click={startGame}>Commencer</button>

      {#if isLoading}
        <div class="loading">Chargement des scores...</div>
      {:else}
        <div class="leaderboard">
          <h2>Meilleurs scores ({level === 'adulte' ? 'Adulte' : 'Enfant'})</h2>
          {#if getCurrentLeaderboard().length > 0}
            <table>
              <thead>
              <tr>
                <th>Rang</th>
                <th>Nom</th>
                <th>Score</th>
                <th>Durée</th>
              </tr>
              </thead>
              <tbody>
              {#each getCurrentLeaderboard() as entry, i}
                <tr>
                  <td>{i + 1}</td>
                  <td>{entry.name}</td>
                  <td>{entry.score}</td>
                  <td>{entry.duration} min</td>
                </tr>
              {/each}
              </tbody>
            </table>
          {:else}
            <p>Aucun score enregistré pour ce niveau.</p>
          {/if}
        </div>
      {/if}
    </div>
  {:else if gameState === 'playing'}
    <div class="game-screen">
      <div class="game-header">
        <div class="timer">Temps: {formatTime(gameTimer)}</div>
        <div class="level">Niveau: {level === 'adulte' ? 'Adulte' : 'Enfant'}</div>
        <div class="score">Score: {score}</div>
      </div>

      <div class="progress-container">
        <div class="progress-label">Multiplications résolues: {getSolvedCount()}/100</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {getSolvedCount()}%"></div>
        </div>
      </div>

      {#if isMobile}
        <!-- Version mobile - Affichage simplifié sans grille -->
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
              {#if getSolvedCount() === 0}
                <p>Aucune multiplication résolue pour le moment.</p>
              {:else}
                <div class="solved-grid">
                  {#each Array(10) as _, rowIndex}
                    {#each Array(10) as _, colIndex}
                      {#if solvedCells[rowIndex][colIndex]}
                        <div class="solved-item">
                          {rowIndex + 1} × {colIndex + 1} = {grid[rowIndex][colIndex]}
                        </div>
                      {/if}
                    {/each}
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <!-- Version desktop - Affichage avec grille -->
        <div class="current-multiplication">
          <span>Multiplication actuelle: {currentRow} × {currentCol}</span>
          <div class="cell-timer-container">
            <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
          </div>
        </div>

        <div class="grid-container">
          <div class="grid">
            <!-- En-tête des colonnes -->
            <div class="grid-header-cell"></div>
            {#each Array(10) as _, colIndex}
              <div class="grid-header-cell">{colIndex + 1}</div>
            {/each}

            <!-- Lignes avec en-têtes -->
            {#each Array(10) as _, rowIndex}
              <!-- En-tête de ligne -->
              <div class="grid-header-cell">{rowIndex + 1}</div>

              <!-- Cellules de la grille -->
              {#each Array(10) as _, colIndex}
                <div
                  class="grid-cell"
                  class:current={rowIndex + 1 === currentRow && colIndex + 1 === currentCol}
                  class:solved={solvedCells[rowIndex][colIndex]}
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
                  {:else}
                    <div class="cell-content">
                      <span class="multiplication-text">{rowIndex + 1}×{colIndex + 1}</span>
                    </div>
                  {/if}
                </div>
              {/each}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else if gameState === 'finished'}
    <div class="end-screen">
      <h1>Partie terminée!</h1>
      <p>Votre score: <span class="final-score">{score}</span></p>
      <p>Niveau: <span class="final-level">{level === 'adulte' ? 'Adulte' : 'Enfant'}</span></p>
      <p>Multiplications résolues: <span class="final-solved">{getSolvedCount()}/100</span></p>

      <div class="save-score">
        <h2>Enregistrer votre score</h2>
        <form on:submit|preventDefault={saveScore}>
          <input
            type="text"
            bind:value={playerName}
            placeholder="Votre prénom"
            required
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      <button class="restart-button" on:click={() => gameState = 'notStarted'}>Retour à l'accueil</button>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f5f5;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1 {
    color: #333;
    text-align: center;
    margin-bottom: 20px;
  }

  h2 {
    color: #555;
    margin-bottom: 15px;
  }

  h3 {
    color: #666;
    margin-bottom: 10px;
    font-size: 18px;
  }

  /* Écran de démarrage */
  .start-screen {
    text-align: center;
  }

  .game-options {
    margin: 30px 0;
  }

  .option-section {
    margin-bottom: 20px;
  }

  .option-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 10px;
  }

  .option-buttons button {
    padding: 10px 20px;
    background-color: #e0e0e0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-buttons button.active {
    background-color: #4caf50;
    color: white;
  }

  .option-description {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }

  .start-button {
    padding: 15px 30px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 18px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 30px;
  }

  .start-button:hover {
    background-color: #0b7dda;
  }

  /* Écran de jeu */
  .game-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: bold;
  }

  .timer {
    color: #f44336;
  }

  .level {
    color: #9c27b0;
  }

  .score {
    color: #4caf50;
  }

  .progress-container {
    margin-bottom: 20px;
  }

  .progress-label {
    font-size: 16px;
    margin-bottom: 5px;
    color: #555;
  }

  .progress-bar {
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #4caf50;
    transition: width 0.3s ease;
  }

  .current-multiplication {
    text-align: center;
    margin-bottom: 20px;
    font-size: 20px;
    font-weight: bold;
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

  /* Version mobile du jeu */
  .mobile-game {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .current-multiplication-mobile {
    width: 100%;
    max-width: 300px;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
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

  .mobile-solved-info {
    width: 100%;
    padding: 15px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .solved-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .solved-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .solved-item {
    background-color: #e8f5e9;
    padding: 8px;
    border-radius: 5px;
    font-size: 14px;
    color: #2e7d32;
  }

  /* Grille */
  .grid-container {
    overflow-x: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(11, 1fr); /* 1 colonne pour les en-têtes + 10 colonnes pour la grille */
    gap: 5px;
    margin-top: 20px;
  }

  .grid-header-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 5px;
    font-weight: bold;
    color: #555;
    aspect-ratio: 1;
  }

  .grid-cell {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e0e0e0;
    border-radius: 5px;
    font-weight: bold;
    position: relative;
  }

  .grid-cell.current {
    background-color: #bbdefb;
    border: 2px solid #2196f3;
  }

  .grid-cell.solved {
    background-color: #c8e6c9;
    color: #2e7d32;
  }

  .cell-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .multiplication-text {
    font-size: 12px;
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
    font-size: 16px;
    text-align: center;
    border: 2px solid #ccc;
    border-radius: 5px;
    padding: 0;
  }

  input.correct {
    border-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.1);
  }

  input.incorrect {
    border-color: #f44336;
    background-color: rgba(244, 67, 54, 0.1);
  }

  /* Écran de fin */
  .end-screen {
    text-align: center;
  }

  .final-score {
    font-size: 32px;
    font-weight: bold;
    color: #4caf50;
  }

  .final-level {
    font-weight: bold;
    color: #9c27b0;
  }

  .final-solved {
    font-weight: bold;
    color: #2196f3;
  }

  .save-score {
    margin: 30px 0;
  }

  .save-score input {
    padding: 10px;
    font-size: 16px;
    margin-right: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  .save-score button {
    padding: 10px 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .save-score button:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
  }

  .restart-button {
    padding: 15px 30px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 18px;
    cursor: pointer;
  }

  /* Tableau des scores */
  .leaderboard {
    margin-top: 30px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }

  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
  }

  .loading {
    margin: 20px 0;
    color: #666;
    font-style: italic;
  }

  /* Responsive */
  @media (max-width: 767px) {
    .container {
      padding: 10px;
    }

    .game-header {
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .option-buttons {
      flex-direction: column;
      gap: 10px;
    }

    .save-score input, .save-score button {
      width: 100%;
      margin: 5px 0;
    }
  }
</style>