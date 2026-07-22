import {test, expect} from '@playwright/test';

/**
 * Tests end-to-end pour le parcours utilisateur
 *
 * Pour exécuter ces tests:
 * 1. Installer Playwright: npm install --save-dev @playwright/test
 * 2. Lancer les tests: npx playwright test
 */

test.describe('Parcours utilisateur MultyFun', () => {
  test.beforeEach(async ({page}) => {
    // Visiter la page d'accueil avant chaque test
    await page.goto('/');
  });

  test('devrait afficher la page d\'accueil avec les options de démarrage', async ({page}) => {
    // Vérifier que le titre de la page est correct
    await expect(page).toHaveTitle(/MultyFun/);

    // Vérifier la présence des éléments d'accueil
    await expect(page.locator('h1')).toContainText('Jeu de Multiplication');

    // Vérifier la présence des options de démarrage
    await expect(page.locator('.option-card')).toHaveCount(3);

    // Vérifier les titres des options
    const optionTitles = await page.locator('.option-card h3').allTextContents();
    expect(optionTitles).toContain('Commencer l\'aventure');
    expect(optionTitles).toContain('Se connecter');
    expect(optionTitles).toContain('Partie rapide');
  });

  test('devrait permettre de jouer une partie rapide sans compte', async ({page}) => {
    // Cliquer sur l'option "Partie rapide"
    await page.locator('.option-card').filter({hasText: 'Partie rapide'}).click();

    // Vérifier qu'on est bien sur la page de jeu
    await expect(page.locator('.game-options')).toBeVisible();

    // Vérifier que le niveau est bien "adulte"
    await expect(page.locator('button').filter({hasText: '👨‍💼 Adulte'})).toBeVisible();

    // La suite du test dépend de l'implémentation exacte de votre page de jeu
    // Nous vérifions simplement que la page est chargée
  });
});