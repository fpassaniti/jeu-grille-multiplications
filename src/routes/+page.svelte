<script>
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import LevelAvatar from '$lib/components/LevelAvatar.svelte';
  import { _ } from '$lib/utils/i18n';

  // Données utilisateur venant du serveur (fournies via +layout.server.js)
  export let data;

  // État UI
  let loading = false;

  // Redirection selon le statut de connexion
  onMount(() => {
    if (data.user) {
      // Si déjà connecté, proposer d'aller au dashboard
    }
  });

  // Fonctions de navigation
  function goToQuickPlay() {
    goto('/play');
  }

  function goToLogin() {
    goto('/login');
  }

  function goToRegister() {
    goto('/register');
  }

  function goToDashboard() {
    goto('/dashboard');
  }

  function goToLeaderboard() {
    goto('/leaderboard');
  }
</script>

<svelte:head>
  <title>{_('home.title')}</title>
  <meta name="description" content={_('home.metaDescription')} />
</svelte:head>

<main class="container">
  <div class="welcome-screen card">
    <div class="logo-container">
      <div class="logo">
        <span class="logo-text">{_('common.appName')}</span>
        <div class="logo-icon">
          <span class="math-symbol">×</span>
        </div>
      </div>
    </div>

    <h1>{_('home.gameTitle')}</h1>
    <p class="game-intro">{_('home.gameIntro')}</p>

    {#if data.user}
      <!-- Utilisateur connecté -->
      <div class="welcome-message">
        <p>{_('home.welcome', { name: data.user.displayName })}</p>
        <div class="current-level-display">
          <div class="level-avatar-container">
            <LevelAvatar
              level={data.userProgress?.level || 1}
              imageUrl={data.userProgress?.currentLevel?.image_url}
              colorTheme={data.userProgress?.currentLevel?.color_theme}
              size="medium"
              shape="circle"
            />
          </div>
          <h2 class="level-info">
            {_('home.levelNumber', { level: data.userProgress?.level || 1 })}
            <span class="level-title">{data.userProgress?.currentLevel?.title || _('home.defaultLevelName')}</span>
          </h2>
        </div>
      </div>

      <div class="action-buttons">
        <button class="primary-button" on:click={goToDashboard}>
          <span class="emoji">🏆</span> {_('home.continueAdventure')}
        </button>
      </div>
    {:else}
      <!-- Utilisateur non connecté -->
      <div class="start-options">
        <div class="option-card" on:click={goToRegister}>
          <div class="option-icon">🚀</div>
          <h3>{_('home.startOptions.startAdventure.title')}</h3>
          <p>{_('home.startOptions.startAdventure.description')}</p>
        </div>

        <div class="option-card" on:click={goToLogin}>
          <div class="option-icon">🔑</div>
          <h3>{_('home.startOptions.login.title')}</h3>
          <p>{_('home.startOptions.login.description')}</p>
        </div>

        <div class="option-card" on:click={goToQuickPlay}>
          <div class="option-icon">⚡</div>
          <h3>{_('home.startOptions.quickPlay.title')}</h3>
          <p>{_('home.startOptions.quickPlay.description')}</p>
        </div>
      </div>
    {/if}

    <div class="features-section">
      <h2>{_('home.features.title')}</h2>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>{_('home.features.gainLevels.title')}</h3>
          <p>{_('home.features.gainLevels.description')}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🏅</div>
          <h3>{_('home.features.collectTitles.title')}</h3>
          <p>{_('home.features.collectTitles.description')}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🖨️</div>
          <h3>{_('home.features.printCard.title')}</h3>
          <p>{_('home.features.printCard.description')}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3>{_('home.features.playEverywhere.title')}</h3>
          <p>{_('home.features.playEverywhere.description')}</p>
        </div>
      </div>
    </div>

    <div class="leaderboard-section">
      <h2>{_('home.leaderboard.title')}</h2>
      <p>{_('home.leaderboard.description')}</p>
      <button class="leaderboard-button" on:click={goToLeaderboard}>
        <span class="emoji">🏆</span> {_('home.leaderboard.viewButton')}
      </button>
    </div>
  </div>
</main>

<style>
  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    animation: bounce 2s ease-in-out infinite;
  }

  .logo-text {
    font-family: 'Baloo 2', cursive;
    font-size: 2.8rem;
    font-weight: bold;
    color: var(--primary);
    text-shadow: 3px 3px 0 var(--accent-light);
  }

  .logo-icon {
    background: var(--accent);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  .math-symbol {
    font-size: 2rem;
    font-weight: bold;
    color: white;
  }

  .game-intro {
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: var(--text-secondary);
  }

  .welcome-screen {
    text-align: center;
    padding: 30px;
    margin: 20px auto;
  }

  .game-intro {
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: var(--text-secondary);
  }

  .welcome-message {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    margin: 20px 0;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .current-level-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 15px;
  }

  .level-avatar-container {
    margin-bottom: 5px;
  }

  .username {
    font-weight: bold;
    color: var(--primary);
    font-size: 1.2em;
  }

  .level-info {
    margin-top: 10px;
  }

  .level-title {
    font-weight: bold;
    color: var(--success);
  }

  .action-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 25px 0;
  }

  .primary-button {
    font-size: 1.2rem;
    padding: 15px 30px;
    background-color: var(--accent);
    color: white;
    box-shadow: 0 6px 0 var(--accent-dark);
  }

  .secondary-button {
    font-size: 1.2rem;
    padding: 15px 30px;
    background-color: var(--primary);
    color: white;
    box-shadow: 0 6px 0 var(--primary-dark);
  }

  .start-options {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    margin: 30px 0;
  }

  .option-card {
    background-color: white;
    border-radius: var(--border-radius-md);
    padding: 25px 20px;
    width: 220px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
  }

  .option-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  }

  .option-icon {
    font-size: 3rem;
    margin-bottom: 15px;
  }

  .option-card h3 {
    color: var(--primary-dark);
    margin-bottom: 10px;
  }

  .option-card p {
    color: var(--text-secondary);
  }

  .features-section {
    margin-top: 60px;
  }

  .features-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    margin-top: 30px;
  }

  .feature-card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    width: 220px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 15px;
    color: var(--primary);
  }

  .feature-card h3 {
    color: var(--primary-dark);
    margin-bottom: 10px;
    font-size: 1.1rem;
  }

  .feature-card p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .leaderboard-section {
    margin-top: 60px;
    background-color: var(--bg-secondary);
    padding: 30px;
    border-radius: var(--border-radius-lg);
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .leaderboard-section h2 {
    color: var(--primary-dark);
    margin-bottom: 15px;
  }

  .leaderboard-section p {
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  .leaderboard-button {
    background-color: var(--primary);
    color: white;
    padding: 12px 25px;
    font-size: 1.1rem;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--primary-dark);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .leaderboard-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 var(--primary-dark);
  }

  @media (max-width: 767px) {
    .action-buttons {
      flex-direction: column;
    }

    .option-card, .feature-card {
      width: 100%;
    }
  }
</style>