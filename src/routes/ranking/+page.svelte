<script>
  import { _ } from '$lib/utils/i18n';
  import LevelBadge from '$lib/components/LevelBadge.svelte';

  export let data;

  let mode = data.defaultMode;
  let ranking = data.ranking;
  let isLoading = false;

  const rankEmojis = ['🥇', '🥈', '🥉'];

  async function selectMode(newMode) {
    if (newMode === mode || isLoading) return;
    mode = newMode;
    isLoading = true;
    try {
      const response = await fetch(`/api/ranking?playerMode=${newMode}`);
      ranking = await response.json();
    } finally {
      isLoading = false;
    }
  }

  $: showYourPosition = ranking.viewerEntry && ranking.viewerEntry.rank > 20;
</script>

<svelte:head>
  <title>{_('ranking.title')} - {_('common.appName')}</title>
</svelte:head>

<div class="container">
  <div class="ranking-container card">
    <div class="ranking-header">
      <h1>{_('ranking.title')}</h1>
      <p class="subtitle">{_('ranking.subtitle')}</p>
    </div>

    <div class="mode-buttons">
      <button class:active={mode === 'adulte'} on:click={() => selectMode('adulte')}>
        <span class="emoji">👨‍💼</span> {_('common.adult')}
      </button>
      <button class:active={mode === 'enfant'} on:click={() => selectMode('enfant')}>
        <span class="emoji">🧒</span> {_('common.child')}
      </button>
    </div>

    <div class="ranking-content card-inset">
      {#if isLoading}
        <div class="loading">
          <div class="loading-spinner"></div>
          <span>{_('common.loading')}</span>
        </div>
      {:else if ranking.top.length > 0}
        <div class="ranking-table">
          <table>
            <thead>
            <tr>
              <th class="rank-col"></th>
              <th>{_('ranking.nameHeader')}</th>
              <th class="hide-mobile level-col">{_('ranking.levelHeader')}</th>
              <th class="xp-col">{_('ranking.xpHeader')}</th>
              <th class="hide-mobile games-col">{_('ranking.gamesHeader')}</th>
            </tr>
            </thead>
            <tbody>
            {#each ranking.top as entry, i}
              <tr class:top-three={i < 3} class:is-viewer={entry.isViewer}>
                <td class="rank-cell">
                  <span class="rank">{rankEmojis[i] || entry.rank}</span>
                </td>
                <td class="name-cell">{entry.displayName}</td>
                <td class="hide-mobile level-col">
                  <LevelBadge level={entry.level} colorTheme={entry.colorTheme} size={28} />
                </td>
                <td class="xp-cell">{entry.xp}</td>
                <td class="hide-mobile games-col">{entry.gamesPlayed}</td>
              </tr>
            {/each}
            </tbody>
          </table>
        </div>

        {#if showYourPosition}
          <div class="your-position">
            {_('ranking.yourPosition', { rank: ranking.viewerEntry.rank })}
          </div>
        {/if}
      {:else}
        <div class="empty-state">
          <div class="empty-icon">🏅</div>
          <p>{_('ranking.empty')}</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    width: 100%;
    box-sizing: border-box;
  }

  .ranking-container {
    max-width: 700px;
    margin: 50px auto;
    padding: 30px;
  }

  .ranking-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .subtitle {
    color: var(--text-light);
    margin-top: 5px;
  }

  .mode-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
  }

  .mode-buttons button.active {
    background-color: var(--primary);
    color: white;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  .card-inset {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .ranking-content {
    min-height: 300px;
    display: flex;
    flex-direction: column;
  }

  .ranking-table {
    flex: 1;
    overflow-x: auto;
    border-radius: var(--border-radius-md);
  }

  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }

  .rank-col {
    width: 10%;
  }

  .level-col {
    width: 18%;
  }

  .xp-col, .xp-cell {
    width: 18%;
  }

  .games-col {
    width: 15%;
  }

  .name-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th, td {
    padding: 12px 8px;
    text-align: left;
    box-sizing: border-box;
  }

  th {
    background-color: var(--primary-light);
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 1px;
  }

  tr {
    border-bottom: 1px solid var(--bg-secondary);
    transition: background-color 0.2s;
  }

  tr:last-child {
    border-bottom: none;
  }

  tr:hover:not(.top-three) {
    background-color: var(--bg-primary);
  }

  .top-three {
    background-color: var(--bg-secondary);
    font-weight: bold;
  }

  .is-viewer {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .rank-cell {
    text-align: center;
    font-weight: bold;
  }

  .xp-cell {
    font-weight: bold;
    color: var(--success-dark);
  }

  .your-position {
    margin-top: 15px;
    padding: 12px;
    text-align: center;
    font-weight: bold;
    background-color: white;
    border-radius: var(--border-radius-md);
  }

  .loading {
    flex: 1;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid var(--bg-secondary);
    border-top-color: var(--primary);
    animation: spin 1s linear infinite;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--text-secondary);
    padding: 40px 0;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.7;
  }

  @media (max-width: 767px) {
    .hide-mobile {
      display: none;
    }

    th, td {
      padding: 10px;
    }

    .rank-col {
      width: 15%;
    }
  }
</style>
