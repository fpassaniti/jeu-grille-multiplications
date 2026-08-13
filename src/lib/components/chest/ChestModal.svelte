<script>
  import CoinCounter from '$lib/components/CoinCounter.svelte';
  import { _, getLanguage } from '$lib/utils/i18n';

  function potionName(potion) {
    return potion.name?.[getLanguage()] ?? potion.name?.fr ?? potion.code;
  }

  // Props
  export let chestType = 'daily'; // daily|streak|levelup|perfect|welcome|mission
  export let onOpened = () => {}; // (result) => void — le parent rafraîchit coins/inventaire
  export let onClose = () => {};

  const CHEST_ICONS = {
    daily: '🎁',
    streak: '🔥',
    levelup: '⬆️',
    perfect: '💯',
    welcome: '👋',
    mission: '🗝️'
  };
  const CONFETTI = ['🎉', '✨', '🪙', '⭐'];

  let opened = false;
  let isOpening = false;
  let result = null;
  let error = null;

  async function openChest() {
    if (isOpening || opened) return;
    isOpening = true;
    error = null;
    try {
      const response = await fetch('/api/chests/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: chestType })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur');
      result = data;
      opened = true;
      onOpened(data);
    } catch (e) {
      error = e.message;
    } finally {
      isOpening = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && opened) onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="chest-overlay" role="presentation" on:click|self={() => opened && onClose()}>
  <div class="chest-content">
    {#if !opened}
      <button class="chest-box" class:shaking={!isOpening} on:click={openChest} disabled={isOpening}>
        <span class="chest-icon">{CHEST_ICONS[chestType] ?? '🎁'}</span>
      </button>
      <p class="chest-hint">{isOpening ? _('common.loading') : _('chest.tapToOpen')}</p>
      {#if error}
        <p class="chest-error">⚠️ {error}</p>
      {/if}
    {:else}
      <div class="chest-reveal">
        <div class="confetti-layer">
          {#each Array(16) as _unused, i}
            <span class="confetti" style="--i: {i}">{CONFETTI[i % CONFETTI.length]}</span>
          {/each}
        </div>

        <p class="reveal-coins"><CoinCounter value={result.coins} /></p>

        {#if result.potions?.length}
          <div class="reveal-potions">
            {#each result.potions as potion}
              <span class="reveal-potion">🧪 {potionName(potion)}</span>
            {/each}
          </div>
        {/if}

        <button class="close-button" on:click={onClose}>{_('common.close')}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .chest-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .chest-content {
    background-color: white;
    border-radius: var(--border-radius-lg);
    padding: 40px;
    text-align: center;
    min-width: 280px;
  }

  .chest-box {
    background: none;
    border: none;
    cursor: pointer;
  }

  .chest-icon {
    font-size: 6rem;
    display: inline-block;
  }

  .chest-box.shaking .chest-icon {
    animation: shake 1.2s ease-in-out infinite;
  }

  .chest-hint {
    margin-top: 15px;
    color: var(--text-secondary);
    font-weight: bold;
  }

  .chest-error {
    color: var(--secondary-dark, #c62828);
    margin-top: 10px;
  }

  .chest-reveal {
    position: relative;
    animation: scaleIn 0.4s ease;
  }

  .reveal-coins {
    font-size: 2rem;
    margin: 10px 0;
  }

  .reveal-potions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 10px 0;
  }

  .reveal-potion {
    font-weight: bold;
    color: var(--primary-dark);
  }

  .close-button {
    margin-top: 20px;
    padding: 10px 30px;
    background-color: var(--primary);
    color: white;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--primary-dark);
  }

  .confetti-layer {
    position: absolute;
    inset: -20px;
    pointer-events: none;
    overflow: visible;
  }

  .confetti {
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 1.4rem;
    animation: confetti-burst 1s ease-out forwards;
    animation-delay: calc(var(--i) * 0.03s);
    transform: rotate(calc(var(--i) * 22.5deg));
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-8deg); }
    40% { transform: rotate(8deg); }
    60% { transform: rotate(-6deg); }
    80% { transform: rotate(6deg); }
  }

  @keyframes scaleIn {
    from { transform: scale(0.7); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes confetti-burst {
    from {
      transform: rotate(calc(var(--i) * 22.5deg)) translate(0, 0);
      opacity: 1;
    }
    to {
      transform: rotate(calc(var(--i) * 22.5deg)) translate(0, -140px);
      opacity: 0;
    }
  }
</style>
