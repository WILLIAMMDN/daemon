# Protocolo de colaboración Codex–Antigravity

## Objetivo

Permitir trabajo frontend paralelo sin mezclar cambios incompletos, romper
contratos funcionales ni desplegar directamente una propuesta visual.

## Ramas y responsabilidades

| Superficie | Responsable | Rama |
| --- | --- | --- |
| Implementación visual acotada | Antigravity | `feature/frontend-design-system` o `antigravity/<modulo>` |
| Auditoría, corrección e integración | Codex | `codex/antigravity-integration` |
| Producción | pipeline validado | `main` |

`main` no es una rama de trabajo. Antigravity entrega commits atómicos; Codex
los revisa y los cherry-pickea. Solo una integración con todos los gates en
verde puede proponerse para merge.

## Propiedad temporal de archivos

Cada handoff declara qué archivos posee el agente durante la tarea. El otro
agente no los edita hasta que exista un commit entregado o una liberación
explícita. Los archivos de shell (`layout-*`, `sidebar-portal`, topbars,
interceptores, rutas y estilos globales) requieren propiedad exclusiva porque
afectan muchos módulos.

No se fuerza una sincronización copiando el working tree de la otra IA. Se
intercambian hashes de commit reproducibles.

## Flujo de integración

1. Ambos agentes parten del mismo `origin/main` documentado.
2. Antigravity implementa un solo módulo y ejecuta sus gates.
3. Antigravity actualiza `antigravity-to-codex.md` y entrega un hash.
4. Codex revisa contratos, diff, responsive, accesibilidad y rendimiento.
5. Codex cherry-pickea el commit en `codex/antigravity-integration`.
6. Las correcciones se registran en un commit separado y en
   `codex-to-antigravity.md`.
7. Se abre un PR borrador. No se despliega una rama con archivos sin commit ni
   con gates incompletos.

## Gates mínimos

```text
npm run check:architecture
npm run check:student-visual
npm run test:ci
npm run build
QA 1440×900, 1024×768, 390×844 y 360×800
loading / datos / vacío / error / reintento
teclado / foco / reduced motion / objetivo táctil >= 40 px
```

Para cambios de autenticación, API o backend también se exige la suite Laravel
y una revisión específica de seguridad. Para producción se añaden CI, E2E y
smoke; nunca se asume que un build local autoriza el deploy.

## Decisiones vigentes

- La ficha redundante de usuario no se muestra dentro del sidebar; el enlace
  `Mi perfil` se conserva. La cuenta vive en el topbar.
- El tour del alumno apunta al control `#topbar-perfil`.
- Se conservan el sidebar morado, sus rutas y los IDs de navegación del tour.
- Los `401` de rutas protegidas limpian la sesión; no se silencian para evitar
  un logout.
- Los cambios visuales no pueden retirar funciones ni reemplazar skeletons por
  una pantalla vacía con spinner cuando existe una estructura conocida.

## Conflictos

Si ambos agentes necesitan el mismo archivo, se detiene ese archivo, se entrega
primero el commit del propietario actual y el segundo agente rebasa su trabajo
sobre el commit aceptado. No se resuelven conflictos eligiendo automáticamente
“ours” o “theirs”.
