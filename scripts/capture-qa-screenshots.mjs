import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const distDir = path.resolve('frontend-angular/dist/frontend-angular/browser');
const outDir = path.resolve('docs/qa/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Simple SPA static server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.riv': 'application/octet-stream',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(4200, async () => {
  console.log('Server running on http://localhost:4200');

  const browser = await chromium.launch({ headless: true });

  const mockUser = {
    id: 7,
    nombre_completo: 'Luna Estudiante',
    usuario: 'luna',
    email: 'luna@daemon.edu',
    rol: 'alumno',
    nivel: 'KIDS',
    tokens: 120,
    experiencia: 350,
    nivel_gamificacion: 3,
    avatar: '/img/robot-mision.png',
  };

  const mockPanel = {
    usuario: mockUser,
    posicion: 2,
    posicion_scope: 'aula',
    posicion_scope_label: 'Tu aula',
    misiones_pendientes: 1,
    misiones_completadas: 4,
    insignias: 3,
    canjes_pendientes: 0,
    racha: 3,
    actividad_semana: [
      { fecha: '2026-08-26', etiqueta: 'mie', activo: true, tipo: 'mision' },
      { fecha: '2026-08-27', etiqueta: 'jue', activo: true, tipo: 'mision' },
      { fecha: '2026-08-28', etiqueta: 'vie', activo: false, tipo: null },
      { fecha: '2026-08-29', etiqueta: 'sab', activo: false, tipo: null },
      { fecha: '2026-08-30', etiqueta: 'dom', activo: false, tipo: null },
      { fecha: '2026-08-31', etiqueta: 'lun', activo: true, tipo: 'leccion' },
      { fecha: '2026-09-01', etiqueta: 'mar', activo: true, tipo: 'leccion' },
    ],
    proxima_mision: {
      id: 10,
      titulo: 'Exploración del Núcleo IA',
      descripcion: 'Entrena a tu primer agente inteligente para reconocer patrones.',
      recompensa: 50,
      tipo_evidencia: 'proyecto',
      nivel_requerido: 'KIDS',
    },
    progreso_nivel: {
      nivel: 3,
      nivel_maximo: 100,
      experiencia_total: 350,
      experiencia_nivel: 200,
      experiencia_meta: 300,
      experiencia_restante: 100,
      progreso_porcentaje: 67,
    },
  };

  const mockHomeContext = {
    student: mockUser,
    currentEnrollment: { id: 1, id_alumno: 7, id_aula: 1, estado: 'activa' },
    currentCourse: { id: 1, titulo: 'Fundamentos de Inteligencia Artificial', descripcion: 'Aprende los conceptos base de la IA.' },
    cohort: { id: 1, nombre: 'Aula Exploradores A' },
    nextLiveSession: {
      id: 1,
      titulo: 'Taller en Vivo: Creación de Bots',
      descripcion: 'Acompaña a tu docente a construir tu primer asistente conversacional.',
      tipo: 'taller',
      estado: 'programada',
      fecha_inicio: '2026-09-01T15:00:00Z',
      fecha_fin: '2026-09-01T16:00:00Z',
      enlace_sesion: 'https://meet.google.com/abc-defg-hij',
    },
    nextAction: {
      type: 'mission',
      title: 'Exploración del Núcleo IA',
      experience: { sourceId: 10, sourceTable: 'misiones' },
    },
    upcomingAgendaSummary: { totalEvents: 1, nextSession: '2026-09-01T15:00:00Z' },
    generatedAt: new Date().toISOString(),
  };

  const mockAprendizaje = {
    resumen: { cursosTotales: 1, cursosCompletados: 0, leccionesTotales: 6, leccionesCompletadas: 3, porcentaje: 50 },
    cursos: [
      {
        id: 1,
        titulo: 'Fundamentos de Inteligencia Artificial',
        descripcion: 'Aprende los conceptos base de la IA y cómo interactuar con modelos de lenguaje.',
        portada: '/img/portada-curso.png',
        estado: 'inProgress',
        unidades: [
          {
            id: 1,
            titulo: 'Unidad 1: ¿Qué es la IA?',
            descripcion: 'Conceptos fundamentales y primeros pasos.',
            orden: 1,
            estado: 'completed',
            leccionesCompletadas: 2,
            totalLecciones: 2,
            porcentaje: 100,
            lecciones: [
              { id: 101, titulo: 'Introducción a los agentes', duracionMinutos: 15, estado: 'completed', progresoActual: { estado: 'completed' } },
              { id: 102, titulo: 'Cómo aprenden las máquinas', duracionMinutos: 20, estado: 'completed', progresoActual: { estado: 'completed' } },
            ],
          },
          {
            id: 2,
            titulo: 'Unidad 2: Redes Neuronales y Creatividad',
            descripcion: 'Descubre cómo se generan historias e imágenes.',
            orden: 2,
            estado: 'inProgress',
            leccionesCompletadas: 1,
            totalLecciones: 2,
            porcentaje: 50,
            lecciones: [
              { id: 201, titulo: 'Prompts y generación de texto', duracionMinutos: 25, estado: 'completed', progresoActual: { estado: 'completed' } },
              { id: 202, titulo: 'Ilustración con IA', duracionMinutos: 30, estado: 'notStarted', progresoActual: { estado: 'notStarted' } },
            ],
          },
        ],
      },
    ],
  };

  const mockAgenda = {
    range: { start: '2026-09-01T00:00:00Z', end: '2026-09-30T23:59:59Z' },
    events: [
      {
        id: 1,
        titulo: 'Taller en Vivo: Creación de Bots',
        descripcion: 'Acompaña a tu docente a construir tu primer asistente conversacional.',
        tipo: 'taller',
        estado: 'programada',
        fecha_inicio: '2026-09-01T15:00:00Z',
        fecha_fin: '2026-09-01T16:00:00Z',
        enlace_sesion: 'https://meet.google.com/abc-defg-hij',
      },
      {
        id: 2,
        titulo: 'Asesoría de Proyectos Digitales',
        descripcion: 'Revisión y feedback en vivo sobre tus historias y aplicaciones.',
        tipo: 'asesoria',
        estado: 'programada',
        fecha_inicio: '2026-09-05T17:00:00Z',
        fecha_fin: '2026-09-05T18:00:00Z',
        enlace_sesion: 'https://meet.google.com/xyz-uvwx-rst',
      },
    ],
  };

  const setupPage = async (page) => {
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/alumno/panel')) {
        return route.fulfill({ json: mockPanel });
      }
      if (url.includes('/alumno/home-context')) {
        return route.fulfill({ json: mockHomeContext });
      }
      if (url.includes('/alumno/learning-context')) {
        return route.fulfill({ json: { student: mockUser, currentEnrollment: mockHomeContext.currentEnrollment, activeEnrollments: [mockHomeContext.currentEnrollment], generatedAt: new Date().toISOString() } });
      }
      if (url.includes('/alumno/aprender/mapa')) {
        return route.fulfill({ json: { path: { id: 1, title: 'Ruta Principal' }, milestones: [], nextItem: null, progress: { percentage: 50 }, legacyFallback: false } });
      }
      if (url.includes('/alumno/aprendizaje')) {
        return route.fulfill({ json: mockAprendizaje });
      }
      if (url.includes('/alumno/agenda')) {
        return route.fulfill({ json: mockAgenda });
      }
      if (url.includes('/alumno/rutas')) {
        return route.fulfill({ json: [] });
      }
      if (url.includes('/tienda/premios')) {
        return route.fulfill({ json: { premios: [{ id: 1, nombre: 'Skin Dragón', imagen: null }, { id: 2, nombre: 'Gafas Cyber', imagen: null }] } });
      }
      return route.fulfill({ json: {} });
    });

    await page.addInitScript((user) => {
      localStorage.setItem('daemon_sesion', JSON.stringify({ usuario: user, token: 'token-qa-test' }));
      localStorage.setItem('daemon_token', 'token-qa-test');
      localStorage.setItem('daemon_usuario', JSON.stringify(user));
    }, mockUser);
  };

  // 1. Desktop 1440x900 screenshots
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await setupPage(page);

  console.log('Capturing Screenshot 1: /alumno (Golden Student Inicio)...');
  await page.goto('http://localhost:4200/alumno');
  await page.waitForSelector('.welcome-hero', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01-alumno-inicio-golden-1440.png'), fullPage: false });

  console.log('Capturing Screenshot 2: /alumno with Aprender submenu open...');
  // Click on Aprender trigger in sidebar
  const aprenderBtn = page.locator('#nav-alumno-aprender-trigger, button:has-text("Aprender")').first();
  if (await aprenderBtn.isVisible()) {
    await aprenderBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, '02-alumno-sidebar-aprender-open-1440.png'), fullPage: false });

  console.log('Capturing Screenshot 3: /alumno/aprender (Mis aprendizajes)...');
  await page.goto('http://localhost:4200/alumno/aprender/mis-aprendizajes');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '03-alumno-aprender-mis-aprendizajes-1440.png'), fullPage: false });

  console.log('Capturing Screenshot 4: /alumno/aprender/curso/1 (Learning space)...');
  await page.goto('http://localhost:4200/alumno/aprender/curso/1');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04-alumno-aprender-espacio-curso-1440.png'), fullPage: false });

  console.log('Capturing Screenshot 5: /alumno with Crear submenu open...');
  await page.goto('http://localhost:4200/alumno/crear/proyectos');
  const crearBtn = page.locator('#nav-alumno-crear-trigger, button:has-text("Crear")').first();
  if (await crearBtn.isVisible()) {
    await crearBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, '05-alumno-crear-submenu-open-1440.png'), fullPage: false });

  console.log('Capturing Screenshot 6: /alumno/agenda (Sesiones)...');
  await page.goto('http://localhost:4200/alumno/agenda/sesiones');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '06-alumno-agenda-sesiones-1440.png'), fullPage: false });

  console.log('Capturing Screenshot 7: /alumno/identidad with submenu open...');
  await page.goto('http://localhost:4200/alumno/identidad/resumen');
  const idBtn = page.locator('#nav-alumno-identidad-trigger, button:has-text("Identidad")').first();
  if (await idBtn.isVisible()) {
    await idBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, '07-alumno-identidad-submenu-open-1440.png'), fullPage: false });

  await context.close();

  // 2. Mobile Viewports (430px, 390px)
  console.log('Capturing Screenshot 8: Mobile viewport (430px)...');
  const mobileContext = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const mobilePage = await mobileContext.newPage();
  await setupPage(mobilePage);
  await mobilePage.goto('http://localhost:4200/alumno');
  await mobilePage.waitForSelector('.welcome-hero', { timeout: 10000 });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(outDir, '08-alumno-mobile-430px.png'), fullPage: false });

  console.log('Capturing Additional Responsive: Tablet viewport (834px)...');
  const tabletContext = await browser.newContext({ viewport: { width: 834, height: 1194 } });
  const tabletPage = await tabletContext.newPage();
  await setupPage(tabletPage);
  await tabletPage.goto('http://localhost:4200/alumno');
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: path.join(outDir, '09-alumno-tablet-834px.png'), fullPage: false });

  await mobileContext.close();
  await tabletContext.close();
  await browser.close();

  console.log('All QA screenshots captured successfully in docs/qa/screenshots/!');
  server.close();
  process.exit(0);
});
