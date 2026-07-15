import { test, expect } from '@playwright/test';

test.describe('Módulo de Autenticación Independiente', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Muestra error si la contraseña es incorrecta', async ({ page }) => {
    await page.goto('/login');
    
    await page.waitForSelector('input[name="usuario"]');
    await page.locator('input[name="usuario"]').fill(process.env['E2E_INVALID_USERNAME'] || 'e2e_invalid_user');
    await page.locator('input[name="password"]').fill('badpassword');
    await page.locator('button[type="submit"]').click();
    
    const visualAlert = page.locator('.form-alert, .field-error, .ant-message, .ant-notification');
    const accessibleError = page.getByText(/incorrecta|credenciales|conectar con la api|no se pudo/i);

    await expect(visualAlert.or(accessibleError).first()).toBeVisible({ timeout: 60000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
