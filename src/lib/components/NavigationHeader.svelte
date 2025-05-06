<script>
  import {goto} from '$app/navigation';

  // Props
  export let user = null;

  // Fonctions de navigation
  function goToHome() {
    goto('/');
  }

  function goToPlay() {
    goto('/play');
  }

  function goToDashboard() {
    goto('/dashboard');
  }

  function goToLeaderboard() {
    goto('/leaderboard');
  }

  function goToLogin() {
    goto('/login');
  }

  function goToRegister() {
    goto('/register');
  }

  // Fonction de déconnexion
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });

      // Forcer un rechargement complet de la page au lieu d'utiliser goto
      // Cela garantit que tous les composants seront actualisés avec le nouvel état d'authentification
      window.location.href = '/';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  }
</script>

<header class="app-header">
  <div class="header-container">
    <div class="logo" on:click={goToHome}>
      <span class="logo-text">MultyFun</span>
      <span class="logo-icon">×</span>
    </div>

    <nav class="navigation">
      <ul class="nav-links">
        <li>
          <button class="nav-link" on:click={goToHome}>Accueil</button>
        </li>
        <li>
          <button class="nav-link" on:click={goToPlay}>Jouer</button>
        </li>
        <li>
          <button class="nav-link" on:click={goToLeaderboard}>Classement</button>
        </li>
        {#if user}
          <li>
            <button class="nav-link" on:click={goToDashboard}>Tableau de bord</button>
          </li>
        {/if}
      </ul>
    </nav>

    <div class="auth-buttons">
      {#if user}
        <span class="user-greeting">Bonjour, {user.displayName}!</span>
        <button class="logout-button" on:click={handleLogout} title="Déconnexion">
          <span class="logout-icon">🚪</span>
        </button>
      {:else}
        <button class="login-button" on:click={goToLogin}>Connexion</button>
        <button class="register-button" on:click={goToRegister}>Inscription</button>
      {/if}
    </div>
  </div>
</header>

<style>
  .app-header {
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .logo-text {
    font-family: 'Baloo 2', cursive;
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary);
  }

  .logo-icon {
    background: var(--accent);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .navigation {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .nav-links {
    display: flex;
    list-style: none;
    gap: 20px;
    margin: 0;
    padding: 0;
  }

  .nav-link {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1rem;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s;
  }

  .nav-link:hover {
    background-color: var(--bg-secondary);
    color: var(--primary);
  }

  .auth-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .user-greeting {
    color: var(--primary);
    font-weight: bold;
  }

  .login-button, .register-button {
    padding: 8px 15px;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .login-button {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .register-button {
    background-color: var(--primary);
    color: white;
    box-shadow: 0 2px 0 var(--primary-dark);
  }

  .register-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 var(--primary-dark);
  }

  .logout-button {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    transition: all 0.2s;
    padding: 0;
    border: none;
    cursor: pointer;
  }

  .logout-button:hover {
    background-color: var(--secondary-light);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 3px 0 var(--secondary-dark);
  }

  .logout-icon {
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    .header-container {
      flex-direction: column;
      gap: 10px;
      padding: 10px;
    }

    .navigation {
      order: 2;
      width: 100%;
    }

    .nav-links {
      justify-content: space-around;
      width: 100%;
    }

    .auth-buttons {
      order: 3;
      width: 100%;
      justify-content: center;
      margin-top: 10px;
    }
  }
</style>