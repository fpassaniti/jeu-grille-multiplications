<script>
  // Props
  export let level = 1;
  export let imageUrl = null;
  export let colorTheme = null;
  export let size = 'large'; // small, medium, large
  export let isLocked = false;
  export let shape = 'circle'; // 'circle' pour rond, 'rectangle' pour 3:4

  // Calculer la taille
  $: dimensions = {
    small: shape === 'circle' ? '60px' : '100%',
    medium: shape === 'circle' ? '80px' : '100%',
    large: shape === 'circle' ? '120px' : '100%'
  }[size] || '100%';

  $: height = {
    small: shape === 'circle' ? '60px' : '100%',
    medium: shape === 'circle' ? '80px' : '100%',
    large: shape === 'circle' ? '120px' : '100%'
  }[size] || '100%';

  $: fontSize = {
    small: '1.5rem',
    medium: '1.8rem',
    large: '2.5rem'
  }[size] || '1.8rem';

  // Générer un dégradé basé sur le thème de couleur
  $: gradient = getColorGradient(colorTheme);

  // Fonctions utilitaires
  function getColorGradient(theme) {
    // Correspondance des thèmes aux gradients spécifiques (sans utiliser de variables CSS)
    const themeMap = {
      'blue': 'linear-gradient(45deg, #4d57ff, #8a90ff)',
      'green': 'linear-gradient(45deg, #43d787, #7df0b2)',
      'purple': 'linear-gradient(45deg, #9c5fff, #c29aff)',
      'orange': 'linear-gradient(45deg, #ff8f3e, #ffb585)',
      'red': 'linear-gradient(45deg, #ff6b6b, #ff9999)',
      'teal': 'linear-gradient(45deg, #26c0c0, #7fe7e7)',
      'indigo': 'linear-gradient(45deg, #4f46e5, #a5b4fc)',
      'pink': 'linear-gradient(45deg, #ec4899, #f9a8d4)',
      'amber': 'linear-gradient(45deg, #d97706, #fbbf24)',
      'gold': 'linear-gradient(45deg, #d4af37, #f9e29c)'
    };

    return themeMap[theme] || 'linear-gradient(45deg, #4d57ff, #8a90ff)';
  }

  // Vérifier si l'image est valide
  let imageError = false;

  function handleImageError() {
    imageError = true;
  }
</script>

<div
  class="level-avatar {size} {shape}"
  style="--avatar-width: {dimensions}; --avatar-height: {height}; --font-size: {fontSize};"
>
  {#if isLocked}
    <div class="locked-avatar">
      <span class="emoji">🔒</span>
    </div>
  {:else if imageUrl && !imageError}
    <img
      src={imageUrl}
      alt="Niveau {level}"
      class="avatar-image"
      on:error={handleImageError}
    />
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
    width: var(--avatar-width);
    height: var(--avatar-height);
    position: relative;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border: 3px solid #4d57ff;
  }

  .circle .avatar-image {
    border-radius: 50%;
  }

  .rectangle .avatar-image {
    border-radius: 12px;
  }

  .fallback-avatar {
    width: 100%;
    height: 100%;
    background-color: #4d57ff;
    color: white;
    font-size: var(--font-size);
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .circle .fallback-avatar {
    border-radius: 50%;
  }

  .rectangle .fallback-avatar {
    border-radius: 12px;
  }

  .locked-avatar {
    width: 100%;
    height: 100%;
    background-color: var(--bg-secondary);
    color: var(--text-light);
    font-size: var(--font-size);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }

  .circle .locked-avatar {
    border-radius: 50%;
  }

  .rectangle .locked-avatar {
    border-radius: 12px;
  }

  /* Tailles prédéfinies */
  .small {
    --avatar-width: 60px;
  }

  .medium {
    --avatar-width: 80px;
  }

  .large {
    --avatar-width: 120px;
  }

  /* Hauteurs spécifiques pour la forme rectangle */
  .small.circle {
    --avatar-height: 60px;
  }

  .medium.circle {
    --avatar-height: 80px;
  }

  .large.circle {
    --avatar-height: 120px;
  }

  .small.rectangle {
    --avatar-height: 80px;
  }

  .medium.rectangle {
    --avatar-height: 106px;
  }

  .large.rectangle {
    --avatar-height: 160px;
  }
</style>