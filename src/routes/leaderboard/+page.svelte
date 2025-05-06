<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Leaderboard from '$lib/components/Leaderboard.svelte';

  // Données chargées depuis le serveur
  export let data;

  // État UI
  let isLoading = false;
  let currentLevel = 'adulte';

  // Fonctions d'interaction
  function toggleLevel() {
    currentLevel = currentLevel === 'adulte' ? 'enfant' : 'adulte';
  }

  // Navigation
  function goToHome() {
    goto('/');
  }

  function goToPlay() {
    goto('/play');
  }
</script>

<svelte:head>
  <title>Classement des meilleurs scores - MultyFun</title>
  <meta name="description" content="Découvre les meilleurs joueurs de MultyFun et leurs scores impressionnants!" />
</svelte:head>

<main class="container">
  <div class="leaderboard-page card">
    <div class="page-header">
      <h1>Classement des Meilleurs Scores</h1>
    </div>

    <div class="level-toggle">
      <button
        class="toggle-button {currentLevel === 'adulte' ? 'active' : ''}"
        on:click={() => currentLevel = 'adulte'}
      >
        <span class="emoji">👨‍💼</span> Niveau Adulte
      </button>
      <button
        class="toggle-button {currentLevel === 'enfant' ? 'active' : ''}"
        on:click={() => currentLevel = 'enfant'}
      >
        <span class="emoji">🧒</span> Niveau Enfant
      </button>
    </div>

    <div class="leaderboard-container">
      <Leaderboard
        isLoading={isLoading}
        level={currentLevel}
        leaderboard={currentLevel === 'adulte' ? data.leaderboardAdult : data.leaderboardChild}
      />
    </div>

    <div class="page-footer">
      <p>Les scores sont mis à jour après chaque partie terminée.</p>
      <p class="challenge-text">
        <span class="emoji">🚀</span> Relève le défi et inscris ton nom dans le classement !
      </p>
      <button class="play-button" on:click={goToPlay}>
        Jouer maintenant
      </button>
    </div>
  </div>
</main>

<style>
  .leaderboard-page {
    max-width: 900px;
    margin: 40px auto;
    padding: 30px;
  }

  .page-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
  }

  .page-header h1 {
    color: var(--primary-dark);
    text-align: center;
    font-size: 2rem;
  }

  .level-toggle {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
  }

  .toggle-button {
    padding: 12px 20px;
    border-radius: var(--border-radius-md);
    font-size: 1.1rem;
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    transition: all 0.3s;
  }

  .toggle-button.active {
    background-color: var(--primary);
    color: white;
    box-shadow: 0 4px 0 var(--primary-dark);
  }

  .toggle-button:hover:not(.active) {
    background-color: var(--bg-primary);
    transform: translateY(-3px);
  }

  .leaderboard-container {
    margin-bottom: 30px;
  }

  .page-footer {
    text-align: center;
    margin-top: 40px;
    color: var(--text-secondary);
  }

  .challenge-text {
    font-weight: bold;
    color: var(--primary);
    margin: 15px 0;
    font-size: 1.1rem;
  }

  .play-button {
    background-color: var(--accent);
    color: white;
    padding: 12px 25px;
    font-size: 1.1rem;
    border-radius: var(--border-radius-md);
    margin-top: 15px;
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  .play-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 var(--accent-dark);
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      gap: 15px;
    }

    .level-toggle {
      flex-direction: column;
      gap: 10px;
    }

    .toggle-button {
      width: 100%;
    }
  }
</style>