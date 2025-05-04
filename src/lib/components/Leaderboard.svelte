<script>
  import { formatDate } from '$lib/utils/formatters';

  // Props
  export let isLoading = false;
  export let level = 'adulte';
  export let leaderboard = [];

  // Déterminer le niveau à afficher pour le titre
  $: levelLabel = level === 'adulte' ? 'Adulte' : 'Enfant';
  $: rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
</script>

<div class="leaderboard card-inset">
  <h2><span class="emoji">🏆</span> Meilleurs scores ({levelLabel})</h2>

  {#if isLoading}
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Chargement des scores...</span>
    </div>
  {:else if leaderboard.length > 0}
    <div class="leaderboard-table">
      <table>
        <thead>
        <tr>
          <th></th>
          <th>Nom</th>
          <th>Score</th>
          <th>Durée</th>
          <th class="hide-mobile">Date</th>
        </tr>
        </thead>
        <tbody>
        {#each leaderboard as entry, i}
          <tr class:top-three={i < 3}>
            <td class="rank-cell">
              <span class="rank">{rankEmojis[i] || (i + 1)}</span>
            </td>
            <td>{entry.name}</td>
            <td class="score-cell">{entry.score}</td>
            <td>{entry.duration} min</td>
            <td class="hide-mobile">{formatDate(entry.date)}</td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">🏅</div>
      <p>Aucun score enregistré pour ce niveau.</p>
      <p class="empty-message">Sois le premier à relever le défi!</p>
    </div>
  {/if}
</div>

<style>
  .leaderboard {
    width: 100%;
    margin-top: 30px;
  }
  
  .emoji {
    margin-right: 5px;
  }

  .leaderboard-table {
    overflow-x: auto;
    margin-top: 15px;
    border-radius: var(--border-radius-md);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }

  th, td {
    padding: 12px 15px;
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
    margin: 30px 0;
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
    padding: 30px 0;
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
  
  @media (max-width: 767px) {
    .hide-mobile {
      display: none;
    }
    
    th, td {
      padding: 10px;
    }
  }
</style>