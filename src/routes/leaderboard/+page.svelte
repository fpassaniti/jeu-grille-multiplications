<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { _ } from '$lib/utils/i18n';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  
  export let data;

  // State variables
  let selectedLevel = 'child'; // Default level is child
  let selectedDuration = 30; // Default duration is 30 seconds
  let scores = [];
  let isLoading = true;

  // Initialize scores by loading from server data
  $: {
    isLoading = true;
    scores = data.scores[selectedLevel]?.[selectedDuration] || [];
    isLoading = false;
  }

  // Navigation to play
  function goToPlay() {
    goto('/play');
  }
</script>

<svelte:head>
  <title>{_('leaderboard.pageTitle')}</title>
  <meta name="description" content={_('leaderboard.metaDescription')} />
</svelte:head>

<div class="container narrow">
  <div class="leaderboard-page">
    <h1>{_('leaderboard.title')}</h1>

    <div class="filter-controls">
      <div class="filter-group">
        <label for="level-filter">{_('leaderboard.levelLabel')}</label>
        <div class="button-group">
          <button 
            class="filter-button" 
            class:active={selectedLevel === 'adult'} 
            on:click={() => selectedLevel = 'adult'}
          >
            {_('leaderboard.adultLevel')}
          </button>
          <button 
            class="filter-button" 
            class:active={selectedLevel === 'child'} 
            on:click={() => selectedLevel = 'child'}
          >
            {_('leaderboard.childLevel')}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <label for="duration-filter">{_('leaderboard.durationLabel')}</label>
        <div class="button-group">
          <button 
            class="filter-button" 
            class:active={selectedDuration === 30} 
            on:click={() => selectedDuration = 30}
          >
            30s
          </button>
          <button 
            class="filter-button" 
            class:active={selectedDuration === 60} 
            on:click={() => selectedDuration = 60}
          >
            60s
          </button>
          <button 
            class="filter-button" 
            class:active={selectedDuration === 120} 
            on:click={() => selectedDuration = 120}
          >
            120s
          </button>
        </div>
      </div>
    </div>

    <p class="filter-explainer">{_('leaderboard.filterExplanation')}</p>

    <Leaderboard {scores} {isLoading} level={selectedLevel} />

    <div class="leaderboard-footer">
      <p>{_('leaderboard.challenge')}</p>
      <button class="cta-button" on:click={goToPlay}>
        {_('leaderboard.playNow')}
      </button>
    </div>
  </div>
</div>

<style>
  .leaderboard-page {
    background-color: white;
    border-radius: var(--border-radius-lg);
    padding: 30px;
    margin: 20px 0;
    box-shadow: var(--shadow-md);
  }

  h1 {
    text-align: center;
    color: var(--primary-dark);
    margin-bottom: 30px;
  }

  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 15px;
  }

  .filter-group {
    flex: 1;
    min-width: 200px;
  }

  label {
    font-weight: bold;
    color: var(--text-secondary);
    margin-bottom: 8px;
    display: block;
  }

  .button-group {
    display: flex;
    border-radius: var(--border-radius-md);
    overflow: hidden;
    background-color: var(--bg-secondary);
  }

  .filter-button {
    flex: 1;
    background: none;
    border: none;
    padding: 10px 15px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    transition: all 0.2s;
  }

  .filter-button:not(:last-child) {
    border-right: 1px solid rgba(0,0,0,0.1);
  }

  .filter-button:hover {
    background-color: rgba(0,0,0,0.05);
  }

  .filter-button.active {
    background-color: var(--primary);
    color: white;
    font-weight: bold;
  }

  .filter-explainer {
    color: var(--text-light);
    font-size: 0.9rem;
    text-align: center;
    margin-bottom: 30px;
  }

  .leaderboard-footer {
    margin-top: 40px;
    text-align: center;
  }

  .leaderboard-footer p {
    font-size: 1.1rem;
    margin-bottom: 15px;
    color: var(--text-secondary);
  }

  .cta-button {
    background-color: var(--accent);
    color: white;
    font-size: 1.1rem;
    padding: 12px 30px;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--accent-dark);
    transition: all 0.2s;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 var(--accent-dark);
  }

  @media (max-width: 768px) {
    .filter-group, .button-group {
      width: 100%;
    }
  }
</style>