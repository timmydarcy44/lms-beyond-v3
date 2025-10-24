import { test, expect } from '@playwright/test';

test.describe('Parcours E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - redirect to admin page
    await page.goto('/admin/test-org/parcours');
  });

  test('complete pathway management flow', async ({ page }) => {
    // 1. Create pathway
    await test.step('Create new pathway', async () => {
      await page.click('text=Nouveau parcours');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      await page.fill('input[id="title"]', 'E2E Test Pathway');
      await page.click('button:has-text("Créer")');
      
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
      await expect(page.locator('text=E2E Test Pathway')).toBeVisible();
    });

    // 2. Navigate to edit page
    await test.step('Navigate to edit page', async () => {
      await page.click('text=Modifier');
      await expect(page).toHaveURL(/\/admin\/test-org\/parcours\/[^\/]+$/);
      await expect(page.locator('h2:has-text("Édition du parcours")')).toBeVisible();
    });

    // 3. Edit meta information
    await test.step('Edit pathway meta', async () => {
      await page.fill('input[id="title"]', 'E2E Test Pathway Updated');
      await page.selectOption('select[id="reading_mode"]', 'free');
      await page.fill('textarea[id="description"]', 'Updated description for E2E test');
      
      await page.click('button:has-text("Sauvegarder")');
      
      // Wait for success toast
      await expect(page.locator('text=Parcours sauvegardé')).toBeVisible();
    });

    // 4. Add items to pathway
    await test.step('Add items to pathway', async () => {
      await page.click('button:has-text("Ajouter")');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Switch to formations tab
      await page.click('text=Formations');
      
      // Select first available formation (if any)
      const formationCheckbox = page.locator('input[type="checkbox"]').first();
      if (await formationCheckbox.isVisible()) {
        await formationCheckbox.check();
        await page.click('button:has-text("Ajouter")');
        
        await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        await expect(page.locator('text=Formation')).toBeVisible();
      }
    });

    // 5. Reorder items (if items exist)
    await test.step('Reorder pathway items', async () => {
      const sortableItems = page.locator('[data-testid="sortable-item"]');
      const count = await sortableItems.count();
      
      if (count > 1) {
        // Drag first item to second position
        const firstItem = sortableItems.first();
        const secondItem = sortableItems.nth(1);
        
        await firstItem.dragTo(secondItem);
        
        // Save order
        await page.click('button:has-text("Sauvegarder l\'ordre")');
        await expect(page.locator('text=Ordre sauvegardé')).toBeVisible();
      }
    });

    // 6. Assign learners and groups
    await test.step('Assign learners and groups', async () => {
      // Scroll to assignments section
      await page.locator('text=Assignations').scrollIntoViewIfNeeded();
      
      // Try to select learners (if any available)
      const learnersSelect = page.locator('text=Sélectionner des apprenants').first();
      if (await learnersSelect.isVisible()) {
        await learnersSelect.click();
        
        // Select first available learner
        const learnerOption = page.locator('text=test@example.com').first();
        if (await learnerOption.isVisible()) {
          await learnerOption.click();
        }
      }
      
      // Save assignments
      await page.click('button:has-text("Sauvegarder les assignations")');
      await expect(page.locator('text=Assignations sauvegardées')).toBeVisible();
    });

    // 7. Navigate back to list
    await test.step('Navigate back to list', async () => {
      await page.click('text=← Retour aux parcours');
      await expect(page).toHaveURL('/admin/test-org/parcours');
      await expect(page.locator('text=E2E Test Pathway Updated')).toBeVisible();
    });

    // 8. Delete pathway
    await test.step('Delete pathway', async () => {
      // Find the pathway card and hover to show actions
      const pathwayCard = page.locator('text=E2E Test Pathway Updated').locator('..').locator('..');
      await pathwayCard.hover();
      
      await page.click('text=Supprimer');
      
      // Confirm deletion
      await page.click('button:has-text("OK")');
      
      await expect(page.locator('text=Parcours supprimé')).toBeVisible();
      await expect(page.locator('text=E2E Test Pathway Updated')).not.toBeVisible();
    });
  });

  test('pathway validation errors', async ({ page }) => {
    // Test empty title validation
    await page.click('text=Nouveau parcours');
    await page.click('button:has-text("Créer")');
    
    // Should show validation error
    await expect(page.locator('text=Le titre est requis')).toBeVisible();
    
    // Test invalid URL validation
    await page.fill('input[id="title"]', 'Test Pathway');
    await page.fill('input[id="cover_url"]', 'not-a-url');
    await page.click('button:has-text("Créer")');
    
    // Should show validation error
    await expect(page.locator('text=URL invalide')).toBeVisible();
  });

  test('accessibility features', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test modal accessibility
    await page.click('text=Nouveau parcours');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[aria-labelledby="modal-title"]')).toBeVisible();
    
    // Test ESC key closes modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Test focus trap in modal
    await page.click('text=Nouveau parcours');
    await page.fill('input[id="title"]', 'Accessibility Test');
    
    // Tab should stay within modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should still be in modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
