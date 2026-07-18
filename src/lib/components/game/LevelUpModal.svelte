<script>
  import ChestModal from '$lib/components/chest/ChestModal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let gameResults = null;
  export let reloadPageOnDashboard = () => {};

  $: levelupChestDue = gameResults?.rewards?.chests?.levelup ?? false;
  let openChest = false;
  let chestClaimed = false;
</script>

<div class="level-up-animation">
  <div class="level-up-content">
    <div class="level-up-icon">🏆</div>
    <h2 class="level-up-title">{_('play.levelUp')}</h2>
    <p class="level-up-info">
      {_('home.levelNumber', { level: gameResults.newLevel })}
      <span class="new-level-title">{gameResults.newLevelTitle}</span>
    </p>

    {#if levelupChestDue && !chestClaimed}
      <button class="chest-button" on:click={() => (openChest = true)}>
        🎁 {_('rewards.openChest')}
      </button>
    {/if}

    <button class="view-level-button" on:click={reloadPageOnDashboard}>
      {_('play.viewNewLevel')}
    </button>
  </div>
</div>

{#if openChest}
  <ChestModal
    chestType="levelup"
    onClose={() => {
      openChest = false;
      chestClaimed = true;
    }}
    onOpened={invalidateAll}
  />
{/if}

<style>
  .level-up-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.5s ease;
  }

  .level-up-content {
    background-color: white;
    padding: 30px;
    border-radius: var(--border-radius-lg);
    text-align: center;
    max-width: 400px;
    animation: scaleIn 0.5s ease;
  }

  .level-up-icon {
    font-size: 4rem;
    margin-bottom: 15px;
    animation: bounce 2s infinite;
  }

  .level-up-title {
    color: var(--success);
    font-size: 2rem;
    margin-bottom: 15px;
  }

  .level-up-info {
    margin-bottom: 20px;
  }

  .new-level-title {
    display: block;
    font-weight: bold;
    color: var(--primary);
    font-size: 1.2rem;
    margin-top: 10px;
  }

  .view-level-button {
    padding: 12px 25px;
    background-color: var(--accent);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  .chest-button {
    display: block;
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    background-color: var(--success);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    font-weight: bold;
    box-shadow: 0 4px 0 var(--success-dark);
    animation: pulse 2s infinite;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-20px); }
    60% { transform: translateY(-10px); }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
</style>