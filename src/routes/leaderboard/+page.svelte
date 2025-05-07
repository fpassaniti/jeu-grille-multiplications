<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import { _ } from '$lib/utils/i18n';

  // Initialisation au chargement de la page
  onMount(async () => {
    // Initialiser les données avec celles reçues du serveur
    leaderboardData = {
      adulte: data.leaderboardAdult || [],
      enfant: data.leaderboardChild || []
    };

    // Charger les données les plus récentes (sans montrer l'indicateur de chargement)
    await updateLeaderboard(false);
  });

  // Données chargées depuis le serveur
  export let data;

  // État UI
  let isLoading = false;
  let currentLevel = data.currentLevel || 'adulte';
  let currentDuration = data.currentDuration || 5;
  let leaderboardData = {
    adulte: data.leaderboardAdult || [],
    enfant: data.leaderboardChild || []
  };

  // Options de durée disponibles
  const durationOptions = [
    { value: 2, label: '2 minutes' },
    { value: 3, label: '3 minutes' },
    { value: 5, label: '5 minutes' }
  ];

  // Fonctions d'interaction
  async function toggleLevel(level) {
    if (level !== currentLevel) {
      currentLevel = level;
      await updateLeaderboard(true);
    }
  }

  async function setDuration(duration) {
    if (duration !== currentDuration) {
      currentDuration = duration;
      await updateLeaderboard(true);
    }
  }

  // Met à jour l'URL et charge les données du classement
  async function updateLeaderboard() {
    const url = `/leaderboard?level=${currentLevel}&duration=${currentDuration}`;
    goto(url, { replaceState: true });

    try {
      const response = await fetch(`/api/leaderboard?level=${currentLevel}&duration=${currentDuration}`);
      if (!response.ok) throw new Error(_('common.error'));

      const data = await response.json();

      if (currentLevel === 'adulte') {
        leaderboardData.adulte = data.scores;
      } else {
        leaderboardData.enfant = data.scores;
      }
    } catch (error) {
      console.error(_('leaderboard.loading'), error);
      if (currentLevel === 'adulte') {
        leaderboardData.adulte = [];
      } else {
        leaderboardData.enfant = [];
      }
    }
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
  <title>{_('leaderboard.pageTitle')}</title>
  <meta name="description" content={_('leaderboard.metaDescription')} />
</svelte:head>

<main class="container">
  <div class="leaderboard-page card">
    <div class="page-header">
      <h1>{_('leaderboard.title')}</h1>
    </div>

    <div class="filters-container">
      <div class="level-toggle">
        <h3>{_('leaderboard.levelLabel')}</h3>
        <div class="toggle-buttons">
          <button
            class="toggle-button {currentLevel === 'adulte' ? 'active' : ''}"
            on:click={() => toggleLevel('adulte')}
          >
            <span class="emoji">👨‍💼</span> {_('leaderboard.adultLevel')}
          </button>
          <button
            class="toggle-button {currentLevel === 'enfant' ? 'active' : ''}"
            on:click={() => toggleLevel('enfant')}
          >
            <span class="emoji">🧒</span> {_('leaderboard.childLevel')}
          </button>
        </div>
      </div>

      <div class="duration-selector">
        <h3>{_('leaderboard.durationLabel')}</h3>
        <div class="toggle-buttons">
          {#each durationOptions as option}
            <button
              class="toggle-button {currentDuration === option.value ? 'active' : ''}"
              on:click={() => setDuration(option.value)}
            >
              <span class="emoji">⏱️</span> {option.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="leaderboard-container">
      <Leaderboard
        isLoading={isLoading}
        level={currentLevel}
        duration={currentDuration}
        leaderboard={currentLevel === 'adulte' ? leaderboardData.adulte : leaderboardData.enfant}
      />
    </div>

    <div class="page-footer">
      <p>{_('leaderboard.filterExplanation')}</p>
      <p class="challenge-text">
        <span class="emoji">🚀</span> {_('leaderboard.challenge')}
      </p>
      <button class="play-button" on:click={goToPlay}>
        {_('leaderboard.playNow')}
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

  .filters-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
  }

  .level-toggle, .duration-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .level-toggle h3, .duration-selector h3 {
    color: var(--primary);
    margin: 0;
  }

  .toggle-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .toggle-button {
    padding: 12px 20px;
    border-radius: var(--border-radius-md);
    font-size: 1rem;
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

    .filters-container {
      gap: 15px;
    }

    .toggle-buttons {
      flex-direction: column;
      width: 100%;
    }

    .toggle-button {
      width: 100%;
    }
  }
</style>