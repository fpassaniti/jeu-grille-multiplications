/**
 * Service pour gérer les interactions avec l'API du jeu
 */

/**
 * Sauvegarde un score dans la base de données
 * @param {Object} gameData - Données du jeu
 * @param {string} gameData.name - Nom du joueur
 * @param {number} gameData.score - Score
 * @param {number} gameData.duration - Durée de la partie en minutes
 * @param {string} gameData.level - Niveau de jeu ('adulte' ou 'enfant')
 * @param {string} gameData.gameMode - Mode de calcul ('tables', 'addition', ...)
 * @param {Object} gameData.modeOptions - Options du mode (paliers, tables sélectionnées)
 * @param {number} gameData.questionsSolved - Questions résolues
 * @param {number|null} gameData.questionsTotal - Taille du pool (null = infini)
 * @param {number} gameData.errorsCount - Nombre d'erreurs
 * @param {number} [gameData.solvedCells] - Champ V1 (compat)
 * @param {number|null} [gameData.totalPossibleCells] - Champ V1 (compat)
 * @param {Array<number>} [gameData.selectedTables] - Champ V1 (compat)
 * @returns {Promise<Object>} - Réponse de l'API
 */
export async function saveScore(gameData) {
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(gameData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de la sauvegarde du score');
  }

  return await response.json();
}

/**
 * Récupère le classement
 * @param {string} level - Niveau ('adulte' ou 'enfant')
 * @param {number} duration - Durée en minutes
 * @param {string} mode - Mode de calcul ('tables' par défaut = classement historique)
 * @returns {Promise<Object>} - Réponse de l'API
 */
export async function getLeaderboard(level = 'adulte', duration = 5, mode = 'tables') {
  const response = await fetch(`/api/leaderboard?level=${level}&duration=${duration}&mode=${mode}`);

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des scores');
  }

  return await response.json();
}

/**
 * Récupère la progression de l'utilisateur
 * @returns {Promise<Object>} - Réponse de l'API
 */
export async function getUserProgress() {
  const response = await fetch('/api/user/progress');

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération de la progression');
  }

  return await response.json();
}