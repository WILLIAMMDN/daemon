# Estructura y Distribución de Componentes DAEMON

Para evitar interfaces colapsadas, barras superpuestas y falta de responsividad, todos los módulos de DAEMON deben seguir estas directrices estructurales.

## 1. El Grid Asimétrico (Sidebar Layout)
Cuando una página tenga contenido principal y una barra lateral de metadatos (Arquetipo Detalle/Editor), **nunca** uses un `flex` simple que pueda apilarse caóticamente.
- **Usa CSS Grid:** `grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]`.
- Esto asegura que el área de trabajo (Editor) ocupe el espacio máximo, y la barra lateral se mantenga fija en proporciones corporativas.

## 2. Barras de Acción (Bottom Bars)
Las barras de guardado/edición que van al fondo de la pantalla son críticas en los editores.
- **Error Amateur:** Usar `fixed bottom-0` sin tener en cuenta el menú lateral principal, lo que causa que la barra flote invadiendo el contenido.
- **Enfoque Profesional:** Usar `sticky bottom-6` o `sticky bottom-8` dentro del contenedor principal (`max-w-page`). Esto crea una barra flotante elegante que solo sigue al scroll dentro del área de lectura/edición, sin tapar la UI global y luciendo mucho más moderna (estilo macOS/iOS).

## 3. Composición de Tarjetas (Cards)
- **Separación de responsabilidades:** No metas toda la información en una sola tarjeta gigante. Divide la información lógicamente (ej. "Progreso", "Visibilidad", "Detalles").
- **Spacing:** Usa `gap-5` o `gap-6` entre tarjetas. El espacio en blanco ("White space") es el secreto de las interfaces premium. Las tarjetas amontonadas gritan "básico".

## 4. Alineación y Centrado (Alignment)
- Los contenedores maestros deben estar siempre centrados usando `max-w-page mx-auto`.
- Los padding de la página principal deben heredar las variables del sistema (`p-page`), lo que garantiza que los márgenes en móviles, tablets y desktops sean idénticos en toda la plataforma.

## 5. Carga y Estados Vacíos
- Toda pantalla debe prever un esqueleto de carga (`story-skeleton`) o un estado vacío (`<app-estado-vacio>`) bellamente diseñado, sin parpadeos bruscos. La plataforma nunca debe verse "rota" mientras espera los datos.
