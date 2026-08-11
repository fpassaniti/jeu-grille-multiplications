<script>
  import { _, getLanguage } from '$lib/utils/i18n';

  // Props
  /** Catalogue possédé (familles time_bonus/time_grace/coin_multiplier uniquement, qty > 0 déjà filtré par l'appelant) */
  export let potions = [];
  export let selectedCodes = [];
  export let onSelectionChange = () => {};

  const FAMILIES = ['time_bonus', 'time_grace', 'coin_multiplier'];

  function potionName(potion) {
    return potion.name[getLanguage()] ?? potion.name.fr;
  }

  function potionsFor(family) {
    return potions.filter((p) => p.family === family);
  }

  function isSelected(code) {
    return selectedCodes.includes(code);
  }

  function toggle(potion) {
    const family = potion.family;
    const others = selectedCodes.filter(
      (code) => !potionsFor(family).some((p) => p.code === code)
    );
    onSelectionChange(isSelected(potion.code) ? others : [...others, potion.code]);
  }

  $: visibleFamilies = FAMILIES.filter((family) => potionsFor(family).length > 0);
</script>

{#if visibleFamilies.length > 0}
  <div class="option-section card-inset potion-picker">
    <h2>{_('play.potions.title')}</h2>
    <p class="section-help">{_('play.potions.help')}</p>
    {#each visibleFamilies as family}
      <div class="potion-family">
        {#each potionsFor(family) as potion}
          <button
            class="potion-chip"
            class:active={isSelected(potion.code)}
            on:click={() => toggle(potion)}
          >
            <span class="potion-name">{potionName(potion)}</span>
            <span class="potion-qty">×{potion.quantity}</span>
          </button>
        {/each}
      </div>
    {/each}
  </div>
{/if}

<style>
  .potion-picker {
    text-align: left;
  }

  .section-help {
    font-size: 0.9rem;
    color: var(--text-light);
    margin: 5px 0 15px;
  }

  .potion-family {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
  }

  .potion-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background-color: var(--bg-primary);
    border-radius: var(--border-radius-md);
  }

  .potion-chip.active {
    background-color: var(--primary);
    color: white;
  }

  .potion-qty {
    font-size: 0.8rem;
    opacity: 0.75;
  }
</style>
