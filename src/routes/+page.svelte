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
  import { calculateScore } from '$lib/utils/game-logic';
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
      // Calcul du score avec multiplicateur de difficulté
      const earnedPoints = calculateScore(cellTimer, currentRow, currentCol, level);
      score += earnedPoints;

      lastAnswerCorrect = true;

      // Marquer la cellule comme résolue et afficher le résultat
      solvedCells[currentRow - 1][currentCol - 1] = true;
      grid[currentRow - 1][currentCol - 1] = correctAnswer;

      // Ajouter cette multiplication aux dernières résolues (pour le mode mobile)
      const newSolved = {
        row: currentRow,
        col: currentCol,
        result: correctAnswer,
        points: earnedPoints, // Ajout des points gagnés pour affichage
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
  <title>MultyFun - Jeu de Multiplication</title>
  <meta name="description" content="Améliorez vos compétences en multiplication avec ce jeu interactif amusant pour les enfants et les adultes!" />
</svelte:head>

<main class="container" style="max-width: {windowWidth > 1200 ? '1200px' : '100%'}; width: 100%; box-sizing: border-box;">
  {#if gameState === 'notStarted'}
    <div class="start-screen card">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-text">MultyFun</span>
          <div class="logo-icon">
            <span class="math-symbol">×</span>
          </div>
        </div>
      </div>

      <h1>Jeu de Multiplication</h1>
      <p class="game-intro">Résous autant de multiplications que possible avant la fin du temps!</p>

      <div class="game-options">
        <div class="option-section card-inset">
          <h2>Choisis ton niveau:</h2>
          <div class="option-buttons">
            <button class:active={level === 'adulte'} on:click={() => setLevel('adulte')}>
              <span class="emoji">👨‍💼</span> Adulte
            </button>
            <button class:active={level === 'enfant'} on:click={() => setLevel('enfant')}>
              <span class="emoji">👶</span> Enfant
            </button>
          </div>
          <p class="option-description">
            {level === 'adulte' ? 'Temps de réponse: 5-15 secondes' : 'Temps de réponse: 15-45 secondes'}
          </p>
        </div>

        {#if level === 'enfant'}
          <div class="option-section card-inset">
            <TableSelector
              {toggleTable}
              {selectAllTables}
              selectedNumbers={getSelectedTableNumbers()}
            />
          </div>
        {/if}

        <div class="option-section card-inset">
          <h2>Choisis la durée:</h2>
          <div class="option-buttons">
            <button class:active={gameDuration === 2} on:click={() => setGameDuration(2)}>
              <span class="emoji">⏱️</span> 2 min
            </button>
            <button class:active={gameDuration === 3} on:click={() => setGameDuration(3)}>
              <span class="emoji">⏱️</span> 3 min
            </button>
            <button class:active={gameDuration === 5} on:click={() => setGameDuration(5)}>
              <span class="emoji">⏱️</span> 5 min
            </button>
          </div>
        </div>
      </div>

      <button
        class="start-button"
        on:click={startGame}
        disabled={level === 'enfant' && getSelectedTableNumbers().length === 0}
      >
        <span class="emoji">🚀</span> Commencer
      </button>

      <div class="leaderboard-container">
        <Leaderboard
          {isLoading}
          {level}
          leaderboard={currentLeaderboard}
        />
      </div>
    </div>
  {:else if gameState === 'playing'}
    <div class="game-screen">
      <div class="game-header-sticky card">
        <div class="game-header">
          <div class="timer">
            <span class="emoji">⏱️</span> Temps: {formatTime(gameTimer)}
          </div>
          <div class="level">
            <span class="emoji">{level === 'adulte' ? '👨‍💼' : '👶'}</span> Niveau: {level === 'adulte' ? 'Adulte' : 'Enfant'}
          </div>
          <div class="score">
            <span class="emoji">🏆</span> Score: {score}
          </div>
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
            <span class="emoji">📋</span> Tables sélectionnées: {getSelectedTableNumbers().join(', ')}
          </div>
        {/if}

        {#if !isMobile}
          <div class="current-multiplication">
            <span class="emoji">🎯</span> Multiplication actuelle: <span class="row-col">{currentRow} × {currentCol}</span>
            <div class="cell-timer-container">
              <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
            </div>
          </div>
        {/if}
      </div>

      <div class="game-board-container card">
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
    </div>
  {:else if gameState === 'finished'}
    <div class="end-screen card">
      <h1>🎉 Partie terminée! 🎉</h1>

      <div class="results-container">
        <div class="result-card">
          <div class="result-icon">🏆</div>
          <p>Ton score: <span class="final-score">{score}</span></p>
        </div>

        <div class="result-card">
          <div class="result-icon">{level === 'adulte' ? '👨‍💼' : '👶'}</div>
          <p>Niveau: <span class="final-level">{level === 'adulte' ? 'Adulte' : 'Enfant'}</span></p>
        </div>

        <div class="result-card">
          <div class="result-icon">✅</div>
          {#if level === 'adulte'}
            <p>Multiplications résolues: <span class="final-solved">{solvedCountAdult}/100</span></p>
          {:else}
            <p>Multiplications résolues: <span class="final-solved">{solvedCountChild.count}/{solvedCountChild.total}</span></p>
          {/if}
        </div>

        {#if level === 'enfant'}
          <div class="result-card">
            <div class="result-icon">📚</div>
            <p>Tables pratiquées: <span class="final-tables">{getSelectedTableNumbers().join(', ')}</span></p>
          </div>
        {/if}
      </div>

      <div class="save-score card-inset">
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

      <button class="restart-button" on:click={() => gameState = 'notStarted'}>
        <span class="emoji">🏠</span> Retour à l'accueil
      </button>
    </div>
  {/if}
</main>

<style>
  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    animation: bounce 2s ease-in-out infinite;
  }

  .logo-text {
    font-family: 'Baloo 2', cursive;
    font-size: 2.8rem;
    font-weight: bold;
    color: var(--primary);
    text-shadow: 3px 3px 0 var(--accent-light);
  }

  .logo-icon {
    background: var(--accent);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  .math-symbol {
    font-size: 2rem;
    font-weight: bold;
    color: white;
  }

  .game-intro {
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: var(--text-secondary);
  }

  .start-screen {
    text-align: center;
    padding: 30px;
    margin: 20px auto;
    background-color: white;
  }

  .game-options {
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin: 30px 0;
  }

  .option-section {
    margin-bottom: 10px;
  }

  .card-inset {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .option-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 15px 0;
  }

  .option-description {
    font-size: 0.9rem;
    color: var(--text-light);
    margin-top: 10px;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  .tables-info {
    text-align: center;
    margin: 5px 0; /* Réduit les marges verticales */
    padding: 5px; /* Réduit le padding pour gagner de l'espace vertical */
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    color: var(--text-secondary);
    font-size: 0.85rem; /* Réduit légèrement la taille de police */
  }

  .start-button {
    font-size: 1.3rem;
    padding: 15px 40px;
    background-color: var(--accent);
    color: var(--text-primary);
    margin: 20px 0;
    box-shadow: 0 6px 0 var(--accent-dark);
  }

  .start-button:hover {
    background-color: var(--accent-light);
  }

  .start-button:disabled {
    background-color: #e0e0e0;
    color: var(--text-light);
    box-shadow: 0 4px 0 #bdbdbd;
  }

  /* Écran de jeu */
  .game-screen {
    margin: 10px auto; /* Réduit la marge pour gagner de l'espace vertical */
    padding-top: 5px; /* Réduit le padding pour gagner de l'espace vertical */
  }

  .game-header-sticky {
    position: relative;
    z-index: 100;
    margin-bottom: 10px; /* Réduit la marge pour gagner de l'espace vertical */
    padding: 8px 15px; /* Réduit le padding pour gagner de l'espace vertical */
    background-color: white;
    border-radius: var(--border-radius-md);
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px; /* Réduit la marge pour gagner de l'espace vertical */
    font-size: 1rem; /* Réduit légèrement la taille de police */
    font-weight: bold;
  }

  .timer {
    color: var(--secondary);
  }

  .level {
    color: var(--primary);
  }

  .score {
    color: var(--success);
  }

  .progress-container {
    margin-bottom: 5px; /* Réduit la marge pour gagner de l'espace vertical */
  }

  .progress-label {
    font-size: 0.85rem; /* Réduit légèrement la taille de police */
    margin-bottom: 3px; /* Réduit la marge pour gagner de l'espace vertical */
    color: var(--text-secondary);
  }

  .progress-bar {
    height: 8px;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .progress-fill {
    height: 100%;
    background-color: var(--success);
    transition: width 0.3s ease;
  }

  .current-multiplication {
    text-align: center;
    margin: 5px 0 3px; /* Réduit les marges verticales */
    font-size: 1rem; /* Réduit légèrement la taille de police */
    font-weight: bold;
    color: var(--primary-dark);
  }

  .current-multiplication .row-col {
    font-size: 1.5rem;
  }

  .cell-timer-container {
    height: 6px;
    background-color: var(--bg-secondary);
    border-radius: 3px;
    margin-top: 5px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .cell-timer {
    height: 100%;
    background-color: var(--secondary);
    transition: width 0.1s linear;
  }

  .game-board-container {
    padding: 10px 15px; /* Réduit le padding vertical pour gagner de l'espace */
    background-color: white;
    border-radius: var(--border-radius-md);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }

  /* Écran de fin */
  .end-screen {
    text-align: center;
    padding: 30px;
    margin: 20px auto;
    width: 100%;
    box-sizing: border-box;
  }

  .results-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin: 30px 0;
  }

  .result-card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    min-width: 200px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s;
  }

  .result-card:hover {
    transform: translateY(-5px);
  }

  .result-icon {
    font-size: 2.5rem;
    margin-bottom: 10px;
    animation: pulse 2s infinite;
  }

  .final-score {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--success);
  }

  .final-level {
    font-weight: bold;
    color: var(--primary);
  }

  .final-solved {
    font-weight: bold;
    color: var(--info);
  }

  .final-tables {
    font-weight: bold;
    color: var(--secondary);
  }

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

  .restart-button {
    padding: 15px 30px;
    background-color: var(--primary);
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 6px 0 var(--primary-dark);
  }

  .restart-button:hover {
    background-color: var(--primary-light);
  }

  .leaderboard-container {
    margin-top: 30px;
  }

  /* Responsive */
  @media (max-width: 767px) {
    .container {
      padding: 10px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
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

    .results-container {
      flex-direction: column;
      align-items: center;
    }

    .result-card {
      width: 90%;
    }

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

    .logo-text {
      font-size: 2.2rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
    }

    .math-symbol {
      font-size: 1.6rem;
    }

    .game-header-sticky {
      position: relative;
      top: 0;
      margin-bottom: 15px;
    }
  }
</style>