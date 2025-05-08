/**
 * Représente l'état du jeu
 */
export type GameState = 'notStarted' | 'playing' | 'finished';

/**
 * Représente le niveau de jeu
 */
export type GameLevel = 'adulte' | 'enfant';

/**
 * Représente une multiplication résolue
 */
export interface SolvedMultiplication {
    row: number;
    col: number;
    result: number;
    points: number;
    timestamp: number;
}

/**
 * Représente les statistiques des cellules résolues pour le niveau enfant
 */
export interface SolvedCountChild {
    count: number;
    total: number;
}

/**
 * Représente les résultats d'une partie
 */
export interface GameResults {
    success: boolean;
    message: string;
    gameData: {
        id: string;
        score: number;
        [key: string]: any;
    };
    xpEarned: number;
    progressUpdate?: {
        returned_user_id: string;
        returned_xp: number;
        returned_level: number;
        returned_previous_level?: number;
        returned_streak_days: number;
        returned_total_score: number;
        returned_level_title?: string;
    };
    newLevel?: number;
    newLevelTitle?: string;
}

/**
 * Représente les données à envoyer pour sauvegarder un score
 */
export interface ScoreData {
    name: string;
    score: number;
    duration: number;
    level: GameLevel;
    solvedCells: number;
    totalPossibleCells: number;
    selectedTables: number[];
}