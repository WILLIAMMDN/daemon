# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Módulo de Autenticación Independiente >> Muestra error si la contraseña es incorrecta
- Location: e2e\auth.spec.ts:6:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.form-alert, .field-error').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.form-alert, .field-error').first()

```

```yaml
- main:
  - link "Volver al inicio":
    - /url: /
    - text: Inicio
  - img "Academia Daemon"
  - article:
    - paragraph: Portal estudiante
    - heading "Iniciar sesión" [level=1]
    - text: Estudiante
    - link "Docente":
      - /url: /login-docente
    - textbox:
      - /placeholder: Usuario o correo
      - text: jose123
    - textbox "Mostrar clave":
      - /placeholder: Contraseña
      - text: badpassword
    - button "Mostrar clave"
    - link "¿Problemas para iniciar sesión?":
      - /url: /recuperar-clave
    - button "Ingresando..." [disabled]
    - text: o continúa con Google
    - button "Continuar con Google" [disabled]
    - paragraph:
      - text: ¿Aún no tienes cuenta?
      - link "Regístrate aquí":
        - /url: /registro
  - complementary:
    - paragraph: Accede a tu portal desde cualquier dispositivo con una experiencia optimizada.
- paragraph: Loading...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Módulo de Autenticación Independiente', () => {
  4  |   test.use({ storageState: { cookies: [], origins: [] } });
  5  | 
  6  |   test('Muestra error si la contraseña es incorrecta', async ({ page }) => {
  7  |     await page.goto('/login');
  8  |     
  9  |     await page.waitForSelector('input[name="usuario"]');
  10 |     await page.locator('input[name="usuario"]').fill('jose123');
  11 |     await page.locator('input[name="password"]').fill('badpassword');
  12 |     await page.locator('button[type="submit"]').click();
  13 |     
> 14 |     await expect(page.locator('.form-alert, .field-error').first()).toBeVisible({ timeout: 15000 });
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  15 |   });
  16 | });
  17 | 
```