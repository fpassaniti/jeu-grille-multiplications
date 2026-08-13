<script>
  import { _ } from '$lib/utils/i18n';
  import { SMOOTHIE_INGREDIENTS, MAX_SMOOTHIE_SIZE, isValidSmoothie } from '$lib/utils/smoothie.js';

  export let data;

  let playerMode = data.account.playerMode;
  let pendingMode = null; // mode en attente de confirmation (2 taps, cf. boutique)
  let saving = false;
  let error = null;

  function requestModeChange(mode) {
    if (mode === playerMode) return;
    pendingMode = mode;
    error = null;
  }

  function cancelModeChange() {
    pendingMode = null;
  }

  async function confirmModeChange() {
    saving = true;
    error = null;
    try {
      const response = await fetch('/api/profile/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerMode: pendingMode })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur');
      playerMode = result.playerMode;
      pendingMode = null;
    } catch (e) {
      error = e.message || _('profile.modeChangeError');
    } finally {
      saving = false;
    }
  }

  // Nouveau smoothie en cours de composition (le smoothie actuel n'est jamais
  // exposé en clair côté profil, comme un mot de passe classique).
  let newSmoothie = [];
  let confirmingSmoothie = false;
  let savingSmoothie = false;
  let smoothieError = null;
  let smoothieSaved = false;

  function toggleNewSmoothieIngredient(char) {
    if (newSmoothie.includes(char)) {
      newSmoothie = newSmoothie.filter(c => c !== char);
    } else if (newSmoothie.length < MAX_SMOOTHIE_SIZE) {
      newSmoothie = [...newSmoothie, char];
    }
    confirmingSmoothie = false;
    smoothieSaved = false;
  }

  function requestSmoothieChange() {
    if (!isValidSmoothie(newSmoothie)) return;
    confirmingSmoothie = true;
    smoothieError = null;
  }

  function cancelSmoothieChange() {
    confirmingSmoothie = false;
  }

  async function confirmSmoothieChange() {
    savingSmoothie = true;
    smoothieError = null;
    try {
      const response = await fetch('/api/profile/smoothie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smoothie: newSmoothie })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erreur');
      newSmoothie = [];
      confirmingSmoothie = false;
      smoothieSaved = true;
    } catch (e) {
      smoothieError = e.message || _('profile.smoothieChangeError');
    } finally {
      savingSmoothie = false;
    }
  }
</script>

<svelte:head>
  <title>{_('profile.title')} - {_('common.appName')}</title>
</svelte:head>

<div class="container">
  <div class="profile-container card">
    <div class="profile-header">
      <h1>{_('profile.title')}</h1>
    </div>

    <div class="profile-section card-inset">
      <h2>{_('profile.account')}</h2>
      <p><strong>{_('auth.displayName')}:</strong> {data.account.displayName}</p>
    </div>

    <div class="profile-section card-inset">
      <h2>{_('profile.playerMode')}</h2>
      <p class="section-help">{_('profile.playerModeHelp')}</p>

      <div class="mode-buttons">
        <button
          class:active={playerMode === 'adulte'}
          on:click={() => requestModeChange('adulte')}
          disabled={saving}
        >
          <span class="emoji">👨‍💼</span> {_('common.adult')}
        </button>
        <button
          class:active={playerMode === 'enfant'}
          on:click={() => requestModeChange('enfant')}
          disabled={saving}
        >
          <span class="emoji">🧒</span> {_('common.child')}
        </button>
      </div>

      {#if pendingMode}
        <div class="confirm-box">
          <p>{_('profile.confirmModeChange', { mode: _(`common.${pendingMode === 'adulte' ? 'adult' : 'child'}`) })}</p>
          <div class="confirm-actions">
            <button class="confirm-button" on:click={confirmModeChange} disabled={saving}>
              {_('common.yes')}
            </button>
            <button class="cancel-button" on:click={cancelModeChange} disabled={saving}>
              {_('common.cancel')}
            </button>
          </div>
        </div>
      {/if}

      {#if error}
        <div class="error-message">
          <span class="emoji">⚠️</span> {error}
        </div>
      {/if}
    </div>

    <div class="profile-section card-inset">
      <h2>{_('profile.smoothie')}</h2>
      <p class="section-help">{_('profile.smoothieHelp')}</p>

      <div class="password-container">
        {#each SMOOTHIE_INGREDIENTS as char}
          <button
            type="button"
            class="password-char-btn"
            class:selected={newSmoothie.includes(char)}
            on:click={() => toggleNewSmoothieIngredient(char)}
            disabled={savingSmoothie}
          >
            {char}
          </button>
        {/each}
      </div>

      <button
        class="save-smoothie-button"
        on:click={requestSmoothieChange}
        disabled={savingSmoothie || newSmoothie.length === 0}
      >
        {_('common.save')}
      </button>

      {#if confirmingSmoothie}
        <div class="confirm-box">
          <p>{_('profile.confirmSmoothieChange')}</p>
          <div class="confirm-actions">
            <button class="confirm-button" on:click={confirmSmoothieChange} disabled={savingSmoothie}>
              {_('common.yes')}
            </button>
            <button class="cancel-button" on:click={cancelSmoothieChange} disabled={savingSmoothie}>
              {_('common.cancel')}
            </button>
          </div>
        </div>
      {/if}

      {#if smoothieSaved}
        <div class="success-text">{_('profile.smoothieChanged')}</div>
      {/if}

      {#if smoothieError}
        <div class="error-message">
          <span class="emoji">⚠️</span> {smoothieError}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    width: 100%;
    box-sizing: border-box;
  }

  .profile-container {
    max-width: 530px;
    margin: 50px auto;
    padding: 30px;
  }

  .profile-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .profile-section {
    margin-bottom: 20px;
  }

  .card-inset {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 20px;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  }

  .section-help {
    font-size: 0.9rem;
    color: var(--text-light);
    margin: 5px 0 15px;
  }

  .mode-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
  }

  .mode-buttons button.active {
    background-color: var(--primary);
    color: white;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }

  .confirm-box {
    margin-top: 15px;
    padding: 15px;
    background-color: white;
    border-radius: var(--border-radius-md);
    text-align: center;
  }

  .confirm-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .confirm-button {
    background-color: var(--accent);
    color: white;
  }

  .cancel-button {
    background-color: var(--bg-secondary);
  }

  .error-message {
    margin-top: 15px;
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px;
    border-radius: var(--border-radius-md);
  }

  .password-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: white;
    border-radius: var(--border-radius-md);
  }

  .password-char-btn {
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .password-char-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }

  .password-char-btn.selected {
    background-color: var(--primary-light);
    box-shadow: 0 0 0 2px var(--primary);
  }

  .save-smoothie-button {
    display: block;
    margin: 15px auto 0;
    padding: 10px 25px;
    background-color: var(--accent);
    color: white;
    border-radius: var(--border-radius-md);
  }

  .save-smoothie-button:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
  }

  .success-text {
    margin-top: 15px;
    text-align: center;
    color: var(--primary-dark);
    font-weight: bold;
  }
</style>
