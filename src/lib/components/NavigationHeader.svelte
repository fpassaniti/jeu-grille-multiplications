<script>
  // Props
  export let user = null;

  // État du menu mobile
  let mobileMenuOpen = false;

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

  // Ouvrir/fermer le menu mobile
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  // Fermer le menu mobile
  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<header class="app-header">
  <div class="header-container">
    <div class="header-main">
      <a href="/" class="logo">
        <span class="logo-text">MultyFun</span>
        <span class="logo-icon">×</span>
      </a>

      <!-- Navigation sur desktop -->
      <nav class="navigation desktop-nav">
        <ul class="nav-links">
          <li>
            <a href="/" class="nav-link button">Accueil</a>
          </li>
          <li>
            <a href="/play" class="nav-link button">Jouer</a>
          </li>
          <li>
            <a href="/leaderboard" class="nav-link button">Classement</a>
          </li>
          {#if user}
            <li>
              <a href="/dashboard" class="nav-link button">Tableau de bord</a>
            </li>
          {/if}
        </ul>
      </nav>

      <!-- Boutons d'authentification sur desktop -->
      <div class="auth-buttons desktop-auth">
        {#if user}
          <span class="user-greeting">Bonjour, {user.displayName}!</span>
          <button class="logout-button" on:click={handleLogout} title="Déconnexion">
            <span class="logout-icon">🚪</span>
          </button>
        {:else}
          <a href="/login" class="button login-button">Connexion</a>
          <a href="/register" class="button register-button">Inscription</a>
        {/if}
      </div>

      <!-- Bouton hamburger pour mobile (affiché en fixed) -->
      <button class="hamburger-button" on:click={toggleMobileMenu} aria-label="Menu">
        <span class="hamburger-icon">☰</span>
      </button>
    </div>

    <!-- Menu mobile (déplié lorsque mobileMenuOpen est true) -->
    <div class="mobile-menu" class:open={mobileMenuOpen}>
      <nav class="mobile-nav">
        <ul class="mobile-nav-links">
          <li>
            <a href="/" class="button mobile-nav-link">
              <span class="nav-icon">🏠</span> Accueil
            </a>
          </li>
          <li>
            <a href="/play" class="button mobile-nav-link">
              <span class="nav-icon">🎮</span> Jouer
            </a>
          </li>
          <li>
            <a href="/leaderboard" class="button mobile-nav-link">
              <span class="nav-icon">🏆</span> Classement
            </a>
          </li>
          {#if user}
            <li>
              <a href="/dashboard" class="button mobile-nav-link">
                <span class="nav-icon">📊</span> Tableau de bord
              </a>
            </li>
          {/if}
        </ul>

        <div class="mobile-auth">
          {#if user}
            <div class="mobile-user-info">
              <span class="mobile-greeting">Connecté en tant que</span>
              <span class="mobile-username">{user.displayName}</span>
            </div>
            <button class="mobile-logout-button" on:click={handleLogout}>
              <span class="nav-icon">🚪</span> Déconnexion
            </button>
          {:else}
            <a href="/login" class="button mobile-login-button">
              <span class="nav-icon">🔑</span> Connexion
            </a>
            <a href="/register" class="button mobile-register-button">
              <span class="nav-icon">📝</span> Inscription
            </a>
          {/if}
        </div>
      </nav>
    </div>
  </div>
</header>

<!-- Overlay pour fermer le menu en cliquant en dehors -->
{#if mobileMenuOpen}
  <div class="mobile-menu-overlay" on:click={closeMobileMenu}></div>
{/if}

<style>
  .app-header {
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px 0;
    position: relative; /* Non-sticky */
    z-index: 100;
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-decoration: none;
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

  /* Navigation desktop */
  .desktop-nav {
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
    text-decoration: none;
  }

  .nav-link:hover {
    background-color: var(--bg-secondary);
    color: var(--primary);
  }

  /* Auth buttons desktop */
  .desktop-auth {
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

  /* Bouton hamburger */
  .hamburger-button {
    display: none;
    background-color: white;
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--primary);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 110;
  }

  /* Menu mobile (masqué par défaut) */
  .mobile-menu {
    display: none;
    background-color: white;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
  }

  .mobile-menu.open {
    max-height: 500px;
    border-top: 1px solid var(--bg-secondary);
  }

  .mobile-nav-links {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .mobile-nav-link {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 15px 20px;
    background: none;
    border: none;
    text-align: left;
    font-size: 1rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--bg-secondary);
    cursor: pointer;
    text-decoration: none;
  }

  .mobile-nav-link:hover {
    background-color: var(--bg-secondary);
  }

  .nav-icon {
    margin-right: 10px;
    font-size: 1.2rem;
  }

  .mobile-auth {
    padding: 15px 20px;
  }

  .mobile-user-info {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
  }

  .mobile-greeting {
    font-size: 0.9rem;
    color: var(--text-light);
  }

  .mobile-username {
    font-weight: bold;
    color: var(--primary);
    font-size: 1.1rem;
  }

  .mobile-logout-button,
  .mobile-login-button,
  .mobile-register-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 15px;
    margin-bottom: 10px;
    font-size: 1rem;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    text-decoration: none;
  }

  .mobile-logout-button {
    background-color: var(--secondary-light);
    color: white;
  }

  .mobile-login-button {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .mobile-register-button {
    background-color: var(--primary);
    color: white;
  }

  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }

  /* Media queries pour le responsive */
  @media (max-width: 768px) {
    /* Cacher navigation et auth desktop */
    .desktop-nav, .desktop-auth {
      display: none;
    }

    /* Afficher le bouton hamburger en position fixe */
    .hamburger-button {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 10px;
      right: 10px;
    }

    /* Préparer le menu mobile */
    .mobile-menu {
      display: block;
    }

    /* Ajuster le header pour mobile */
    .app-header {
      padding: 10px 0;
    }

    /* Ajouter de l'espace à droite pour le bouton hamburger */
    .header-main {
      padding-right: 45px;
    }
  }
</style>