<script>
  import { onMount, onDestroy } from 'svelte';

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
  let leaderboard = [];
  let playerName = '';
  let inputRef;
  let lastAnswerCorrect = null;
  let isSelectingNewCell = false; // Flag pour éviter les sélections multiples
  let level = 'adulte'; // 'adulte' ou 'enfant'
  
  // Grille de jeu (10x10)
  let grid = Array(10).fill().map(() => Array(10).fill(null));
  // Grille pour suivre les cellules déjà résolues
  let solvedCells = Array(10).fill().map(() => Array(10).fill(false));

  // Chargement du leaderboard depuis localStorage
  onMount(() => {
    try {
      const savedLeaderboard = localStorage.getItem('multiplicationLeaderboard');
      if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
      }
    } catch (e) {
      console.error('Erreur lors du chargement du leaderboard:', e);
      leaderboard = [];
    }
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
          unsolvedCells.push({ row: r, col: c });
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
      score += correctAnswer;
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
  function saveScore() {
    if (playerName.trim() === '') return;
    
    const newScore = {
      name: playerName,
      score: score,
      date: new Date().toISOString(),
      duration: gameDuration,
      level: level
    };
    
    leaderboard = [...leaderboard, newScore].sort((a, b) => b.score - a.score).slice(0, 10);
    
    try {
      localStorage.setItem('multiplicationLeaderboard', JSON.stringify(leaderboard));
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du leaderboard:', e);
    }
    
    playerName = '';
    gameState = 'notStarted';
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
      
      {#if leaderboard.length > 0}
        <div class="leaderboard">
          <h2>Meilleurs scores</h2>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Nom</th>
                <th>Score</th>
                <th>Durée</th>
                <th>Niveau</th>
              </tr>
            </thead>
            <tbody>
              {#each leaderboard as entry, i}
                <tr>
                  <td>{i + 1}</td>
                  <td>{entry.name}</td>
                  <td>{entry.score}</td>
                  <td>{entry.duration} min</td>
                  <td>{entry.level || 'adulte'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
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
    </div>
  {:else if gameState === 'finished'}
    <div class="end-screen">
      <h1>Partie terminée!</h1>
      <p>Votre score: <span class="final-score">{score}</span></p>
      <p>Niveau: <span class="final-level">{level === 'adulte' ? 'Adulte' : 'Enfant'}</span></p>
      
      <div class="save-score">
        <h2>Enregistrer votre score</h2>
        <form on:submit|preventDefault={saveScore}>
          <input 
            type="text" 
            bind:value={playerName} 
            placeholder="Votre prénom"
            required
          />
          <button type="submit">Sauvegarder</button>
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
  
  /* Grille */
  .grid-container {
    /*overflow-x: auto;*/
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
  
  /* Responsive */
  @media (max-width: 600px) {
    .grid {
      grid-template-columns: repeat(6, 1fr); /* 1 colonne pour les en-têtes + 5 colonnes pour la grille */
    }
    
    .grid-cell {
      font-size: 14px;
    }
    
    input[type="number"] {
      font-size: 14px;
    }
    
    .multiplication-text {
      font-size: 10px;
    }
    
    .game-header {
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }
  }
</style>