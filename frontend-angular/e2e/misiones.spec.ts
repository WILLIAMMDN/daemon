import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Módulo de Misiones y Evaluaciones', () => {
  test('La vista de misiones carga correctamente', async ({ page }) => {
    await page.goto('/alumno/desafios');
    await expect(page.locator('h1, h2, app-cargando').first()).toBeVisible({ timeout: 15000 });
  });

  test('La vista de evaluaciones (Quiz) carga correctamente', async ({ page }) => {
    await page.goto('/alumno/misiones');
    await expect(page.locator('h1, h2, app-cargando').first()).toBeVisible({ timeout: 15000 });
  });
});
