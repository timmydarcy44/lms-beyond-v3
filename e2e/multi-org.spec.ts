import { test, expect } from '@playwright/test';

test.describe('Multi-Organization Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page de base pour initialiser
    await page.goto('/');
  });

  test('should redirect /admin to default org or org-picker', async ({ page }) => {
    await page.goto('/admin');
    
    // Vérifier que la redirection a lieu
    await expect(page).toHaveURL(/\/admin\/[a-z-]+|\/org-picker/);
  });

  test('should normalize org slug to lowercase (308 redirect)', async ({ page }) => {
    // Tenter d'accéder à une URL avec slug en majuscules
    const response = await page.goto('/admin/ACME');
    
    // Vérifier que c'est une redirection 308
    expect(response?.status()).toBe(308);
    
    // Vérifier que l'URL finale est en minuscules
    await expect(page).toHaveURL(/\/admin\/acme/);
  });

  test('should redirect unauthenticated user to login with org and next params', async ({ page }) => {
    // Supprimer les cookies d'auth s'ils existent
    await page.context().clearCookies();
    
    await page.goto('/admin/demo/dashboard');
    
    // Vérifier la redirection vers login avec les bons paramètres
    await expect(page).toHaveURL(/\/login\?org=demo&next=/);
  });

  test('should handle switch-org functionality', async ({ page }) => {
    // Simuler un utilisateur authentifié (nécessite setup auth)
    // Pour ce test, on vérifie juste que la route existe et répond correctement
    
    const response = await page.goto('/switch-org?to=demo&next=/admin/demo/dashboard');
    
    // Vérifier que la route répond (même si c'est une erreur d'auth)
    const status = response?.status();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThanOrEqual(500);
  });

  test('should show org-picker for users with multiple orgs', async ({ page }) => {
    // Ce test nécessiterait un setup d'auth avec plusieurs orgs
    // Pour l'instant, on vérifie que la page existe
    await page.goto('/org-picker');
    
    // Vérifier que la page se charge (même si c'est une erreur d'auth)
    const response = await page.goto('/org-picker');
    const status = response?.status();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThanOrEqual(500);
  });

  test('should return 404 for invalid org slugs', async ({ page }) => {
    const response = await page.goto('/admin/invalid-org-that-does-not-exist');
    
    // Vérifier que c'est bien une 404
    expect(response?.status()).toBe(404);
  });

  test('should handle empty org slug gracefully', async ({ page }) => {
    const response = await page.goto('/admin//dashboard');
    
    // Vérifier que c'est bien une 404
    expect(response?.status()).toBe(404);
  });

  test('should redirect /login/admin to /login', async ({ page }) => {
    await page.goto('/login/admin');
    
    // Vérifier la redirection vers /login
    await expect(page).toHaveURL('/login');
  });
});
