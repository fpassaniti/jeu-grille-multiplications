<!-- src/lib/components/LevelAvatar.svelte -->
<script>
  // Props
  export let level = 1;
  export let imageUrl = null;
  export let colorTheme = null;
  export let size = 'medium'; // small, medium, large
  export let isLocked = false;

  // Calculer la taille
  $: dimensions = {
    small: '60px',
    medium: '80px',
    large: '120px'
  }[size] || '80px';

  $: fontSize = {
    small: '1.5rem',
    medium: '1.8rem',
    large: '2.5rem'
  }[size] || '1.8rem';

  // Générer un dégradé basé sur le thème de couleur
  $: gradient = getColorGradient(colorTheme);

  // Fonctions utilitaires
  function getColorGradient(theme) {
    // Correspondance des thèmes aux variables CSS
    const themeMap = {
      'blue': 'linear-gradient(45deg, var(--primary), var(--primary-light))',
      'green': 'linear-gradient(45deg, var(--success), var(--success-light))',
      'purple': 'linear-gradient(45deg, #9c5fff, #c29aff)',
      'orange': 'linear-gradient(45deg, #ff8f3e, #ffb585)',
      'red': 'linear-gradient(45deg, var(--secondary), var(--secondary-light))',
      'teal': 'linear-gradient(45deg, #26c0c0, #7fe7e7)',
      'indigo': 'linear-gradient(45deg, #4f46e5, #a5b4fc)',
      'pink': 'linear-gradient(45deg, #ec4899, #f9a8d4)',
      'amber': 'linear-gradient(45deg, #d97706, #fbbf24)',
      'gold': 'linear-gradient(45deg, #d4af37, #f9e29c)'
    };

    return themeMap[theme] || 'linear-gradient(45deg, var(--primary), var(--primary-light))';
  }
</script>

<div class="level-avatar {size}" style="--avatar-size: {dimensions}; --font-size: {fontSize};">
  {#if isLocked}
    <div class="locked-avatar">
      <span class="emoji">🔒</span>
    </div>
  {:else if imageUrl}
    <img
      src={imageUrl}
      alt="Niveau {level}"
      class="avatar-image"
      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
    />
    <div
      class="fallback-avatar"
      style="background-image: {gradient}; display: none;"
    >
      {level}
    </div>
  {:else}
    <div
      class="fallback-avatar"
      style="background-image: {gradient};"
    >
      {level}
    </div>
  {/if}
</div>

<style>
  .level-avatar {
    width: var(--avatar-size);
    height: var(--avatar-size);
    position: relative;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border: 3px solid var(--primary);
  }

  .fallback-avatar {
    width: 100%;
    height: 100%;
    background-color: var(--primary);
    background-image: linear-gradient(45deg, var(--primary), var(--primary-light));
    color: white;
    font-size: var(--font-size);
    font-weight: bold;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .locked-avatar {
    width: 100%;
    height: 100%;
    background-color: var(--bg-secondary);
    color: var(--text-light);
    font-size: var(--font-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }

  /* Tailles prédéfinies */
  .small {
    --avatar-size: 60px;
    --font-size: 1.5rem;
  }

  .medium {
    --avatar-size: 80px;
    --font-size: 1.8rem;
  }

  .large {
    --avatar-size: 120px;
    --font-size: 2.5rem;
  }
</style>