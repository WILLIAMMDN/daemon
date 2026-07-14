import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('autenticar', async ({ page }) => {
  // Ir a la página de login
  await page.goto('/login');

  // Esperar a que el formulario cargue
  await page.waitForSelector('input[name="usuario"]');

  // Llenar credenciales locales (Fallback a Sanctum sin usar Firebase Email)
  const userInput = page.locator('input[name="usuario"]');
  const passInput = page.locator('input[name="password"]');
  const submitBtn = page.locator('button[type="submit"]');

  await userInput.first().fill('jose123');
  await passInput.first().fill('1234'); 

  await submitBtn.first().click();

  // Esperar 3 segundos para que aparezca cualquier error en UI y tomar foto
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'login-debug.png' });

  // Esperar a ser redirigido al panel principal
  await page.waitForURL('**/alumno', { timeout: 15000 });

  // Guardar estado
  const dir = path.dirname(authFile);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }
  await page.context().storageState({ path: authFile });
});
