<script>
  import { formatDate } from '$lib/utils/formatters';
  import { getMode } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let isLoading = false;
  export let mode = 'tables';
  export let level = 'adulte';
  export let duration = 5;
  export let leaderboard = [];

  // Déterminer le niveau à afficher pour le titre
  $: modeConfig = getMode(mode);
  $: levelLabel = level === 'adulte' ? _('common.adult') : _('common.child');
  $: durationLabel = `${duration} ${_('common.min')}`;
  // La colonne « tables » n'a de sens que pour le mode tables en niveau enfant
  $: showTablesColumn = mode === 'tables' && level === 'enfant';
  $: rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
</script>

<div class="leaderboard card-inset">
  <h2>
    <span class="emoji">{modeConfig.icon}</span>
    {_(modeConfig.labelKey)} ({levelLabel}, {durationLabel})
  </h2>

  <div class="leaderboard-content">
    {#if isLoading}
      <div class="loading">
        <div class="loading-spinner"></div>
        <span>{_('common.loading')}</span>
      </div>
    {:else if leaderboard.length > 0}
      <div class="leaderboard-table">
        <table>
          <thead>
          <tr>
            <th class="rank-col"></th>
            <th>{_('leaderboard.nameHeader')}</th>
            <th class="score-col">{_('leaderboard.scoreHeader')}</th>
            {#if showTablesColumn}
              <th class="hide-mobile tables-cell">{_('leaderboard.tablesHeader')}</th>
            {/if}
            <th class="hide-mobile date-col">{_('leaderboard.dateHeader')}</th>
          </tr>
          </thead>
          <tbody>
          {#each leaderboard as entry, i}
            <tr class:top-three={i < 3}>
              <td class="rank-cell">
                <span class="rank">{rankEmojis[i] || (i + 1)}</span>
              </td>
              <td class="name-cell">{entry.name}</td>
              <td class="score-cell">{entry.score}</td>
              {#if showTablesColumn}
                <td class="hide-mobile tables-cell">
                  {#if entry.tables_used && Array.isArray(entry.tables_used) && entry.tables_used.length > 0}
                    {@const tablesList = entry.tables_used.sort((a, b) => a - b).join(', ')}
                    <span class="tables-all" title={tablesList}>{tablesList}</span>
                  {:else}
                    <span class="tables-all">{_('leaderboard.allTables')}</span>
                  {/if}
                </td>
              {/if}
              <td class="hide-mobile date-col">{formatDate(entry.date)}</td>
            </tr>
          {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">🏅</div>
        <p>{_('leaderboard.noScores')}</p>
        <p class="empty-message">{_('leaderboard.beFirst')}</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .leaderboard {
    width: 100%;
    margin-top: 30px;
  }

  .emoji {
    margin-right: 5px;
  }

  .leaderboard-content {
    min-height: 560px;
    margin-top: 15px;
    display: flex;
    flex-direction: column;
  }

  .leaderboard-table {
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
    width: 8%;
  }

  .score-col {
    width: 13%;
  }

  .date-col {
    width: 20%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th, td {
    padding: 12px 8px;
    text-align: left;
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

  .rank-cell {
    text-align: center;
    font-weight: bold;
  }

  .score-cell {
    font-weight: bold;
    color: var(--success-dark);
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
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.7;
  }

  .empty-message {
    font-style: italic;
    margin-top: 5px;
    color: var(--text-light);
  }

  .tables-cell {
    width: 16%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tables-all {
    font-size: 0.9rem;
    font-style: italic;
    color: var(--text-light);
  }

  @media (max-width: 767px) {
    .hide-mobile {
      display: none;
    }

    th, td {
      padding: 10px;
    }
  }
</style>