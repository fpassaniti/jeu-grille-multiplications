<script>
  import { onMount } from 'svelte';
  import PrintableCard from '$lib/components/PrintableCard.svelte';
  import LevelAvatar from '$lib/components/LevelAvatar.svelte';

  // Données du niveau venant du serveur
  export let data;

  // État
  let showPrintPreview = false;
  let playerName = 'Joueur Test';
  let customDate = new Date().toLocaleDateString();
  let debugInfo = {};

  onMount(() => {
    // Afficher des informations de debug
    debugInfo = {
      level: data.level,
      highResImagePath: data.level.image_url ? data.level.image_url.replace(/level-(\d+)\.png/i, 'level-$1_lg.png') : null,
      timestamp: new Date().toISOString()
    };
  });

  function togglePreview() {
    showPrintPreview = !showPrintPreview;
  }
</script>

<svelte:head>
  <title>Debug Impression - Niveau {data.level.level}</title>
  <style>
    /* Styles pour l'aperçu d'impression */
    .preview-mode body {
      background-color: #f0f0f0;
      padding: 20px;
    }

    @media print {
      .debug-controls, .debug-info {
        display: none !important;
      }
    }
  </style>
</svelte:head>

<main class="container">
  <div class="debug-page">
    <div class="debug-header">
      <h1>Débogage Impression - Niveau {data.level.level}</h1>
      <p class="debug-description">Cette page permet de tester l'impression sans avoir à naviguer dans l'application.</p>
    </div>

    <div class="debug-controls card">
      <div class="level-preview">
        <div class="level-preview-header">
          <h2>Aperçu du niveau {data.level.level}</h2>
        </div>

        <div class="level-info">
          <div class="level-avatar">
            <LevelAvatar
              level={data.level.level}
              imageUrl={data.level.image_url}
              colorTheme={data.level.color_theme}
              size="medium"
              shape="circle"
              isLocked={false}
            />
          </div>

          <div class="level-details">
            <h3 class="level-title">{data.level.title}</h3>
            <p class="level-description">{data.level.description}</p>
            <div class="level-meta">
              <div><strong>XP nécessaire:</strong> {data.level.min_xp}</div>
              <div><strong>Thème couleur:</strong> {data.level.color_theme || 'blue'}</div>
            </div>
          </div>
        </div>

        <div class="customize-print">
          <h3>Personnaliser l'impression</h3>

          <div class="form-group">
            <label for="playerName">Nom du joueur</label>
            <input type="text" id="playerName" bind:value={playerName} />
          </div>

          <div class="form-group">
            <label for="customDate">Date</label>
            <input type="text" id="customDate" bind:value={customDate} />
          </div>

          <div class="action-buttons">
            <PrintableCard
              level={data.level.level}
              title={data.level.title}
              description={data.level.description}
              imageUrl={data.level.image_url}
              colorTheme={data.level.color_theme || 'blue'}
              playerName={playerName}
              date={customDate}
            />

            <button class="preview-button" on:click={togglePreview}>
              {showPrintPreview ? 'Masquer aperçu' : 'Afficher aperçu'}
            </button>
          </div>
        </div>
      </div>

      <div class="debug-info">
        <h3>Informations de débogage</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>

    {#if showPrintPreview}
      <div class="print-preview card">
        <div class="preview-header">
          <h2>Aperçu de l'impression</h2>
          <button class="close-preview" on:click={togglePreview}>×</button>
        </div>

        <div class="preview-frame-container">
          <div class="preview-frame" class:portrait={true}>
            <div class="preview-page">
              <div class="print-card">
                <div class="print-header">
                  <h1 class="print-title">MultyFun - Certificat de Niveau</h1>
                </div>

                <div class="print-content">
                  <div class="print-level-info">
                    <div class="print-level-number">Niveau {data.level.level}</div>
                    <div class="print-level-title">{data.level.title}</div>

                    <div class="print-level-image">
                      {#if data.level.image_url}
                        <div class="print-image-wrapper">
                          <img src={data.level.image_url.replace(/level-(\d+)\.png/i, 'level-$1_lg.png')}
                               alt="Niveau {data.level.level}"
                               class="print-image" />
                        </div>
                      {:else}
                        <div class="print-fallback-image"
                             style="background: {
                               data.level.color_theme === 'blue' ? 'linear-gradient(45deg, #4d57ff, #8a90ff)' :
                               data.level.color_theme === 'green' ? 'linear-gradient(45deg, #43d787, #7df0b2)' :
                               data.level.color_theme === 'purple' ? 'linear-gradient(45deg, #9c5fff, #c29aff)' :
                               data.level.color_theme === 'orange' ? 'linear-gradient(45deg, #ff8f3e, #ffb585)' :
                               data.level.color_theme === 'red' ? 'linear-gradient(45deg, #ff6b6b, #ff9999)' :
                               data.level.color_theme === 'teal' ? 'linear-gradient(45deg, #26c0c0, #7fe7e7)' :
                               data.level.color_theme === 'indigo' ? 'linear-gradient(45deg, #4f46e5, #a5b4fc)' :
                               data.level.color_theme === 'pink' ? 'linear-gradient(45deg, #ec4899, #f9a8d4)' :
                               data.level.color_theme === 'amber' ? 'linear-gradient(45deg, #d97706, #fbbf24)' :
                               data.level.color_theme === 'gold' ? 'linear-gradient(45deg, #d4af37, #f9e29c)' :
                               'linear-gradient(45deg, #4d57ff, #8a90ff)'
                             }">
                          <span class="fallback-level">{data.level.level}</span>
                        </div>
                      {/if}
                    </div>

                    <div class="print-level-description">
                      {data.level.description}
                    </div>
                  </div>
                </div>

                <div class="print-player-info">
                  <div class="print-player-name">
                    {playerName}
                  </div>
                  <div class="print-date">
                    {customDate}
                  </div>
                </div>

                <div class="print-footer">
                  <p>Continue ton aventure mathématique sur MultyFun!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div class="debug-navigation">
      <a href="/debug-print/{Math.max(1, data.level.level - 1)}" class="nav-button">
        ← Niveau précédent
      </a>
      <a href="/debug-print/{data.level.level + 1}" class="nav-button">
        Niveau suivant →
      </a>
    </div>
  </div>
</main>

<style>
  .debug-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .debug-header {
    margin-bottom: 20px;
  }

  .debug-description {
    color: var(--text-secondary);
  }

  .debug-controls {
    padding: 20px;
    margin-bottom: 20px;
  }

  .level-preview {
    margin-bottom: 30px;
  }

  .level-preview-header {
    margin-bottom: 20px;
  }

  .level-info {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
  }

  .level-details {
    flex: 1;
  }

  .level-title {
    color: var(--primary-dark);
    margin-top: 0;
    margin-bottom: 10px;
  }

  .level-description {
    color: var(--text-secondary);
    margin-bottom: 15px;
  }

  .level-meta {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .customize-print {
    background-color: var(--bg-secondary);
    padding: 15px;
    border-radius: var(--border-radius-md);
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input {
    width: 100%;
    padding: 10px;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--bg-secondary);
  }

  .action-buttons {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .preview-button {
    padding: 8px 15px;
    background-color: var(--primary);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
  }

  .debug-info {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: var(--border-radius-md);
    margin-top: 20px;
  }

  .debug-info pre {
    background-color: #f1f3f5;
    padding: 10px;
    border-radius: 5px;
    overflow: auto;
    font-size: 0.8rem;
  }

  .print-preview {
    margin-bottom: 20px;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .close-preview {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0;
    margin: 0;
  }

  .preview-frame-container {
    overflow: auto;
    border: 1px solid #ddd;
    background-color: #f5f5f5;
  }

  .preview-frame {
    width: 100%;
    min-height: 600px;
    background-color: white;
    margin: 20px auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .preview-frame.portrait {
    width: 595px; /* A4 width in pixels at 72dpi */
    height: 842px; /* A4 height in pixels at 72dpi */
  }

  .preview-page {
    padding: 40px;
    height: 100%;
    box-sizing: border-box;
  }

  /* Styles simulant l'impression */
  .print-card {
    border: 10px double #555;
    padding: 20px;
    height: 85%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .print-header {
    margin-bottom: 20px;
    text-align: center;
    border-bottom: 2px solid #888;
    padding-bottom: 10px;
  }

  .print-title {
    font-size: 24px;
    font-family: 'Baloo 2', sans-serif;
    margin: 0;
    color: #333;
  }

  .print-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .print-level-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .print-level-number {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .print-level-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 20px;
    text-align: center;
  }

  .print-level-image {
    margin-bottom: 20px;
  }

  .print-image-wrapper {
    width: 200px; /* ~80mm à l'échelle de l'aperçu */
    height: 250px; /* ~100mm à l'échelle de l'aperçu */
    margin: 0 auto;
    overflow: hidden;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .print-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .print-fallback-image {
    width: 200px;
    height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    color: white;
    font-size: 36px;
    font-weight: bold;
  }

  .print-level-description {
    font-size: 14px;
    text-align: center;
    max-width: 90%;
    font-style: italic;
    margin: 0 auto;
  }

  .print-player-info {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #ccc;
    width: 100%;
  }

  .print-player-name {
    font-size: 16px;
    font-weight: bold;
  }

  .print-date {
    font-size: 14px;
  }

  .print-footer {
    margin-top: 10px;
    text-align: center;
    font-size: 12px;
    color: #777;
  }

  .debug-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
  }

  .nav-button {
    padding: 10px 15px;
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: var(--border-radius-md);
    transition: all 0.2s;
  }

  .nav-button:hover {
    background-color: var(--primary-light);
    color: white;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .level-info {
      flex-direction: column;
    }

    .action-buttons {
      flex-direction: column;
      align-items: flex-start;
    }

    .preview-frame.portrait {
      width: 100%;
      height: auto;
      min-height: 500px;
    }
  }
</style>