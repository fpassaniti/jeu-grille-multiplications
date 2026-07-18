// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import GameBoard from '../../lib/components/GameBoard.svelte';
import QuestionPanel from '../../lib/components/QuestionPanel.svelte';
import TableSelector from '../../lib/components/TableSelector.svelte';

function makeBoard() {
  return {
    grid: Array(10)
      .fill(0)
      .map((_, i) => Array(10).fill(0).map((_, j) => (i + 1) * (j + 1))),
    solvedCells: Array(10)
      .fill(0)
      .map(() => Array(10).fill(false)),
    selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  };
}

function tablesQuestion(row = 5, col = 5) {
  return {
    id: `tables:${row},${col}`,
    operands: [row, col],
    operator: '×',
    answer: row * col,
    difficulty: 1.5,
    timeAllowedSec: 10,
    meta: { row, col }
  };
}

describe('Composant GameBoard', () => {
  const defaultProps = {
    board: makeBoard(),
    question: tablesQuestion(),
    userAnswer: '',
    feedback: null,
    level: 'adulte',
    windowWidth: 1024,
    windowHeight: 768,
    onInput: vi.fn(),
    onSubmit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend la grille 10×10 avec ses en-têtes', () => {
    const { container } = render(GameBoard, { props: defaultProps });
    expect(container.querySelector('.grid')).not.toBeNull();
    // 100 cellules + 21 en-têtes (1 coin + 10 colonnes + 10 lignes)
    const cells = container.querySelectorAll('.grid-cell, .grid-header-cell');
    expect(cells.length).toBe(100 + 21);
  });

  it('place l’input dans la cellule courante (question.meta)', () => {
    const { container } = render(GameBoard, { props: defaultProps });
    const currentCell = container.querySelector('.grid-cell.current');
    expect(currentCell).not.toBeNull();
    expect(currentCell.querySelector('input')).not.toBeNull();
  });

  it('remonte la saisie via onInput', async () => {
    const onInput = vi.fn();
    const { container } = render(GameBoard, { props: { ...defaultProps, onInput } });
    const input = container.querySelector('.grid-cell.current input');
    await fireEvent.input(input, { target: { value: '25' } });
    expect(onInput).toHaveBeenCalledWith('25');
  });

  it('affiche les cellules résolues', () => {
    const board = makeBoard();
    board.solvedCells[2][3] = true;
    const { container } = render(GameBoard, { props: { ...defaultProps, board } });
    const solved = container.querySelector('.grid-cell.solved .solved-result');
    expect(solved).not.toBeNull();
    expect(solved.textContent).toBe('12'); // (2+1)×(3+1)
  });

  it('grise les cellules hors tables sélectionnées en mode enfant', () => {
    const board = { ...makeBoard(), selectedNumbers: [3] };
    const { container } = render(GameBoard, {
      props: { ...defaultProps, board, level: 'enfant', question: tablesQuestion(3, 7) }
    });
    expect(container.querySelectorAll('.grid-cell.inactive').length).toBe(81); // 100 − 19
  });
});

describe('Composant QuestionPanel', () => {
  const baseProps = {
    userAnswer: '',
    feedback: null,
    questionTimer: 10,
    timeAllowed: 20,
    solvedHistory: [],
    isMobile: false,
    onInput: vi.fn(),
    onSubmit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('présentation posée en colonnes pour une addition multi-chiffres', () => {
    const question = {
      id: 'addition:38+45',
      operands: [38, 45],
      operator: '+',
      answer: 83,
      difficulty: 1.2,
      timeAllowedSec: 25,
      meta: { tier: 'A3' }
    };
    const { container } = render(QuestionPanel, { props: { ...baseProps, question } });
    expect(container.querySelector('.posed')).not.toBeNull();
    expect(container.querySelector('.question-inline')).toBeNull();
    const operands = [...container.querySelectorAll('.posed-operand')].map((n) => n.textContent);
    expect(operands).toEqual(['38', '45']);
    const operators = [...container.querySelectorAll('.posed-operator')].map((n) =>
      n.textContent.trim()
    );
    expect(operators).toContain('+');
  });

  it('présentation inline pour une table (tables mobile)', () => {
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(6, 7), isMobile: true }
    });
    expect(container.querySelector('.question-inline')).not.toBeNull();
    expect(container.querySelector('.question-inline').textContent).toContain('6 × 7');
    expect(container.querySelector('.posed')).toBeNull();
  });

  it('affiche le pavé numérique sur mobile uniquement', () => {
    const question = tablesQuestion();
    const mobile = render(QuestionPanel, { props: { ...baseProps, question, isMobile: true } });
    expect(mobile.container.querySelector('.keypad')).not.toBeNull();
    const desktop = render(QuestionPanel, { props: { ...baseProps, question, isMobile: false } });
    expect(desktop.container.querySelector('.keypad')).toBeNull();
  });

  it('le pavé numérique concatène les chiffres via onInput', async () => {
    const onInput = vi.fn();
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), userAnswer: '2', isMobile: true, onInput }
    });
    const buttons = [...container.querySelectorAll('.keypad .key')];
    const five = buttons.find((b) => b.textContent.trim() === '5');
    await fireEvent.pointerDown(five);
    expect(onInput).toHaveBeenCalledWith('25');
  });

  it('affiche l’historique des réponses justes avec les points', () => {
    const solvedHistory = [
      { operands: [3, 7], operator: '×', answer: 21, points: 12 },
      { operands: [38, 45], operator: '+', answer: 83, points: 20 }
    ];
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), solvedHistory }
    });
    const items = container.querySelectorAll('.solved-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('3 × 7 = 21');
    expect(items[1].textContent).toContain('38 + 45 = 83');
  });
});

describe('Composant TableSelector', () => {
  it('affiche la sélection et remonte les toggles', async () => {
    const onToggle = vi.fn();
    const onSelectAll = vi.fn();
    const { container } = render(TableSelector, {
      props: { selectedNumbers: [2, 5], onToggle, onSelectAll }
    });

    expect(container.querySelectorAll('.table-checkbox.selected').length).toBe(2);

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    await fireEvent.change(checkboxes[6]); // table 7
    expect(onToggle).toHaveBeenCalledWith(7);

    const buttons = container.querySelectorAll('.selection-actions button');
    await fireEvent.click(buttons[0]);
    expect(onSelectAll).toHaveBeenCalledWith(true);
  });
});
