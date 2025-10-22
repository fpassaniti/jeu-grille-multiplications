<script>
  import { _ } from '$lib/utils/i18n';
</script>

<svelte:head>
  <title>Mode Hors Ligne - Multy</title>
</svelte:head>

<div class="offline-container">
  <div class="offline-content">
    <div class="offline-icon">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>

    <h1>{_('offline.title') || 'Vous êtes hors ligne'}</h1>
    <p>{_('offline.message') || 'Vous avez perdu votre connexion Internet. Certaines fonctionnalités peuvent ne pas être disponibles.'}</p>

    <div class="offline-tips">
      <h2>{_('offline.tips') || 'Ce que vous pouvez faire :'}</h2>
      <ul>
        <li>{_('offline.tip1') || 'Continuez à jouer aux niveaux téléchargés'}</li>
        <li>{_('offline.tip2') || 'Consultez vos scores précédents'}</li>
        <li>{_('offline.tip3') || 'Cherchez une meilleure connexion Internet'}</li>
      </ul>
    </div>

    <div class="offline-actions">
      <a href="/" class="btn-primary">{_('offline.backHome') || 'Retour à l\'accueil'}</a>
    </div>
  </div>
</div>

<style>
  .offline-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 192px);
    padding: 40px 20px;
    background-color: var(--bg-primary);
  }

  .offline-content {
    text-align: center;
    max-width: 600px;
  }

  .offline-icon {
    color: #ef4444;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 10px 0;
    color: var(--text-primary);
  }

  p {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin-bottom: 40px;
  }

  .offline-tips {
    text-align: left;
    background-color: var(--bg-secondary);
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 40px;
  }

  .offline-tips h2 {
    margin-top: 0;
    color: var(--text-primary);
  }

  .offline-tips ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .offline-tips li {
    padding: 10px 0;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .offline-tips li:last-child {
    border-bottom: none;
  }

  .offline-actions {
    display: flex;
    justify-content: center;
  }

  .btn-primary {
    display: inline-block;
    padding: 12px 30px;
    background-color: #5B21B6;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn-primary:hover {
    background-color: #7c3aed;
  }

  @media (max-width: 600px) {
    .offline-container {
      min-height: calc(100vh - 120px);
    }

    h1 {
      font-size: 1.5rem;
    }

    p {
      font-size: 1rem;
    }

    .offline-tips {
      padding: 20px;
    }
  }
</style>
