<script>
  // Props
  export let equipment = {}; // {slot: {itemId, code, assetUrl}|null} — résolu côté serveur
  export let size = 150; // px : 40 (header) / 150 (dashboard/shop) / 300 (page personnage)

  // Ordre d'empilement (z-index croissant), SPEC §5.3
  const LAYER_ORDER = ['background', 'aura', 'back', 'body', 'outfit', 'weapon', 'hat', 'pet'];
</script>

<div class="character-avatar" style="width: {size}px; height: {size}px;">
  {#if !equipment.background}
    <div class="sky-fallback"></div>
  {/if}
  {#each LAYER_ORDER as slot}
    {#if equipment[slot]}
      <img class="layer" src={equipment[slot].assetUrl} alt="" />
    {/if}
  {/each}
</div>

<style>
  .character-avatar {
    position: relative;
    border-radius: var(--border-radius-md);
    overflow: hidden;
    background-color: #eef2ff;
  }

  .sky-fallback {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #bcd9ff 0%, #eef6ff 100%);
  }

  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
