<!-- src/lib/components/game/CurrentMultiplication.svelte -->
<script>
  import { _ } from '$lib/utils/i18n';

  // Props
  export let currentRow = 0;
  export let currentCol = 0;
  export let cellTimer = 0;
  export let maxCellTimer = 0;
</script>

<div class="current-multiplication">
  <span class="emoji">🎯</span> {_('play.currentMultiplicationLabel')} <span class="row-col">{currentRow} × {currentCol}</span>
  <div class="cell-timer-container">
    <div class="cell-timer" style="width: {(cellTimer / maxCellTimer) * 100}%"></div>
  </div>
</div>

<style>
  .current-multiplication {
    text-align: center;
    margin: 5px 0 3px;
    font-size: 1rem;
    font-weight: bold;
    color: var(--primary-dark);
    padding: 5px;
  }

  .row-col {
    font-size: 1.5rem;
    color: #4d57ff;
  }

  .cell-timer-container {
    height: 6px;
    background-color: #f5f5f5;
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

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }
</style>