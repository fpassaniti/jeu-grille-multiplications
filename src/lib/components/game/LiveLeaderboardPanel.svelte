<script>
  import Leaderboard from '$lib/components/Leaderboard.svelte';

  // Props
  export let mode = 'tables';
  export let level = 'adulte';
  export let duration = 5;

  let scores = [];
  let isLoading = false;
  let requestId = 0;

  async function loadScores(currentMode, currentLevel, currentDuration) {
    const thisRequest = ++requestId;
    isLoading = true;
    try {
      const response = await fetch(
        `/api/leaderboard?mode=${currentMode}&level=${currentLevel}&duration=${currentDuration}`
      );
      if (!response.ok) throw new Error('Erreur de chargement du classement');
      const data = await response.json();
      if (thisRequest !== requestId) return; // réponse obsolète, une requête plus récente est en cours
      scores = data.scores ?? [];
    } catch (err) {
      console.error('Erreur lors du chargement du classement:', err);
      if (thisRequest === requestId) scores = [];
    } finally {
      if (thisRequest === requestId) isLoading = false;
    }
  }

  $: loadScores(mode, level, duration);
</script>

<Leaderboard {isLoading} {mode} {level} {duration} leaderboard={scores} />
