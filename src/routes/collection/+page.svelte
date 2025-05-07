<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import LevelAvatar from '$lib/components/LevelAvatar.svelte';
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

  // Navigation
  function goToDashboard() {
    goto('/dashboard');
  }

  function goToHome() {
    goto('/');
  }

  // Fonction pour imprimer la carte de niveau sélectionnée
  function printLevelCard(level) {
    // Stocker temporairement le niveau sélectionné
    selectedLevel = level;
    setTimeout(() => {
      window.print();
      selectedLevel = null;
    }, 100);
  }

  // Niveau sélectionné pour impression
  let selectedLevel = null;
</script>

<svelte:head>
  <title>{_('collection.pageTitle')}</title>
  <style media="print">
    /* Style spécifique pour l'impression */
    body * {
      visibility: hidden;
    }
    .print-level-card, .print-level-card * {
      visibility: visible;
    }
    .print-level-card {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: white;
    }
  </style>
</svelte:head>

<main class="container">
  <div class="collection-container">
    <nav class="collection-nav card">
      <button class="nav-button" on:click={goToHome}>
        <span class="emoji">🏠</span> {_('common.home')}
      </button>

      <div class="nav-title">
        {_('collection.title')}
      </div>

      <button class="nav-button" on:click={goToDashboard}>
        <span class="emoji">📊</span> {_('common.dashboard')}
      </button>
    </nav>

    {#if error}
      <div class="error-message">
        <span class="emoji">⚠️</span> {error}
      </div>
    {/if}

    <div class="collection-header card">
      <h1>{_('collection.title')}</h1>
      <p class="collection-description">
        {_('collection.description')}
      </p>

      <div class="progress-summary">
        <div class="progress-label">
          <span>{_('collection.unlockedLevels')} {data.unlockedLevels}/{data.levels.length}</span>
          <span>{_('collection.currentLevel')} {data.userLevel}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {(data.unlockedLevels/data.levels.length) * 100}%"></div>
        </div>
      </div>
    </div>

    <div class="levels-grid">
      {#each data.levels as level}
        <div class="level-card card" class:unlocked={level.unlocked} class:current={level.current}>
          <div class="level-header">
            <span class="level-number">{_('collection.levelLabel')} {level.level}</span>
            {#if level.unlocked}
              <span class="level-status unlocked">{_('collection.unlocked')}</span>
            {:else}
              <span class="level-status locked">{_('collection.locked')}</span>
            {/if}
          </div>

          <div class="level-content">
            <div class="level-image">
              <LevelAvatar
                level={level.level}
                imageUrl={level.image_url}
                colorTheme={level.color_theme}
                size="medium"
                shape="circle"
                isLocked={!level.unlocked}
              />
            </div>

            <div class="level-details">
              <h3 class="level-title">{level.title}</h3>

              {#if level.unlocked}
                <p class="level-description">{level.description}</p>
              {:else}
                <p class="level-hint">{_('collection.unlockHint')}</p>
                <p class="level-xp-required">{_('collection.requiredXp')} {level.min_xp}</p>
                {#if data.userProgress}
                  <p class="level-xp-missing">{_('collection.xpNeeded', { xp: level.min_xp - data.userProgress.xp })}</p>
                {/if}
              {/if}
            </div>
          </div>

          {#if level.unlocked}
            <div class="level-actions">
              <button class="print-button" on:click={() => printLevelCard(level)}>
                <span class="emoji">🖨️</span> {_('collection.print')}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if selectedLevel}
    <div class="print-level-card">
      <div class="print-card-content">
        <div class="print-header">
          <h1 class="print-title">{_('collection.certificateTitle')}</h1>
        </div>

        <div class="print-level-info">
          <div class="print-level-number">{_('collection.levelLabel')} {selectedLevel.level}</div>
          <div class="print-level-title">{selectedLevel.title}</div>

          <div class="print-level-image">
            <!-- Note: Pour l'impression, nous gardons l'approche simple pour garantir la compatibilité -->
            {#if selectedLevel.image_url}
              <img
                src={selectedLevel.image_url}
                alt="Niveau {selectedLevel.level}"
                class="print-avatar-img"
              />
              <div class="print-avatar" style="display: none; background-image: {
                selectedLevel.color_theme ?
                `linear-gradient(45deg, var(--${selectedLevel.color_theme}), var(--${selectedLevel.color_theme}-light))` :
                'linear-gradient(45deg, #4a6da7, #7a9fd7)'
              }">
                {selectedLevel.level}
              </div>
            {:else}
              <!-- Image représentant le niveau (fallback) -->
              <div class="print-avatar" style={selectedLevel.color_theme ?
                `background-image: linear-gradient(45deg, var(--${selectedLevel.color_theme}), var(--${selectedLevel.color_theme}-light))` :
                'background-image: linear-gradient(45deg, #4a6da7, #7a9fd7)'
              }>
                {selectedLevel.level}
              </div>
            {/if}
          </div>

          <div class="print-level-description">
            {selectedLevel.description}
          </div>
        </div>

        <div class="print-player-info">
          <div class="print-player-name">
            {data.user?.displayName || 'Joueur'}
          </div>
          <div class="print-date">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div class="print-footer">
          <p>{_('collection.continueAdventure')}</p>
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .collection-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .collection-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    margin-bottom: 30px;
  }

  .nav-button {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 15px;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
  }

  .nav-title {
    font-weight: bold;
    color: var(--primary);
    font-size: 1.2rem;
  }

  .collection-header {
    text-align: center;
    padding: 30px;
    margin-bottom: 30px;
  }

  .collection-header h1 {
    margin-bottom: 15px;
    color: var(--primary-dark);
  }

  .collection-description {
    color: var(--text-secondary);
    max-width: 700px;
    margin: 0 auto 25px auto;
  }

  .progress-summary {
    max-width: 500px;
    margin: 0 auto;
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
    background-color: var(--bg-secondary);
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

  .levels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .level-card {
    padding: 20px;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
    overflow: hidden;
  }

  .level-card.unlocked:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  }

  .level-card.current {
    border: 2px solid var(--success);
  }

  .level-card.current::before {
    content: "Niveau actuel";
    position: absolute;
    top: 10px;
    right: -30px;
    background-color: var(--success);
    color: white;
    padding: 5px 40px;
    font-size: 0.7rem;
    transform: rotate(45deg);
  }

  .level-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .level-number {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .level-status {
    font-size: 0.8rem;
    padding: 3px 8px;
    border-radius: 10px;
  }

  .level-status.unlocked {
    background-color: var(--success-light);
    color: var(--success-dark);
  }

  .level-status.locked {
    background-color: var(--bg-secondary);
    color: var(--text-light);
  }

  .level-content {
    display: flex;
    gap: 15px;
  }

  .level-image {
    flex: 0 0 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .level-details {
    flex: 1;
  }

  .level-title {
    margin: 0 0 10px 0;
    color: var(--primary-dark);
    font-size: 1.2rem;
  }

  .level-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 15px;
  }

  .level-hint {
    font-style: italic;
    color: var(--text-light);
    font-size: 0.9rem;
    margin-bottom: 10px;
  }

  .level-xp-required {
    font-weight: bold;
    color: var(--primary);
    font-size: 0.9rem;
  }

  .level-xp-missing {
    color: var(--text-secondary);
    font-size: 0.85rem;
    margin-top: 5px;
  }

  .level-actions {
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
  }

  .print-button {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 15px;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
  }

  .error-message {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: var(--border-radius-md);
    margin-bottom: 20px;
  }

  /* Styles pour la carte imprimable */
  .print-level-card {
    display: none; /* Masqué en affichage normal, visible uniquement lors de l'impression */
  }

  @media print {
    .print-level-card {
      display: block;
      page-break-inside: avoid;
      font-family: 'Arial', sans-serif;
      padding: 20mm;
      box-sizing: border-box;
      color: #333;
    }

    .print-card-content {
      border: 5mm double #555;
      padding: 10mm;
      position: relative;
      height: 180mm;
      display: flex;
      flex-direction: column;
    }

    .print-header {
      margin-bottom: 10mm;
      text-align: center;
      border-bottom: 2px solid #888;
      padding-bottom: 5mm;
    }

    .print-title {
      font-size: 24pt;
      margin: 0;
    }

    .print-level-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .print-level-number {
      font-size: 16pt;
      margin-bottom: 5mm;
    }

    .print-level-title {
      font-size: 32pt;
      font-weight: bold;
      margin-bottom: 10mm;
    }

    .print-level-image {
      margin-bottom: 10mm;
    }

    .print-avatar {
      width: 30mm;
      height: 30mm;
      background-color: #4a6da7;
      color: white;
      font-size: 20pt;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .print-avatar-img {
      width: 30mm;
      height: 30mm;
      object-fit: cover;
      border-radius: 50%;
      border: 2mm solid #4a6da7;
      margin: 0 auto;
    }

    .print-level-description {
      font-size: 12pt;
      text-align: center;
      max-width: 90%;
      font-style: italic;
    }

    .print-player-info {
      display: flex;
      justify-content: space-between;
      margin-top: 15mm;
      padding-top: 10mm;
      border-top: 1px solid #ccc;
      width: 100%;
    }

    .print-player-name {
      font-size: 14pt;
      font-weight: bold;
    }

    .print-date {
      font-size: 12pt;
    }

    .print-footer {
      margin-top: 5mm;
      text-align: center;
      font-size: 10pt;
      color: #777;
    }
  }

  @media (max-width: 767px) {
    .levels-grid {
      grid-template-columns: 1fr;
    }

    .collection-nav {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>