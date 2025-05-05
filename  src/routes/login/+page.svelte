<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // État du formulaire
  let username = '';
  let passwordChar = '';
  let loading = false;
  let error = null;

  // Fonction de connexion
  async function handleLogin() {
    if (!username || !passwordChar) {
      error = 'Tous les champs sont obligatoires';
      return;
    }

    if (passwordChar.length !== 1) {
      error = 'Le mot de passe doit être un seul caractère';
      return;
    }

    error = null;
    loading = true;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, passwordChar })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Connexion réussie
      goto('/dashboard');

    } catch (err) {
      console.error('Erreur de connexion:', err);
      error = err.message || 'Erreur lors de la connexion. Essaie à nouveau.';
    } finally {
      loading = false;
    }
  }

  // Retour à l'accueil
  function goToHome() {
    goto('/');
  }

  // Aller à la page d'inscription
  function goToRegister() {
    goto('/register');
  }
</script>

<svelte:head>
  <title>Se connecter - MultyFun</title>
</svelte:head>

<main class="container">
  <div class="login-container card">
    <button class="back-button" on:click={goToHome}>
      <span class="emoji">🏠</span> Accueil
    </button>

    <div class="login-header">
      <h1>Se connecter</h1>
      <p class="login-subheader">Continue ton aventure mathématique!</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="login-form">
      {#if error}
        <div class="error-message">
          <span class="emoji">⚠️</span> {error}
        </div>
      {/if}

      <div class="form-group">
        <label for="username">Ton prénom</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          placeholder="Entre ton prénom"
          disabled={loading}
          autocomplete="off"
        />
      </div>

      <div class="form-group">
        <label for="passwordChar">Ton code secret (1 caractère)</label>
        <input
          type="text"
          id="passwordChar"
          bind:value={passwordChar}
          placeholder="Un seul caractère"
          maxlength="1"
          disabled={loading}
          autocomplete="off"
        />
        <p class="input-help">Un seul caractère: une lettre, un chiffre ou un symbole</p>
      </div>

      <button type="submit" class="login-button" disabled={loading}>
        {#if loading}
          Connexion en cours...
        {:else}
          <span class="emoji">🚀</span> Se connecter
        {/if}
      </button>
    </form>

    <div class="login-footer">
      <p>Tu n'as pas encore de compte?</p>
      <button class="register-link" on:click={goToRegister}>
        Créer un compte
      </button>
    </div>
  </div>
</main>

<style>
  .login-container {
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

  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .login-subheader {
    color: var(--text-secondary);
    margin-top: 10px;
  }

  .login-form {
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

  .login-button {
    padding: 15px;
    background-color: var(--accent);
    color: white;
    font-size: 1.1rem;
    border-radius: var(--border-radius-md);
    margin-top: 10px;
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  .login-button:hover {
    background-color: var(--accent-light);
  }

  .login-button:disabled {
    background-color: #e0e0e0;
    box-shadow: none;
    cursor: not-allowed;
  }

  .login-footer {
    margin-top: 30px;
    text-align: center;
    color: var(--text-secondary);
  }

  .register-link {
    color: var(--primary);
    font-weight: bold;
    text-decoration: underline;
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    font-size: 1rem;
  }

  .register-link:hover {
    color: var(--primary-dark);
  }
</style>
