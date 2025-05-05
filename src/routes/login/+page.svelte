<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // État du formulaire
  let username = '';
  let passwordChar = '';
  let loading = false;
  let error = '';
  let showPassword = false;
  let submitted = false;
  
  // Caractères disponibles pour le mot de passe visuel
  const passwordChars = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍍', '🍒', '🥭', '🍉'];

  // Vérifier si déjà connecté
  onMount(async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET'
      });
      const data = await response.json();
      
      if (data.user) {
        // Rediriger vers le tableau de bord si déjà connecté
        goto('/dashboard');
      }
    } catch (err) {
      // Pas d'utilisateur connecté, c'est normal
    }
  });

  // Fonction de connexion
  async function handleLogin() {
    if (!username || !passwordChar) {
      error = "Veuillez remplir tous les champs";
      return;
    }

    loading = true;
    submitted = true;
    error = '';

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
        error = data.error || "Erreur lors de la connexion";
      } else {
        // Redirection vers le tableau de bord
        goto('/dashboard');
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      error = "Problème de connexion au serveur";
    } finally {
      loading = false;
    }
  }

  // Fonction pour naviguer vers l'inscription
  function goToRegister() {
    goto('/register');
  }

  // Fonction pour retourner à l'accueil
  function goToHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Connexion - MultyFun</title>
</svelte:head>

<main class="container">
  <div class="login-container">
    <div class="login-header">
      <h1>Connexion</h1>
      <div class="logo-container">
        <div class="game-logo">
          <span class="logo-text">×</span>
        </div>
      </div>
      <p class="subtitle">Connecte-toi pour suivre ta progression et débloquer des récompenses !</p>
    </div>

    <div class="card login-card">
      <form on:submit|preventDefault={handleLogin} class="login-form">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input 
            type="text" 
            id="username" 
            bind:value={username} 
            autocomplete="username"
            class:input-error={submitted && !username}
            disabled={loading}
          />
          {#if submitted && !username}
            <div class="error-text">Nom d'utilisateur requis</div>
          {/if}
        </div>

        <div class="form-group">
          <label for="password">Caractère secret</label>
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
            <div class="error-text">Choisis un caractère secret</div>
          {/if}
          <div class="password-help">
            Clique sur l'émoji que tu utilises comme mot de passe
          </div>
        </div>

        {#if error}
          <div class="error-message">
            <span class="emoji">⚠️</span> {error}
          </div>
        {/if}

        <div class="form-actions">
          <button type="submit" class="primary-button login-button" disabled={loading}>
            {#if loading}
              <span class="spinner"></span> Connexion...
            {:else}
              <span class="emoji">🚪</span> Se connecter
            {/if}
          </button>
        </div>
      </form>

      <div class="alternative-actions">
        <button type="button" class="text-button" on:click={goToRegister}>
          Pas encore de compte ? Inscris-toi ici
        </button>
        <button type="button" class="text-button" on:click={goToHome}>
          <span class="emoji">🏠</span> Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
</main>

<style>
  .login-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header h1 {
    color: var(--primary-dark);
    margin-bottom: 1rem;
  }

  .subtitle {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }

  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .game-logo {
    width: 100px;
    height: 100px;
    background-color: var(--primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 0 var(--primary-dark);
  }

  .logo-text {
    font-size: 4rem;
    font-weight: bold;
    color: white;
  }

  .login-card {
    padding: 2rem;
    border-radius: var(--border-radius-lg);
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: bold;
    color: var(--text-secondary);
  }

  input {
    padding: 0.8rem 1rem;
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    background-color: var(--bg-input);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
    outline: none;
  }

  .input-error {
    border-color: var(--error) !important;
  }

  .error-text {
    color: var(--error);
    font-size: 0.85rem;
    margin-top: 0.25rem;
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

  .password-help {
    font-size: 0.85rem;
    color: var(--text-light);
    margin-top: 0.5rem;
  }

  .form-actions {
    margin-top: 1rem;
  }

  .login-button {
    width: 100%;
    padding: 1rem;
    background-color: var(--primary);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: 1.1rem;
    font-weight: bold;
    box-shadow: 0 4px 0 var(--primary-dark);
    transition: transform 0.1s, box-shadow 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .login-button:hover:not([disabled]) {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 var(--primary-dark);
  }

  .login-button:active:not([disabled]) {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--primary-dark);
  }

  .login-button[disabled] {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 1.5rem;
    height: 1.5rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 0.8rem 1rem;
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .alternative-actions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1.5rem;
    align-items: center;
  }

  .text-button {
    background: none;
    color: var(--primary);
    font-size: 0.95rem;
    text-decoration: underline;
    cursor: pointer;
  }

  .text-button:hover {
    color: var(--primary-dark);
  }

  @media (max-width: 480px) {
    .login-container {
      padding: 1rem;
    }

    .login-card {
      padding: 1.5rem;
    }

    .password-char-btn {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.2rem;
    }
  }
</style>