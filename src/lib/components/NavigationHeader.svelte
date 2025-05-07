<script>
  import {goto} from '$app/navigation';
  import LanguagePicker from './LanguagePicker.svelte';
  import { _, setLanguage } from '$lib/utils/i18n';

  // Props
  export let user = null;

  // État du menu mobile
  let mobileMenuOpen = false;

  // Fonctions de navigation
  function goToHome() {
    goto('/');
    closeMobileMenu();
  }

  function goToPlay() {
    goto('/play');
    closeMobileMenu();
  }

  function goToDashboard() {
    goto('/dashboard');
    closeMobileMenu();
  }

  function goToLeaderboard() {
    goto('/leaderboard');
    closeMobileMenu();
  }

  function goToLogin() {
    goto('/login');
    closeMobileMenu();
  }

  function goToRegister() {
    goto('/register');
    closeMobileMenu();
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
      console.error(_('dashboard.logoutError'), err);
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
      <div class="logo" on:click={goToHome}>
        <span class="logo-text">{_('common.appName')}</span>
        <span class="logo-icon">×</span>
      </div>

      <!-- Navigation sur desktop -->
      <nav class="navigation desktop-nav">
        <ul class="nav-links">
          <li>
            <button class="nav-link" on:click={goToHome}>{_('common.home')}</button>
          </li>
          <li>
            <button class="nav-link" on:click={goToPlay}>{_('common.play')}</button>
          </li>
          <li>
            <button class="nav-link" on:click={goToLeaderboard}>{_('common.leaderboard')}</button>
          </li>
          {#if user}
            <li>
              <button class="nav-link" on:click={goToDashboard}>{_('common.dashboard')}</button>
            </li>
          {/if}
        </ul>
      </nav>

      <!-- Boutons d'authentification sur desktop -->
      <div class="auth-buttons desktop-auth">
        <!-- Language Picker -->
        <div class="language-picker-container">
          <LanguagePicker />
        </div>
        
        {#if user}
          <span class="user-greeting">{_('common.greeting', { name: user.displayName })}</span>
          <button class="logout-button" on:click={handleLogout} title={_('navigation.logoutTitle')}>
            <span class="logout-icon">🚪</span>
          </button>
        {:else}
          <button class="login-button" on:click={goToLogin}>{_('common.login')}</button>
          <button class="register-button" on:click={goToRegister}>{_('common.register')}</button>
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
            <button class="mobile-nav-link" on:click={goToHome}>
              <span class="nav-icon">🏠</span> {_('common.home')}
            </button>
          </li>
          <li>
            <button class="mobile-nav-link" on:click={goToPlay}>
              <span class="nav-icon">🎮</span> {_('common.play')}
            </button>
          </li>
          <li>
            <button class="mobile-nav-link" on:click={goToLeaderboard}>
              <span class="nav-icon">🏆</span> {_('common.leaderboard')}
            </button>
          </li>
          {#if user}
            <li>
              <button class="mobile-nav-link" on:click={goToDashboard}>
                <span class="nav-icon">📊</span> {_('common.dashboard')}
              </button>
            </li>
          {/if}
          <!-- Language Picker in mobile menu -->
          <li class="mobile-language-item">
            <div class="mobile-language-label">
              <span class="nav-icon">🌐</span> {_('common.language')}:
            </div>
            <div class="mobile-language-picker">
              <LanguagePicker />
            </div>
          </li>
        </ul>

        <div class="mobile-auth">
          {#if user}
            <div class="mobile-user-info">
              <span class="mobile-greeting">{_('common.loggedInAs')}</span>
              <span class="mobile-username">{user.displayName}</span>
            </div>
            <button class="mobile-logout-button" on:click={handleLogout}>
              <span class="nav-icon">🚪</span> {_('common.logout')}
            </button>
          {:else}
            <button class="mobile-login-button" on:click={goToLogin}>
              <span class="nav-icon">🔑</span> {_('common.login')}
            </button>
            <button class="mobile-register-button" on:click={goToRegister}>
              <span class="nav-icon">📝</span> {_('common.register')}
            </button>
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
    position: fixed; /* Non-sticky */
    width: 100%;
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
  
  .language-picker-container {
    margin-right: 10px;
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
    max-height: 550px; /* Increased for language picker */
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
  }

  .mobile-nav-link:hover {
    background-color: var(--bg-secondary);
  }
  
  .mobile-language-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--bg-secondary);
  }
  
  .mobile-language-label {
    flex: 1;
    display: flex;
    align-items: center;
  }
  
  .mobile-language-picker {
    flex: 1;
    display: flex;
    justify-content: flex-end;
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

    /* Afficher le bouton hamburger en position absolute */
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