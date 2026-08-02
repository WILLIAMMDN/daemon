# Sistema de Diseño Premium DAEMON (Technical Guide)

Este documento no es solo teoría; es el manual de ingeniería Frontend para replicar exactamente la potencia inmersiva de la **Galería de Historias** (`galeria-proyectos`), considerada el estándar visual supremo de DAEMON.

Para que las páginas se vean "Super Profesionales" y al nivel de grandes corporaciones (Apple, Vercel, Stripe), los módulos de DAEMON implementan técnicas avanzadas de SCSS que Tailwind puro no cubre. Aquí está el secreto de la receta.

## 1. Gradientes y Profundidad (El Estilo DAEMON)
Las interfaces genéricas usan fondos grises. DAEMON usa un **Glassmorphism inmersivo y gradientes vibrantes**.

**Ejemplo de Botón o Tab Activa (Inmersiva):**
En `galeria-proyectos.scss`, un filtro activo NO usa `bg-primary` de Tailwind. Usa un degradado intenso con sombra teñida para dar el efecto de luz (Glow):
```scss
.story-filters button.active {
  background: linear-gradient(135deg, #6c3fe8 0%, #4f2cc7 100%);
  border-color: transparent;
  color: #fff;
  /* El secreto: Sombra del mismo color del fondo, pero con opacidad (Glow Effect) */
  box-shadow: 0 8px 18px -10px rgba(79, 44, 199, .6);
}
```

## 2. Botones de Alta Conversión (CTAs)
Los botones principales (ej. "Crear cuento") no son simples `btn`. Utilizan la paleta de Acento (Amarillo DAEMON) con bordes suaves, interacción física (TranslateY) y sombras dinámicas.
```scss
.btn-cta-primary {
  background: #ffc414; /* var(--daemon-accent) */
  border: 1px solid #ffc414;
  border-radius: 12px;
  color: #1a1f36;
  font-weight: 800;
  box-shadow: 0 6px 14px -8px rgba(255, 196, 20, .55);
  transition: background .18s ease, transform .18s ease, box-shadow .18s ease;

  &:hover {
    background: #ffd64f;
    transform: translateY(-1px);
    box-shadow: 0 10px 18px -8px rgba(255, 196, 20, .7);
  }
}
```

## 3. Composición 3D y Banners Híbridos (El Secreto de la Cabecera)
El diseño DAEMON rara vez usa imágenes cuadradas planas. Integra **assets 3D flotantes** (monstruos, planetas, robots) que escapan de sus contenedores.

Para replicar tarjetas como "¿Necesitas inspiración?", se usa un fondo espacial + un render 3D posicionado con absolute:
```scss
.story-inspiration-card {
  /* Fondo envolvente usando el asset oficial del header */
  background-image: url('/img/headers/story-header-bg.png');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden; /* Cuidado: si el 3D debe salir de la tarjeta, quitar overflow */
  padding: 1.4rem 1.5rem;
}

.inspiration-art {
  /* El asset 3D flota sobre la tarjeta */
  position: absolute;
  right: -0.5rem;
  bottom: -0.75rem;
  width: clamp(120px, 40%, 160px);
  z-index: 1;
  pointer-events: none;
  /* Sombra para despegar el render 3D del fondo */
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
}
```

## 4. Tarjetas Estructurales (Cards)
La información debe flotar en tarjetas inmaculadas sobre un fondo sutil (`bg-canvas`). 
```scss
.story-card {
  background: #ffffff;
  border: 1px solid rgba(228, 234, 242, 0.8);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); /* Sombra casi imperceptible */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 16px 32px -12px rgba(23, 32, 51, 0.15); /* Sombra fuerte al hover */
    transform: translateY(-4px); /* Levantamiento físico */
  }
}
```

## Regla de Oro para el Desarrollo
No intentes forzar todo esto solo con clases de Tailwind HTML. Si un componente necesita "Brillar" (Glow effects, transiciones físicas fluidas, ilustraciones 3D flotantes), **escribe SCSS custom** basado en estos patrones de `galeria-proyectos.scss`. Así es como las verdaderas empresas mantienen su código limpio y logran vistas súper profesionales.
