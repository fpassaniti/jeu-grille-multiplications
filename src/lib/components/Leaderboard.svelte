<script>
  import { formatDate } from '$lib/utils/formatters';

  // Props
  export let isLoading = false;
  export let level = 'adulte';
  export let leaderboard = [];

  // Déterminer le niveau à afficher pour le titre
  $: levelLabel = level === 'adulte' ? 'Adulte' : 'Enfant';
</script>

<div class="leaderboard">
  <h2>Meilleurs scores ({levelLabel})</h2>

  {#if isLoading}
    <div class="loading">Chargement des scores...</div>
  {:else if leaderboard.length > 0}
    <table>
      <thead>
      <tr>
        <th>Rang</th>
        <th>Nom</th>
        <th>Score</th>
        <th>Durée</th>
        <th>Date</th>
      </tr>
      </thead>
      <tbody>
      {#each leaderboard as entry, i}
        <tr>
          <td>{i + 1}</td>
          <td>{entry.name}</td>
          <td>{entry.score}</td>
          <td>{entry.duration} min</td>
          <td>{formatDate(entry.date)}</td>
        </tr>
      {/each}
      </tbody>
    </table>
  {:else}
    <p>Aucun score enregistré pour ce niveau.</p>
  {/if}
</div>

<style>
  .leaderboard {
    margin-top: 30px;
    width: 100%;
    overflow-x: auto; /* Permettre le défilement horizontal pour le tableau si nécessaire */
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }

  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
  }

  .loading {
    margin: 20px 0;
    color: #666;
    font-style: italic;
  }
</style>