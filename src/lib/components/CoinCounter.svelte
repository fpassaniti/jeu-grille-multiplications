<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  // Props
  export let value = 0;
  export let duration = 1200;

  const displayed = tweened(0, { duration, easing: cubicOut });
  $: displayed.set(value);
</script>

<span class="coin-counter">
  🪙 {Math.round($displayed)}
</span>

<style>
  .coin-counter {
    font-weight: bold;
    color: #ff8f00;
    font-variant-numeric: tabular-nums;
  }
</style>
