# Estados vacíos de DAEMON

Estado vigente desde el 19 de julio de 2026.

DAEMON usa un único contrato visual para representar una colección válida que
todavía no contiene elementos. La implementación canónica es el componente
standalone `app-estado-vacio`, construido sobre `nz-empty` de NG-ZORRO.

## Qué representa

Un estado vacío confirma que la consulta terminó correctamente y devolvió cero
resultados. No reemplaza:

- la carga inicial o una actualización en curso;
- un error de red, permisos o servidor;
- un campo multimedia todavía sin completar;
- una instrucción, bloqueo o logro completado que tenga semántica propia.

Carga, error y vacío deben seguir siendo estados mutuamente excluyentes. Si una
actualización falla pero existen datos anteriores, se conservan esos datos y se
muestra un aviso; no se sustituye el contenido por el robot.

## Implementación canónica

```html
<app-estado-vacio
  titulo="Tu próxima misión está en camino"
  descripcion="Ahora no hay misiones activas para tu nivel."
>
  <button nz-button nzType="primary" type="button">Actualizar misiones</button>
</app-estado-vacio>
```

Contrato disponible:

| Entrada | Uso |
| --- | --- |
| `titulo` | Explica el estado sin culpar al usuario. |
| `descripcion` | Indica por qué está vacío, qué ocurrirá o qué puede hacer. |
| `tamano` | `default`, `compact` o `mini`, según el espacio disponible. |
| `compacto` | Alias heredado de `tamano="compact"`. |
| `imagen` | Excepción documentada; por defecto usa el robot canónico. |
| `anunciar` | Controla `aria-live`; se desactiva en popovers ya anunciados. |

Las acciones se proyectan en el footer de `nz-empty`. Debe existir una sola
acción primaria. Una acción secundaria solo se agrega cuando ofrece una ruta
real y distinta; nunca se inventa una acción para llenar espacio.

## Tamaños

- `default`: páginas y paneles principales.
- `compact`: tarjetas, pestañas, resultados filtrados e inventarios.
- `mini`: popovers y superficies de muy poca altura, como notificaciones.

En móvil las acciones ocupan el ancho disponible y mantienen un área táctil
legible. La tipografía sigue siendo Inter, igual que el resto del portal; los
controles y la estructura accesible provienen de NG-ZORRO.

## Ilustración canónica

```text
frontend-angular/public/img/empty/empty-robot.webp
```

- Fuente entregada: PNG transparente de 1254 × 1254 px.
- Salida: WebP lossless transparente, 288 774 bytes.
- Reducción frente al PNG original: 52,8 %.
- Diferencia de píxeles decodificados: cero.
- SHA-256: `9813FCC986580ACDB395E70B0900A1A8DF8A83ED612857D3D59EC66FED6236CA`.

No se generó un SVG automático. La ilustración tiene volumen 3D, iluminación,
sombras y transparencias; vectorizarla produciría una malla enorme o una
aproximación visual distinta. El WebP lossless conserva exactamente el robot y
reduce de forma material el peso de descarga. Si el recurso falla, el
componente muestra un fallback SVG liviano sin exponer texto alternativo
redundante: el título y la descripción ya comunican el estado.

## Redacción

1. El título describe qué ocurrirá: “Tu primera insignia está por llegar”.
2. La descripción explica el origen o siguiente paso con lenguaje breve.
3. El botón usa un verbo concreto: “Actualizar cursos”, “Ver misiones”.
4. No usar mensajes técnicos, bromas ambiguas ni expresiones que parezcan error.
5. Adaptar pronombres cuando se consulta el perfil de otra persona.

## Decisión sobre configuración global

NG-ZORRO permite configurar una imagen vacía global. DAEMON no lo hace porque
también afectaría vacíos internos de selects, tablas y otros controles compactos,
donde este robot sería desproporcionado. Los vacíos editoriales se declaran con
`app-estado-vacio`; los controles internos conservan el comportamiento estándar
de la librería.

## Verificación mínima

```powershell
cd frontend-angular
npm test -- --runInBand src/app/shared/componentes/estado-vacio/estado-vacio.spec.ts
npm run check:architecture
npm run build
```

La prueba compartida comprueba la imagen canónica, el contenido contextual, la
acción proyectada y el fallback ante un recurso roto.
