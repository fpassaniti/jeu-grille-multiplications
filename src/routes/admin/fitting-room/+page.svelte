<script>
  import CharacterAvatar from '$lib/components/character/CharacterAvatar.svelte';
  import { _, getLanguage } from '$lib/utils/i18n';

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

  const initialEquipment = data.equipment;
  let equipment = { ...initialEquipment };
  let activeSlot = 'body';

  function itemName(item) {
    return item.name[getLanguage()] ?? item.name.fr;
  }

  function itemsFor(slot) {
    return data.items.filter((item) => item.slot === slot);
  }

  function selectItem(item) {
    equipment = { ...equipment, [item.slot]: { itemId: item.id, code: item.code, assetUrl: item.assetUrl } };
  }

  function clearSlot(slot) {
    equipment = { ...equipment, [slot]: null };
  }

  function reset() {
    equipment = { ...initialEquipment };
  }
</script>

<svelte:head>
  <title>{_('admin.fittingRoom.title')} - MultyFun</title>
</svelte:head>

<main class="container fitting-room-page">
  <div class="fitting-room-header card">
    <CharacterAvatar {equipment} size={300} />
    <div class="fitting-room-header-info">
      <h1>{_('admin.fittingRoom.title')}</h1>
      <p class="subtitle">{_('admin.fittingRoom.subtitle')}</p>
      <button class="reset-button" on:click={reset}>{_('admin.fittingRoom.reset')}</button>
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

  <div class="items-grid">
    <button
      class="item-card none-card"
      class:selected={!equipment[activeSlot]}
      on:click={() => clearSlot(activeSlot)}
    >
      <span class="none-icon">🚫</span>
      <span class="item-name">{_('character.none')}</span>
    </button>
    {#each itemsFor(activeSlot) as item}
      <button
        class="item-card rarity-{item.rarity ?? 'default'}"
        class:selected={equipment[activeSlot]?.itemId === item.id}
        on:click={() => selectItem(item)}
      >
        <img class="item-thumb" src={item.assetUrl} alt={itemName(item)} />
        <span class="item-name">{itemName(item)}</span>
      </button>
    {/each}
  </div>
</main>

<style>
  .fitting-room-page {
    max-width: 900px;
    margin: 20px auto;
    padding: 0 15px;
  }

  .fitting-room-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .fitting-room-header-info h1 {
    margin: 0 0 5px;
    color: var(--primary-dark);
  }

  .subtitle {
    color: var(--text-secondary);
    margin: 0 0 10px;
  }

  .reset-button {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: var(--border-radius-md);
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

  .none-card .none-icon {
    font-size: 1.8rem;
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

  @media (max-width: 600px) {
    .fitting-room-header {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
