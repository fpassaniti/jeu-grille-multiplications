import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import GameBoard from '../../lib/components/GameBoard.svelte';
import MobileGame from '../../lib/components/MobileGame.svelte';
import TableSelector from '../../lib/components/TableSelector.svelte';
import Leaderboard from '../../lib/components/Leaderboard.svelte';

/**
 * Tests pour les composants du jeu
 *
 * Pour exécuter ces tests:
 * 1. Installer les dépendances: npm install --save-dev @testing-library/svelte
 * 2. Lancer les tests: npm run test
 */

// Tests pour le composant GameBoard
describe('Composant GameBoard', () => {
  // Props par défaut pour les tests
  const defaultProps = {
    grid: Array(10).fill(0).map((_, i) => Array(10).fill(0).map((_, j) => (i + 1) * (j + 1))),
    solvedCells: Array(10).fill(0).map(() => Array(10).fill(false)),
    currentRow: 5,
    currentCol: 5,
    userAnswer: '',
    handleAnswerChange: vi.fn(),
    handleSubmit: vi.fn(),
    inputRef: { current: null },
    lastAnswerCorrect: null,
    isSelectedTableCell: () => true,
    level: 'adulte',
    getSelectedTableNumbers: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    windowWidth: 1024,
    windowHeight: 768
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait rendre correctement la grille de jeu', () => {
    const { container } = render(GameBoard, { props: defaultProps });

    // Vérifier que la grille est rendue
    expect(container.querySelector('.grid')).not.toBeNull();

    // Vérifier le nombre de cellules (10x10 + 11 entêtes de ligne + 11 entêtes de colonne)
    const cells = container.querySelectorAll('.grid-cell, .grid-header-cell');
    expect(cells.length).toBe(10 * 10 + 11 + 11);

    // Vérifier que la cellule courante est correctement marquée
    const currentCell = container.querySelector('.grid-cell.current');
    expect(currentCell).not.toBeNull();

    // Vérifier que le champ de saisie est présent dans la cellule courante
    expect(currentCell.querySelector('input[type="number"]')).not.toBeNull();
  });

  it('devrait appeler handleSubmit lors de la soumission du formulaire', async () => {
    const { container } = render(GameBoard, { props: defaultProps });

    // Trouver le formulaire
    const form = container.querySelector('.cell-form');

    // Simuler une soumission de formulaire
    await fireEvent.submit(form);

    // Vérifier que handleSubmit a été appelé
    expect(defaultProps.handleSubmit).toHaveBeenCalled();
  });

  it('devrait appeler handleAnswerChange lors de la modification de l\'entrée', async () => {
    const { container } = render(GameBoard, { props: defaultProps });

    // Trouver le champ de saisie
    const input = container.querySelector('input[type="number"]');

    // Simuler une modification de l'entrée
    await fireEvent.input(input, { target: { value: '25' } });

    // Vérifier que handleAnswerChange a été appelé
    expect(defaultProps.handleAnswerChange).toHaveBeenCalled();
  });

  it('devrait afficher correctement les cellules résolues', async () => {
    // Modifier les props pour avoir quelques cellules résolues
    const solvedCells = Array(10).fill(0).map(() => Array(10).fill(false));
    solvedCells[2][3] = true; // La cellule 3x4 est résolue

    const props = {
      ...defaultProps,
      solvedCells
    };

    const { container } = render(GameBoard, { props });

    // Vérifier que la cellule résolue est correctement marquée
    const solvedCell = container.querySelectorAll('.grid-cell.solved');
    expect(solvedCell.length).toBe(1);

    // Vérifier que le résultat est affiché dans la cellule résolue
    expect(solvedCell[0].textContent).toContain('12'); // 3x4 = 12
  });

  it('devrait gérer correctement les classes pour les réponses correctes/incorrectes', async () => {
    // Tester avec une réponse correcte
    const propsCorrect = {
      ...defaultProps,
      lastAnswerCorrect: true
    };

    const { container: containerCorrect } = render(GameBoard, { props: propsCorrect });
    expect(containerCorrect.querySelector('input.correct')).not.toBeNull();

    // Tester avec une réponse incorrecte
    const propsIncorrect = {
      ...defaultProps,
      lastAnswerCorrect: false
    };

    const { container: containerIncorrect } = render(GameBoard, { props: propsIncorrect });
    expect(containerIncorrect.querySelector('input.incorrect')).not.toBeNull();
  });
});

// Tests pour le composant MobileGame
describe('Composant MobileGame', () => {
  const defaultProps = {
    currentRow: 5,
    currentCol: 5,
    userAnswer: '',
    handleAnswerChange: vi.fn(),
    handleSubmit: vi.fn(),
    inputRef: { current: null },
    lastAnswerCorrect: null,
    cellTimer: 8,
    maxCellTimer: 10,
    lastSolvedMultiplications: [
      { row: 3, col: 4, result: 12, points: 10 },
      { row: 7, col: 6, result: 42, points: 20 }
    ]
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait rendre correctement la vue mobile du jeu', () => {
    const { container } = render(MobileGame, { props: defaultProps });

    // Vérifier que la vue mobile est rendue
    expect(container.querySelector('.mobile-game')).not.toBeNull();

    // Vérifier que la question de multiplication est affichée
    expect(container.querySelector('.multiplication-question').textContent).toContain('5 × 5');

    // Vérifier que le champ de saisie est présent
    expect(container.querySelector('input[type="number"]')).not.toBeNull();

    // Vérifier que le timer est présent
    expect(container.querySelector('.cell-timer')).not.toBeNull();

    // Vérifier que les multiplications résolues sont affichées
    expect(container.querySelector('.solved-list')).not.toBeNull();
    expect(container.querySelectorAll('.solved-item').length).toBe(2);
  });

  it('devrait appeler handleSubmit lors de la soumission du formulaire', async () => {
    const { container } = render(MobileGame, { props: defaultProps });

    // Trouver le formulaire
    const form = container.querySelector('.mobile-form');

    // Simuler une soumission de formulaire
    await fireEvent.submit(form);

    // Vérifier que handleSubmit a été appelé
    expect(defaultProps.handleSubmit).toHaveBeenCalled();
  });

  it('devrait afficher un message si aucune multiplication n\'a été résolue', () => {
    const props = {
      ...defaultProps,
      lastSolvedMultiplications: []
    };

    const { container } = render(MobileGame, { props });

    // Vérifier que le message "Aucune multiplication résolue" est affiché
    expect(container.querySelector('.no-solved')).not.toBeNull();
    expect(container.querySelector('.no-solved').textContent).toContain('Aucune multiplication résolue');
  });

  it('devrait afficher le timer avec le pourcentage correct', () => {
    const props = {
      ...defaultProps,
      cellTimer: 5,
      maxCellTimer: 10
    };

    const { container } = render(MobileGame, { props });

    // Vérifier que le timer a un style avec une largeur de 50%
    const timer = container.querySelector('.cell-timer');
    expect(timer.style.width).toBe('50%');
  });
});

// Tests pour le composant TableSelector
describe('Composant TableSelector', () => {
  // Mock du store à injecter
  vi.mock('svelte/store', () => ({
    writable: vi.fn(() => ({
      subscribe: vi.fn(() => () => {}),
      set: vi.fn(),
      update: vi.fn()
    })),
    derived: vi.fn(() => ({
      subscribe: vi.fn(() => () => {})
    }))
  }));

  // Mock du store gameStore
  vi.mock('$lib/stores/gameStore', () => ({
    selectedTables: {
      subscribe: vi.fn(fn => {
        fn(Array(10).fill(true));
        return () => {};
      })
    },
    selectedTablesCount: {
      subscribe: vi.fn(fn => {
        fn(10);
        return () => {};
      })
    }
  }));

  const defaultProps = {
    toggleTable: vi.fn(),
    selectAllTables: vi.fn(),
    selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait rendre correctement le sélecteur de tables', () => {
    const { container } = render(TableSelector, { props: defaultProps });

    // Vérifier que le sélecteur est rendu
    expect(container.querySelector('.table-selector')).not.toBeNull();

    // Vérifier que toutes les tables sont affichées
    expect(container.querySelectorAll('.table-checkbox').length).toBe(10);

    // Vérifier que les boutons "Tout sélectionner/désélectionner" sont présents
    expect(container.querySelector('button').textContent).toContain('Tout sélectionner');
  });

  it('devrait appeler toggleTable lors du clic sur une case à cocher', async () => {
    const { container } = render(TableSelector, { props: defaultProps });

    // Trouver la première case à cocher
    const checkbox = container.querySelector('.table-checkbox input');

    // Simuler un clic sur la case à cocher
    await fireEvent.change(checkbox);

    // Vérifier que toggleTable a été appelé avec l'index 0
    expect(defaultProps.toggleTable).toHaveBeenCalledWith(0);
  });

  it('devrait appeler selectAllTables lors du clic sur les boutons correspondants', async () => {
    const { container } = render(TableSelector, { props: defaultProps });

    // Trouver les boutons
    const buttons = container.querySelectorAll('.selection-actions button');

    // Simuler un clic sur "Tout sélectionner"
    await fireEvent.click(buttons[0]);
    expect(defaultProps.selectAllTables).toHaveBeenCalledWith(true);

    // Simuler un clic sur "Tout désélectionner"
    await fireEvent.click(buttons[1]);
    expect(defaultProps.selectAllTables).toHaveBeenCalledWith(false);
  });

  it('devrait afficher les tables sélectionnées', () => {
    const { container } = render(TableSelector, { props: defaultProps });

    // Vérifier que le texte des tables sélectionnées est affiché
    const selectionInfo = container.querySelector('.selection-info');
    expect(selectionInfo.textContent).toContain('Tables sélectionnées: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  });

  it('devrait afficher un message si aucune table n\'est sélectionnée', () => {
    const props = {
      ...defaultProps,
      selectedNumbers: []
    };

    const { container } = render(TableSelector, { props });

    // Vérifier que le message est affiché
    const selectionInfo = container.querySelector('.selection-info');
    expect(selectionInfo.textContent).toContain('Veuillez sélectionner au moins une table');
  });
});

// Tests pour le composant Leaderboard
describe('Composant Leaderboard', () => {
  const mockLeaderboard = [
    { id: '1', name: 'Joueur 1', score: 500, duration: 5, level: 'adulte', date: '2023-01-01T12:00:00Z' },
    { id: '2', name: 'Joueur 2', score: 450, duration: 5, level: 'adulte', date: '2023-01-02T12:00:00Z' },
    { id: '3', name: 'Joueur 3', score: 400, duration: 5, level: 'adulte', date: '2023-01-03T12:00:00Z' }
  ];

  const defaultProps = {
    isLoading: false,
    level: 'adulte',
    leaderboard: mockLeaderboard
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait rendre correctement le tableau des meilleurs scores', () => {
    const { container } = render(Leaderboard, { props: defaultProps });

    // Vérifier que le tableau est rendu
    expect(container.querySelector('.leaderboard')).not.toBeNull();

    // Vérifier que le titre contient le niveau
    expect(container.querySelector('h2').textContent).toContain('Adulte');

    // Vérifier que les scores sont affichés
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    // Vérifier que les données sont correctes pour le premier joueur
    const firstRow = rows[0];
    expect(firstRow.textContent).toContain('Joueur 1');
    expect(firstRow.textContent).toContain('500');
  });

  it('devrait afficher un indicateur de chargement', () => {
    const props = {
      ...defaultProps,
      isLoading: true
    };

    const { container } = render(Leaderboard, { props });

    // Vérifier que l'indicateur de chargement est affiché
    expect(container.querySelector('.loading')).not.toBeNull();
    expect(container.querySelector('.loading-spinner')).not.toBeNull();
    expect(container.querySelector('.loading').textContent).toContain('Chargement des scores');
  });

  it('devrait afficher un message si le tableau est vide', () => {
    const props = {
      ...defaultProps,
      leaderboard: []
    };

    const { container } = render(Leaderboard, { props });

    // Vérifier que le message d'état vide est affiché
    expect(container.querySelector('.empty-state')).not.toBeNull();
    expect(container.querySelector('.empty-state').textContent).toContain('Aucun score enregistré');
  });

  it('devrait formater correctement les dates', () => {
    const { container } = render(Leaderboard, { props: defaultProps });

    // Vérifier que la date est formatée
    const dateCell = container.querySelector('tbody tr:first-child td:last-child');

    // Le format dépend des paramètres régionaux, mais vérifions au moins qu'il y a une date
    expect(dateCell.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('devrait mettre en évidence les trois premiers scores', () => {
    const { container } = render(Leaderboard, { props: defaultProps });

    // Vérifier que les trois premières lignes ont la classe top-three
    const topThreeRows = container.querySelectorAll('tbody tr.top-three');
    expect(topThreeRows.length).toBe(3);
  });
});