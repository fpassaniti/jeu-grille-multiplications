<script>
  import { listEnabledModes } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // data.mission depuis +page.server.js (getMissionStatus) :
  // {missionId, titleKey, descriptionKey, slots: [{key, done}], completed, chestAvailable}
  export let mission;
  export let onClaim = () => {};

  const modes = listEnabledModes();

  // Pour missionId === 'each_mode', slot.key est un id de mode : on résout
  // son icône via le registre plutôt que de la dupliquer ici.
  function modeIcon(key) {
    return modes.find((m) => m.id === key)?.icon ?? '🎮';
  }
</script>

<div class="card daily-mission-card">
  <h2 class="mission-title">🗝️ {_('mission.title')}</h2>

  {#if mission}
    <p class="mission-name">{_(mission.titleKey)}</p>
    <p class="mission-description">{_(mission.descriptionKey)}</p>

    <div class="mission-slots">
      {#each mission.slots as slot}
        <div class="mission-slot" class:done={slot.done}>
          <span class="slot-icon">
            {mission.missionId === 'each_mode' ? modeIcon(slot.key) : '🎯'}
          </span>
          {#if slot.done}<span class="slot-check">✅</span>{/if}
        </div>
      {/each}
    </div>

    {#if mission.chestAvailable}
      <button class="mission-claim-button" on:click={onClaim}>
        🎁 {_('mission.claim')}
      </button>
    {:else if mission.completed}
      <p class="mission-done">✅ {_('mission.alreadyClaimed')}</p>
    {/if}
  {/if}
</div>

<style>
  .daily-mission-card {
    padding: 15px;
    text-align: center;
  }

  .mission-title {
    margin: 0 0 4px;
    font-size: 1.1rem;
    color: var(--primary-dark);
  }

  .mission-name {
    margin: 0;
    font-weight: bold;
    color: var(--text-primary);
  }

  .mission-description {
    margin: 4px 0 12px;
    color: var(--text-light);
    font-size: 0.9rem;
  }

  .mission-slots {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .mission-slot {
    position: relative;
    width: 2.4rem;
    height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-sm);
    background-color: var(--bg-secondary);
    font-size: 1.2rem;
    opacity: 0.5;
  }

  .mission-slot.done {
    opacity: 1;
    background-color: var(--accent-light);
  }

  .slot-check {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 1rem;
  }

  .mission-claim-button {
    width: 100%;
    padding: 12px;
    background-color: var(--accent);
    color: white;
    font-weight: bold;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--accent-dark);
    animation: mission-pulse 2s infinite;
  }

  .mission-done {
    color: var(--text-light);
    font-style: italic;
    margin: 0;
  }

  @keyframes mission-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
</style>
