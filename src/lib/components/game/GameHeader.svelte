<!-- src/lib/components/game/GameHeader.svelte -->
<script>
  import { formatTime } from '$lib/utils/formatters';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let gameTimer = 0;
  export let level = 'adulte';
  export let score = 0;
  export let endGame = () => {};
</script>

<div class="game-header">
  <div class="timer">
    <span class="emoji">⏱️</span> {_('play.timeLabel')} {formatTime(gameTimer)}
    <button class="smaller-button" on:click={endGame}>{_('play.endGame')}</button>
  </div>
  <div class="level">
    <span class="emoji">{level === 'adulte' ? '👨‍💼' : '🧒'}</span> {_('play.levelLabel')} {level === 'adulte' ? _('common.adult') : _('common.child')}
  </div>
  <div class="score">
    <span class="emoji">🏆</span> {_('play.scoreLabel')} {score}
  </div>
</div>

<style>
  .game-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 1rem;
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

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  .smaller-button {
    margin-left: 8px;
    padding: 0 8px;
  }

  /* Responsive */
  @media (max-width: 767px) {
    .game-header {
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }
  }
</style>