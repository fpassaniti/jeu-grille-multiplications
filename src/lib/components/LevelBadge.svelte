<script>
  import { getLevelGradient } from '$lib/utils/level-theme.js';

  // Props
  export let level = 1;
  export let colorTheme = null;
  export let size = 32; // px

  $: gradient = getLevelGradient(colorTheme);
  $: fontSize = Math.max(9, Math.round(size * 0.42));
</script>

<div
  class="level-badge"
  style="width: {size}px; height: {size}px; font-size: {fontSize}px; background-image: {gradient};"
  title="Niveau {level}"
>
  {level}
</div>

<style>
  .level-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    line-height: 1;
  }
</style>
