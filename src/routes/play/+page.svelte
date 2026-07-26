<script>
  import { onDestroy } from 'svelte';

  import StartScreen from '$lib/components/game/StartScreen.svelte';
  import GameScreen from '$lib/components/game/GameScreen.svelte';
  import EndScreen from '$lib/components/game/EndScreen.svelte';

  import { GameEngine } from '$lib/game/engine.svelte.js';
  import { loadSettings, saveSettings, optionsFor } from '$lib/game/persistence.js';
  import { getMode } from '$lib/modes/index.js';
  import { saveScore as postScore } from '$lib/services/gameService';
  import { playNavRequested } from '$lib/stores/playNavStore.js';

  let { data } = $props();

  const engine = new GameEngine();
  let settings = $state(loadSettings());

  // État de sauvegarde de fin de partie
  let scoreSaved = $state(false);
  let saveAttempted = $state(false); // évite les tentatives automatiques en boucle sur échec
  let saveError = $state(null);
  let gameResults = $state(null);
  let levelUp = $state(false);

  // Dimensions / mobile
  let windowWidth = $state(0);
  let windowHeight = $state(0);
  const isMobile = $derived(windowWidth > 0 && windowWidth < 768);

  const currentOptions = $derived(optionsFor(settings, settings.lastMode));

  // Sauvegarde automatique en fin de partie — une seule tentative :
  // en cas d'échec (ex. anti-replay), on n'entre pas dans une boucle de retry.
  $effect(() => {
    if (engine.state === 'finished' && !saveAttempted) {
      saveAttempted = true;
      saveScore();
    }
  });

  function updateSettings(patch) {
    settings = { ...settings, ...patch };
    saveSettings(settings);
  }

  function setModeOptions(modeId, options) {
    settings = {
      ...settings,
      optionsByMode: { ...settings.optionsByMode, [modeId]: options }
    };
    saveSettings(settings);
  }

  function startGame() {
    scoreSaved = false;
    saveAttempted = false;
    saveError = null;
    levelUp = false;
    gameResults = null;
    engine.start({
      modeId: settings.lastMode,
      options: currentOptions,
      level: settings.level,
      durationMin: settings.duration
    });
  }

  async function saveScore() {
    const results = engine.results;
    const isTables = getMode(results.modeId).boardType === 'grid';
    const selectedTables =
      isTables && results.level === 'enfant' ? (results.options.selectedTables ?? []) : [];

    // Double payload : nouveau format V2 + champs V1 (compat serveur pas-encore-déployé)
    const gameData = {
      name: data.user.username,
      score: results.score,
      duration: results.durationMin,
      level: results.level,
      gameMode: results.modeId,
      modeOptions: results.options,
      questionsSolved: results.questionsSolved,
      questionsTotal: results.questionsTotal,
      errorsCount: results.errorsCount,
      elapsedSec: results.elapsedSec,
      completed: results.completed,
      solvedCells: results.questionsSolved,
      totalPossibleCells: results.questionsTotal,
      selectedTables
    };

    try {
      saveError = null;
      const resultData = await postScore(gameData);
      gameResults = resultData;

      if (
        resultData.progressUpdate &&
        resultData.progressUpdate.returned_level > resultData.progressUpdate.returned_previous_level
      ) {
        levelUp = true;
        gameResults.newLevel = resultData.progressUpdate.returned_level;
        gameResults.newLevelTitle = resultData.progressUpdate.returned_level_title;
      }

      scoreSaved = true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du score:', e);
      saveError = e.message || 'Impossible de sauvegarder le score en ligne';
    }
  }

  function restartGame() {
    startGame();
  }

  function resetGame() {
    engine.destroy();
    engine.state = 'notStarted';
  }

  function reloadPageOnDashboard() {
    window.location.href = '/';
  }

  // Le clic sur "Jouer" dans le menu alors qu'on est déjà sur /play ne déclenche pas
  // de navigation (même URL) : on écoute ce signal explicite pour revenir au choix de mode.
  const unsubscribePlayNav = playNavRequested.subscribe((value) => {
    if (value > 0) resetGame();
  });

  onDestroy(() => {
    engine.destroy();
    unsubscribePlayNav();
  });
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight} />

<svelte:head>
  <title>MultyFun - Jeu de Calcul Mental</title>
  <meta
    name="description"
    content="Améliore tes compétences en calcul mental : tables, additions, soustractions et multiplications!"
  />
</svelte:head>

<main
  class="container"
  style="max-width: {windowWidth > 1200 ? '1200px' : '100%'}; width: 100%; box-sizing: border-box;"
>
  {#if engine.state === 'notStarted'}
    <StartScreen
      modeId={settings.lastMode}
      level={settings.level}
      duration={settings.duration}
      options={currentOptions}
      onModeSelect={(modeId) => updateSettings({ lastMode: modeId })}
      onLevelSelect={(level) => updateSettings({ level })}
      onDurationSelect={(duration) => updateSettings({ duration })}
      onOptionsChange={(options) => setModeOptions(settings.lastMode, options)}
      onStart={startGame}
    />
  {:else if engine.state === 'playing'}
    <GameScreen
      modeId={settings.lastMode}
      level={settings.level}
      score={engine.score}
      gameTimer={engine.gameTimer}
      question={engine.question}
      questionTimer={engine.questionTimer}
      timeAllowed={engine.timeAllowed}
      userAnswer={engine.userAnswer}
      stageIndex={engine.stageIndex}
      digitIndex={engine.digitIndex}
      feedback={engine.feedback}
      progress={engine.progress}
      solvedHistory={engine.solvedHistory}
      board={engine.board}
      poolResetNotice={engine.poolResetNotice}
      {isMobile}
      {windowWidth}
      {windowHeight}
      onInput={(raw) => engine.onAnswerInput(raw)}
      onSubmit={() => engine.submitAnswer()}
      onEnd={() => engine.end({ manual: true })}
    />
  {:else if engine.state === 'finished'}
    <EndScreen
      results={engine.results}
      {scoreSaved}
      {saveError}
      {gameResults}
      {levelUp}
      {reloadPageOnDashboard}
      {restartGame}
      {resetGame}
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
