<!-- src/routes/collection/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import LevelAvatar from '$lib/components/LevelAvatar.svelte';
  import PrintableCard from '$lib/components/PrintableCard.svelte';

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
  <title>Ma Collection - MultyFun</title>
</svelte:head>

<main class="container">
  <div class="collection-container">
    {#if error}
      <div class="error-message">
        <span class="emoji">⚠️</span> {error}
      </div>
    {/if}

    <div class="collection-header card">
      <h1>Ma Collection de Niveaux</h1>
      <p class="collection-description">
        Découvre tous les niveaux que tu peux débloquer en jouant à MultyFun!
        Chaque niveau te donne un nouveau titre et une nouvelle image.
      </p>

      <div class="progress-summary">
        <div class="progress-label">
          <span>Niveaux débloqués: {data.unlockedLevels}/{data.levels.length}</span>
          <span>Niveau actuel: {data.userLevel}</span>
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
            <span class="level-number">Niveau {level.level}</span>
            {#if level.unlocked}
              <span class="level-status unlocked">Débloqué</span>
            {:else}
              <span class="level-status locked">Verrouillé</span>
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
                <p class="level-hint">Débloque ce niveau en gagnant plus d'XP!</p>
                <p class="level-xp-required">XP nécessaire: {level.min_xp}</p>
                {#if data.userProgress}
                  <p class="level-xp-missing">Encore {level.min_xp - data.userProgress.xp} XP à gagner</p>
                {/if}
              {/if}
            </div>
          </div>

          {#if level.unlocked}
            <div class="level-actions">
              <!-- Remplacé le bouton d'impression par notre nouveau composant -->
              <PrintableCard
                level={level.level}
                title={level.title}
                description={level.description}
                imageUrl={level.image_url}
                colorTheme={level.color_theme || 'blue'}
                playerName={data.user?.displayName || 'Aventurier'}
              />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</main>

<style>
  .collection-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
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

  .error-message {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: var(--border-radius-md);
    margin-bottom: 20px;
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