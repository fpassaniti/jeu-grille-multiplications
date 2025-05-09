<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import LevelAvatar from '$lib/components/LevelAvatar.svelte';
  import PrintableCard from '$lib/components/PrintableCard.svelte';
  import { _ } from '$lib/utils/i18n';

  // Données utilisateur venant du serveur
  export let data;

  // État de l'interface
  let loading = false;
  let error = null;

  // Redirection si non connecté
  onMount(() => {
    if (!data.user) {
      goto('/login');
    }
  });
</script>

<svelte:head>
  <title>Tableau de bord - MultyFun</title>
</svelte:head>

<main class="container">
  <div class="dashboard-container">
    {#if error}
      <div class="error-message">
        <span class="emoji">⚠️</span> {error}
      </div>
    {/if}

    <div class="dashboard-content">
      <div class="dashboard-main card">
        <h1>{_('dashboard.welcome', { name: data.user?.displayName || _('dashboard.defaultLevelName') })}</h1>

        <div class="level-card">
          <div class="level-image">
            <LevelAvatar
              level={data.userProgress?.level || 1}
              imageUrl={data.userProgress?.currentLevel?.image_url}
              colorTheme={data.userProgress?.currentLevel?.color_theme}
              size="large"
              shape="rectangle"
              isLocked={false}
            />
          </div>

          <div class="level-info">
            <div class="level-title">
              <span class="level-number">{_('dashboard.levelNumber', { level: data.userProgress?.level || 1 })}</span>
              <h2 class="level-name">{data.userProgress?.level ? _(`level.${data.userProgress?.level}`) : _('dashboard.defaultLevelName')}</h2>
            </div>

            <p class="level-description">
              {data.userProgress?.level ? _(`level.description.${data.userProgress?.level}`) : _('dashboard.defaultLevelDescription')}
            </p>

            <div class="level-stats">
              <div class="stat-item">
                <span class="stat-label">{_('dashboard.gamesPlayed')}</span>
                <span class="stat-value">{data.userProgress?.games_played || 0}</span>
              </div>

              <div class="stat-item">
                <span class="stat-label">{_('dashboard.totalXp')}</span>
                <span class="stat-value">{data.userProgress?.xp || 0}</span>
              </div>
            </div>

            {#if data.userProgress?.nextLevel}
              <div class="xp-progress">
                <div class="progress-label">
                  <span>{_('dashboard.nextLevel', { title: data.userProgress.nextLevel.title })}</span>
                  <span>{data.userProgress.xp}/{data.userProgress.nextLevel.min_xp} XP</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {data.userProgress.levelProgress}%"></div>
                </div>
                <div class="progress-info">
                  {_('dashboard.xpUntilNextLevel', { xp: data.userProgress.xpUntilNextLevel })}
                </div>
              </div>
            {:else}
              <div class="max-level">
                <span class="emoji">🏆</span> {_('dashboard.maxLevel')}
              </div>
            {/if}
          </div>
        </div>

        <div class="action-buttons">
          <a href="/play" class="button primary-button">
            <span class="emoji">🎮</span> {_('dashboard.playButton')}
          </a>

          <a href="/collection" class="button secondary-button">
            <span class="emoji">📚</span> {_('dashboard.collectionButton')}
          </a>

          <!-- Remplacé le bouton d'impression par notre nouveau composant -->
          <div class="print-button-wrapper">
            <PrintableCard
              level={data.userProgress?.level || 1}
              title={data.userProgress?.currentLevel?.title || 'Explorateur des Nombres'}
              description={data.userProgress?.currentLevel?.description || 'Tu as commencé ton voyage dans le monde des mathématiques!'}
              imageUrl={data.userProgress?.currentLevel?.image_url}
              colorTheme={data.userProgress?.currentLevel?.color_theme || 'blue'}
              playerName={data.user?.displayName || 'Aventurier'}
            />
          </div>
        </div>
      </div>

      <div class="recent-games card">
        <h2>{_('dashboard.recentGames')}</h2>

        {#if data.recentGames && data.recentGames.length > 0}
          <div class="games-list">
            {#each data.recentGames as game}
              <div class="game-item">
                <div class="game-date">
                  {new Date(game.date).toLocaleDateString()}
                </div>
                <div class="game-details">
                  <div class="game-score">
                    <span class="emoji">🏆</span> {game.score} XP
                  </div>
                </div>
                <div class="game-level">
                  <span class="emoji">{game.level === 'adulte' ? '👨‍💼' : '🧒'}</span> {game.level === 'adulte' ? _('common.adult') : _('common.child')}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="no-games">
            <p>{_('dashboard.noGames')}</p>
            <a href="/play" class="button play-now-button">
              {_('dashboard.playNow')}
            </a>
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>


<style>
  .dashboard-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
  }

  .dashboard-main {
    padding: 30px;
  }

  .dashboard-main h1 {
    margin-bottom: 30px;
    color: var(--primary-dark);
  }

  .level-card {
    display: flex;
    gap: 20px;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-lg);
    padding: 25px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    margin-bottom: 30px;
  }

  .level-image {
    flex: 0 0 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .level-info {
    flex: 1;
  }

  .level-title {
    margin-bottom: 10px;
  }

  .level-number {
    font-size: 0.9rem;
    color: var(--text-secondary);
    display: block;
    margin-bottom: 5px;
  }

  .level-name {
    font-size: 1.8rem;
    color: var(--primary-dark);
    margin: 0 0 10px 0;
  }

  .level-description {
    color: var(--text-secondary);
    margin-bottom: 20px;
  }

  .level-stats {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
  }

  .stat-item {
    background-color: white;
    padding: 10px 15px;
    border-radius: var(--border-radius-md);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  }

  .stat-label {
    font-size: 0.8rem;
    color: var(--text-light);
    display: block;
    margin-bottom: 3px;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary-dark);
  }

  .xp-progress {
    margin-top: 20px;
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .progress-bar {
    height: 10px;
    background-color: white;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 5px;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--success);
    border-radius: 5px;
    transition: width 0.5s ease;
  }

  .progress-info {
    font-size: 0.8rem;
    color: var(--text-light);
    text-align: right;
  }

  .max-level {
    background-color: var(--success-light);
    color: var(--success-dark);
    padding: 10px;
    border-radius: var(--border-radius-md);
    text-align: center;
    margin-top: 20px;
    font-weight: bold;
  }

  .action-buttons {
    display: flex;
    gap: 15px;
    margin-top: 20px;
  }

  .primary-button {
    flex: 1;
    padding: 15px;
    background-color: var(--accent);
    color: white;
    font-size: 1.1rem;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--accent-dark);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .secondary-button {
    flex: 1;
    padding: 15px;
    background-color: var(--primary);
    color: white;
    font-size: 1.1rem;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--primary-dark);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .print-button-wrapper {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .emoji {
    margin-right: 5px;
  }

  .recent-games {
    padding: 20px;
  }

  .recent-games h2 {
    margin-bottom: 20px;
    color: var(--primary-dark);
  }

  .games-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .game-item {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    transition: transform 0.2s;
  }

  .game-item:hover {
    transform: translateY(-3px);
  }

  .game-date {
    font-size: 0.8rem;
    color: var(--text-light);
  }

  .game-details {
    display: flex;
    justify-content: space-between;
  }

  .game-score, .game-xp {
    font-weight: bold;
  }

  .game-score {
    color: var(--primary-dark);
  }

  .game-xp {
    color: var(--success-dark);
  }

  .game-level {
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-align: right;
  }

  .no-games {
    text-align: center;
    padding: 30px 0;
    color: var(--text-light);
  }

  .play-now-button {
    margin-top: 15px;
    padding: 10px 20px;
    background-color: var(--accent);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
    box-shadow: 0 3px 0 var(--accent-dark);
    display: inline-block;
  }

  .error-message {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: var(--border-radius-md);
    margin-bottom: 20px;
  }

  @media (max-width: 767px) {
    .dashboard-content {
      grid-template-columns: 1fr;
    }

    .level-card {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .level-stats {
      flex-direction: column;
      width: 100%;
    }

    .action-buttons {
      flex-direction: column;
    }
  }
</style>