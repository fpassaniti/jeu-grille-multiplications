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
  let potionsCatalog = data.shop.potions.catalog;
  let streakFreezeDays = data.shop.potions.streakFreezeDays;

  const POTION_FAMILIES = ['time_bonus', 'time_grace', 'coin_multiplier', 'streak_freeze'];

  function potionName(potion) {
    return potion.name[getLanguage()] ?? potion.name.fr;
  }

  function potionDesc(potion) {
    return potion.description[getLanguage()] ?? potion.description.fr;
  }

  $: potionsByFamily = POTION_FAMILIES.map((family) => ({
    family,
    potions: potionsCatalog.filter((p) => p.family === family)
  })).filter((group) => group.potions.length > 0);

  let activeSlot = 'body';
  let activeRarity = null; // null = toutes les raretés
  let previewItem = null; // item survolé/sélectionné, essayé visuellement
  let pendingItem = null; // item en attente de confirmation d'achat (2 taps)
  let isBuying = false;
  let buyError = null;

  let buyingPotionCode = null;
  let potionError = null;

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

  async function buyPotion(potion) {
    buyingPotionCode = potion.code;
    potionError = null;
    try {
      const response = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ potionCode: potion.code })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erreur');
      }
      coins = result.coinsBalance;
      if (potion.family === 'streak_freeze') {
        streakFreezeDays += potion.value;
      } else {
        potionsCatalog = potionsCatalog.map((p) =>
          p.code === potion.code ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
    } catch (e) {
      potionError = e.message;
    } finally {
      buyingPotionCode = null;
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
    <button class="sheet-backdrop" aria-label={_('common.close')} on:click={cancelBuy}></button>
    <div class="confirm-panel card">
      <p class="confirm-text">
        {_('shop.confirmBuy', { price: pendingItem.price })}
      </p>
      {#if coins >= pendingItem.price}
        <p class="confirm-remaining">
          {_('shop.confirmRemaining', { remaining: coins - pendingItem.price })}
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
        <button class="confirm-button" on:click={confirmBuy} disabled={isBuying || coins < pendingItem.price}>
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
        <img class="item-thumb" src={item.assetUrl} alt={itemName(item)} />
        <span class="item-name">{itemName(item)}</span>
        {#if item.owned}
          <span class="owned-badge">✅ {_('shop.owned')}</span>
        {:else if item.unlockLevel > level}
          <span class="locked-badge">🔒 {_('shop.levelLocked', { level: item.unlockLevel })}</span>
        {:else}
          <span class="price-tag">{item.price} 🪙</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="potions-section card">
    <h2>{_('shop.potions')}</h2>
    {#if potionError}
      <p class="confirm-error">⚠️ {_(`shop.${potionError}`) ?? potionError}</p>
    {/if}
    {#each potionsByFamily as group}
      <h3 class="potion-family-title">{_(`shop.potionFamilies.${group.family}`)}</h3>
      <div class="potions-grid">
        {#each group.potions as potion}
          <div class="potion-card">
            <h4>{potionName(potion)}</h4>
            <p>{potionDesc(potion)}</p>
            {#if potion.family === 'streak_freeze'}
              <p class="potion-owned">{_('shop.streakFreezeDays', { days: streakFreezeDays })}</p>
            {:else if potion.quantity > 0}
              <p class="potion-owned">{_('shop.owned')} ×{potion.quantity}</p>
            {/if}
            <button
              on:click={() => buyPotion(potion)}
              disabled={buyingPotionCode === potion.code || coins < potion.price}
            >
              {buyingPotionCode === potion.code ? _('common.loading') : `${potion.price} 🪙`}
            </button>
          </div>
        {/each}
      </div>
    {/each}
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

  .sheet-backdrop {
    display: none;
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

  .potions-section {
    padding: 20px;
    margin-bottom: 20px;
  }

  .potions-section h2 {
    text-align: center;
    color: var(--primary-dark);
  }

  .potion-family-title {
    text-align: center;
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 15px 0 10px;
  }

  .potions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
    margin-bottom: 10px;
  }

  .potion-card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 15px;
    text-align: center;
  }

  .potion-owned {
    display: inline-block;
    font-size: 0.85rem;
    color: var(--primary-dark);
    font-weight: bold;
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

    .sheet-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      border: none;
      padding: 0;
      background-color: rgba(0, 0, 0, 0.45);
      z-index: 40;
    }

    .confirm-panel {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      max-height: 70vh;
      overflow-y: auto;
      margin: 0;
      border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
      box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.25);
      z-index: 50;
    }

    .potion-card {
      width: 100%;
      box-sizing: border-box;
    }
  }
</style>
