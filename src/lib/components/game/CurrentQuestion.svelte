<!-- src/lib/components/game/CurrentQuestion.svelte -->
<script>
  import { _ } from '$lib/utils/i18n';

  // Props
  export let question = null;
  export let questionTimer = 0;
  export let timeAllowed = 0;
</script>

{#if question}
  <div class="current-question">
    <span class="emoji">🎯</span> {_('play.currentQuestionLabel')}
    <span class="question-text">{question.operands.join(` ${question.operator} `)}</span>
    <div class="question-timer-container">
      <div
        class="question-timer"
        style="width: {timeAllowed > 0 ? (questionTimer / timeAllowed) * 100 : 0}%"
      ></div>
    </div>
  </div>
{/if}

<style>
  .current-question {
    text-align: center;
    margin: 5px 0 3px;
    font-size: 1rem;
    font-weight: bold;
    color: var(--primary-dark);
    padding: 5px;
  }

  .question-text {
    font-size: 1.5rem;
    color: #4d57ff;
  }

  .question-timer-container {
    height: 6px;
    background-color: #f5f5f5;
    border-radius: 3px;
    margin-top: 5px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .question-timer {
    height: 100%;
    background-color: var(--secondary);
    transition: width 0.1s linear;
  }

  .emoji {
    font-size: 1.2em;
    margin-right: 5px;
    display: inline-block;
  }
</style>
