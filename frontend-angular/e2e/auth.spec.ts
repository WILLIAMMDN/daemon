import { test, expect } from '@playwright/test';

test.describe('Módulo de Autenticación Independiente', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Muestra error si la contraseña es incorrecta', async ({ page }) => {
    await page.goto('/login');
    
    await page.waitForSelector('input[name="usuario"]');
    await page.locator('input[name="usuario"]').fill('jose123');
    await page.locator('input[name="password"]').fill('badpassword');
    await page.locator('button[type="submit"]').click();
    
    // Puede ser .form-alert, mensaje de ng-zorro (.ant-message), o un texto de error.
    await expect(page.locator('.form-alert, .field-error, .ant-message, .ant-notification, text="incorrecta"').first()).toBeVisible({ timeout: 15000 });
  });
});
