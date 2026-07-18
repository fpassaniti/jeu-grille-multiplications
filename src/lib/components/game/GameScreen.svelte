<script>
  import GameBoard from '$lib/components/GameBoard.svelte';
  import QuestionPanel from '$lib/components/QuestionPanel.svelte';
  import GameHeader from './GameHeader.svelte';
  import GameProgress from './GameProgress.svelte';
  import CurrentQuestion from './CurrentQuestion.svelte';
  import { getMode } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // Props (scalaires/objets fournis par /play — jamais l'engine lui-même)
  export let modeId = 'tables';
  export let level = 'adulte';
  export let score = 0;
  export let gameTimer = 0;
  export let question = null;
  export let questionTimer = 0;
  export let timeAllowed = 0;
  export let userAnswer = '';
  export let feedback = null;
  export let progress = { solved: 0, total: null, cumulative: 0 };
  export let solvedHistory = [];
  export let board = null;
  export let poolResetNotice = false;
  export let isMobile = false;
  export let windowWidth = 0;
  export let windowHeight = 0;
  export let onInput = () => {};
  export let onSubmit = () => {};
  export let onEnd = () => {};

  // Mapping boardType → composant : 'grid' + desktop → GameBoard, sinon QuestionPanel
  $: mode = getMode(modeId);
  $: useGrid = mode.boardType === 'grid' && !isMobile;
</script>

<div class="game-screen">
  <div class="game-header-sticky card">
    <GameHeader {gameTimer} {level} {score} modeIcon={mode.icon} endGame={onEnd} />

    <GameProgress {progress} {poolResetNotice} />

    {#if mode.boardType === 'grid' && level === 'enfant' && board}
      <div class="tables-info">
        <span class="emoji">📋</span>
        {_('tableSelector.selectedTables')}
        {board.selectedNumbers.join(', ')}
      </div>
    {/if}

    {#if useGrid}
      <CurrentQuestion {question} {questionTimer} {timeAllowed} />
    {/if}
  </div>

  <div class="game-board-container card">
    {#if useGrid}
      <GameBoard
        {board}
        {question}
        {userAnswer}
        {feedback}
        {level}
        {windowWidth}
        {windowHeight}
        {onInput}
        {onSubmit}
      />
    {:else}
      <QuestionPanel
        {question}
        {userAnswer}
        {feedback}
        {questionTimer}
        {timeAllowed}
        {solvedHistory}
        {isMobile}
        {onInput}
        {onSubmit}
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
