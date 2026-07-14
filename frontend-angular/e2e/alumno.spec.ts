import { test, expect } from '@playwright/test';

test.describe('Módulo de Alumno (Dashboard y Perfil)', () => {
  test('El dashboard carga correctamente y muestra el resumen del estudiante', async ({ page }) => {
    // Al usar storageState, el robot ya entra autenticado
    await page.goto('/alumno');

    // Verificar que el título de bienvenida o progreso esté presente
    await expect(page.locator('h1, h2').filter({ hasText: /¡Hola|Tu progreso/i }).first()).toBeVisible({ timeout: 15000 });

    // Verificar que el canvas Rive (osito) se cargue (es un <canvas> o un elemento rive o imagen)
    const canvas = page.locator('canvas, img[src*="bot"]');
    if (await canvas.count() > 0) {
      await expect(canvas.first()).toBeVisible();
    }
  });

  test('El perfil de usuario es accesible y carga los datos personales', async ({ page }) => {
    await page.goto('/alumno/perfil');
    
    // Verificar que el texto Datos Personales exista, dándole tiempo al API local a cargar
    await expect(page.getByText('Datos personales', { exact: false }).first()).toBeVisible({ timeout: 15000 });
  });
});
