// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tick } from 'svelte';
import { render, fireEvent } from '@testing-library/svelte';
import QuestionPanel from '../../lib/components/QuestionPanel.svelte';
import TableSelector from '../../lib/components/TableSelector.svelte';

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

describe('Composant QuestionPanel', () => {
  const baseProps = {
    userAnswer: '',
    feedback: null,
    questionTimer: 10,
    timeAllowed: 20,
    solvedHistory: [],
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
      meta: { tier: 'A3' },
      posed: true,
      stages: [{ key: 'final', value: 83, digits: 2, shift: 0 }]
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
    // Une case par chiffre de la réponse (83 → 2 cases), pas d'input texte visible
    expect(container.querySelectorAll('.digit-box').length).toBe(2);
  });

  it("cliquer sur la zone posée redonne le focus à l'input réel (desktop)", async () => {
    const question = {
      id: 'addition:38+45',
      operands: [38, 45],
      operator: '+',
      answer: 83,
      difficulty: 1.2,
      timeAllowedSec: 25,
      meta: { tier: 'A3' },
      posed: true,
      stages: [{ key: 'final', value: 83, digits: 2, shift: 0 }]
    };
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question }
    });
    const input = container.querySelector('.stage-input');
    expect(input).not.toBeNull();
    input.blur();
    expect(document.activeElement).not.toBe(input);
    await fireEvent.click(container.querySelector('.posed'));
    expect(document.activeElement).toBe(input);
  });

  it('saisie clavier sur la ligne posée remonte via onInput', async () => {
    const onInput = vi.fn();
    const question = {
      id: 'addition:38+45',
      operands: [38, 45],
      operator: '+',
      answer: 83,
      difficulty: 1.2,
      timeAllowedSec: 25,
      meta: { tier: 'A3' },
      posed: true,
      stages: [{ key: 'final', value: 83, digits: 2, shift: 0 }]
    };
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question, onInput }
    });
    const input = container.querySelector('.stage-input');
    await fireEvent.input(input, { target: { value: '8' } });
    expect(onInput).toHaveBeenCalledWith('8');
  });

  it('touche chiffre non-shiftée (AZERTY) au keydown est reconnue via event.code', async () => {
    const onInput = vi.fn();
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), onInput }
    });
    const input = container.querySelector('input');
    const result = await fireEvent.keyDown(input, { code: 'Digit5', key: '(' });
    expect(onInput).toHaveBeenCalledWith('5');
    expect(result).toBe(false); // preventDefault() appelé
  });

  it('pavé numérique physique non affecté par la normalisation clavier', async () => {
    const onInput = vi.fn();
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), onInput }
    });
    const input = container.querySelector('input');
    const result = await fireEvent.keyDown(input, { code: 'Numpad5', key: '5' });
    expect(onInput).not.toHaveBeenCalled();
    expect(result).toBe(true); // pas de preventDefault, flux natif inchangé
  });

  it('clavier virtuel mobile (pas de code exploitable) non intercepté', async () => {
    const onInput = vi.fn();
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), onInput }
    });
    const input = container.querySelector('input');
    const result = await fireEvent.keyDown(input, { code: '', key: '5' });
    expect(onInput).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('raccourcis Ctrl/Meta/Alt+chiffre non interceptés', async () => {
    const onInput = vi.fn();
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), onInput }
    });
    const input = container.querySelector('input');
    await fireEvent.keyDown(input, { code: 'Digit1', ctrlKey: true });
    await fireEvent.keyDown(input, { code: 'Digit1', metaKey: true });
    await fireEvent.keyDown(input, { code: 'Digit1', altKey: true });
    expect(onInput).not.toHaveBeenCalled();
  });

  it('composition IME en cours non interceptée', async () => {
    const onInput = vi.fn();
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(), onInput }
    });
    const input = container.querySelector('input');
    await fireEvent.keyDown(input, { code: 'Digit1', isComposing: true });
    expect(onInput).not.toHaveBeenCalled();
  });

  it('multiplication posée n\'affiche pas de cases pour ×10 (règle mentale, pas posée)', () => {
    const question = {
      id: 'multiplication:23x10',
      operands: [23, 10],
      operator: '×',
      answer: 230,
      difficulty: 0.6,
      timeAllowedSec: 6,
      meta: { tier: 'M1' },
      stages: [{ key: 'final', value: 230, digits: 3, shift: 0 }]
    };
    const { container } = render(QuestionPanel, { props: { ...baseProps, question } });
    expect(container.querySelector('.question-inline')).not.toBeNull();
    expect(container.querySelector('.posed')).toBeNull();
  });

  it('multiplication posée à produits partiels (M6) : saisie droite→gauche, décalage', () => {
    const question = {
      id: 'multiplication:23x47',
      operands: [23, 47],
      operator: '×',
      answer: 1081,
      difficulty: 3.0,
      timeAllowedSec: 40,
      meta: { tier: 'M6', posed: true, partials: [{ value: 161, shift: 0 }, { value: 92, shift: 1 }] },
      posed: true,
      stages: [
        { key: 'partial0', value: 161, digits: 3, shift: 0 },
        { key: 'partial1', value: 92, digits: 2, shift: 1 },
        { key: 'final', value: 1081, digits: 4, shift: 0 }
      ]
    };
    // Ligne 0 (161) déjà entièrement validée, ligne 1 (92) : 1 chiffre verrouillé
    // (les unités, depuis la droite), la case des dizaines est active.
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question, stageIndex: 1, digitIndex: 1 }
    });
    expect(container.querySelector('.posed')).not.toBeNull();
    const rows = container.querySelectorAll('.stage-row');
    expect(rows.length).toBe(3);

    // Ligne 0 verrouillée (161) : 3 cases correctes, affichées dans l'ordre normal d'écriture
    const row0Boxes = rows[0].querySelectorAll('.digit-box');
    expect(rows[0].querySelectorAll('.digit-box.correct').length).toBe(3);
    expect([...row0Boxes].map((b) => b.textContent.trim())).toEqual(['1', '6', '1']);

    // Ligne 1 active (92, digitIndex=1) : case de droite (unités, '2') verrouillée,
    // case de gauche (dizaines) active — pas encore remplie — + 1 case "spacer" de décalage.
    const row1Boxes = rows[1].querySelectorAll('.digit-box');
    expect(row1Boxes.length).toBe(3); // 2 chiffres + 1 spacer
    expect(row1Boxes[1].className).toContain('correct'); // unités verrouillées
    expect(row1Boxes[1].textContent.trim()).toBe('2');
    expect(row1Boxes[0].className).toContain('cursor'); // dizaines : case active
    expect(rows[1].querySelectorAll('.digit-box.spacer').length).toBe(1);

    // Ligne 2 (somme) pas encore atteinte : cases vides et non validées
    expect(rows[2].querySelectorAll('.digit-box.pending').length).toBe(4);
  });

  it('présentation inline pour une table', () => {
    const { container } = render(QuestionPanel, {
      props: { ...baseProps, question: tablesQuestion(6, 7) }
    });
    expect(container.querySelector('.question-inline')).not.toBeNull();
    expect(container.querySelector('.question-inline').textContent).toContain('6 × 7');
    expect(container.querySelector('.posed')).toBeNull();
  });

  it('utilise le clavier numérique natif (inputmode), pas de pavé personnalisé', () => {
    const question = tablesQuestion();
    const { container } = render(QuestionPanel, { props: { ...baseProps, question } });
    const input = container.querySelector('input');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.hasAttribute('readonly')).toBe(false);
    expect(container.querySelector('.keypad')).toBeNull();
  });

  it('redonne le focus à l’input à chaque nouvelle question (bug régression : focus perdu en mode responsive)', async () => {
    const question = tablesQuestion(3, 4);
    const { container } = render(QuestionPanel, { props: { ...baseProps, question } });
    const input = container.querySelector('input');
    await tick();
    expect(document.activeElement).toBe(input);
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
