<script>
  import GameOptions from './GameOptions.svelte';
  import PotionPicker from './PotionPicker.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import LiveLeaderboardPanel from './LiveLeaderboardPanel.svelte';
  import { getMode } from '$lib/modes/index.js';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let modeId = 'tables';
  export let level = 'adulte';
  export let duration = 3;
  export let options = {};
  export let potions = [];
  export let selectedPotionCodes = [];
  export let onModeSelect = () => {};
  export let onDurationSelect = () => {};
  export let onOptionsChange = () => {};
  export let onPotionSelectionChange = () => {};
  export let onStart = () => {};

  $: mode = getMode(modeId);
  // validateOptions tolère déjà 0 table sélectionnée (≡ toutes les tables) ;
  // on délègue uniformément à chaque mode plutôt que de spécialiser le cas grid.
  $: canStart = mode.validateOptions(options).ok;
</script>

<div class="start-screen card">
  <div class="start-layout">
    <div class="start-main">
      <ModeSelector selected={modeId} onSelect={onModeSelect} />

      <GameOptions
        {modeId}
        {level}
        {duration}
        {options}
        {onDurationSelect}
        {onOptionsChange}
      />

      <PotionPicker
        {potions}
        selectedCodes={selectedPotionCodes}
        onSelectionChange={onPotionSelectionChange}
      />

      <button class="start-button" on:click={onStart} disabled={!canStart}>
        <span class="emoji">🚀</span> {_('play.start')}
      </button>
    </div>

    <div class="start-leaderboard">
      <LiveLeaderboardPanel mode={modeId} {level} {duration} />
    </div>
  </div>
</div>

<style>
  .start-screen {
    text-align: center;
    padding: 10px 30px;
    margin: 20px auto;
    background-color: white;
  }

  .start-layout {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 20px;
    align-items: start;
    text-align: left;
  }

  .start-main {
    text-align: center;
  }

  @media (max-width: 767px) {
    .start-layout {
      grid-template-columns: 1fr;
    }
  }

  .start-button {
    font-size: 1.3rem;
    padding: 15px 40px;
    background-color: var(--accent);
    color: var(--text-primary);
    margin: 20px 0;
    box-shadow: 0 6px 0 var(--accent-dark);
  }

  .start-button:hover {
    background-color: var(--accent-light);
  }

  .start-button:disabled {
    background-color: #e0e0e0;
    color: var(--text-light);
    box-shadow: 0 4px 0 #bdbdbd;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }
</style>
