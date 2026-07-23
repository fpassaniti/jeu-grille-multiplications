<script>
  import { PRESETS, presetOptionsFor, detectPreset, groupPresetsForMode } from '$lib/modes/presets.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let mode; // objet GameMode (config statique)
  export let options = { tiers: [] };
  export let level = 'adulte';
  export let onChange = () => {};

  let previousModeId = null;
  let previousLevel = null;

  // Seuls les modes ayant un preset dédié affichent le bouton correspondant
  // (ex. la division n'a pas de preset CE1/CE2 : seul CM1 lui est proposé).
  // Les presets pointant vers les mêmes paliers pour ce mode (ex. CE2 = CM1
  // en soustraction) sont fusionnés en un seul bouton.
  $: presetGroups = level === 'enfant' ? groupPresetsForMode(mode.id) : [];

  $: activePreset = level === 'enfant' ? detectPreset(mode.id, options) : null;

  // Verrouillage adulte : dès qu'on est en mode adulte (au montage ou après un
  // changement de mode/niveau), on applique automatiquement le jeu de paliers
  // le plus difficile (identique au preset CM1) — aucun choix de difficulté
  // n'est proposé aux adultes.
  $: if (mode.id !== previousModeId || level !== previousLevel) {
    previousModeId = mode.id;
    previousLevel = level;
    if (level === 'adulte') {
      const hardest = presetOptionsFor('cm1', mode.id);
      if (hardest) onChange(hardest);
    }
  }

  function presetById(id) {
    return PRESETS.find((preset) => preset.id === id);
  }

  function selectPresetGroup(group) {
    onChange(structuredClone(group.options));
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

  $: allChecked =
    mode.tiers.length > 0 && mode.tiers.every((tier) => options.tiers?.includes(tier.id));

  function toggleAll() {
    if (allChecked) return;
    onChange({ tiers: mode.tiers.map((tier) => tier.id) });
  }

  function stars(difficulty) {
    return '⭐'.repeat(Math.max(1, Math.round(difficulty)));
  }
</script>

<div class="difficulty-selector">
  <h2>{_('difficulty.chooseTitle')}</h2>

  {#if presetGroups.length > 0}
    <div class="preset-buttons">
      {#each presetGroups as group}
        <button
          class="preset-button"
          class:active={group.ids.includes(activePreset)}
          on:click={() => selectPresetGroup(group)}
        >
          <span class="emoji">{group.ids.map((id) => presetById(id).icon).join('')}</span>
          {group.ids.map((id) => _(presetById(id).labelKey)).join(' / ')}
        </button>
      {/each}
    </div>
  {/if}

  <details class="tiers-accordion">
    <summary>{_('difficulty.editExercises')}</summary>
    <div class="tiers-list">
      <p class="tiers-hint">{_('difficulty.customHint')}</p>
      <label class="tier-row select-all-row" class:selected={allChecked}>
        <input type="checkbox" checked={allChecked} on:change={toggleAll} />
        <span class="tier-label">{_('difficulty.selectAll')}</span>
      </label>
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
  </details>
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

  .tiers-accordion {
    max-width: 420px;
    margin: 15px auto 0;
    text-align: left;
  }

  .tiers-accordion summary {
    cursor: pointer;
    color: var(--text-light);
    font-size: 0.9rem;
    text-align: center;
    list-style: none;
  }

  .tiers-accordion summary::-webkit-details-marker {
    display: none;
  }

  .tiers-accordion summary::before {
    content: '▸ ';
  }

  .tiers-accordion[open] summary::before {
    content: '▾ ';
  }

  .tiers-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
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

  .select-all-row {
    border-style: dashed;
    margin-bottom: 4px;
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
