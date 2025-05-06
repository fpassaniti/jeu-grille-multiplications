<script>
  import { onMount } from 'svelte';

  // État du formulaire
  let name = 'Joueur Test';
  let score = 500;
  let duration = 2;
  let level = 'adulte';
  let solvedCells = 10;
  let totalPossibleCells = 100;
  let selectedTables = [2, 5, 7];
  let isConnected = false;

  // État de la réponse
  let loading = false;
  let response = null;
  let error = null;
  let successMessage = '';

  // récuépration depuis le layout
  export let data;

  // Vérifier automatiquement si l'utilisateur est connecté
  onMount(async () => {
    try {
      if (data.user) {
        isConnected = true;
        name = data.user.username;
        console.log(data.user)
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de la session:', err);
    }
  });

  // Fonction pour envoyer le score simulé
  async function submitTestScore() {
    loading = true;
    error = null;
    response = null;
    successMessage = '';

    try {
      // Préparer les données du score
      const scoreData = {
        name,
        score: parseInt(score),
        duration: parseInt(duration),
        level,
        solvedCells: parseInt(solvedCells),
        totalPossibleCells: parseInt(totalPossibleCells),
        selectedTables: level === 'enfant' ? selectedTables.map(t => parseInt(t)) : []
      };

      // Appeler l'API scores
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
      });

      // Traiter la réponse
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du score');
      }

      // Afficher la réponse
      response = data;
      successMessage = 'Score envoyé avec succès!';

    } catch (err) {
      console.error('Erreur:', err);
      error = err.message || 'Une erreur s\'est produite';
    } finally {
      loading = false;
    }
  }

  // Fonction pour réinitialiser le formulaire
  function resetForm() {
    name = 'Joueur Test';
    score = 500;
    duration = 2;
    level = 'adulte';
    solvedCells = 10;
    totalPossibleCells = 100;
    selectedTables = [2, 5, 7];
    response = null;
    error = null;
    successMessage = '';
  }

  // Mise à jour dynamique des tables sélectionnées
  function handleTableChange(tableNumber, event) {
    const isChecked = event.target.checked;

    if (isChecked && !selectedTables.includes(tableNumber)) {
      selectedTables = [...selectedTables, tableNumber];
    } else if (!isChecked && selectedTables.includes(tableNumber)) {
      selectedTables = selectedTables.filter(t => t !== tableNumber);
    }
  }

  // Sélectionner/désélectionner toutes les tables
  function toggleAllTables(select) {
    if (select) {
      selectedTables = Array.from({ length: 10 }, (_, i) => i + 1);
    } else {
      selectedTables = [];
    }
  }
</script>

<svelte:head>
  <title>Testeur d'API Scores - MultyFun</title>
</svelte:head>

<main class="container">
  <div class="test-page card">
    <h1>Testeur d'API Scores</h1>
    <p class="subtitle">Cet outil permet de simuler une fin de partie et tester l'API d'enregistrement des scores.</p>

    <div class="auth-status">
      <span class="status-label">Statut d'authentification:</span>
      <span class="status-value {isConnected ? 'connected' : 'not-connected'}">
        {isConnected ? '✓ Connecté' : '✗ Non connecté'}
      </span>
      {#if !isConnected}
        <p class="auth-info">
          Vous n'êtes pas connecté. Pour tester avec un utilisateur authentifié,
          <a href="/login">connectez-vous</a> d'abord, puis revenez sur cette page.
        </p>
      {/if}
    </div>

    <form on:submit|preventDefault={submitTestScore} class="test-form">
      <div class="form-grid">
        <div class="form-section">
          <h2>Informations de base</h2>

          <div class="form-group">
            <label for="name">Nom du joueur</label>
            <input type="text" id="name" bind:value={name} required />
            <p class="input-help">
              {#if isConnected}
                Vous êtes connecté, mais vous pouvez toujours spécifier un nom personnalisé.
              {:else}
                Nom qui apparaîtra dans le classement pour un utilisateur non connecté.
              {/if}
            </p>
          </div>

          <div class="form-group">
            <label for="score">Score</label>
            <input type="number" id="score" bind:value={score} min="1" max="10000" required />
            <p class="input-help">Le score qui sera enregistré et utilisé comme XP.</p>
          </div>

          <div class="form-group">
            <label for="duration">Durée (minutes)</label>
            <select id="duration" bind:value={duration} required>
              <option value="2">2 minutes</option>
              <option value="3">3 minutes</option>
              <option value="5">5 minutes</option>
            </select>
            <p class="input-help">Durée de la partie en minutes.</p>
          </div>

          <div class="form-group">
            <label for="level">Niveau</label>
            <select id="level" bind:value={level} required>
              <option value="adulte">Adulte</option>
              <option value="enfant">Enfant</option>
            </select>
            <p class="input-help">Le niveau de difficulté joué.</p>
          </div>
        </div>

        <div class="form-section">
          <h2>Statistiques de partie</h2>

          <div class="form-group">
            <label for="solvedCells">Cellules résolues</label>
            <input type="number" id="solvedCells" bind:value={solvedCells} min="1" max={totalPossibleCells} required />
            <p class="input-help">Nombre de multiplications résolues pendant la partie.</p>
          </div>

          <div class="form-group">
            <label for="totalCells">Total de cellules possibles</label>
            <input type="number" id="totalCells" bind:value={totalPossibleCells} min={solvedCells} required />
            <p class="input-help">Nombre total de cellules disponibles dans la grille.</p>
          </div>

          {#if level === 'enfant'}
            <div class="form-group tables-selection">
              <label>Tables sélectionnées</label>
              <div class="tables-grid">
                {#each Array(10) as _, i}
                  <label class="table-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(i + 1)}
                      on:change={(e) => handleTableChange(i + 1, e)}
                    />
                    <span>Table de {i + 1}</span>
                  </label>
                {/each}
              </div>
              <div class="tables-buttons">
                <button type="button" class="secondary-button" on:click={() => toggleAllTables(true)}>Tout sélectionner</button>
                <button type="button" class="secondary-button" on:click={() => toggleAllTables(false)}>Tout désélectionner</button>
              </div>
              <p class="input-help">Tables utilisées pendant la partie (niveau Enfant uniquement).</p>
            </div>
          {/if}
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="primary-button" disabled={loading}>
          {#if loading}
            <span class="spinner"></span> Envoi en cours...
          {:else}
            Simuler fin de partie
          {/if}
        </button>
        <button type="button" class="secondary-button" on:click={resetForm} disabled={loading}>
          Réinitialiser
        </button>
      </div>
    </form>

    {#if error}
      <div class="error-message">
        <h3>Erreur</h3>
        <p>{error}</p>
      </div>
    {/if}

    {#if successMessage}
      <div class="success-message">
        <h3>Succès</h3>
        <p>{successMessage}</p>
      </div>
    {/if}

    {#if response}
      <div class="response-container">
        <h3>Réponse du serveur</h3>

        <div class="response-tabs">
          <div class="tab active">Données JSON</div>
        </div>

        <pre class="response-json">{JSON.stringify(response, null, 2)}</pre>

        {#if response.progressUpdate}
          <div class="progress-update">
            <h4>Mise à jour de la progression</h4>
            <div class="progress-details">
              <div class="progress-item">
                <span class="label">XP totale:</span>
                <span class="value">{response.progressUpdate.returned_xp}</span>
              </div>
              <div class="progress-item">
                <span class="label">Niveau:</span>
                <span class="value">{response.progressUpdate.returned_level}</span>
              </div>
              <div class="progress-item">
                <span class="label">Série de jours:</span>
                <span class="value">{response.progressUpdate.returned_streak_days} jour(s)</span>
              </div>
              <div class="progress-item">
                <span class="label">Score total:</span>
                <span class="value">{response.progressUpdate.returned_total_xp}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>
  .test-page {
    max-width: 1000px;
    margin: 40px auto;
    padding: 30px;
  }

  h1 {
    color: var(--primary-dark);
    margin-bottom: 10px;
  }

  .subtitle {
    color: var(--text-secondary);
    margin-bottom: 30px;
  }

  .auth-status {
    background-color: var(--bg-secondary);
    padding: 15px;
    border-radius: var(--border-radius-md);
    margin-bottom: 30px;
  }

  .status-label {
    font-weight: bold;
    margin-right: 10px;
  }

  .status-value {
    font-weight: bold;
  }

  .connected {
    color: var(--success);
  }

  .not-connected {
    color: var(--secondary);
  }

  .auth-info {
    margin-top: 10px;
    font-size: 0.9rem;
    color: var(--text-light);
  }

  .test-form {
    margin-top: 20px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
  }

  .form-section {
    background-color: var(--bg-primary);
    padding: 20px;
    border-radius: var(--border-radius-md);
  }

  .form-section h2 {
    font-size: 1.2rem;
    margin-bottom: 20px;
    color: var(--primary);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .input-help {
    font-size: 0.8rem;
    color: var(--text-light);
    margin-top: 5px;
  }

  input, select {
    width: 100%;
    padding: 10px;
    border: 2px solid var(--bg-secondary);
    border-radius: var(--border-radius-md);
    background-color: white;
  }

  .tables-selection {
    margin-top: 20px;
  }

  .tables-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 15px;
  }

  .table-checkbox {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
  }

  .tables-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .form-actions {
    display: flex;
    gap: 15px;
    margin-top: 30px;
  }

  .primary-button {
    padding: 12px 20px;
    background-color: var(--primary);
    color: white;
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .secondary-button {
    padding: 12px 20px;
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    transition: all 0.2s;
  }

  .primary-button:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
  }

  .secondary-button:hover:not(:disabled) {
    background-color: var(--bg-primary);
    transform: translateY(-2px);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message, .success-message {
    margin-top: 30px;
    padding: 15px;
    border-radius: var(--border-radius-md);
  }

  .error-message {
    background-color: rgba(220, 53, 69, 0.1);
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .success-message {
    background-color: rgba(40, 167, 69, 0.1);
    border: 1px solid rgba(40, 167, 69, 0.3);
  }

  .error-message h3, .success-message h3 {
    margin-top: 0;
    margin-bottom: 10px;
  }

  .error-message h3 {
    color: #dc3545;
  }

  .success-message h3 {
    color: #28a745;
  }

  .response-container {
    margin-top: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: var(--border-radius-md);
    border: 1px solid #e9ecef;
  }

  .response-tabs {
    display: flex;
    margin-bottom: 15px;
  }

  .tab {
    padding: 8px 16px;
    background-color: #e9ecef;
    border-radius: var(--border-radius-md);
    font-size: 0.9rem;
    cursor: pointer;
  }

  .tab.active {
    background-color: var(--primary);
    color: white;
  }

  .response-json {
    background-color: #212529;
    color: #f8f9fa;
    padding: 15px;
    border-radius: var(--border-radius-md);
    overflow-x: auto;
    font-family: monospace;
    font-size: 0.9rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .progress-update {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .progress-update h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--primary);
  }

  .progress-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .progress-item {
    background-color: white;
    padding: 10px;
    border-radius: var(--border-radius-md);
    display: flex;
    flex-direction: column;
  }

  .progress-item .label {
    font-size: 0.8rem;
    color: var(--text-light);
  }

  .progress-item .value {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary-dark);
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .tables-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .progress-details {
      grid-template-columns: 1fr;
    }
  }
</style>