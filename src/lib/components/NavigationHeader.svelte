<script>
  import LanguagePicker from './LanguagePicker.svelte';
  import { _ } from '$lib/utils/i18n';
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
      console.error(_('dashboard.logoutError'), err);
    }
  }

  // Ouvrir/fermer le menu mobile
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;

    // Désactiver le défilement du corps quand le menu est ouvert
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }

  // Fermer le menu mobile
  function closeMobileMenu() {
    mobileMenuOpen = false;
    document.body.classList.remove('menu-open');
  }
</script>

<header class="app-header">
  <div class="header-container">
    <div class="header-main">
      <a href="/" class="logo">
        <span class="logo-text">{_('common.appName')}</span>
        <span class="logo-icon">×</span>
      </a>

      <!-- Navigation sur desktop -->
      <nav class="navigation desktop-nav">
        <ul class="nav-links">
          <li>
            <a href="/" class="nav-link button">{_('common.home')}</a>
          </li>
          <li>
            <a href="/play" class="nav-link button">{_('common.play')}</a>
          </li>
          <li>
            <a href="/leaderboard" class="nav-link button">{_('common.leaderboard')}</a>
          </li>
          {#if user}
            <li>
              <a href="/dashboard" class="nav-link button">{_('common.dashboard')}</a>
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
          <a href="/login" class="button login-button">{_('common.login')}</a>
          <a href="/register" class="button register-button">{_('common.register')}</a>
        {/if}
      </div>

      <!-- Bouton hamburger pour mobile -->
      <button class="hamburger-button" on:click={toggleMobileMenu} aria-label="Menu">
        <span class="hamburger-icon">☰</span>
      </button>
    </div>
  </div>
</header>

<!-- Menu mobile avec slide-in -->
<div class="mobile-menu-wrapper" class:open={mobileMenuOpen}>
  <div class="mobile-menu-content">
    <div class="mobile-menu-header">
      <button class="close-menu-button" on:click={closeMobileMenu} aria-label="Fermer le menu">
        <span>✖</span>
      </button>
      <div class="mobile-logo">
        <span class="mobile-logo-text">MultyFun</span>
        <span class="mobile-logo-icon">×</span>
      </div>
    </div>

    <nav class="mobile-nav">
      <ul class="mobile-nav-links">
        <li>
          <a href="/" class="mobile-nav-link" on:click={closeMobileMenu}>
            <span class="nav-icon">🏠</span> {_('common.home')}
          </a>
        </li>
        <li>
          <a href="/play" class="mobile-nav-link" on:click={closeMobileMenu}>
            <span class="nav-icon">🎮</span> {_('common.play')}
          </a>
        </li>
        <li>
          <a href="/leaderboard" class="mobile-nav-link" on:click={closeMobileMenu}>
            <span class="nav-icon">🏆</span> {_('common.leaderboard')}
          </a>
        </li>
        {#if user}
          <li>
            <a href="/dashboard" class="mobile-nav-link" on:click={closeMobileMenu}>
              <span class="nav-icon">📊</span> {_('common.dashboard')}
            </a>
          </li>
          <li>
            <a href="/collection" class="mobile-nav-link" on:click={closeMobileMenu}>
              <span class="nav-icon">📚</span> {_('common.collection')}
            </a>
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
    </nav>

    <div class="mobile-auth">
      {#if user}
        <div class="mobile-user-info">
          <span class="mobile-greeting">{_('common.loggedInAs')}</span>
          <span class="mobile-username">{user.displayName}</span>
        </div>
        <button class="mobile-logout-button" on:click={() => { handleLogout(); closeMobileMenu(); }}>
          <span class="nav-icon">🚪</span> {_('common.logout')}
        </button>
      {:else}
        <div class="mobile-auth-buttons">
          <a href="/login" class="mobile-auth-button login" on:click={closeMobileMenu}>
            <span class="nav-icon">🔑</span> {_('common.login')}
          </a>
          <a href="/register" class="mobile-auth-button register" on:click={closeMobileMenu}>
            <span class="nav-icon">📝</span> {_('common.register')}
          </a>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Overlay pour fermer le menu en cliquant en dehors -->
{#if mobileMenuOpen}
  <div class="mobile-menu-overlay" on:click={closeMobileMenu}></div>
{/if}

<style>
  /* Styles de base */
  .app-header {
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px 0;
    position: relative;
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

  /* Logo */
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

  /* Bouton hamburger pour mobile */
  .hamburger-button {
    display: none;
    background-color: var(--primary);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    cursor: pointer;
    color: white;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .hamburger-button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  /* ===== MENU MOBILE (Nouveau design) ===== */
  .mobile-menu-wrapper {
    position: fixed;
    top: 0;
    right: -300px; /* Caché par défaut */
    width: 300px;
    height: 100vh;
    background-color: white;
    z-index: 200;
    transition: transform 0.3s ease-in-out;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
  }

  .mobile-menu-wrapper.open {
    transform: translateX(-300px);
  }

  .mobile-menu-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 15px;
    border-bottom: 1px solid var(--bg-secondary);
    position: relative;
  }

  .close-menu-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 5px;
    margin-right: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 15px;
    transition: all 0.2s;
  }

  .close-menu-button:hover {
    color: var(--secondary);
    transform: rotate(90deg);
  }

  .mobile-logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mobile-logo-text {
    font-family: 'Baloo 2', cursive;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary);
  }

  .mobile-logo-icon {
    background: var(--accent);
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .mobile-nav {
    flex: 1;
    padding: 20px 0;
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
    font-size: 1.1rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }

  .mobile-nav-link:hover, .mobile-nav-link:active {
    background-color: var(--bg-secondary);
    color: var(--primary);
    border-left-color: var(--primary);
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
    margin-right: 12px;
    font-size: 1.2rem;
  }

  .mobile-auth {
    padding: 20px;
    border-top: 1px solid var(--bg-secondary);
    margin-top: auto; /* Pousse l\'auth en bas */
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

  .mobile-logout-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 15px;
    font-size: 1rem;
    border-radius: var(--border-radius-md);
    background-color: var(--secondary-light);
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mobile-logout-button:hover {
    background-color: var(--secondary);
    transform: translateY(-2px);
  }

  .mobile-auth-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-auth-button {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    font-size: 1rem;
    border-radius: var(--border-radius-md);
    text-decoration: none;
    transition: all 0.2s;
  }

  .mobile-auth-button.login {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .mobile-auth-button.register {
    background-color: var(--primary);
    color: white;
    box-shadow: 0 3px 0 var(--primary-dark);
  }

  .mobile-auth-button.register:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 var(--primary-dark);
  }

  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 199;
    backdrop-filter: blur(2px);
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Media queries pour le responsive */
  @media (max-width: 768px) {
    /* Cacher la navigation et l\'auth desktop */
    .desktop-nav, .desktop-auth {
      display: none;
    }

    /* Afficher le bouton hamburger */
    .hamburger-button {
      display: flex;
    }
  }

  /* Add to global CSS or here */
  :global(body.menu-open) {
    overflow: hidden;
  }
</style>