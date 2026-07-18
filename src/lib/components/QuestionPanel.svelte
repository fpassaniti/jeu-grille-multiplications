<!-- src/lib/components/QuestionPanel.svelte -->
<!-- Généralise MobileGame : question générique (posée en colonnes pour +/− multi-chiffres) -->
<script>
  import { tick } from 'svelte';
  import NumericKeypad from './NumericKeypad.svelte';
  import { _ } from '$lib/utils/i18n';

  // Props
  export let question = null;
  export let userAnswer = '';
  export let feedback = null; // null | 'correct' | 'incorrect' | 'timeout'
  export let questionTimer = 0;
  export let timeAllowed = 0;
  export let solvedHistory = [];
  export let isMobile = false;
  export let onInput = () => {};
  export let onSubmit = () => {};

  let inputEl;

  // Présentation posée en colonnes (technique opératoire CE1/CE2)
  $: isPosed =
    question &&
    (question.operator === '+' || question.operator === '−') &&
    Math.max(...question.operands) >= 10;

  $: answerWidth = question ? String(question.answer).length : 2;

  // Refocus au changement de question (desktop, clavier physique)
  $: if (question?.id && !isMobile) {
    tick().then(() => inputEl?.focus());
  }

  function handleInput(event) {
    onInput(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }
</script>

<div class="question-panel">
  <div class="question-card card">
    <div class="question-icon">✨</div>

    {#if question}
      {#if isPosed}
        <div class="posed" class:correct={feedback === 'correct'} class:incorrect={feedback === 'incorrect' || feedback === 'timeout'}>
          {#each question.operands as operand, i}
            <div class="posed-row">
              <span class="posed-operator">{i === question.operands.length - 1 ? question.operator : ''}</span>
              <span class="posed-operand">{operand}</span>
            </div>
          {/each}
          <div class="posed-line"></div>
          <form on:submit={handleSubmit} class="posed-row posed-answer-row">
            <span class="posed-operator"></span>
            <input
              bind:this={inputEl}
              type="text"
              class="posed-input"
              style="width: {Math.max(answerWidth + 1, 3)}ch"
              value={userAnswer}
              on:input={handleInput}
              inputmode={isMobile ? 'none' : 'numeric'}
              readonly={isMobile}
              pattern="[0-9]*"
              autocomplete="off"
              class:correct={feedback === 'correct'}
              class:incorrect={feedback === 'incorrect' || feedback === 'timeout'}
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
            inputmode={isMobile ? 'none' : 'numeric'}
            readonly={isMobile}
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

    {#if isMobile}
      <div class="keypad-wrapper">
        <NumericKeypad
          onDigit={(d) => onInput(userAnswer + d)}
          onErase={() => onInput(userAnswer.slice(0, -1))}
          onValidate={onSubmit}
        />
      </div>
    {:else}
      <button class="validate-button" on:click={onSubmit}>
        {_('game.validate')}
      </button>
    {/if}
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

  .posed-input {
    font-family: inherit;
    font-size: inherit;
    font-weight: bold;
    text-align: right;
    border: 3px solid var(--primary-light);
    border-radius: var(--border-radius-sm);
    padding: 2px 6px;
    box-sizing: content-box;
  }

  input.correct {
    border-color: var(--success);
    background-color: rgba(67, 215, 135, 0.1);
  }

  input.incorrect {
    border-color: var(--secondary);
    background-color: rgba(255, 107, 107, 0.1);
  }

  .posed.correct .posed-line {
    border-color: var(--success);
  }

  .posed.incorrect .posed-line {
    border-color: var(--secondary);
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

  .keypad-wrapper {
    margin-top: 18px;
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
</style>
