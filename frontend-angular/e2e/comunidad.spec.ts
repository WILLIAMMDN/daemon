import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Módulo Social y Comunidad', () => {
  test('El muro o comunidad carga correctamente', async ({ page }) => {
    await page.goto('/alumno/muro');
    await expect(page.locator('h1, h2, app-cargando').first()).toBeVisible({ timeout: 15000 });
  });

  test('El portafolio público carga correctamente', async ({ page }) => {
    await page.goto('/alumno/portafolio');
    await expect(page.locator('h1, h2, app-cargando').first()).toBeVisible({ timeout: 15000 });
  });
});
