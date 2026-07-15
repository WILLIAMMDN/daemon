import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('autenticar', async ({ page }) => {
  const username = process.env['E2E_STUDENT_USERNAME'];
  const password = process.env['E2E_STUDENT_PASSWORD'];
  if (!username || !password) {
    throw new Error('E2E_STUDENT_USERNAME y E2E_STUDENT_PASSWORD son obligatorios para pruebas autenticadas.');
  }

  // Ir a la página de login
  await page.goto('/login');

  // Esperar a que el formulario cargue
  await page.waitForSelector('input[name="usuario"]');

  // Llenar credenciales locales (Fallback a Sanctum sin usar Firebase Email)
  const userInput = page.locator('input[name="usuario"]');
  const passInput = page.locator('input[name="password"]');
  const submitBtn = page.locator('button[type="submit"]');

  await userInput.first().fill(username);
  await passInput.first().fill(password);

  await submitBtn.first().click();

  // Esperar a ser redirigido al panel principal
  await page.waitForURL('**/alumno', { timeout: 15000 });

  // Guardar estado
  const dir = path.dirname(authFile);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }
  await page.context().storageState({ path: authFile });
});
