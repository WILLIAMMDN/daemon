// Read-only post-deployment acceptance. A SPA rewrite can return 200 HTML;
// an image/PDF response at a retired URL must still fail the deployment gate.
const sites = ['https://daemonarc.web.app', 'https://daemonestudiante.web.app'];
const paths = [
  '/uploads/tareas/tarea_7_24_1769779763.png',
  '/img/premios/premio_697cad1bea665.png',
];
let failed = false;
for (const site of sites) {
  for (const path of paths) {
    for (const revalidate of [false, true]) {
      try {
        const response = await fetch(`${site}${path}`, {
          method: 'HEAD',
          headers: revalidate ? { 'Cache-Control': 'no-cache' } : {},
          signal: AbortSignal.timeout(20000),
        });
        const type = response.headers.get('content-type') ?? '';
        const unavailable = [401, 403, 404, 410].includes(response.status)
          || (response.status === 200 && type.startsWith('text/html'));
        console.log(`${unavailable ? 'PASS' : 'FAIL'} ${site}${path} (${revalidate ? 'revalidated' : 'ordinary'}): ${response.status} ${type}`);
        failed ||= !unavailable;
      } catch {
        console.error(`FAIL ${site}${path}: verification unavailable`);
        failed = true;
      }
    }
  }
}
process.exitCode = failed ? 1 : 0;
