<script>
  import QuestionPanel from '$lib/components/QuestionPanel.svelte';
  import GameHeader from './GameHeader.svelte';
  import GameProgress from './GameProgress.svelte';
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
  export let stageIndex = 0;
  export let digitIndex = 0;
  export let feedback = null;
  export let progress = { solved: 0, total: null, cumulative: 0 };
  export let solvedHistory = [];
  export let board = null;
  export let poolResetNotice = false;
  export let onInput = () => {};
  export let onSubmit = () => {};
  export let onEnd = () => {};

  $: mode = getMode(modeId);
</script>

<div class="game-screen">
  <div class="game-header-sticky card">
    <GameHeader {gameTimer} {level} {score} modeIcon={mode.icon} endGame={onEnd} />

    <GameProgress {progress} {poolResetNotice} {mode} />

    {#if mode.boardType === 'grid' && level === 'enfant' && board}
      <div class="tables-info">
        <span class="emoji">📋</span>
        {_('tableSelector.selectedTables')}
        {board.selectedNumbers.join(', ')}
      </div>
    {/if}
  </div>

  <div class="game-board-container card">
    <QuestionPanel
      {question}
      {userAnswer}
      {stageIndex}
      {digitIndex}
      {feedback}
      {questionTimer}
      {timeAllowed}
      {solvedHistory}
      {onInput}
      {onSubmit}
    />
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
