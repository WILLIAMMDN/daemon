# Sistema de criaturas y cosméticos DAEMON

## Objetivo

Este módulo convierte a la criatura del estudiante en una colección visual
extensible sin acoplar el arte al código. DAEMON no genera personajes: el
equipo creativo publica bases y capas, y la plataforma se ocupa de catálogo,
compatibilidad, compra, inventario, equipamiento y render.

La moneda gastable es `usuarios.tokens` (DAEMONS). La experiencia
`usuarios.experiencia`, el nivel y el ranking nunca se descuentan.

## Flujo de contenido

1. Crear el arte base y sus accesorios usando el contrato de lienzo descrito
   abajo.
2. Copiar los archivos versionados a
   `frontend-angular/public/img/mascotas/{codigo-especie}/` y desplegar el
   frontend. También se admite una ruta `uploads/` pública administrada por
   Supabase Storage.
3. En **Docente > Tienda**, una cuenta administradora registra la especie base.
4. Crear un premio con entrega **Cosmético para criatura** y completar código,
   ranura, rareza, capa, orden y especies compatibles.
5. El estudiante compra el premio con DAEMONS. La misma transacción descuenta
   saldo, reduce stock, crea el canje y otorga la pieza al inventario.
6. La pieza aparece en **Alumno > Mi criatura** y puede equiparse o retirarse.

## Contrato visual para artistas

Cada especie define un lienzo maestro. La especie inicial usa `1024 × 1024`.

- Base, skins y accesorios deben tener exactamente el mismo ancho, alto,
  encuadre y origen `(0,0)`.
- No recortar ni aplicar *trim* automático al espacio transparente.
- Exportar capas en WebP lossless o PNG con transparencia real. No usar JPEG.
- Evitar SVG de origen no confiable. Para contenido administrado, preferir
  WebP/PNG optimizado.
- La miniatura recomendada es cuadrada, de `320 × 320`, con el objeto centrado.
- Presupuesto recomendado: hasta 350 KB para una capa de 1024 px y 80 KB para
  una miniatura. El vestidor carga primero la base y lo equipado; el resto usa
  carga diferida.
- Convención de rutas:

```text
img/mascotas/{especie}/base.webp
img/mascotas/{especie}/miniatura.webp
img/mascotas/{especie}/{slot}/{codigo-cosmetico}.webp
img/mascotas/{especie}/{slot}/{codigo-cosmetico}-thumb.webp
```

Las ranuras disponibles y su orden inicial son:

| Ranura | Orden sugerido | Uso |
|---|---:|---|
| `fondo` | -100 | Escenario detrás de la criatura |
| `espalda` | -10 | Alas, mochilas, capas traseras |
| base | 0 | Cuerpo principal de la especie |
| `piel` | 10 | Skin que cubre o modifica el cuerpo |
| `atuendo` | 20 | Ropa principal |
| `ojos` | 30 | Lentes, visores y expresiones |
| `rostro` | 35 | Máscaras, maquillaje, hocico |
| `cuello` | 40 | Collares, medallas, bufandas |
| `cabeza` | 50 | Sombreros, cascos, coronas |
| `mano` | 60 | Herramientas u objetos sostenidos |
| `aura` | 100 | Partículas o marcos frontales |

El orden puede ajustarse por cosmético. El render siempre ordena las capas por
este valor; por eso un archivo nuevo no requiere cambios en Angular.

## Modelo de datos

- `mascota_especies`: catálogo de cuerpos base y dimensiones del lienzo.
- `mascota_cosmeticos`: metadatos de la capa, ranura, rareza y premio asociado.
- `mascota_compatibilidades`: relación explícita entre cosmético y especies.
- `mascotas_alumnos`: criatura y nombre seleccionados por cada estudiante.
- `mascota_inventario`: propiedad permanente del cosmético, con fuente y canje.
- `mascota_equipamientos`: una pieza equipada por ranura y criatura.

Las restricciones únicas impiden duplicar propiedad y equipar dos piezas en la
misma ranura. Las claves foráneas conservan integridad referencial. El backend
valida además propiedad, compatibilidad, ranura y disponibilidad.

## Reglas de economía y seguridad

- El backend es la única autoridad para compras y equipamiento.
- La compra bloquea usuario, premio y cosmético dentro de una transacción.
- Una compra repetida se rechaza antes de descontar DAEMONS o stock.
- Cambiar de especie quita solo las piezas incompatibles del look; nunca las
  elimina del inventario del estudiante.
- Un cosmético ya otorgado no puede convertirse en premio físico ni eliminarse
  como si nunca hubiese existido. Debe ocultarse del catálogo con `activo`.
- No se guardan datos de pago, conversación, navegación o vigilancia. El módulo
  conserva únicamente selección visual, inventario y procedencia del canje.

## API

Estudiante:

```text
GET    /api/v1/mascota
PATCH  /api/v1/mascota
POST   /api/v1/mascota/equipar
DELETE /api/v1/mascota/equipamiento/{slot}
```

Administración:

```text
GET  /api/v1/mascota/admin/catalogo
POST /api/v1/mascota/admin/especies
PUT  /api/v1/mascota/admin/especies/{id}
```

Los cosméticos se crean y actualizan junto al premio mediante los endpoints de
tienda existentes. Así no puede publicarse un artículo comprable sin su ficha
visual ni aparece una economía paralela.

## Evolución prevista

El modelo admite nuevas especies y miles de cosméticos sin migraciones por cada
asset. Si más adelante se agregan animaciones, se debe versionar el contrato de
render (por ejemplo, hojas de sprites o Rive por especie) manteniendo las mismas
entidades de propiedad, compatibilidad y equipamiento.
