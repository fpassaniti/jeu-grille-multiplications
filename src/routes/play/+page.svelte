<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Importation des composants
  import StartScreen from '$lib/components/game/StartScreen.svelte';
  import GameScreen from '$lib/components/game/GameScreen.svelte';
  import EndScreen from '$lib/components/game/EndScreen.svelte';

  // Importation des stores et utilitaires
  import { calculateScore } from '$lib/utils/game-logic';
  import { selectedTables, getSelectedTableNumbers } from '$lib/stores/gameStore';

  // Polyfills
  import 'core-js/stable';
  import 'regenerator-runtime/runtime';

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

  // Variables pour la gamification
  let isLoggedIn = false;
  let estimatedXP = 0;
  let gameResults = null;
  let scoreSaved = false;
  let levelUp = false;

  // Grille de jeu (10x10)
  let grid = Array(10).fill().map(() => Array(10).fill(null));
  // Grille pour suivre les cellules déjà résolues
  let solvedCells = Array(10).fill().map(() => Array(10).fill(false));

  // Variables pour le tracking des cellules résolues au total
  let totalSolvedCountAdult = 0;
  let totalSolvedCountChild = { count: 0, total: 0 };
  let solvedCountAdult = 0;
  let solvedCountChild = { count: 0, total: 0 };

  // Variable pour la notification de réinitialisation de grille
  let showingGridReset = false;

  // Vérifier l'état de connexion
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

  // Mettre à jour l'état de connexion de manière réactive
  $: isLoggedIn = !!data.user;

  // Vérifier si l'appareil est mobile et obtenir les dimensions de la fenêtre
  function updateDimensions() {
    if (!browser) return;
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    isMobile = windowWidth < 768;
  }

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

    // Réinitialiser les compteurs et la grille
    totalSolvedCountAdult = 0;
    totalSolvedCountChild = { count: 0, total: 0 };
    solvedCountAdult = 0;
    solvedCountChild = { count: 0, total: 0 };

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

    // Mettre à jour les totaux avant de vérifier si la grille est complète
    updateTotalCounts();

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

    // Si toutes les cellules disponibles sont résolues, réinitialiser la grille
    if (availableCells.length === 0) {
      // Réinitialiser la grille des cellules résolues, mais conserver le score
      solvedCells = Array(10).fill().map(() => Array(10).fill(false));

      // Afficher une notification brève que la grille est réinitialisée
      showGridResetNotification();

      // Rappeler cette fonction pour sélectionner une cellule dans la nouvelle grille
      isSelectingNewCell = false;
      selectNewMultiplication();
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

      // Mettre à jour les compteurs totaux
      updateTotalCounts();

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

    // Le score est maintenant directement utilisé comme XP
    estimatedXP = score;

    // Sauvegarder automatiquement le score
    if (isLoggedIn) {
      saveScore();
    }
  }

  // Fonction pour sauvegarder le score
  async function saveScore() {
    if (!isLoggedIn && playerName.trim() === '') return;

    const gameData = {
      name: isLoggedIn ? data.user.username : playerName,
      score: score,
      duration: gameDuration,
      level: level,
      solvedCells: level === 'adulte'
        ? totalSolvedCountAdult + solvedCountAdult
        : totalSolvedCountChild.count + solvedCountChild.count,
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

      // Récupérer les données de résultat
      const resultData = await response.json();
      gameResults = resultData;

      // Vérifier s'il y a eu une montée en niveau
      if (isLoggedIn && resultData.progressUpdate && resultData.progressUpdate.returned_level > resultData.progressUpdate.returned_previous_level) {
        levelUp = true;

        // Récupérer le titre du nouveau niveau
        gameResults.newLevel = resultData.progressUpdate.returned_level;
        gameResults.newLevelTitle = resultData.progressUpdate.returned_level_title;
      }

      // Marquer le score comme sauvegardé
      scoreSaved = true;

    } catch (e) {
      console.error('Erreur lors de la sauvegarde du score:', e);
      alert(`Erreur: ${e.message || 'Impossible de sauvegarder le score en ligne'}. Essayez à nouveau plus tard.`);
    } finally {
      isLoading = false;
    }
  }

  // Fonction pour afficher une notification de réinitialisation de grille
  function showGridResetNotification() {
    showingGridReset = true;
    // Masquer la notification après 1.5 secondes
    setTimeout(() => {
      showingGridReset = false;
    }, 1500);
  }

  function restartGame() {
    scoreSaved = false;
    levelUp = false;
    gameResults = null;
    startGame();
  }

  // Fonction pour revenir à l'écran de démarrage
  function resetGame() {
    gameState = 'notStarted';
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

  function reloadPageOnDashboard() {
    window.location.href = '/dashboard';
  }

  // Fonction pour la gestion des tables
  function toggleTable(index) {
    $selectedTables[index] = !$selectedTables[index];
    saveSelectedTables();
  }

  // Fonction pour sélectionner ou désélectionner toutes les tables
  function selectAllTables(select) {
    $selectedTables = Array(10).fill(select);
    saveSelectedTables();
  }

  // Variables réactives pour le suivi des multiplications résolues
  $: {
    // Calcul pour le mode adulte
    if (level === 'adulte') {
      // Calculer d'abord les cellules résolues dans la grille actuelle
      let currentCount = 0;
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (solvedCells[r][c]) currentCount++;
        }
      }

      // Mettre à jour le compteur de la grille actuelle
      solvedCountAdult = currentCount;
    }
  }

  $: {
    // Calcul pour le mode enfant
    if (level === 'enfant') {
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

      solvedCountChild = { count, total };
    }
  }

  // Fonction pour suivre l'état précédent et détecter les réinitialisations de grille
  let prevSolvedCountAdult = 0;
  let prevSolvedCountChild = { count: 0, total: 0 };

  function updateTotalCounts() {
    // Mode adulte
    if (level === 'adulte') {
      // Détection de la réinitialisation: on passe d'un nombre élevé à un nombre très faible
      if (solvedCountAdult < 10 && prevSolvedCountAdult > 90) {
        // La grille a été réinitialisée, ajouter 100 au total
        totalSolvedCountAdult += 100;
      }
      prevSolvedCountAdult = solvedCountAdult;
    }
    // Mode enfant
    else if (level === 'enfant' && solvedCountChild && solvedCountChild.total > 0) {
      const total = solvedCountChild.total;
      // Détection de la réinitialisation
      if (solvedCountChild.count < 10 && prevSolvedCountChild.count > (total * 0.9)) {
        // La grille a été réinitialisée, ajouter le total précédent
        totalSolvedCountChild.count += total;
      }
      prevSolvedCountChild = { ...solvedCountChild };
      totalSolvedCountChild.total = total; // Toujours mettre à jour le total
    }
  }

  // Pour le pourcentage de progression
  $: progressPercentage = level === 'adulte'
    ? (solvedCountAdult / 100) * 100
    : (solvedCountChild.total > 0 ? (solvedCountChild.count / solvedCountChild.total) * 100 : 0);

  // Vérifie si une cellule fait partie des tables sélectionnées (pour l'affichage de la grille)
  function isSelectedTableCell(row, col) {
    if (level === 'adulte') return true;
    const selectedNums = getSelectedTableNumbers();
    return selectedNums.includes(row + 1) || selectedNums.includes(col + 1);
  }

  // Nettoyage des intervalles à la destruction du composant
  onDestroy(() => {
    clearInterval(gameTimerInterval);
    clearInterval(cellTimerInterval);
  });
</script>

<svelte:head>
  <title>MultyFun - Jeu de Multiplication</title>
  <meta name="description" content="Améliorez vos compétences en multiplication avec ce jeu interactif amusant pour les enfants et les adultes!" />
</svelte:head>

<main class="container" style="max-width: {windowWidth > 1200 ? '1200px' : '100%'}; width: 100%; box-sizing: border-box;">
  {#if gameState === 'notStarted'}
    <StartScreen
      {level}
      {gameDuration}
      {setLevel}
      {setGameDuration}
      {toggleTable}
      {selectAllTables}
      {getSelectedTableNumbers}
      {startGame}
    />
  {:else if gameState === 'playing'}
    <GameScreen
      {gameTimer}
      {level}
      {score}
      {solvedCountAdult}
      {solvedCountChild}
      {totalSolvedCountAdult}
      {totalSolvedCountChild}
      {progressPercentage}
      {showingGridReset}
      {getSelectedTableNumbers}
      {currentRow}
      {currentCol}
      {cellTimer}
      {maxCellTimer}
      {isMobile}
      {grid}
      {solvedCells}
      bind:userAnswer
      {handleAnswerChange}
      {handleSubmit}
      bind:inputRef
      {lastAnswerCorrect}
      {isSelectedTableCell}
      {windowWidth}
      {windowHeight}
      {lastSolvedMultiplications}
      {endGame}
    />
  {:else if gameState === 'finished'}
    <EndScreen
      {score}
      {level}
      {solvedCountAdult}
      {solvedCountChild}
      {totalSolvedCountAdult}
      {totalSolvedCountChild}
      {getSelectedTableNumbers}
      {isLoggedIn}
      bind:playerName
      {saveScore}
      {isLoading}
      {scoreSaved}
      {gameResults}
      {levelUp}
      {reloadPageOnDashboard}
      {restartGame}
      resetGame={resetGame}
    />
  {/if}
</main>

<style>
  .container {
    width: 100%;
    box-sizing: border-box;
  }

  @media (max-width: 767px) {
    .container {
      padding: 10px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    }
  }
</style>