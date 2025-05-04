<script>
  import {onMount, onDestroy} from 'svelte';
  import {createClient} from '@supabase/supabase-js';

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
  let windowWidth = 0;
  let windowHeight = 0;

  // Nouvelles variables pour la sélection des tables
  let selectedTables = Array(10).fill(true); // Par défaut, toutes les tables sont sélectionnées

  // Getter pour obtenir les nombres des tables sélectionnées
  function getSelectedTableNumbers() {
    return selectedTables.map((selected, index) => selected ? index + 1 : null).filter(num => num !== null);
  }

  // Variable pour suivre les dernières multiplications résolues (pour le mode mobile)
  let lastSolvedMultiplications = [];
  const MAX_LAST_SOLVED = 10; // Nombre maximal de dernières multiplications à afficher

  // Grille de jeu (10x10)
  let grid = Array(10).fill().map(() => Array(10).fill(null));
  // Grille pour suivre les cellules déjà résolues
  let solvedCells = Array(10).fill().map(() => Array(10).fill(false));

  // Vérifier si l'appareil est mobile et obtenir les dimensions de la fenêtre
  function updateDimensions() {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    isMobile = windowWidth < 768;
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

  // Chargement des tables sélectionnées depuis localStorage
  function loadSelectedTables() {
    try {
      const savedTables = localStorage.getItem('selectedMultiplicationTables');
      if (savedTables) {
        selectedTables = JSON.parse(savedTables);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tables sélectionnées:', error);
    }
  }

  // Sauvegarde des tables sélectionnées dans localStorage
  function saveSelectedTables() {
    try {
      localStorage.setItem('selectedMultiplicationTables', JSON.stringify(selectedTables));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tables sélectionnées:', error);
    }
  }

  onMount(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    loadLeaderboards();
    loadSelectedTables();

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  });

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
      selectedTables = Array(10).fill(true);
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

    // Liste des nombres disponibles pour les tables (selon le mode et la sélection)
    let availableRows = Array.from({length: 10}, (_, i) => i + 1);
    let availableCols = Array.from({length: 10}, (_, i) => i + 1);

    // En mode enfant, filtrer selon les tables sélectionnées
    if (level === 'enfant') {
      const selectedNums = getSelectedTableNumbers();
      availableRows = selectedNums;
      availableCols = selectedNums;
    }

    // Vérifier s'il reste des cellules non résolues parmi les disponibles
    const unsolvedCells = [];
    for (let ri = 0; ri < availableRows.length; ri++) {
      const r = availableRows[ri] - 1; // -1 car les indices de la grille commencent à 0
      for (let ci = 0; ci < availableCols.length; ci++) {
        const c = availableCols[ci] - 1;
        if (!solvedCells[r][c]) {
          unsolvedCells.push({row: r, col: c});
        }
      }
    }

    // Si toutes les cellules disponibles sont résolues, terminer le jeu
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

  // Fonction pour basculer la sélection d'une table
  function toggleTable(index) {
    selectedTables[index] = !selectedTables[index];
    saveSelectedTables();
  }

  // Fonction pour sélectionner ou désélectionner toutes les tables
  function selectAllTables(select) {
    selectedTables = Array(10).fill(select);
    saveSelectedTables();
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
    if (level === 'adulte') {
      // En mode adulte, compte toutes les cellules résolues
      let count = 0;
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          if (solvedCells[r][c]) count++;
        }
      }
      return count;
    } else {
      // En mode enfant, compte uniquement les cellules des tables sélectionnées
      const selectedNums = getSelectedTableNumbers();
      let count = 0;
      let total = 0;

      for (let ri = 0; ri < selectedNums.length; ri++) {
        const r = selectedNums[ri] - 1;
        for (let ci = 0; ci < selectedNums.length; ci++) {
          const c = selectedNums[ci] - 1;
          total++;
          if (solvedCells[r][c]) count++;
        }
      }

      return {count, total};
    }
  }

  // Vérifie si une cellule fait partie des tables sélectionnées (pour l'affichage de la grille)
  function isSelectedTableCell(row, col) {
    if (level === 'adulte') return true;
    const selectedNums = getSelectedTableNumbers();
    return selectedNums.includes(row + 1) && selectedNums.includes(col + 1);
  }
</script>

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
          <div class="option-section">
            <h2>Sélectionnez les tables à pratiquer:</h2>
            <div class="tables-selection">
              {#each Array(10) as _, i}
                <div class="table-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedTables[i]}
                      on:change={() => toggleTable(i)}
                    />
                    <span>Table de {i + 1}</span>
                  </label>
                </div>
              {/each}
            </div>
            <div class="selection-actions">
              <button on:click={() => selectAllTables(true)}>Tout sélectionner</button>
              <button on:click={() => selectAllTables(false)}>Tout désélectionner</button>
            </div>
            <p class="option-description">
              {getSelectedTableNumbers().length === 0
                ? 'Veuillez sélectionner au moins une table.'
                : `Tables sélectionnées: ${getSelectedTableNumbers().join(', ')}`}
            </p>
          </div>
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
        {#if level === 'adulte'}
          <div class="progress-label">Multiplications résolues: {getSolvedCount()}/100</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {getSolvedCount()}%"></div>
          </div>
        {:else}
          {#if getSelectedTableNumbers().length > 0}
            {@const solvedInfo = getSolvedCount()}
            <div class="progress-label">Multiplications résolues: {solvedInfo.count}/{solvedInfo.total}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {(solvedInfo.count / solvedInfo.total) * 100}%"></div>
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
              {#if lastSolvedMultiplications.length === 0}
                <p>Aucune multiplication résolue pour le moment.</p>
              {:else}
                <div class="solved-grid">
                  {#each lastSolvedMultiplications as solved}
                    <div class="solved-item">
                      {solved.row} × {solved.col} = {solved.result}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <!-- Version desktop - Affichage avec grille responsive -->
        <div class="current-multiplication">
          <span>Multiplication actuelle: {currentRow} × {currentCol}</span>
          <div class="cell-timer-container">
            <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
          </div>
        </div>

        <div class="grid-container">
          <div class="grid" style="--grid-size: {Math.min(windowWidth - 40, windowHeight - 250, 900) / 11}px;">
            <!-- En-tête des colonnes -->
            <div class="grid-header-cell"></div>
            {#each Array(10) as _, colIndex}
              <div class="grid-header-cell" class:inactive={level === 'enfant' && !getSelectedTableNumbers().includes(colIndex + 1)}>
                {colIndex + 1}
              </div>
            {/each}

            <!-- Lignes avec en-têtes -->
            {#each Array(10) as _, rowIndex}
              <!-- En-tête de ligne -->
              <div class="grid-header-cell" class:inactive={level === 'enfant' && !getSelectedTableNumbers().includes(rowIndex + 1)}>
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
      {/if}
    </div>
  {:else if gameState === 'finished'}
    <div class="end-screen">
      <h1>Partie terminée!</h1>
      <p>Votre score: <span class="final-score">{score}</span></p>
      <p>Niveau: <span class="final-level">{level === 'adulte' ? 'Adulte' : 'Enfant'}</span></p>

      {#if level === 'adulte'}
        <p>Multiplications résolues: <span class="final-solved">{getSolvedCount()}/100</span></p>
      {:else}
        {@const solvedInfo = getSolvedCount()}
        <p>Multiplications résolues: <span class="final-solved">{solvedInfo.count}/{solvedInfo.total}</span></p>
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

  /* Style pour la sélection des tables */
  .tables-selection {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .table-checkbox {
    background-color: #f0f0f0;
    border-radius: 5px;
    padding: 8px 12px;
    transition: all 0.2s;
  }

  .table-checkbox label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .table-checkbox input {
    margin-right: 8px;
  }

  .selection-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .selection-actions button {
    padding: 8px 15px;
    background-color: #e0e0e0;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .selection-actions button:hover {
    background-color: #d0d0d0;
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
    min-width: 80px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

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

  /* Tableau des scores */
  .leaderboard {
    margin-top: 30px;
    width: 100%;
    overflow-x: auto; /* Permettre le défilement horizontal pour le tableau si nécessaire */
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

    /* Style responsive pour la sélection des tables */
    .tables-selection {
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .table-checkbox {
      width: 80%;
      max-width: 250px;
    }

    .save-score input, .save-score button {
      width: 100%;
      margin: 5px 0;
    }
  }
</style>