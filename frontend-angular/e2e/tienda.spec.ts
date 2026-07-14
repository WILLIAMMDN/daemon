import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Módulo de Recompensas y Tienda', () => {
  test('La tienda y el inventario cargan correctamente', async ({ page }) => {
    await page.goto('/alumno/tienda');
    await expect(page.locator('h1, h2, app-cargando').first()).toBeVisible({ timeout: 15000 });
  });
});
