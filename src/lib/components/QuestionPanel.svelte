<!-- src/lib/components/QuestionPanel.svelte -->
<!-- Généralise MobileGame : question générique (posée en colonnes pour +/−/× multi-chiffres) -->
<script>
  import { tick } from 'svelte';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let question = null;
  export let userAnswer = '';
  export let stageIndex = 0;
  export let digitIndex = 0;
  export let feedback = null; // null | 'correct' | 'incorrect' | 'timeout'
  export let questionTimer = 0;
  export let timeAllowed = 0;
  export let solvedHistory = [];
  export let onInput = () => {};
  export let onSubmit = () => {};

  let inputEl;

  // Présentation posée en colonnes (technique opératoire CE1/CE2), calculée
  // côté génération (question.posed — voir computePosed dans generator-utils.js)
  // pour que l'engine et l'UI s'accordent sur la même mécanique de saisie.
  $: isPosed = question?.posed === true;

  // Repli identique à GameEngine#stages() : une question sans `stages` explicite
  // (mode non générique, fixture de test) reste posable avec une seule étape.
  $: stages = question
    ? (question.stages ?? [
        { key: 'final', value: question.answer, digits: String(question.answer).length, shift: 0 }
      ])
    : [];

  // Refocus au changement de question ou d'étape : l'input réel reste le même
  // nœud DOM d'une étape à l'autre, mais on reforce le focus par sécurité
  // (ex: après un clic ailleurs qui l'aurait perdu). Le clavier natif (inputmode
  // numeric) rend ce comportement pertinent aussi bien au clavier physique
  // qu'au clavier virtuel mobile.
  $: if (question?.id && stageIndex >= 0) {
    tick().then(() => inputEl?.focus());
  }

  function handleInput(event) {
    onInput(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  // Les cases ne sont qu'un reflet visuel de l'input réel (masqué) : cliquer
  // n'importe où sur la zone posée doit lui rendre le focus.
  function focusInput() {
    inputEl?.focus();
  }
</script>

<div class="question-panel">
  <div class="question-card card">
    <div class="question-icon">✨</div>

    {#if question}
      {#if isPosed}
        <div
          class="posed"
          class:correct={feedback === 'correct'}
          class:incorrect={feedback === 'incorrect' || feedback === 'timeout'}
          on:click={focusInput}
        >
          {#each question.operands as operand, i}
            <div class="posed-row">
              <span class="posed-operator"
                >{i === question.operands.length - 1 ? question.operator : ''}</span
              >
              <span class="posed-operand">{operand}</span>
            </div>
          {/each}
          <div class="posed-line"></div>

          {#each stages as stage, i}
            {@const rowState = i < stageIndex ? 'locked' : i === stageIndex ? 'active' : 'pending'}
            {#if stages.length > 1 && i === stages.length - 1}
              <div class="posed-line"></div>
            {/if}
            <div class="posed-row stage-row">
              <span class="posed-operator"></span>
              <div class="digit-boxes">
                {#each Array.from({ length: stage.digits }) as _, j}
                  {@const p = stage.digits - 1 - j}
                  {@const isLocked = rowState === 'locked' || (rowState === 'active' && p < digitIndex)}
                  {@const isActive = rowState === 'active' && p === digitIndex}
                  {@const digit = isLocked
                    ? String(Math.floor(stage.value / 10 ** p) % 10)
                    : isActive
                      ? userAnswer
                      : ''}
                  <span
                    class="digit-box"
                    class:pending={!isLocked && !isActive}
                    class:cursor={isActive && feedback !== 'incorrect'}
                    class:correct={isLocked}
                    class:incorrect={isActive && feedback === 'incorrect'}
                  >
                    {digit}
                  </span>
                {/each}
                {#each Array.from({ length: stage.shift }) as _}
                  <span class="digit-box spacer"></span>
                {/each}
              </div>
            </div>
          {/each}

          <form on:submit={handleSubmit} class="stage-input-form">
            <input
              bind:this={inputEl}
              type="text"
              class="stage-input"
              value={userAnswer}
              on:input={handleInput}
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="off"
              aria-label={_('game.answerPlaceholder')}
            />
          </form>
        </div>
      {:else}
        <div class="question-inline">
          {question.operands.join(` ${question.operator} `)} = ?
        </div>
        <form on:submit={handleSubmit} class="inline-form">
          <input
            bind:this={inputEl}
            type="text"
            value={userAnswer}
            on:input={handleInput}
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            class:correct={feedback === 'correct'}
            class:incorrect={feedback === 'incorrect' || feedback === 'timeout'}
            placeholder={_('game.answerPlaceholder')}
          />
        </form>
      {/if}

      {#if feedback === 'timeout'}
        <p class="timeout-answer">⏰ {question.operands.join(` ${question.operator} `)} = {question.answer}</p>
      {/if}

      <div class="question-timer-container">
        <div
          class="question-timer"
          style="width: {timeAllowed > 0 ? (questionTimer / timeAllowed) * 100 : 0}%"
        ></div>
      </div>
    {/if}

    <button class="validate-button" on:click={onSubmit}>
      {_('game.validate')}
    </button>
  </div>

  <div class="solved-info card">
    <h3><span class="emoji">🎯</span> {_('game.recentlySolved')}</h3>
    <div class="solved-list">
      {#if solvedHistory.length === 0}
        <p class="no-solved">{_('game.noSolved')}</p>
      {:else}
        <div class="solved-grid">
          {#each solvedHistory as solved}
            <div class="solved-item">
              <span class="solved-operation"
                >{solved.operands.join(` ${solved.operator} `)} = {solved.answer}</span
              >
              <div class="points-earned">{_('game.pointsEarned', { points: solved.points })}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .question-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .question-card {
    width: 100%;
    max-width: 360px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .question-icon {
    font-size: 2rem;
    position: absolute;
    top: 10px;
    right: 15px;
    opacity: 0.3;
    animation: spin 10s linear infinite;
  }

  /* Présentation inline (tables, n × 10…) */
  .question-inline {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 24px;
    color: var(--primary-dark);
    animation: pulse 2s infinite;
  }

  .inline-form {
    margin-bottom: 20px;
  }

  .inline-form input {
    width: 100%;
    padding: 15px;
    font-size: 1.5rem;
    text-align: center;
    border: 3px solid var(--primary-light);
    border-radius: var(--border-radius-md);
    box-sizing: border-box;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
  }

  /* Présentation posée en colonnes */
  .posed {
    display: inline-block;
    font-family: 'Courier New', Courier, monospace;
    font-variant-numeric: tabular-nums;
    font-size: 2.2rem;
    font-weight: bold;
    color: var(--primary-dark);
    text-align: right;
    margin-bottom: 15px;
    cursor: text;
  }

  .posed-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    line-height: 1.3;
  }

  .posed-operator {
    min-width: 1.2ch;
    text-align: left;
    color: var(--secondary);
  }

  .posed-operand {
    white-space: pre;
  }

  .posed-line {
    border-top: 4px solid var(--primary-dark);
    margin: 6px 0;
  }

  .posed.correct .posed-line {
    border-color: var(--success);
  }

  .posed.incorrect .posed-line {
    border-color: var(--secondary);
  }

  /* Cases de saisie chiffre par chiffre (réponse + produits partiels) */
  .stage-row {
    margin: 4px 0;
  }

  .digit-boxes {
    display: flex;
    gap: 4px;
  }

  .digit-box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.3em;
    height: 1.3em;
    font-family: inherit;
    font-size: 0.9em;
    font-weight: bold;
    border: 3px solid var(--primary-light);
    border-radius: var(--border-radius-sm);
    box-sizing: border-box;
    background: white;
    cursor: text;
  }

  .digit-box.pending {
    border: 3px dashed var(--bg-secondary);
    background: transparent;
    cursor: default;
  }

  .digit-box.cursor {
    border-color: var(--primary-dark);
  }

  .digit-box.cursor::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 55%;
    background: var(--primary-dark);
    animation: blink 1s step-end infinite;
  }

  .digit-box.correct {
    border-color: var(--success);
    background-color: rgba(67, 215, 135, 0.15);
  }

  .digit-box.incorrect {
    border-color: var(--secondary);
    background-color: rgba(255, 107, 107, 0.15);
  }

  .digit-box.spacer {
    border: none;
    background: transparent;
  }

  /* Input réel : capte clavier physique / pavé mobile, invisible (les cases
     ci-dessus en sont le reflet visuel — évite de réinventer la gestion du
     focus multi-input). Le form n'a pas de position propre : sans autre
     enfant que cet input absolu, il se réduit naturellement à hauteur 0. */
  .stage-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    border: 0;
    opacity: 0;
  }

  input.correct {
    border-color: var(--success);
    background-color: rgba(67, 215, 135, 0.1);
  }

  input.incorrect {
    border-color: var(--secondary);
    background-color: rgba(255, 107, 107, 0.1);
  }

  .timeout-answer {
    color: var(--secondary);
    font-weight: bold;
    margin: 5px 0;
  }

  .question-timer-container {
    height: 10px;
    background-color: var(--bg-secondary);
    border-radius: 5px;
    margin-top: 15px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .question-timer {
    height: 100%;
    background-color: var(--secondary);
    transition: width 0.1s linear;
  }

  .validate-button {
    margin-top: 15px;
    padding: 10px 30px;
    font-size: 1.1rem;
    background-color: var(--success);
    color: white;
    box-shadow: 0 4px 0 var(--success-dark);
  }

  .solved-info {
    width: 100%;
    max-width: 400px;
    padding: 20px;
  }

  .solved-info h3 {
    margin-top: 0;
    text-align: center;
  }

  .emoji {
    margin-right: 5px;
  }

  .solved-list {
    max-height: 250px;
    overflow-y: auto;
    padding: 5px;
  }

  .no-solved {
    text-align: center;
    color: var(--text-light);
    font-style: italic;
    padding: 15px 0;
  }

  .solved-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .solved-item {
    background-color: var(--success-light);
    padding: 12px;
    border-radius: var(--border-radius-md);
    font-size: 1rem;
    color: var(--success-dark);
    min-width: 120px;
    text-align: center;
    box-shadow: 0 3px 0 var(--success-dark);
    position: relative;
    overflow: hidden;
  }

  .solved-operation {
    font-weight: bold;
  }

  .points-earned {
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--success-dark);
    margin-top: 5px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    padding: 2px 8px;
    display: inline-block;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }
</style>
