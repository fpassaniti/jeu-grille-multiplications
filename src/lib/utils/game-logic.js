/**
 * Calcule la difficulte d'une multiplication selon les facteurs
 * @param {number} row - Premier facteur (ligne)
 * @param {number} col - Deuxieme facteur (colonne)
 * @returns {number} Coefficient de difficulte entre 0.5 et 3.0
 */
export function calculateDifficultyMultiplier(row, col) {
  // Table de difficulte relative des multiplications
  // Les valeurs sont basees sur une analyse de la difficulte cognitive typique
  const difficultyMatrix = [
    // 1  2  3  4  5  6  7  8  9  10
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // Table de 1
    [0.5, 0.8, 0.8, 0.9, 0.9, 1.0, 1.1, 1.2, 1.0, 0.5], // Table de 2
    [0.5, 0.8, 1.0, 1.2, 1.2, 1.3, 1.4, 1.5, 1.3, 0.5], // Table de 3
    [0.5, 0.9, 1.2, 1.4, 1.4, 1.5, 1.6, 1.7, 1.5, 0.5], // Table de 4
    [0.5, 0.9, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.6, 0.5], // Table de 5
    [0.5, 1.0, 1.3, 1.5, 1.6, 2.0, 2.4, 2.5, 2.0, 0.5], // Table de 6
    [0.5, 1.1, 1.4, 1.6, 1.7, 2.4, 3.0, 2.7, 2.2, 0.5], // Table de 7
    [0.5, 1.2, 1.5, 1.7, 1.8, 2.5, 2.7, 2.6, 2.1, 0.5], // Table de 8
    [0.5, 1.0, 1.3, 1.5, 1.6, 2.0, 2.2, 2.1, 1.9, 0.5], // Table de 9
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]  // Table de 10
  ];

  // Indices commeneant e 0 pour le tableau mais e 1 pour l'utilisateur
  const rowIndex = row - 1;
  const colIndex = col - 1;

  // Protection contre les valeurs hors limites
  if (rowIndex < 0 || rowIndex > 9 || colIndex < 0 || colIndex > 9) {
    return 1.0; // Valeur par defaut si hors limites
  }

  return difficultyMatrix[rowIndex][colIndex];
}

/**
 * Calcule les points pour une reponse correcte
 * @param {number} timeRemaining - Temps restant en secondes
 * @param {number} row - Premier facteur
 * @param {number} col - Deuxieme facteur
 * @param {string} level - Niveau de jeu ('adulte' ou 'enfant')
 * @returns {number} Points gagnes pour cette reponse
 */
export function calculateScore(timeRemaining, row, col, level) {
  // Obtenir le multiplicateur de difficulte
  const difficultyMultiplier = calculateDifficultyMultiplier(row, col);
  
  // Base de points: temps restant e multiplicateur de difficulte
  // Pour le niveau enfant, on reduit un peu la penalite pour les tables faciles
  const basePoints = level === 'adulte' 
    ? timeRemaining * difficultyMultiplier
    : timeRemaining * (difficultyMultiplier * 0.7 + 0.3);
  
  // Arrondir au nombre entier
  return Math.round(basePoints);
}