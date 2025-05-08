<script>
  import '../app.css';
  import NavigationHeader from '$lib/components/NavigationHeader.svelte';

  // Récupérer les données du layout server
  export let data;
</script>

<NavigationHeader user={data.user} />

<main>
  <slot />
</main>

<footer class="app-footer">
  <div class="footer-container">
    <div class="footer-content">
      <p>&copy; {new Date().getFullYear()} MultyFun - Apprends les multiplications en t'amusant!</p>
    </div>
  </div>
</footer>

<style>
  main {
    min-height: calc(100vh - 192px);
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