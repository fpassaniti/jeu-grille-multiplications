import { describe, it, expect } from 'vitest';
import { calculateDifficultyMultiplier, calculateScore } from './game-logic.js';

describe('Game Logic - calculateDifficultyMultiplier', () => {
  it('devrait retourner une valeur plus faible pour les multiplications faciles', () => {
    // Table de 1 ou 10 - considérées comme faciles
    expect(calculateDifficultyMultiplier(1, 5)).toBe(0.5);
    expect(calculateDifficultyMultiplier(10, 5)).toBe(0.5);
    expect(calculateDifficultyMultiplier(5, 1)).toBe(0.5);
    expect(calculateDifficultyMultiplier(5, 10)).toBe(0.5);
  });

  it('devrait retourner une valeur élevée pour les multiplications difficiles', () => {
    // 7x7 est considéré comme l'une des plus difficiles
    expect(calculateDifficultyMultiplier(7, 7)).toBe(3.0);
    // Autres multiplications réputées difficiles
    expect(calculateDifficultyMultiplier(6, 8)).toBe(2.5);
    expect(calculateDifficultyMultiplier(8, 7)).toBe(2.7);
  });

  it('devrait retourner une valeur intermédiaire pour les multiplications moyennes', () => {
    // Multiplications de difficulté moyenne
    expect(calculateDifficultyMultiplier(3, 4)).toBe(1.2);
    expect(calculateDifficultyMultiplier(5, 5)).toBe(1.5);
  });

  it('devrait retourner une valeur par défaut pour les indices hors limites', () => {
    // Valeurs hors limites
    expect(calculateDifficultyMultiplier(0, 5)).toBe(1.0);
    expect(calculateDifficultyMultiplier(5, 0)).toBe(1.0);
    expect(calculateDifficultyMultiplier(11, 5)).toBe(1.0);
    expect(calculateDifficultyMultiplier(5, 11)).toBe(1.0);
  });

  it('devrait respecter la symétrie pour certaines multiplications', () => {
    // Test de symétrie: 6x8 devrait être aussi difficile que 8x6
    expect(calculateDifficultyMultiplier(6, 8)).toBe(calculateDifficultyMultiplier(8, 6));
    // Test de symétrie: 7x9 devrait être aussi difficile que 9x7
    expect(calculateDifficultyMultiplier(7, 9)).toBe(calculateDifficultyMultiplier(9, 7));
  });
});

describe('Game Logic - calculateScore', () => {
  it('devrait calculer un score plus élevé pour un temps restant plus important', () => {
    // Même multiplication, temps différent
    const scoreFastTime = calculateScore(10, 5, 5, 'adulte');
    const scoreSlowerTime = calculateScore(5, 5, 5, 'adulte');
    
    expect(scoreFastTime).toBeGreaterThan(scoreSlowerTime);
  });

  it('devrait calculer un score plus élevé pour une multiplication plus difficile', () => {
    // Même temps, multiplication différente
    const scoreEasy = calculateScore(10, 2, 2, 'adulte');
    const scoreHard = calculateScore(10, 7, 7, 'adulte');
    
    expect(scoreHard).toBeGreaterThan(scoreEasy);
  });

  it('devrait calculer un score légèrement différent selon le niveau', () => {
    // Même multiplication et temps, niveau différent
    const scoreAdult = calculateScore(10, 6, 9, 'adulte');
    const scoreChild = calculateScore(10, 6, 9, 'enfant');
    
    // Pour le niveau enfant, la pénalité pour les tables faciles est réduite
    expect(scoreAdult).not.toBe(scoreChild);
  });

  it('devrait retourner un nombre entier', () => {
    // Vérifier que le score est arrondi
    const score = calculateScore(7.5, 4, 6, 'adulte');
    expect(Number.isInteger(score)).toBe(true);
  });

  it('devrait utiliser le multiplicateur de difficulté correctement', () => {
    // Test avec la table de 7 (difficulté élevée)
    const difficultyMultiplier = calculateDifficultyMultiplier(7, 7);
    const timeRemaining = 10;
    const expectedScore = Math.round(timeRemaining * difficultyMultiplier);
    
    expect(calculateScore(timeRemaining, 7, 7, 'adulte')).toBe(expectedScore);
  });

  it('devrait calculer un score différent pour le niveau enfant', () => {
    // Pour le niveau enfant, on applique une formule légèrement différente
    const timeRemaining = 10;
    const row = 5;
    const col = 5;
    const difficultyMultiplier = calculateDifficultyMultiplier(row, col);
    
    // Formule pour niveau adulte
    const expectedAdultScore = Math.round(timeRemaining * difficultyMultiplier);
    
    // Formule pour niveau enfant
    const expectedChildScore = Math.round(timeRemaining * (difficultyMultiplier * 0.7 + 0.3));
    
    expect(calculateScore(timeRemaining, row, col, 'adulte')).toBe(expectedAdultScore);
    expect(calculateScore(timeRemaining, row, col, 'enfant')).toBe(expectedChildScore);
    
    // Le score enfant devrait être différent du score adulte
    expect(expectedAdultScore).not.toBe(expectedChildScore);
  });
});