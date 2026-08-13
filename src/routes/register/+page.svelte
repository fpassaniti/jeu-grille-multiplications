<script>
  import {_} from '$lib/utils/i18n';
  import { SMOOTHIE_INGREDIENTS, MAX_SMOOTHIE_SIZE } from '$lib/utils/smoothie.js';

  // État du formulaire
  let username = '';
  let smoothie = [];
  let displayName = '';
  let playerMode = '';
  let loading = false;
  let error = null;
  let success = false;
  let submitted = false;

  function toggleIngredient(char) {
    if (smoothie.includes(char)) {
      smoothie = smoothie.filter(c => c !== char);
    } else if (smoothie.length < MAX_SMOOTHIE_SIZE) {
      smoothie = [...smoothie, char];
    }
  }

  async function handleRegister() {
    submitted = true;

    if (!username || smoothie.length === 0 || !playerMode) {
      error = _('auth.requiredFields');
      return;
    }

    error = null;
    loading = true;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          smoothie,
          displayName: displayName || username,
          playerMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur d\'inscription');
      }

      // Inscription réussie
      success = true;

      // Rediriger vers l'accueil après 2 secondes avec rechargement complet
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      error = err.message || 'Erreur lors de la création du compte. Essaie à nouveau.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{_('auth.registerTitle')} - {_('common.appName')}</title>
</svelte:head>

<div class="container">
  <div class="register-container card">
    <div class="register-header">
      <h1>{_('auth.registerTitle')}</h1>
      <p class="register-subheader">{_('auth.registerSubtitle')}</p>
    </div>

    {#if success}
      <div class="success-message">
        <div class="success-icon">🎉</div>
        <h2>{_('auth.accountCreated')}</h2>
        <p>{_('auth.welcomeMessage')}</p>
      </div>
    {:else}
      <form on:submit|preventDefault={handleRegister} class="register-form">
        {#if error}
          <div class="error-message">
            <span class="emoji">⚠️</span> {error}
          </div>
        {/if}

        <div class="form-group">
          <label for="username">{_('auth.firstName')}</label>
          <input
            type="text"
            id="username"
            bind:value={username}
            placeholder={_('auth.firstNamePlaceholder')}
            disabled={loading}
            autocomplete="off"
          />
          <p class="input-help">{_('auth.firstNameHelp')}</p>
        </div>

        <div class="form-group">
          <label for="displayName">{_('auth.displayName')}</label>
          <input
            type="text"
            id="displayName"
            bind:value={displayName}
            placeholder={_('auth.displayNamePlaceholder')}
            disabled={loading}
            autocomplete="off"
          />
          <p class="input-help">{_('auth.displayNameHelp')}</p>
        </div>

        <div class="form-group">
          <span class="form-label">{_('auth.playerMode')}</span>
          <div class="player-mode-buttons">
            <button
              type="button"
              class="player-mode-btn"
              class:selected={playerMode === 'adulte'}
              on:click={() => (playerMode = 'adulte')}
              disabled={loading}
            >
              <span class="emoji">👨‍💼</span> {_('common.adult')}
            </button>
            <button
              type="button"
              class="player-mode-btn"
              class:selected={playerMode === 'enfant'}
              on:click={() => (playerMode = 'enfant')}
              disabled={loading}
            >
              <span class="emoji">🧒</span> {_('common.child')}
            </button>
          </div>
          {#if submitted && !playerMode}
            <div class="error-text">{_('auth.choosePlayerMode')}</div>
          {/if}
          <p class="input-help">{_('auth.playerModeHelp')}</p>
        </div>

        <div class="form-group">
          <label for="passwordChar">{_('auth.secretCharacter')}</label>
          <div class="password-container">
            {#each SMOOTHIE_INGREDIENTS as char}
              <button
                type="button"
                class="password-char-btn"
                class:selected={smoothie.includes(char)}
                on:click={() => toggleIngredient(char)}
                disabled={loading}
              >
                {char}
              </button>
            {/each}
          </div>
          {#if submitted && smoothie.length === 0}
            <div class="error-text">{_('auth.chooseSecretCharacter')}</div>
          {/if}
          <p class="input-help">{_('auth.emojiPassword')}</p>
        </div>

        <button type="submit" class="register-button" disabled={loading}>
          {#if loading}
            {_('auth.creatingAccount')}
          {:else}
            <span class="emoji">🚀</span> {_('auth.createAccount')}
          {/if}
        </button>
      </form>

      <div class="register-footer">
        <p>{_('auth.alreadyHaveAccount')}</p>
        <a href="/login" class="button text-button">
          {_('auth.loginButton')}
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .register-container {
    max-width: 530px;
    margin: 50px auto;
    padding: 30px;
    position: relative;
  }

  .register-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .register-subheader {
    color: var(--text-secondary);
    margin-top: 10px;
  }

  .register-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .error-message {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: var(--border-radius-md);
    margin-bottom: 10px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label,
  .form-label {
    font-weight: bold;
    color: var(--primary-dark);
  }

  .player-mode-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
  }

  .player-mode-btn {
    padding: 12px 20px;
    border-radius: var(--border-radius-md);
    background-color: var(--bg-secondary);
  }

  .player-mode-btn.selected {
    background-color: var(--primary);
    color: white;
  }

  .form-group input {
    padding: 15px;
    font-size: 1rem;
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .form-group input:focus {
    border-color: var(--primary);
    outline: none;
  }

  .input-help {
    font-size: 0.8rem;
    color: var(--text-light);
    margin-top: 5px;
  }

  .password-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .password-char-btn {
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .password-char-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }

  .password-char-btn.selected {
    background-color: var(--primary-light);
    box-shadow: 0 0 0 2px var(--primary);
  }

  .error-text {
    color: #d32f2f;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .register-button {
    padding: 15px;
    background-color: var(--accent);
    color: white;
    font-size: 1.1rem;
    border-radius: var(--border-radius-md);
    margin-top: 10px;
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  .register-button:hover {
    background-color: var(--accent-light);
  }

  .register-button:disabled {
    background-color: #e0e0e0;
    box-shadow: none;
    cursor: not-allowed;
  }

  .register-footer {
    margin-top: 30px;
    text-align: center;
    color: var(--text-secondary);
  }

  .text-button {
    color: var(--primary);
    font-weight: bold;
    text-decoration: underline;
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    font-size: 1rem;
  }

  .text-button:hover {
    color: var(--primary-dark);
  }

  .success-message {
    text-align: center;
    padding: 30px 20px;
    animation: fadeIn 0.5s ease-in-out;
  }

  .success-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    animation: bounce 2s infinite;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-20px);
    }
    60% {
      transform: translateY(-10px);
    }
  }
</style>