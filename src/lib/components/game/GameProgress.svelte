<!-- src/lib/components/game/GameProgress.svelte -->
<script>
  import { _ } from '$lib/utils/i18n';

  // Props
  export let progress = { solved: 0, total: null, cumulative: 0 };
  export let poolResetNotice = false;

  $: percentage = progress.total ? (progress.solved / progress.total) * 100 : 0;
</script>

<div class="progress-container">
  {#if poolResetNotice}
    <div class="grid-reset-notification">
      <span class="emoji">🔄</span> {_('play.gridReset')}
    </div>
  {/if}

  {#if progress.total !== null}
    <div class="progress-label">
      {_('play.solvedLabel')} {progress.cumulative}/{progress.total}
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {percentage}%"></div>
    </div>
  {:else}
    <div class="progress-label">
      <span class="emoji">✅</span> {_('play.solvedGenericLabel', { count: progress.cumulative })}
    </div>
  {/if}
</div>

<style>
  .progress-container {
    margin-bottom: 5px;
  }

  .progress-label {
    font-size: 0.85rem;
    margin-bottom: 3px;
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

  .grid-reset-notification {
    background-color: var(--accent-light);
    color: var(--accent-dark);
    padding: 5px 10px;
    border-radius: var(--border-radius-md);
    text-align: center;
    margin-bottom: 8px;
    font-weight: bold;
    animation: fadeInOut 1.5s ease;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    15% { opacity: 1; transform: translateY(0); }
    85% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
</style>
