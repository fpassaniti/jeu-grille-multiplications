<script>
  import { onMount } from 'svelte';
  import { _ } from '$lib/utils/i18n';

  let showInstallPrompt = false;
  let showUpdatePrompt = false;
  let deferredPrompt = null;

  onMount(() => {
    // Gérer l'installation de la PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallPrompt = true;
    });

    // Gérer les mises à jour du service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        showUpdatePrompt = true;
      });

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      }, 60 * 60 * 1000);
    }
  });

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    deferredPrompt = null;
    showInstallPrompt = false;
  }

  function dismissInstall() {
    showInstallPrompt = false;
  }

  function handleUpdate() {
    window.location.reload();
  }

  function dismissUpdate() {
    showUpdatePrompt = false;
  }
</script>

{#if showInstallPrompt}
  <div class="pwa-prompt install-prompt">
    <div class="prompt-content">
      <h3>{_('pwa.installTitle') || 'Installer Multy'}</h3>
      <p>{_('pwa.installMessage') || 'Installez notre application pour accéder à des fonctionnalités hors ligne'}</p>
      <div class="prompt-actions">
        <button class="btn-primary" on:click={handleInstall}>
          {_('pwa.install') || 'Installer'}
        </button>
        <button class="btn-secondary" on:click={dismissInstall}>
          {_('pwa.dismiss') || 'Plus tard'}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showUpdatePrompt}
  <div class="pwa-prompt update-prompt">
    <div class="prompt-content">
      <h3>{_('pwa.updateTitle') || 'Nouvelle version disponible'}</h3>
      <p>{_('pwa.updateMessage') || 'Une nouvelle version de Multy est disponible'}</p>
      <div class="prompt-actions">
        <button class="btn-primary" on:click={handleUpdate}>
          {_('pwa.update') || 'Mettre à jour'}
        </button>
        <button class="btn-secondary" on:click={dismissUpdate}>
          {_('pwa.later') || 'Plus tard'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .pwa-prompt {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    max-width: 400px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .prompt-content {
    padding: 20px;
  }

  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    color: #1f2937;
  }

  p {
    margin: 0 0 15px 0;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .prompt-actions {
    display: flex;
    gap: 10px;
  }

  button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #5B21B6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #7c3aed;
  }

  .btn-secondary {
    background-color: #e5e7eb;
    color: #1f2937;
  }

  .btn-secondary:hover {
    background-color: #d1d5db;
  }

  @media (max-width: 600px) {
    .pwa-prompt {
      bottom: 10px;
      left: 10px;
      right: 10px;
      max-width: none;
    }
  }
</style>
