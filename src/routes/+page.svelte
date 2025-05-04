<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Importation des composants
  import GameBoard from '$lib/components/GameBoard.svelte';
  import MobileGame from '$lib/components/MobileGame.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import TableSelector from '$lib/components/TableSelector.svelte';

  // Importation des stores et utilitaires
  import { formatTime } from '$lib/utils/formatters';
  import { selectedTables, getSelectedTableNumbers } from '$lib/stores/gameStore';

  // Données des leaderboards chargées côté serveur
  export let data;

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
  let windowWidth = 0;
  let windowHeight = 0;

  // Variables pour suivre les dernières multiplications résolues (pour le mode mobile)
  let lastSolvedMultiplications = [];
  const MAX_LAST_SOLVED = 10; // Nombre maximal de dernières multiplications à afficher

  // Grille de jeu (10x10)
  let grid = Array(10).fill().map(() => Array(10).fill(null));
  // Grille pour suivre les cellules déjà résolues
  let solvedCells = Array(10).fill().map(() => Array(10).fill(false));

  // Mettre à jour les leaderboards depuis les données chargées côté serveur
  $: {
    if (data.leaderboardAdult) {
      leaderboardAdult = data.leaderboardAdult;
    }
    if (data.leaderboardChild) {
      leaderboardChild = data.leaderboardChild;
    }
  }

  // Vérifier si l'appareil est mobile et obtenir les dimensions de la fenêtre
  function updateDimensions() {
    if (!browser) return;
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    isMobile = windowWidth < 768;
  }

  // Chargement des leaderboards (mise à jour en temps réel)
  async function loadLeaderboards() {
    try {
      isLoading = true;
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Erreur réseau');

      const leaderboardData = await response.json();
      leaderboardAdult = leaderboardData.adult;
      leaderboardChild = leaderboardData.child;
    } catch (e) {
      console.error('Erreur lors du chargement des leaderboards:', e);
      // Fallback sur localStorage (utilisé uniquement en cas d'erreur réseau)
      if (browser) {
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
      }
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    updateDimensions();
    if (browser) {
      window.addEventListener('resize', updateDimensions);
      loadSelectedTables();
    }
    return () => {
      if (browser) {
        window.removeEventListener('resize', updateDimensions);
      }
    };
  });

  // Chargement des tables sélectionnées depuis localStorage
  function loadSelectedTables() {
    if (!browser) return;
    try {
      const savedTables = localStorage.getItem('selectedMultiplicationTables');
      if (savedTables) {
        $selectedTables = JSON.parse(savedTables);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tables sélectionnées:', error);
    }
  }

  // Sauvegarde des tables sélectionnées dans localStorage
  function saveSelectedTables() {
    if (!browser) return;
    try {
      localStorage.setItem('selectedMultiplicationTables', JSON.stringify($selectedTables));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tables sélectionnées:', error);
    }
  }

  // Fonction pour démarrer le jeu
  function startGame() {
    gameState = 'playing';
    score = 0;
    gameTimer = gameDuration * 60;
    lastSolvedMultiplications = []; // Réinitialiser les dernières multiplications résolues

    // Réinitialiser la grille et les cellules résolues
    grid = Array(10).fill().map(() => Array(10).fill(null));
    solvedCells = Array(10).fill().map(() => Array(10).fill(false));

    // Si en mode enfant et aucune table sélectionnée, sélectionner toutes les tables
    if (level === 'enfant' && getSelectedTableNumbers().length === 0) {
      $selectedTables = Array(10).fill(true);
      saveSelectedTables();
    }

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

    // Construire la liste des cellules disponibles selon le mode
    const availableCells = [];

    // En mode adulte, toutes les cellules sont disponibles
    if (level === 'adulte') {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (!solvedCells[r][c]) {
            availableCells.push({row: r, col: c});
          }
        }
      }
    } else {
      // En mode enfant, seules les cellules concernant les tables sélectionnées sont disponibles
      const selectedNums = getSelectedTableNumbers();

      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          // Une cellule est sélectionnable si sa ligne OU sa colonne fait partie des tables sélectionnées
          if (!solvedCells[r][c] && (selectedNums.includes(r + 1) || selectedNums.includes(c + 1))) {
            availableCells.push({row: r, col: c});
          }
        }
      }
    }

    // Si toutes les cellules disponibles sont résolues, terminer le jeu
    if (availableCells.length === 0) {
      endGame();
      isSelectingNewCell = false;
      return;
    }

    // Sélectionner aléatoirement une cellule non résolue
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const selectedCell = availableCells[randomIndex];

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

      // Ajouter cette multiplication aux dernières résolues (pour le mode mobile)
      const newSolved = {
        row: currentRow,
        col: currentCol,
        result: correctAnswer,
        timestamp: Date.now()
      };

      lastSolvedMultiplications = [newSolved, ...lastSolvedMultiplications].slice(0, MAX_LAST_SOLVED);

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

  // Fonction pour sauvegarder le score (sécurisée via l'API)
  async function saveScore() {
    if (playerName.trim() === '') return;

    const gameData = {
      name: playerName,
      score: score,
      duration: gameDuration,
      level: level,
      solvedCells: level === 'adulte'
        ? solvedCountAdult
        : solvedCountChild.count,
      totalPossibleCells: level === 'adulte'
        ? 100
        : solvedCountChild.total,
      selectedTables: level === 'enfant' ? getSelectedTableNumbers() : []
    };

    try {
      isLoading = true;

      // Utiliser l'endpoint sécurisé pour sauvegarder le score
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde du score');
      }

      // Recharger les leaderboards après sauvegarde
      await loadLeaderboards();

      // Réinitialiser et retourner à l'écran d'accueil
      playerName = '';
      gameState = 'notStarted';

    } catch (e) {
      console.error('Erreur lors de la sauvegarde du score:', e);
      alert(`Erreur: ${e.message || 'Impossible de sauvegarder le score en ligne'}. Essayez à nouveau plus tard.`);
    } finally {
      isLoading = false;
    }
  }

  // Fonction pour gérer la sélection d'une table
  function toggleTable(index) {
    $selectedTables[index] = !$selectedTables[index];
    saveSelectedTables();
  }

  // Fonction pour sélectionner ou désélectionner toutes les tables
  function selectAllTables(select) {
    $selectedTables = Array(10).fill(select);
    saveSelectedTables();
  }

  // Nettoyage des intervalles à la destruction du composant
  onDestroy(() => {
    clearInterval(gameTimerInterval);
    clearInterval(cellTimerInterval);
  });

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
  $: currentLeaderboard = level === 'adulte' ? leaderboardAdult : leaderboardChild;

  // Variables réactives pour le suivi des multiplications résolues
  $: solvedCountAdult = (() => {
    if (level !== 'adulte') return 0;
    let count = 0;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (solvedCells[r][c]) count++;
      }
    }
    return count;
  })();

  $: solvedCountChild = (() => {
    if (level !== 'enfant') return { count: 0, total: 0 };
    const selectedNums = getSelectedTableNumbers();
    let count = 0;
    let total = 0;

    // Pour chaque cellule du tableau 10x10
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        // Une cellule fait partie des tables sélectionnées si sa ligne OU sa colonne est dans les tables sélectionnées
        if (selectedNums.includes(r + 1) || selectedNums.includes(c + 1)) {
          total++;
          if (solvedCells[r][c]) count++;
        }
      }
    }

    return { count, total };
  })();

  // Pour le pourcentage de progression
  $: progressPercentage = level === 'adulte'
    ? solvedCountAdult
    : (solvedCountChild.total > 0 ? (solvedCountChild.count / solvedCountChild.total) * 100 : 0);

  // Vérifie si une cellule fait partie des tables sélectionnées (pour l'affichage de la grille)
  function isSelectedTableCell(row, col) {
    if (level === 'adulte') return true;
    const selectedNums = getSelectedTableNumbers();
    return selectedNums.includes(row + 1) || selectedNums.includes(col + 1);
  }
</script>

<svelte:head>
  <title>Jeu de Multiplication</title>
  <meta name="description" content="Améliorez vos compétences en multiplication avec ce jeu interactif" />
</svelte:head>

<main class="container" style="max-width: {windowWidth > 1200 ? '1200px' : '100%'}">
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

        {#if level === 'enfant'}
          <TableSelector
            {toggleTable}
            {selectAllTables}
            selectedNumbers={getSelectedTableNumbers()}
          />
        {/if}

        <div class="option-section">
          <h2>Choisissez la durée:</h2>
          <div class="option-buttons">
            <button class:active={gameDuration === 2} on:click={() => setGameDuration(2)}>2 minutes</button>
            <button class:active={gameDuration === 3} on:click={() => setGameDuration(3)}>3 minutes</button>
            <button class:active={gameDuration === 5} on:click={() => setGameDuration(5)}>5 minutes</button>
          </div>
        </div>
      </div>

      <button
        class="start-button"
        on:click={startGame}
        disabled={level === 'enfant' && getSelectedTableNumbers().length === 0}
      >
        Commencer
      </button>

      <Leaderboard
        {isLoading}
        {level}
        leaderboard={currentLeaderboard}
      />
    </div>
  {:else if gameState === 'playing'}
    <div class="game-screen">
      <div class="game-header">
        <div class="timer">Temps: {formatTime(gameTimer)}</div>
        <div class="level">Niveau: {level === 'adulte' ? 'Adulte' : 'Enfant'}</div>
        <div class="score">Score: {score}</div>
      </div>

      <div class="progress-container">
        {#if level === 'adulte'}
          <div class="progress-label">Multiplications résolues: {solvedCountAdult}/100</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progressPercentage}%"></div>
          </div>
        {:else}
          {#if getSelectedTableNumbers().length > 0}
            <div class="progress-label">Multiplications résolues: {solvedCountChild.count}/{solvedCountChild.total}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {progressPercentage}%"></div>
            </div>
          {:else}
            <div class="progress-label">Aucune table sélectionnée</div>
          {/if}
        {/if}
      </div>

      {#if level === 'enfant'}
        <div class="tables-info">
          <span>Tables sélectionnées: {getSelectedTableNumbers().join(', ')}</span>
        </div>
      {/if}

      {#if isMobile}
        <MobileGame
          {currentRow}
          {currentCol}
          bind:userAnswer
          {handleAnswerChange}
          {handleSubmit}
          bind:inputRef
          {lastAnswerCorrect}
          {cellTimer}
          {maxCellTimer}
          {lastSolvedMultiplications}
        />
      {:else}
        <div class="current-multiplication">
          <span>Multiplication actuelle: {currentRow} × {currentCol}</span>
          <div class="cell-timer-container">
            <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
          </div>
        </div>

        <GameBoard
          {grid}
          {solvedCells}
          {currentRow}
          {currentCol}
          bind:userAnswer
          {handleAnswerChange}
          {handleSubmit}
          bind:inputRef
          {lastAnswerCorrect}
          {isSelectedTableCell}
          {level}
          {getSelectedTableNumbers}
          {windowWidth}
          {windowHeight}
        />
      {/if}
    </div>
  {:else if gameState === 'finished'}
    <div class="end-screen">
      <h1>Partie terminée!</h1>
      <p>Votre score: <span class="final-score">{score}</span></p>
      <p>Niveau: <span class="final-level">{level === 'adulte' ? 'Adulte' : 'Enfant'}</span></p>

      {#if level === 'adulte'}
        <p>Multiplications résolues: <span class="final-solved">{solvedCountAdult}/100</span></p>
      {:else}
        <p>Multiplications résolues: <span class="final-solved">{solvedCountChild.count}/{solvedCountChild.total}</span></p>
        <p>Tables pratiquées: <span class="final-tables">{getSelectedTableNumbers().join(', ')}</span></p>
      {/if}

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
    overflow-x: hidden; /* Empêche le défilement horizontal sur la page */
  }

  .container {
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
    width: 100%;
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

  .tables-info {
    text-align: center;
    margin-bottom: 15px;
    color: #666;
    font-style: italic;
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

  .start-button:hover:not(:disabled) {
    background-color: #0b7dda;
  }

  .start-button:disabled {
    background-color: #9e9e9e;
    cursor: not-allowed;
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

  .final-tables {
    font-weight: bold;
    color: #ff9800;
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