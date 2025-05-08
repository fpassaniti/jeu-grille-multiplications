<script>
  import GameBoard from '$lib/components/GameBoard.svelte';
  import MobileGame from '$lib/components/MobileGame.svelte';
  import GameHeader from './GameHeader.svelte';
  import GameProgress from './GameProgress.svelte';
  import CurrentMultiplication from './CurrentMultiplication.svelte';

  // Props
  export let gameTimer = 0;
  export let level = 'adulte';
  export let score = 0;
  export let solvedCountAdult = 0;
  export let solvedCountChild = { count: 0, total: 0 };
  export let totalSolvedCountAdult = 0;
  export let totalSolvedCountChild = { count: 0, total: 0 };
  export let progressPercentage = 0;
  export let showingGridReset = false;
  export let getSelectedTableNumbers = () => [];
  export let currentRow = 0;
  export let currentCol = 0;
  export let cellTimer = 0;
  export let maxCellTimer = 0;
  export let isMobile = false;
  export let grid = [];
  export let solvedCells = [];
  export let userAnswer = '';
  export let handleAnswerChange = () => {};
  export let handleSubmit = () => {};
  export let inputRef;
  export let lastAnswerCorrect = null;
  export let isSelectedTableCell = () => {};
  export let windowWidth = 0;
  export let windowHeight = 0;
  export let lastSolvedMultiplications = [];
  export let endGame = () => {};
</script>

<div class="game-screen">
  <div class="game-header-sticky card">
    <GameHeader {gameTimer} {level} {score} {endGame} />

    <GameProgress
      {level}
      {solvedCountAdult}
      {solvedCountChild}
      {totalSolvedCountAdult}
      {totalSolvedCountChild}
      {getSelectedTableNumbers}
      {progressPercentage}
      {showingGridReset}
    />

    {#if level === 'enfant'}
      <div class="tables-info">
        <span class="emoji">📋</span> Tables sélectionnées: {getSelectedTableNumbers().join(', ')}
      </div>
    {/if}

    {#if !isMobile}
      <CurrentMultiplication
        {currentRow}
        {currentCol}
        {cellTimer}
        {maxCellTimer}
      />
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

<style>
  .game-screen {
    margin: 10px auto;
    padding-top: 5px;
  }

  .game-header-sticky {
    position: relative;
    z-index: 100;
    margin-bottom: 10px;
    padding: 8px 15px;
    background-color: white;
    border-radius: var(--border-radius-md);
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  }

  .game-board-container {
    padding: 10px 15px;
    background-color: white;
    border-radius: var(--border-radius-md);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }

  .tables-info {
    text-align: center;
    margin: 5px 0;
    padding: 5px;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  @media (max-width: 767px) {
    .game-header-sticky {
      position: relative;
      top: 0;
      margin-bottom: 15px;
    }
  }
</style>