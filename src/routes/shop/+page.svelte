<script>
  import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
  import { _, getLanguage } from '$lib/utils/i18n';

  function itemName(item) {
    return item.name[getLanguage()] ?? item.name.fr;
  }

  export let data;

  const SLOT_TABS = [
    { slot: 'background', icon: '🌈' },
    { slot: 'aura', icon: '✨' },
    { slot: 'back', icon: '🦸' },
    { slot: 'body', icon: '🧍' },
    { slot: 'outfit', icon: '👕' },
    { slot: 'weapon', icon: '⚔️' },
    { slot: 'hat', icon: '🎩' },
    { slot: 'pet', icon: '🐾' }
  ];

  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

  let coins = data.shop.coins;
  let items = data.shop.items;
  let level = data.shop.level;
  let equipment = data.equipment;

  let activeSlot = 'body';
  let activeRarity = null; // null = toutes les raretés
  let previewItem = null; // item survolé/sélectionné, essayé visuellement
  let pendingItem = null; // item en attente de confirmation d'achat (2 taps)
  let isBuying = false;
  let buyError = null;

  let boosterPending = false;
  let freezePending = false;
  let consumableError = null;

  // Non possédés d'abord, puis rareté croissante au sein de chaque groupe
  // (le sort_order en base n'est pas strictement croissant par rareté, cf. UX_AUDIT.md)
  $: visibleItems = items
    .filter((item) => item.slot === activeSlot)
    .filter((item) => !activeRarity || item.rarity === activeRarity)
    .slice()
    .sort((a, b) => {
      const ownedDiff = Number(a.owned) - Number(b.owned);
      if (ownedDiff !== 0) return ownedDiff;
      return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    });
  $: previewEquipment = previewItem
    ? { ...equipment, [previewItem.slot]: { itemId: previewItem.id, code: previewItem.code, assetUrl: previewItem.assetUrl } }
    : equipment;

  function selectItem(item) {
    if (!item.owned && item.unlockLevel > level) return; // verrouillé par niveau : pas de panneau d'achat
    previewItem = item;
    pendingItem = item.owned ? null : item;
    buyError = null;
  }

  async function confirmBuy() {
    if (!pendingItem) return;
    isBuying = true;
    buyError = null;
    try {
      const response = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: pendingItem.id })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur');
      }
      coins = result.coinsBalance;
      items = items.map((i) => (i.id === pendingItem.id ? { ...i, owned: true } : i));
      pendingItem = null;
    } catch (e) {
      buyError = e.message;
    } finally {
      isBuying = false;
    }
  }

  function cancelBuy() {
    pendingItem = null;
    previewItem = null;
  }

  async function buyConsumable(kind) {
    const setPending = kind === 'freeze' ? (v) => (freezePending = v) : (v) => (boosterPending = v);
    setPending(true);
    consumableError = null;
    try {
      const response = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumable: kind })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur');
      }
      coins = result.coinsBalance;
    } catch (e) {
      consumableError = e.message;
    } finally {
      setPending(false);
    }
  }
</script>

<svelte:head>
  <title>{_('shop.title')} - MultyFun</title>
</svelte:head>

<main class="container shop-page">
  <div class="shop-header card">
    <CharacterAvatar equipment={previewEquipment} size={150} />
    <div class="shop-header-info">
      <h1>{_('shop.title')}</h1>
      <p class="subtitle">{_('shop.subtitle')}</p>
      <div class="coins-balance">🪙 {coins}</div>
    </div>
  </div>

  <div class="slot-tabs">
    {#each SLOT_TABS as tab}
      <button class="slot-tab" class:active={activeSlot === tab.slot} on:click={() => (activeSlot = tab.slot)}>
        <span class="tab-icon">{tab.icon}</span>
        {_(`shop.slots.${tab.slot}`)}
      </button>
    {/each}
  </div>

  <div class="rarity-filters">
    <button class="rarity-chip" class:active={activeRarity === null} on:click={() => (activeRarity = null)}>
      {_('shop.allRarities')}
    </button>
    {#each RARITY_ORDER as rarity}
      <button
        class="rarity-chip rarity-{rarity}"
        class:active={activeRarity === rarity}
        on:click={() => (activeRarity = rarity)}
      >
        {_(`shop.rarity.${rarity}`)}
      </button>
    {/each}
  </div>

  {#if pendingItem}
    <div class="confirm-panel card">
      <p class="confirm-text">
        {_('shop.confirmBuy', { price: pendingItem.finalPrice })}
      </p>
      {#if coins >= pendingItem.finalPrice}
        <p class="confirm-remaining">
          {_('shop.confirmRemaining', { remaining: coins - pendingItem.finalPrice })}
        </p>
      {:else}
        <p class="confirm-remaining confirm-remaining--insufficient">
          {_('shop.insufficient_coins')}
        </p>
      {/if}
      {#if buyError}
        <p class="confirm-error">⚠️ {_(`shop.${buyError}`) ?? buyError}</p>
      {/if}
      <div class="confirm-buttons">
        <button class="confirm-button" on:click={confirmBuy} disabled={isBuying || coins < pendingItem.finalPrice}>
          {isBuying ? _('common.loading') : _('shop.confirm')}
        </button>
        <button class="cancel-button" on:click={cancelBuy} disabled={isBuying}>{_('shop.cancel')}</button>
      </div>
    </div>
  {/if}

  <div class="items-grid">
    {#each visibleItems as item}
      <button
        class="item-card rarity-{item.rarity ?? 'default'}"
        class:selected={previewItem?.id === item.id}
        class:locked={!item.owned && item.unlockLevel > level}
        on:click={() => selectItem(item)}
      >
        {#if item.isDailyOffer && !item.owned}
          <span class="offer-badge">⭐ -20%</span>
        {/if}
        <img class="item-thumb" src={item.assetUrl} alt={itemName(item)} />
        <span class="item-name">{itemName(item)}</span>
        {#if item.owned}
          <span class="owned-badge">✅ {_('shop.owned')}</span>
        {:else if item.unlockLevel > level}
          <span class="locked-badge">🔒 {_('shop.levelLocked', { level: item.unlockLevel })}</span>
        {:else if item.isPurchasable}
          <span class="price-tag">
            {#if item.isDailyOffer}
              <span class="price-original">{item.price} 🪙</span>
            {/if}
            {item.finalPrice} 🪙
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="potions-section card">
    <h2>{_('shop.potions')}</h2>
    {#if consumableError}
      <p class="confirm-error">⚠️ {consumableError}</p>
    {/if}
    <div class="potions-grid">
      <div class="potion-card">
        <span class="potion-icon">🛡️</span>
        <h3>{_('shop.freezeName')}</h3>
        <p>{_('shop.freezeDesc')}</p>
        <button on:click={() => buyConsumable('freeze')} disabled={freezePending || coins < 300}>
          {freezePending ? _('common.loading') : '300 🪙'}
        </button>
      </div>
      <div class="potion-card">
        <span class="potion-icon">⚡</span>
        <h3>{_('shop.boosterName')}</h3>
        <p>{_('shop.boosterDesc')}</p>
        <button on:click={() => buyConsumable('booster')} disabled={boosterPending || coins < 400}>
          {boosterPending ? _('common.loading') : '400 🪙'}
        </button>
      </div>
    </div>
  </div>

  <div class="shop-footer">
    <a href="/character" class="button character-link">🦸 {_('character.title')}</a>
  </div>
</main>

<style>
  .shop-page {
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  }

  .shop-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .shop-header-info h1 {
    margin: 0 0 5px;
    color: var(--primary-dark);
  }

  .subtitle {
    color: var(--text-secondary);
    margin: 0 0 10px;
  }

  .coins-balance {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ff8f00;
  }

  .slot-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 20px;
  }

  .slot-tab {
    padding: 8px 14px;
    background: white;
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
  }

  .slot-tab.active {
    border-color: var(--primary);
    background-color: var(--bg-primary);
    color: var(--primary-dark);
    font-weight: bold;
  }

  .tab-icon {
    margin-right: 4px;
  }

  .rarity-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-bottom: 16px;
  }

  .rarity-chip {
    padding: 4px 10px;
    font-size: 0.8rem;
    background: white;
    border: 2px solid var(--bg-secondary);
    border-radius: 999px;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .rarity-chip.active {
    border-color: var(--primary);
    color: var(--primary-dark);
    font-weight: bold;
  }

  .confirm-panel {
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
    background-color: var(--bg-secondary);
  }

  .confirm-text {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .confirm-remaining {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .confirm-remaining--insufficient {
    color: var(--secondary-dark, #c62828);
    font-weight: bold;
  }

  .confirm-error {
    color: var(--secondary-dark, #c62828);
    font-weight: bold;
  }

  .confirm-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 12px;
  }

  .confirm-button {
    background-color: var(--success);
    color: white;
    padding: 10px 25px;
    box-shadow: 0 4px 0 var(--success-dark);
  }

  .cancel-button {
    background-color: var(--bg-primary);
    color: var(--text-secondary);
    padding: 10px 20px;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
  }

  .item-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px;
    border-radius: var(--border-radius-md);
    border: 3px solid transparent;
    cursor: pointer;
    background-color: #eceff1;
  }

  .item-card.selected {
    border-color: var(--primary);
  }

  .item-card.locked {
    opacity: 0.5;
    filter: grayscale(0.6);
    cursor: not-allowed;
  }

  .item-card.rarity-common {
    background-color: #eceff1;
  }

  .item-card.rarity-uncommon {
    background-color: #e0f2e9;
  }

  .item-card.rarity-rare {
    background-color: #e3f2fd;
  }

  .item-card.rarity-epic {
    background-color: #f3e5f5;
  }

  .item-card.rarity-legendary {
    background: linear-gradient(135deg, #fff8e1, #ffe082);
  }

  .item-card.rarity-mythic {
    background: linear-gradient(135deg, #ffe0ec, #d6c9ff, #c8f0ff);
  }

  .item-thumb {
    width: 70px;
    height: 70px;
    object-fit: contain;
  }

  .item-name {
    font-size: 0.85rem;
    font-weight: bold;
    text-align: center;
  }

  .offer-badge {
    align-self: flex-start;
    background-color: var(--accent);
    color: white;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 8px;
  }

  .owned-badge {
    font-size: 0.75rem;
    color: var(--success-dark);
    font-weight: bold;
  }

  .locked-badge {
    font-size: 0.75rem;
    color: var(--text-light);
  }

  .price-tag {
    font-weight: bold;
    color: #ff8f00;
  }

  .price-original {
    text-decoration: line-through;
    color: var(--text-light);
    font-weight: normal;
    margin-right: 4px;
  }

  .potions-section {
    padding: 20px;
    margin-bottom: 20px;
  }

  .potions-section h2 {
    text-align: center;
    color: var(--primary-dark);
  }

  .potions-grid {
    display: flex;
    gap: 15px;
    justify-content: center;
  }

  .potion-card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 15px;
    text-align: center;
    min-width: 160px;
  }

  .potion-icon {
    font-size: 2rem;
  }

  .shop-footer {
    text-align: center;
    margin-bottom: 30px;
  }

  .character-link {
    background-color: var(--primary);
    color: white;
    padding: 10px 20px;
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 var(--primary-dark);
  }

  @media (max-width: 600px) {
    .shop-header {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
