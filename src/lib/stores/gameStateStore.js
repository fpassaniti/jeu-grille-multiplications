import { writable, derived, get } from 'svelte/store'; // Added get
import { browser } from '$app/environment';
import { calculateScore } from '$lib/utils/game-logic';

// Stores de base
export const gameState = writable('notStarted'); // notStarted, playing, finished
export const gameDuration = writable(3); // minutes (options: 2, 3, 5)
export const gameTimer = writable(0); // en secondes
export const score = writable(0);
export const level = writable('adulte'); // 'adulte' ou 'enfant'
export const currentRow = writable(0);
export const currentCol = writable(0);
export const cellTimer = writable(0);
export const maxCellTimer = writable(0);
export const userAnswer = writable('');
export const lastAnswerCorrect = writable(null);
export const playerName = writable('');
export const lastSolvedMultiplications = writable([]);

// Grille de jeu (10x10)
export const grid = writable(Array(10).fill().map(() => Array(10).fill(null)));
// Grille pour suivre les cellules déjà résolues
export const solvedCells = writable(Array(10).fill().map(() => Array(10).fill(false)));

// Variables pour la gamification
export const estimatedXP = writable(0);
export const gameResults = writable(null);
export const scoreSaved = writable(false);
export const levelUp = writable(false);
export const isLoading = writable(false);
export const gameSessionToken = writable(null);

// États dérivés
export const solvedCountAdult = derived(solvedCells, $solvedCells => {
  let count = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if ($solvedCells[r][c]) count++;
    }
  }
  return count;
});

export const solvedCountChild = derived([solvedCells, level], ([$solvedCells, $level], getSelectedTableNumbers) => {
  if ($level !== 'enfant' || !getSelectedTableNumbers) return { count: 0, total: 0 };

  const selectedNums = getSelectedTableNumbers();
  let count = 0;
  let total = 0;

  // Pour chaque cellule du tableau 10x10
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      // Une cellule fait partie des tables sélectionnées si sa ligne OU sa colonne est dans les tables sélectionnées
      if (selectedNums.includes(r + 1) || selectedNums.includes(c + 1)) {
        total++;
        if ($solvedCells[r][c]) count++;
      }
    }
  }

  return { count, total };
});

// Fonctions
const generateToken = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export async function startGame(getSelectedTableNumbers) { // Made async
  // Réinitialiser les données du jeu
  gameState.set('playing');
  score.set(0);
  gameSessionToken.set(generateToken());

  // Register the token with the server
  const newToken = get(gameSessionToken);

  if (newToken) {
    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionToken: newToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch if response is not json
        console.error('Failed to register session token:', response.status, errorData.error || 'Unknown error');
        // Optionally, handle this error more gracefully in the UI or game state
      } else {
        // console.log('Session token registered successfully.'); // For client-side debugging
      }
    } catch (error) {
      console.error('Error calling session registration API:', error);
    }
  }

  // Récupérer la durée depuis le store
  let currentDuration;
  gameDuration.subscribe(value => {
    currentDuration = value;
  })();

  gameTimer.set(currentDuration * 60);
  lastSolvedMultiplications.set([]);

  // Réinitialiser la grille et les cellules résolues
  grid.set(Array(10).fill().map(() => Array(10).fill(null)));
  solvedCells.set(Array(10).fill().map(() => Array(10).fill(false)));

  // Si en mode enfant et aucune table sélectionnée, sélectionner toutes les tables
  let currentLevel;
  level.subscribe(value => {
    currentLevel = value;
  })();

  if (currentLevel === 'enfant' && getSelectedTableNumbers().length === 0) {
    // Gérer cette logique au niveau du composant
  }

  // Autres réinitialisations
  gameResults.set(null);
  scoreSaved.set(false);
  levelUp.set(false);
  isLoading.set(false);
}

export function endGame() {
  gameState.set('finished');

  // Le score est maintenant directement utilisé comme XP
  let currentScore;
  score.subscribe(value => {
    currentScore = value;
  })();

  estimatedXP.set(currentScore);
}

export function checkAnswer(row, col, answer, remainingTime, levelValue) {
  const correctAnswer = row * col;
  if (parseInt(answer, 10) === correctAnswer) {
    // Calculer le score
    const earnedPoints = calculateScore(remainingTime, row, col, levelValue);

    // Mettre à jour le score
    score.update(s => s + earnedPoints);

    // Mettre à jour les cellules résolues
    solvedCells.update($solvedCells => {
      $solvedCells[row - 1][col - 1] = true;
      return $solvedCells;
    });

    // Mettre à jour la grille
    grid.update($grid => {
      $grid[row - 1][col - 1] = correctAnswer;
      return $grid;
    });

    // Ajouter à la liste des dernières multiplications résolues
    const MAX_LAST_SOLVED = 10;
    const newSolved = {
      row,
      col,
      result: correctAnswer,
      points: earnedPoints,
      timestamp: Date.now()
    };

    lastSolvedMultiplications.update($last => {
      return [newSolved, ...$last].slice(0, MAX_LAST_SOLVED);
    });

    return true;
  }
  return false;
}

// Fonction pour sauvegarder les tables sélectionnées dans localStorage
export function saveSelectedTables(selected) {
  if (!browser) return;
  try {
    localStorage.setItem('selectedMultiplicationTables', JSON.stringify(selected));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des tables sélectionnées:', error);
  }
}

// Fonction pour charger les tables sélectionnées depuis localStorage
export function loadSelectedTables() {
  if (!browser) return null;
  try {
    const savedTables = localStorage.getItem('selectedMultiplicationTables');
    if (savedTables) {
      return JSON.parse(savedTables);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des tables sélectionnées:', error);
  }
  return null;
}

// Vérifie si une cellule fait partie des tables sélectionnées
export function isSelectedTableCell(row, col, selectedTableNumbers) {
  let currentLevel;
  level.subscribe(value => {
    currentLevel = value;
  })();

  if (currentLevel === 'adulte') return true;
  return selectedTableNumbers.includes(row + 1) || selectedTableNumbers.includes(col + 1);
}