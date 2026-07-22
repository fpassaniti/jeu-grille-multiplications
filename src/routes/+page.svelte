<script>
  import { invalidateAll } from '$app/navigation';
  import PrintableCard from '$lib/components/PrintableCard.svelte';
  import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
  import LevelBadge from '$lib/components/LevelBadge.svelte';
  import ChestModal from '$lib/components/chest/ChestModal.svelte';
  import { listEnabledModes } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  const modes = listEnabledModes();

  // Données utilisateur venant du serveur
  export let data;

  // Bannière week-end : affichage seul, le calcul réel (bonus ×2) est serveur
  const isWeekend = [0, 6].includes(new Date().getDay());

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
</script>

<svelte:head>
  <title>MultyFun - Apprends les multiplications en t'amusant!</title>
  <meta name="description" content="Améliore tes compétences en multiplication avec ce jeu interactif amusant et gagne des niveaux!" />
</svelte:head>

<main class="container">
  {#if isWeekend}
    <p class="weekend-banner">🎉 {_('rewards.weekend')}</p>
  {/if}

  {#if data.user}
    <!-- Utilisateur connecté : tableau de bord -->
    <div class="dashboard-container">
      <div class="dashboard-content">
        <div class="dashboard-main card">
          <h1>{_('dashboard.welcome', { name: data.user?.displayName || _('dashboard.defaultLevelName') })}</h1>

          <div class="level-card">
            <a href="/character" class="level-image">
              <div class="dashboard-avatar-wrapper">
                <CharacterAvatar size={150} equipment={data.equipment ?? {}} />
                <div class="dashboard-level-badge">
                  <LevelBadge
                    level={data.userProgress?.level || 1}
                    colorTheme={data.userProgress?.currentLevel?.color_theme}
                    size={32}
                  />
                </div>
              </div>
              <span class="customize-hint">🦸 {_('character.title')}</span>
            </a>

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

          <div class="dashboard-action-buttons">
            <a href="/play" class="button dashboard-primary-button">
              <span class="emoji">🎮</span> {_('dashboard.playButton')}
            </a>

            <a href="/collection" class="button dashboard-secondary-button">
              <span class="emoji">📚</span> {_('dashboard.collectionButton')}
            </a>

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
  {:else}
    <!-- Utilisateur non connecté : vitrine du jeu -->
    <div class="welcome-screen card">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-text">MultyFun</span>
          <div class="logo-icon">
            <span class="math-symbol">×</span>
          </div>
        </div>
      </div>

      <h1>{_('home.gameTitle')}</h1>
      <p class="game-intro">{_('home.gameIntro')}</p>

      <div class="cta-primary">
        <a href="/register" class="button primary-button">
          <span class="emoji">🚀</span> {_('home.startOptions.startAdventure.title')}
        </a>
        <p class="cta-secondary">
          {_('auth.alreadyHaveAccount')}
          <a href="/login">{_('home.startOptions.login.title')}</a>
        </p>
      </div>

      <div class="modes-showcase">
        <h2>{_('home.modesShowcase.title')}</h2>
        <div class="modes-showcase-grid">
          {#each modes as mode}
            <div class="mode-showcase-card">
              <div class="mode-showcase-icon">{mode.icon}</div>
              <h3>{_(mode.labelKey)}</h3>
            </div>
          {/each}
        </div>
      </div>

      <div class="features-section">
        <h2>{_('home.gamificationShowcase.title')}</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🧙</div>
            <h3>{_('home.gamificationShowcase.character.title')}</h3>
            <p>{_('home.gamificationShowcase.character.description')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🪙</div>
            <h3>{_('home.gamificationShowcase.coins.title')}</h3>
            <p>{_('home.gamificationShowcase.coins.description')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎁</div>
            <h3>{_('home.gamificationShowcase.chests.title')}</h3>
            <p>{_('home.gamificationShowcase.chests.description')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔥</div>
            <h3>{_('home.gamificationShowcase.streaks.title')}</h3>
            <p>{_('home.gamificationShowcase.streaks.description')}</p>
          </div>
        </div>
      </div>

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
        <a href="/play" class="button leaderboard-button">
          <span class="emoji">🏆</span> {_('home.leaderboard.viewButton')}
        </a>
      </div>
    </div>
  {/if}
</main>

{#if dailyOpen}
  <ChestModal chestType="daily" onClose={closeDailyChest} onOpened={handleChestOpened} />
{:else if welcomeOpen}
  <ChestModal chestType="welcome" onClose={closeWelcomeChest} onOpened={handleChestOpened} />
{/if}

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

  .weekend-banner {
    display: inline-block;
    background: linear-gradient(135deg, #fff8e1, #ffe082);
    color: #ff8f00;
    font-weight: bold;
    padding: 10px 20px;
    border-radius: var(--border-radius-md);
    margin: 20px auto;
  }

  .welcome-screen {
    text-align: center;
    padding: 30px;
    margin: 20px auto;
  }

  .cta-primary {
    margin: 30px 0;
    text-align: center;
  }

  .primary-button {
    font-size: 1.2rem;
    padding: 15px 30px;
    background-color: var(--accent);
    color: white;
    box-shadow: 0 6px 0 var(--accent-dark);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .cta-secondary {
    margin-top: 15px;
    color: var(--text-secondary);
  }

  .modes-showcase {
    margin-top: 50px;
  }

  .modes-showcase-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
  }

  .mode-showcase-card {
    background-color: white;
    border-radius: var(--border-radius-md);
    padding: 20px;
    width: 140px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }

  .mode-showcase-icon {
    font-size: 2.2rem;
    margin-bottom: 10px;
  }

  .mode-showcase-card h3 {
    color: var(--primary-dark);
    font-size: 1rem;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .leaderboard-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 var(--primary-dark);
  }

  /* Tableau de bord (utilisateur connecté) */
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    transition: transform 0.2s;
  }

  .level-image:hover {
    transform: translateY(-3px);
  }

  .dashboard-avatar-wrapper {
    position: relative;
    width: 150px;
    height: 150px;
  }

  .dashboard-level-badge {
    position: absolute;
    bottom: -6px;
    right: -6px;
  }

  .customize-hint {
    font-weight: bold;
    color: var(--primary-dark);
    font-size: 0.9rem;
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

  .coins-stat .stat-value {
    color: #ff8f00;
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

  .dashboard-action-buttons {
    display: flex;
    gap: 15px;
    margin-top: 20px;
  }

  .dashboard-primary-button {
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

  .dashboard-secondary-button {
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

  .game-score {
    font-weight: bold;
    color: var(--primary-dark);
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

  @media (max-width: 767px) {
    .mode-showcase-card, .feature-card {
      width: 100%;
    }

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

    .dashboard-action-buttons {
      flex-direction: column;
    }
  }
</style>
