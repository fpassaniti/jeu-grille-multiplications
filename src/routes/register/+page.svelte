<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { _ } from '$lib/utils/i18n';

  // État du formulaire
  let username = '';
  let passwordChar = '';
  let displayName = '';
  let loading = false;
  let error = null;
  let success = false;
  let submitted = false;
  
  // Caractères disponibles pour le mot de passe visuel (identique à l'écran de login)
  const passwordChars = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍒', '🥭', '🍉'];

  async function handleRegister() {
    submitted = true;

    if (!username || !passwordChar) {
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
          passwordChar,
          displayName: displayName || username
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || _('auth.registrationError'));
      }

      // Inscription réussie
      success = true;

      // Rediriger vers le dashboard après 2 secondes avec rechargement complet
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      error = err.message || _('auth.accountCreationError');
    } finally {
      loading = false;
    }
  }

  // Retour à l'accueil
  function goToHome() {
    goto('/');
  }

  // Aller à la page de connexion
  function goToLogin() {
    goto('/login');
  }
</script>

<svelte:head>
  <title>{_('auth.registerTitle')} - {_('common.appName')}</title>
</svelte:head>

<main class="container">
  <div class="register-container card">
    <button class="back-button" on:click={goToHome}>
      <span class="emoji">🏠</span> {_('common.home')}
    </button>

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
          <label for="passwordChar">{_('auth.secretCharacterHelp')}</label>
          <div class="password-container">
            {#each passwordChars as char}
              <button 
                type="button" 
                class="password-char-btn" 
                class:selected={passwordChar === char}
                on:click={() => passwordChar = char}
                disabled={loading}
              >
                {char}
              </button>
            {/each}
          </div>
          {#if submitted && !passwordChar}
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
        <button class="login-link" on:click={goToLogin}>
          {_('common.login')}
        </button>
      </div>
    {/if}
  </div>
</main>

<style>
  .register-container {
    max-width: 500px;
    margin: 50px auto;
    padding: 30px;
    position: relative;
  }

  .back-button {
    position: absolute;
    top: 20px;
    left: 20px;
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 15px;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
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

  .form-group label {
    font-weight: bold;
    color: var(--primary-dark);
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

  .login-link {
    color: var(--primary);
    font-weight: bold;
    text-decoration: underline;
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    font-size: 1rem;
  }

  .login-link:hover {
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
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-20px); }
    60% { transform: translateY(-10px); }
  }
</style>
