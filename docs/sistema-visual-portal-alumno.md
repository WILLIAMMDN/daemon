# Sistema visual del portal alumno

Estado vigente desde el 14 de julio de 2026.

Esta guía define el lenguaje visual que debe conservarse en el portal del
estudiante. Nació después de retirar el primer rediseño basado en degradados,
sombras grandes y formas de demostración. La dirección actual busca que DAEMON
se perciba como un producto educativo terminado, no como un dashboard genérico
ni como una maqueta de gamificación.

## Principios

1. Usar jerarquía clara antes que decoración.
2. Preferir colores sólidos y superficies blancas.
3. Mantener una sola tipografía: Inter.
4. Reservar el color para acciones, estado y progreso.
5. Evitar efectos que reduzcan la lectura: degradados, glassmorphism fuerte,
   sombras profundas y animaciones constantes.
6. Mantener el sidebar actual como identidad de navegación del alumno.
7. Diseñar primero para escritorio y tablet, con adaptación real a móvil.

## Tokens base

Los tokens canónicos viven en `frontend-angular/src/styles.scss`:

```css
--daemon-canvas: #f4f7fb;
--daemon-surface: #ffffff;
--daemon-surface-muted: #f8fafc;
--daemon-border: #e4eaf2;
--daemon-ink: #172033;
--daemon-muted: #667085;
--daemon-primary: #1677ff;
--daemon-primary-dark: #0958d9;
--daemon-success: #12a150;
--daemon-warning: #f5a000;
```

Interpretación:

- `canvas`: fondo general gris azulado.
- `surface`: tarjetas y contenedores principales.
- `surface-muted`: bloques secundarios y metadatos.
- `border`: separación visual ligera.
- `ink`: títulos y cifras importantes.
- `muted`: texto auxiliar.
- `primary`: acción principal y progreso.
- `success`: estados completados.
- `warning`: saldo, DAEMONS y atención moderada.

No introducir una paleta completa y desconectada por módulo. Misiones, ranking,
perfil y tienda deben sentirse como partes del mismo producto. Las experiencias
insignia pueden usar acentos sólidos controlados cuando expresen una categoría,
un estado o una acción y conserven la misma tipografía, estructura e interacción.

## Identidad por experiencia

Coherencia no significa que todas las páginas deban parecer la misma tarjeta
administrativa. Las experiencias centrales de DAEMON pueden construir un
escenario propio con estas reglas:

- usar un hero sólido dentro de la familia azul o azul marino de DAEMON;
- limitar coral, verde, violeta y ámbar a iconos, estado, CTA y bordes de acento;
- mantener Inter, la cuadrícula, la escala de espacios y los radios compartidos;
- permitir profundidad física corta de hasta 5 px en controles lúdicos;
- usar composición, jerarquía e iconografía antes que ilustraciones de relleno;
- representar solo estados reales de sesión o backend, nunca niveles o bloqueos
  ficticios.

`Super Lab` es el primer piloto de esta dirección. Recupera la sensación de
laboratorio y progresión de la arquitectura anterior sin copiar sus degradados,
animaciones constantes ni dependencias visuales rígidas.

## Tipografía

- Familia única: `Inter`.
- Títulos: peso 700 y `letter-spacing: -.025em`.
- Cifras principales: peso 700 u 800.
- Texto de lectura: 400 o 500.
- Etiquetas: 600 o 700, tamaño pequeño y mayúsculas solo cuando mejoren el
  escaneo.

No volver a usar Outfit en el portal alumno. Tampoco mezclar fuentes distintas
para simular una identidad más llamativa.

## Superficies y tarjetas

Reglas actuales:

- Fondo blanco.
- Borde de 1 px con `#e4eaf2`.
- Radio normal entre 12 y 16 px.
- Sin sombra en reposo o con una sombra casi imperceptible.
- Hover opcional con borde azul suave y sombra corta.
- No desplazar las tarjetas de forma exagerada.

El override compartido de NG-ZORRO está en
`frontend-angular/src/styles/_components.scss`, bajo `.student-premium`.

## Header

El header del alumno es una barra blanca compacta. Debe mostrar:

- nivel y progreso de XP;
- XP restante para subir;
- saldo de DAEMONS separado;
- notificaciones;
- identidad resumida del estudiante.

En móvil se reduce a navegación, nivel, saldo y notificaciones. Los textos de
contexto se ocultan antes de comprimir controles hasta volverlos ilegibles.

Archivo principal:

```text
frontend-angular/src/app/core/layouts/layout-alumno/
```

## Sidebar

El sidebar actual se conserva. No fue reemplazado durante el rediseño
correctivo. Sigue siendo el elemento de identidad más fuerte del portal y
mantiene sus rutas, iconos, estado colapsable y navegación móvil.

Antes de cambiarlo, revisar:

```text
frontend-angular/src/app/core/layouts/portal-sidebar.config.ts
frontend-angular/src/app/core/layouts/sidebar-portal/
```

Los IDs del sidebar también son usados por el tour de onboarding. Un cambio de
marcado puede romper el resaltado aunque la navegación siga funcionando.

## Botones, etiquetas y estados

- Acción primaria: azul sólido `#1677ff`.
- Hover primario: `#0958d9`.
- Botones secundarios: fondo blanco, borde suave y texto azul o slate.
- DAEMONS: ámbar suave para saldo; nunca usar ámbar para XP.
- Éxito: verde sólido o fondo verde muy tenue con texto oscuro.
- Error: rojo legible, sin animación continua.

NG-ZORRO aporta comportamiento y accesibilidad. La apariencia final se ajusta
con clases locales y `:host ::ng-deep` cuando el encapsulado lo exige.

Los estados vacíos editoriales usan exclusivamente `app-estado-vacio`, que
compone `nz-empty` con el robot canónico, mensajes contextuales y acciones
reales. No se configura una imagen global de NG-ZORRO porque también afectaría
selects, tablas y controles compactos. El contrato, tamaños y reglas de
redacción están documentados en `docs/estados-vacios-daemon.md`.

## Responsive

Puntos comprobados durante el rediseño:

- Escritorio: 1440 x 900.
- Móvil: 390 x 844.

En móvil:

- el header se simplifica;
- las cuadrículas pasan a una columna;
- el nivel se integra dentro del hero;
- la navegación inferior permanece visible;
- los botones conservan un área táctil mínima de 40 px.

## Prohibiciones del portal alumno

- No usar `linear-gradient` ni `radial-gradient` en sus módulos principales.
- No crear un color de acento diferente para cada pantalla.
- No usar glassmorphism como superficie principal.
- No usar robots o ilustraciones genéricas como relleno. El robot canónico solo
  representa un vacío confirmado mediante `app-estado-vacio`.
- No ocultar información académica detrás de animaciones.
- No convertir el portal en una plantilla administrativa.

## Archivos cubiertos

```text
frontend-angular/src/styles.scss
frontend-angular/src/styles/_components.scss
frontend-angular/src/app/core/layouts/layout-alumno/
frontend-angular/src/app/features/alumno/pages/panel-alumno/
frontend-angular/src/app/features/alumno/pages/perfil-alumno/
frontend-angular/src/app/features/alumno/pages/editar-perfil/
frontend-angular/src/app/features/misiones/pages/
frontend-angular/src/app/features/ranking/pages/ranking/
frontend-angular/src/app/features/tienda/pages/
frontend-angular/src/app/features/herramientas/pages/herramientas/
```

## Verificación rápida

```powershell
cd C:\laragon\www\daemon\frontend-angular
$targets = @(
  'src\app\core\layouts\layout-alumno',
  'src\app\features\alumno',
  'src\app\features\misiones',
  'src\app\features\ranking',
  'src\app\features\tienda',
  'src\styles.scss',
  'src\styles\_components.scss'
)
rg -n -- "linear-gradient|radial-gradient|bg-gradient|Outfit" $targets
npm test -- --runInBand
npm run build
```

La búsqueda no debe encontrar degradados ni Outfit dentro del alcance del
portal alumno. El build debe permanecer por debajo del presupuesto inicial de
1 MB; estilos pesados de tablas, cargas y modales pertenecen a los layouts lazy.
