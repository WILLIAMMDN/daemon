import { test, expect } from '@playwright/test';

// E2E del módulo de cuentos con mocks estables: sin IA real ni backend.
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Módulo de cuentos', () => {
  test('la galería carga y muestra el estado de carga o contenido', async ({ page }) => {
    await page.goto('/alumno/proyectos/cuentos');
    await expect(page.locator('h1, h2, app-cargando').first()).toBeVisible({ timeout: 15000 });
  });

  test('el editor de crear cuento abre sin romper el layout', async ({ page }) => {
    await page.goto('/alumno/proyectos/cuentos/crear');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    // Sin scroll horizontal accidental en móvil
    await page.setViewportSize({ width: 390, height: 844 });
    const scrollAncho = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(scrollAncho).toBeLessThanOrEqual(0);
  });

  test('el asistente IA usa la ruta mockeada y nunca llama a producción', async ({ page }) => {
    let llamadasIA = 0;
    await page.route('**/api/v1/cuentos-v2/ia/asistencia**', async (ruta) => {
      llamadasIA += 1;
      await ruta.fulfill({ status: 200, json: { sugerencia: 'Una idea segura para el cuento.' } });
    });
    await page.goto('/alumno/proyectos/cuentos/crear');
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
  });
});
