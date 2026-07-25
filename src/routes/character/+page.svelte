<script>
  import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
  import { _, getLanguage } from '$lib/utils/i18n';

  export let data;

  const SLOTS = [
    { slot: 'background', icon: '🌈' },
    { slot: 'aura', icon: '✨' },
    { slot: 'back', icon: '🦸' },
    { slot: 'body', icon: '🧍' },
    { slot: 'outfit', icon: '👕' },
    { slot: 'weapon', icon: '⚔️' },
    { slot: 'hat', icon: '🎩' },
    { slot: 'pet', icon: '🐾' }
  ];
  // body est le seul slot obligatoire (sans lui, plus de personnage) :
  // tous les autres slots acceptent "Aucun" comme choix valide
  const REQUIRED_SLOT = 'body';

  let equipment = data.equipment;
  let activeSlot = null;
  let pendingSlot = null;

  function itemName(item) {
    return item.name[getLanguage()] ?? item.name.fr;
  }

  function ownedItemsFor(slot) {
    return data.shop.items.filter((item) => item.slot === slot && item.owned);
  }

  function selectSlot(slot) {
    activeSlot = activeSlot === slot ? null : slot;
  }

  async function equip(slot, itemId) {
    const previous = equipment[slot];
    // Optimistic UI
    equipment = {
      ...equipment,
      [slot]: itemId
        ? { itemId, code: null, assetUrl: data.shop.items.find((i) => i.id === itemId)?.assetUrl }
        : null
    };
    pendingSlot = slot;
    try {
      const response = await fetch('/api/character/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, itemId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur');
      equipment = result.equipment;
    } catch (e) {
      equipment = { ...equipment, [slot]: previous }; // rollback
      alert(`Erreur: ${e.message}`);
    } finally {
      pendingSlot = null;
    }
  }
</script>

<svelte:head>
  <title>{_('character.title')} - MultyFun</title>
</svelte:head>

<main class="container character-page">
  <div class="character-header card">
    <h1>{_('character.title')}</h1>
    <p class="subtitle">{_('character.subtitle')}</p>

    <div class="character-panel">
      <div class="avatar-box">
        <CharacterAvatar {equipment} size={280} />
      </div>
      <div class="slots-grid">
        {#each SLOTS as { slot, icon }}
          <button
            class="slot-square"
            class:active={activeSlot === slot}
            aria-label={_(`shop.slots.${slot}`)}
            title={_(`shop.slots.${slot}`)}
            on:click={() => selectSlot(slot)}
          >
            {#if equipment[slot]}
              <img src={equipment[slot].assetUrl} alt={_(`shop.slots.${slot}`)} />
            {:else}
              <span class="slot-icon-empty">{icon}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if activeSlot}
    {@const activeIcon = SLOTS.find((s) => s.slot === activeSlot)?.icon}
    <div class="slot-section card">
      <h2>{activeIcon} {_(`shop.slots.${activeSlot}`)}</h2>
      <div class="items-row">
        {#if activeSlot !== REQUIRED_SLOT}
          <button
            class="equip-card none-card"
            class:active={!equipment[activeSlot]}
            disabled={pendingSlot === activeSlot}
            on:click={() => equip(activeSlot, null)}
          >
            <span class="none-icon">🚫</span>
            {_('character.none')}
          </button>
        {/if}
        {#each ownedItemsFor(activeSlot) as item}
          <button
            class="equip-card"
            class:active={equipment[activeSlot]?.itemId === item.id}
            disabled={pendingSlot === activeSlot}
            on:click={() => equip(activeSlot, item.id)}
          >
            <img src={item.assetUrl} alt={itemName(item)} />
            <span>{itemName(item)}</span>
            {#if equipment[activeSlot]?.itemId === item.id}
              <span class="equipped-tag">✅ {_('character.equipped')}</span>
            {/if}
          </button>
        {:else}
          {#if activeSlot === REQUIRED_SLOT}
            <p class="empty-hint">{_('character.empty')}</p>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <div class="character-footer">
    <a href="/shop" class="button shop-link">🛍️ {_('character.goToShop')}</a>
  </div>
</main>

<style>
  .character-page {
    max-width: 800px;
    margin: 20px auto;
    padding: 0 15px;
  }

  .character-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 25px;
    margin-bottom: 20px;
    text-align: center;
  }

  .character-header h1 {
    color: var(--primary-dark);
    margin: 15px 0 5px;
  }

  .subtitle {
    color: var(--text-secondary);
  }

  .character-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    margin: 20px auto 0;
  }

  .avatar-box :global(.character-avatar) {
    border-radius: var(--border-radius-md);
  }

  .slots-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .slot-square {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-secondary);
    border: 3px solid transparent;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  }

  .slot-square img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 6px;
  }

  .slot-icon-empty {
    font-size: 1.8rem;
    opacity: 0.4;
  }

  .slot-square.active {
    border-color: var(--primary);
    background-color: var(--bg-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .slot-section {
    padding: 20px;
    margin-bottom: 15px;
  }

  .slot-section h2 {
    color: var(--primary-dark);
    margin-bottom: 12px;
  }

  .items-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .equip-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px;
    min-width: 90px;
    background-color: var(--bg-secondary);
    border: 3px solid transparent;
    border-radius: var(--border-radius-md);
    cursor: pointer;
  }

  .equip-card.active {
    border-color: var(--primary);
    background-color: var(--bg-primary);
  }

  .equip-card img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }

  .none-card .none-icon {
    font-size: 1.8rem;
  }

  .equipped-tag {
    font-size: 0.7rem;
    color: var(--success-dark);
    font-weight: bold;
  }

  .empty-hint {
    color: var(--text-light);
    font-style: italic;
  }

  .character-footer {
    text-align: center;
    margin: 20px 0 30px;
  }

  .shop-link {
    background-color: var(--accent);
    color: white;
    padding: 10px 20px;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--accent-dark);
  }

  @media (max-width: 767px) {
    .character-panel {
      flex-direction: column;
    }

    .slots-grid {
      grid-template-columns: repeat(4, 1fr);
      width: 100%;
    }

    .slot-square {
      width: 100%;
      height: 56px;
    }
  }
</style>
