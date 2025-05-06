import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateScore,
  calculateDifficultyMultiplier,
  checkAnswer
} from '../../lib/utils/game-logic';

// Simulation de l'intégration entre le module de logique du jeu et l'API de scores
describe('Intégration - Jeu et API Scores', () => {
  // Données simulées
  const mockUserInfo = {
    name: 'Test User',
    authenticated: false
  };

  // Simuler un fetch
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();

    // Configuration par défaut du mock fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        gameData: {
          id: 'game-id',
          score: 500
        },
        xpEarned: 500
      })
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('devrait soumettre un score correct après une partie adulte', async () => {
    // Simule une partie terminée
    const gameState = {
      level: 'adulte',
      duration: 5,
      solvedCells: 10,
      totalPossibleCells: 20,
      selectedTables: [],
      timeRemaining: 180,
      cellsWithScore: [
        { row: 7, col: 8, result: 56, timeRemaining: 12 },
        { row: 9, col: 3, result: 27, timeRemaining: 8 }
      ]
    };

    // Calcul du score total
    const totalScore = gameState.cellsWithScore.reduce((total, cell) => {
      const cellScore = calculateScore(
        cell.timeRemaining,
        cell.row,
        cell.col,
        gameState.level
      );
      return total + cellScore;
    }, 0);

    // Soumission du score
    await submitScore(mockUserInfo, gameState, totalScore);

    // Vérifications
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/scores',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('"score":' + totalScore)
      })
    );
  });

  it('devrait soumettre un score avec tables sélectionnées pour une partie enfant', async () => {
    // Simule une partie enfant terminée
    const gameState = {
      level: 'enfant',
      duration: 5,
      solvedCells: 8,
      totalPossibleCells: 15,
      selectedTables: [2, 5, 10], // Tables sélectionnées pour le niveau enfant
      timeRemaining: 240,
      cellsWithScore: [
        { row: 2, col: 5, result: 10, timeRemaining: 15 },
        { row: 5, col: 5, result: 25, timeRemaining: 10 }
      ]
    };

    // Calcul du score total
    const totalScore = gameState.cellsWithScore.reduce((total, cell) => {
      const cellScore = calculateScore(
        cell.timeRemaining,
        cell.row,
        cell.col,
        gameState.level
      );
      return total + cellScore;
    }, 0);

    // Soumission du score
    await submitScore(mockUserInfo, gameState, totalScore);

    // Vérifications
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Vérifier que les tables sélectionnées sont incluses dans la requête
    const fetchCall = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody).toHaveProperty('selectedTables');
    expect(requestBody.selectedTables).toEqual([2, 5, 10]);
  });

  it('devrait mettre à jour la progression pour un utilisateur connecté', async () => {
    // Simuler un utilisateur authentifié
    const authenticatedUser = {
      name: 'Auth User',
      authenticated: true,
      id: 'user-id'
    };

    // Réponse simulée avec mise à jour de progression
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        gameData: {
          id: 'game-id',
          score: 700
        },
        xpEarned: 700,
        progressUpdate: {
          returned_user_id: 'user-id',
          returned_xp: 5200, // XP après mise à jour
          returned_level: 3,  // Niveau après mise à jour
          returned_streak_days: 4,
          returned_total_score: 13200
        }
      })
    });

    // Simuler état du jeu
    const gameState = {
      level: 'adulte',
      duration: 5,
      solvedCells: 15,
      totalPossibleCells: 20,
      selectedTables: [],
      timeRemaining: 180,
      cellsWithScore: [
        { row: 7, col: 8, result: 56, timeRemaining: 12 },
        { row: 6, col: 7, result: 42, timeRemaining: 14 },
        { row: 9, col: 9, result: 81, timeRemaining: 10 }
      ]
    };

    // Calcul du score total
    const totalScore = gameState.cellsWithScore.reduce((total, cell) => {
      const cellScore = calculateScore(
        cell.timeRemaining,
        cell.row,
        cell.col,
        gameState.level
      );
      return total + cellScore;
    }, 0);

    // Soumission du score
    const response = await submitScore(authenticatedUser, gameState, totalScore);

    // Vérifications
    expect(response.progressUpdate).toBeDefined();
    expect(response.progressUpdate.returned_xp).toBe(5200);
    expect(response.progressUpdate.returned_level).toBe(3);
    expect(response.xpEarned).toBe(700);
  });

  it('devrait gérer les erreurs lors de la soumission du score', async () => {
    // Simuler une erreur côté serveur
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Erreur serveur lors de l\'enregistrement du score'
      })
    });

    // Simuler état du jeu
    const gameState = {
      level: 'adulte',
      duration: 5,
      solvedCells: 10,
      totalPossibleCells: 20,
      selectedTables: [],
      timeRemaining: 180,
      cellsWithScore: [
        { row: 7, col: 8, result: 56, timeRemaining: 12 }
      ]
    };

    // Soumission du score
    try {
      await submitScore(mockUserInfo, gameState, 100);
      // Si submitScore ne génère pas d'erreur, le test échoue
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe('Erreur lors de la soumission du score');
    }
  });
});

// Fonction simulée pour soumettre un score (ce serait normalement dans un autre fichier)
async function submitScore(user, gameState, totalScore) {
  const payload = {
    name: user.name,
    score: totalScore,
    duration: gameState.duration,
    level: gameState.level,
    solvedCells: gameState.solvedCells,
    totalPossibleCells: gameState.totalPossibleCells,
    selectedTables: gameState.selectedTables
  };

  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la soumission du score');
  }

  return await response.json();
}