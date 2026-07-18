<script>
  import { PRESETS, presetOptionsFor, detectPreset } from '$lib/modes/presets.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let mode; // objet GameMode (config statique)
  export let options = { tiers: [] };
  export let onChange = () => {};

  let showTiers = false;

  $: activePreset = detectPreset(mode.id, options);
  $: if (activePreset === 'libre') showTiers = true;

  function selectPreset(presetId) {
    if (presetId === 'libre') {
      // « Libre » : conserve la sélection courante, déplie juste les paliers
      showTiers = true;
      return;
    }
    showTiers = false;
    const presetOptions = presetOptionsFor(presetId, mode.id);
    if (presetOptions) {
      onChange(presetOptions);
    }
  }

  function toggleTier(tierId) {
    const current = options.tiers ?? [];
    const tiers = current.includes(tierId)
      ? current.filter((id) => id !== tierId)
      : [...current, tierId];
    if (tiers.length > 0) {
      onChange({ tiers });
    }
  }

  function stars(difficulty) {
    return '⭐'.repeat(Math.max(1, Math.round(difficulty)));
  }
</script>

<div class="difficulty-selector">
  <h2>{_('difficulty.chooseTitle')}</h2>

  <div class="preset-buttons">
    {#each PRESETS as preset}
      <button
        class="preset-button"
        class:active={activePreset === preset.id && (preset.id !== 'libre' || showTiers)}
        on:click={() => selectPreset(preset.id)}
      >
        <span class="emoji">{preset.icon}</span> {_(preset.labelKey)}
      </button>
    {/each}
  </div>

  {#if showTiers || activePreset === 'libre'}
    <div class="tiers-list">
      <p class="tiers-hint">{_('difficulty.customHint')}</p>
      {#each mode.tiers as tier}
        <label class="tier-row" class:selected={options.tiers?.includes(tier.id)}>
          <input
            type="checkbox"
            checked={options.tiers?.includes(tier.id)}
            on:change={() => toggleTier(tier.id)}
          />
          <span class="tier-label">{_(tier.labelKey)}</span>
          <span class="tier-stars">{stars(tier.difficulty)}</span>
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  .difficulty-selector {
    text-align: center;
  }

  .preset-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 15px 0;
  }

  .preset-button {
    font-size: 1.1rem;
    padding: 12px 25px;
  }

  .preset-button.active {
    background-color: var(--primary);
    color: white;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  .tiers-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 420px;
    margin: 10px auto 0;
  }

  .tiers-hint {
    font-size: 0.9rem;
    color: var(--text-light);
    margin: 5px 0;
  }

  .tier-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background-color: white;
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .tier-row.selected {
    border-color: var(--primary-light);
    background-color: var(--bg-primary);
  }

  .tier-label {
    flex: 1;
    font-weight: bold;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .tier-stars {
    font-size: 0.8rem;
    white-space: nowrap;
  }

  @media (max-width: 767px) {
    .preset-buttons {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>
