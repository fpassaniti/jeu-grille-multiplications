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
  // aura/back/hat/pet n'ont pas d'équipement de départ : "Aucun" reste une option valide
  const OPTIONAL_SLOTS = ['aura', 'back', 'hat', 'pet'];

  // Position de chaque icône autour de l'avatar (anneau), cf. maquette validée
  const RING_POSITION = {
    aura: 'top-left',
    hat: 'top-right',
    back: 'mid-left',
    weapon: 'mid-right',
    background: 'lowmid-left',
    pet: 'lowmid-right',
    body: 'bottom-left',
    outfit: 'bottom-right'
  };

  let equipment = data.equipment;
  let activeSlot = null;
  let pendingSlot = null;

  function itemName(item) {
    return item.name[getLanguage()] ?? item.name.fr;
  }

  function ownedItemsFor(slot) {
    return data.shop.items.filter((item) => item.slot === slot && item.owned);
  }

  function selectRingSlot(slot) {
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

    <div class="avatar-ring-wrap">
      <CharacterAvatar {equipment} size={300} />
      <div class="ring-icons">
        {#each SLOTS as { slot, icon }}
          <button
            class="ring-icon pos-{RING_POSITION[slot]}"
            class:active={activeSlot === slot}
            class:has-equip={!!equipment[slot]}
            aria-label={_(`shop.slots.${slot}`)}
            title={_(`shop.slots.${slot}`)}
            on:click={() => selectRingSlot(slot)}
          >
            {icon}
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
        {#if OPTIONAL_SLOTS.includes(activeSlot)}
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
          {#if !OPTIONAL_SLOTS.includes(activeSlot)}
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

  .avatar-ring-wrap {
    position: relative;
    width: 420px;
    height: 420px;
    margin: 20px auto 0;
  }

  .avatar-ring-wrap :global(.character-avatar) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .ring-icons {
    position: absolute;
    inset: 0;
  }

  .ring-icon {
    position: absolute;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    background-color: var(--bg-secondary);
    border: 3px solid transparent;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  }

  .ring-icon.active {
    border-color: var(--primary);
    background-color: var(--bg-primary);
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .ring-icon.has-equip::after {
    content: '';
    display: block;
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--success-dark);
    border: 2px solid white;
  }

  /* Rangée haute (resserrée vers le centre) */
  .pos-top-left { top: 8%; left: 32%; }
  .pos-top-right { top: 8%; left: 68%; }
  /* Rangée médiane haute (plaquée sur les bords) */
  .pos-mid-left { top: 32%; left: 8%; }
  .pos-mid-right { top: 32%; left: 92%; }
  /* Rangée médiane basse (plaquée sur les bords) */
  .pos-lowmid-left { top: 68%; left: 8%; }
  .pos-lowmid-right { top: 68%; left: 92%; }
  /* Rangée basse (resserrée vers le centre) */
  .pos-bottom-left { top: 92%; left: 32%; }
  .pos-bottom-right { top: 92%; left: 68%; }

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
    .avatar-ring-wrap {
      width: auto;
      height: auto;
      position: static;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .avatar-ring-wrap :global(.character-avatar) {
      position: relative;
      top: auto;
      left: auto;
      transform: none;
      margin-bottom: 16px;
    }

    .ring-icons {
      position: static;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      width: 100%;
    }

    .ring-icon {
      position: static;
      transform: none;
      width: 100%;
      height: 56px;
      border-radius: var(--border-radius-md);
    }

    .ring-icon.active {
      transform: scale(1.05);
    }
  }
</style>
