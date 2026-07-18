<script>
  import { _ } from '$lib/utils/i18n';

  // Props
  export let onDigit = () => {};
  export let onErase = () => {};
  export let onValidate = () => {};

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<div class="keypad">
  {#each digits as digit}
    <button class="key" on:pointerdown|preventDefault={() => onDigit(String(digit))}>
      {digit}
    </button>
  {/each}
  <button class="key key-erase" on:pointerdown|preventDefault={onErase} aria-label="Effacer">
    ⌫
  </button>
  <button class="key" on:pointerdown|preventDefault={() => onDigit('0')}>0</button>
  <button class="key key-validate" on:pointerdown|preventDefault={onValidate}>
    {_('game.validate')}
  </button>
</div>

<style>
  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
    touch-action: manipulation;
  }

  .key {
    min-height: 56px;
    font-size: 1.5rem;
    font-weight: bold;
    background-color: white;
    color: var(--primary-dark);
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .key:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.12);
  }

  .key-erase {
    background-color: var(--bg-secondary);
    color: var(--secondary);
  }

  .key-validate {
    background-color: var(--success);
    color: white;
    box-shadow: 0 4px 0 var(--success-dark);
    font-size: 1.1rem;
  }
</style>
