<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import LevelAvatar from '$lib/components/LevelAvatar.svelte';
  import PrintableCard from '$lib/components/PrintableCard.svelte';
  import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
  import ChestModal from '$lib/components/chest/ChestModal.svelte';
  import { _ } from '$lib/utils/i18n';

  // Données utilisateur venant du serveur
  export let data;

  // État de l'interface
  let loading = false;
  let error = null;

  const RARITY_LABEL = { 3: 'commun', 7: 'rare', 14: 'épique', 30: 'légendaire' };

  // 7 derniers jours (aujourd'hui inclus), Europe/Paris
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  $: playedSet = new Set(data.playedDays ?? []);

  let chests = data.chests ?? {};
  let dailyOpen = false;
  // Le coffre de bienvenue s'ouvre automatiquement au premier chargement post-V2
  let welcomeOpen = chests.welcome?.available ?? false;

  function closeDailyChest() {
    dailyOpen = false;
    chests = { ...chests, daily: { available: false } };
  }

  function closeWelcomeChest() {
    welcomeOpen = false;
  }

  // Rafraîchit les pièces/inventaire affichés (header + carte dashboard) après un gain
  function handleChestOpened() {
    invalidateAll();
  }

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

              <div class="stat-item coins-stat">
                <span class="stat-label">{_('common.coins')}</span>
                <span class="stat-value">🪙 {data.userProgress?.coins || 0}</span>
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
              colorTheme={data.userProgress?.currentLevel?.color_theme || 'blue'}
              playerName={data.user?.displayName || 'Aventurier'}
            />
          </div>
        </div>
      </div>

      <a href="/character" class="character-card card">
        <CharacterAvatar equipment={data.equipment ?? {}} size={120} />
        <span class="character-link-label">🦸 {_('character.title')}</span>
      </a>

      <div class="daily-chest-card card">
        {#if chests.daily?.available}
          <button class="daily-chest-button" on:click={() => (dailyOpen = true)}>
            🎁 {_('chest.open')}
          </button>
        {:else}
          <p class="daily-chest-done">🎁 {_('chest.comeBackTomorrow')}</p>
        {/if}
      </div>

      <div class="streak-card card">
        <h2>{_('streak.days', { count: data.userProgress?.streak_days || 0 })}</h2>
        <div class="week-calendar">
          {#each weekDays as day}
            <div class="day-cell" class:played={playedSet.has(day)}>
              {playedSet.has(day) ? '✅' : '⬜'}
            </div>
          {/each}
        </div>
        {#if data.nextStreakMilestone}
          <p class="next-milestone">
            {_('streak.nextMilestone', {
              days: data.nextStreakMilestone - (data.userProgress?.streak_days || 0),
              reward: RARITY_LABEL[data.nextStreakMilestone]
            })}
          </p>
        {/if}
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

{#if dailyOpen}
  <ChestModal chestType="daily" onClose={closeDailyChest} onOpened={handleChestOpened} />
{:else if welcomeOpen}
  <ChestModal chestType="welcome" onClose={closeWelcomeChest} onOpened={handleChestOpened} />
{/if}


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

  .coins-stat .stat-value {
    color: #ff8f00;
  }

  .character-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 15px;
    text-decoration: none;
    transition: transform 0.2s;
  }

  .character-card:hover {
    transform: translateY(-3px);
  }

  .character-link-label {
    font-weight: bold;
    color: var(--primary-dark);
  }

  .daily-chest-card {
    padding: 15px;
    text-align: center;
  }

  .daily-chest-button {
    width: 100%;
    padding: 12px;
    background-color: var(--accent);
    color: white;
    font-weight: bold;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--accent-dark);
    animation: pulse 2s infinite;
  }

  .daily-chest-done {
    color: var(--text-light);
    font-style: italic;
    margin: 0;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }

  .streak-card {
    padding: 20px;
  }

  .streak-card h2 {
    margin-bottom: 15px;
    color: var(--primary-dark);
    text-align: center;
  }

  .week-calendar {
    display: flex;
    justify-content: center;
    gap: 6px;
    font-size: 1.5rem;
  }

  .day-cell {
    width: 32px;
    text-align: center;
  }

  .next-milestone {
    text-align: center;
    margin-top: 12px;
    font-size: 0.9rem;
    color: var(--text-secondary);
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