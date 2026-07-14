# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chatbot-ia.spec.ts >> Módulo de Chatbot e IA (Laboratorio) >> El estudiante puede enviar un mensaje al Chatbot y recibir respuesta
- Location: e2e\chatbot-ia.spec.ts:7:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('deep-chat, app-cargando').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('deep-chat, app-cargando').first()

```

```yaml
- complementary "Navegacion de estudiante":
  - link "Ir al inicio de DAEMON":
    - /url: /alumno
  - button "Fijar menú"
  - region "Cuenta activa":
    - button "Ver datos de la cuenta Jose Gutierrez Medina":
      - img
  - navigation:
    - link "Dashboard":
      - /url: /alumno
    - link "Cursos":
      - /url: /alumno/recursos
    - link "Retos":
      - /url: /alumno/desafios
    - link "Proyectos":
      - /url: /alumno/cuentos
    - link "Misiones":
      - /url: /alumno/misiones
    - link "Ranking":
      - /url: /alumno/ranking
    - link "Comunidad":
      - /url: /alumno/comunidad
    - link "Recompensas":
      - /url: /alumno/tienda
    - link "Mi perfil":
      - /url: /alumno/perfil
    - link "Herramientas IA":
      - /url: /alumno/herramientas
    - link "Evaluaciones":
      - /url: /alumno/evaluaciones
    - link "Certificado":
      - /url: /alumno/certificado
  - button "Cerrar sesión"
- searchbox "Buscar misiones, proyectos, cursos..."
- link "Novato Tokens DAEMON":
  - /url: /alumno/perfil
  - text: Novato
  - group "Tokens DAEMON":
    - img "Tokens DAEMON"
    - text: "300"
- img
- text: jose123 Nivel KIDS
- main:
  - img "Blanquita"
  - text: Asistente local con IA
  - heading "Blanquita" [level=1]
  - paragraph: Conversación conectada al bot personal del estudiante.
  - link "Configurar bot":
    - /url: /alumno/herramientas/bot
  - button "Limpiar chat" [disabled]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Módulo de Chatbot e IA (Laboratorio)', () => {
  4  |   // Aumentamos el timeout específico para esta prueba porque el LLM local puede tardar en responder
  5  |   test.setTimeout(60000);
  6  | 
  7  |   test('El estudiante puede enviar un mensaje al Chatbot y recibir respuesta', async ({ page }) => {
  8  |     await page.goto('/alumno/herramientas/chatbot');
  9  | 
  10 |     // Esperar a que la interfaz del chat cargue
  11 |     const inputChat = page.locator('deep-chat, app-cargando').first();
> 12 |     await expect(inputChat).toBeVisible({ timeout: 15000 });
     |                             ^ Error: expect(locator).toBeVisible() failed
  13 | 
  14 |     // Si es un deep-chat component, las interacciones pueden variar. 
  15 |     // Intentaremos un flujo estándar o esperaremos a que la UI esté lista
  16 |     await page.waitForTimeout(2000);
  17 | 
  18 |     // Como es una prueba crítica, solo verificamos que el módulo no crashee y renderice
  19 |     await expect(page.locator('h1, span').filter({ hasText: /Asistente|Bot/i }).first()).toBeVisible({ timeout: 15000 });
  20 |   });
  21 | });
  22 | 
```