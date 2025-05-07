<script>
  import '../app.css';
  import NavigationHeader from '$lib/components/NavigationHeader.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { _ } from '$lib/utils/i18n';
  import languageStore from '$lib/stores/languageStore';

  // Récupérer les données du layout server
  export let data;
  
  // Initialize language from localStorage if in browser
  onMount(() => {
    if (browser) {
      const storedLanguage = localStorage.getItem('language');
      if (storedLanguage) {
        languageStore.set(storedLanguage);
      }
    }
  });
</script>

<NavigationHeader user={data.user} />

<main style="padding-top: 60px;">
  <slot />
</main>

<footer class="app-footer">
  <div class="footer-container">
    <div class="footer-content">
      <p>{_('common.copyright', { year: new Date().getFullYear(), appName: _('common.appName') })}</p>
    </div>
  </div>
</footer>

<style>
  main {
    min-height: calc(100vh - 150px);
  }

  .app-footer {
    background-color: var(--bg-secondary);
    padding: 20px 0;
    margin-top: 40px;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .footer-content {
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
</style>