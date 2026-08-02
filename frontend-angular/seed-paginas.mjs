import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCarHu8PP3LR7mcNHLk_FTN2rhfnUf4FD4',
  authDomain: 'daemon-a41f8.firebaseapp.com',
  projectId: 'daemon-a41f8',
  storageBucket: 'daemon-a41f8.firebasestorage.app',
  messagingSenderId: '516236234992',
  appId: '1:516236234992:web:7811801e0441ee2d46f235',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const plantillasCuentos = [
  {
    titulo: "El Valle de los Ecos Mágicos",
    categoria: "Fantasía",
    portada: "/img/cuentos/template-1.png",
    paginas: [
      { id: "page-1", contenido: "<h1>Un eco del pasado</h1><p>En el corazón de un valle olvidado, las montañas no devolvían tus gritos, sino tus memorias más felices. Cuando un viajero llegó buscando un recuerdo perdido, descubrió que el valle guardaba secretos aún más grandes.</p>", colorFondo: "#ffffff", ilustracion: "/img/cuentos/template-1.png" },
      { id: "page-2", contenido: "<h1>La Cueva de Cristal</h1><p>Las piedras comenzaron a brillar al caer la noche. El viajero, asombrado, tocó una de las rocas y pudo escuchar la voz de su abuelo contándole historias de cuando era niño.</p>", colorFondo: "#fefefe", ilustracion: null }
    ]
  },
  {
    titulo: "Cyber-Aventuras 2099",
    categoria: "Ciencia Ficción",
    portada: "/img/cuentos/template-2.png",
    paginas: [
      { id: "page-1", contenido: "<h1>El chip de la verdad</h1><p>En una metrópolis de neón y lluvia eterna, un joven hacker encontró un disco duro ancestral de la era 'Web 2.0'. Lo que contenía podría liberar a la ciudad del control de las megacorporaciones.</p>", colorFondo: "#ffffff", ilustracion: "/img/cuentos/template-2.png" },
      { id: "page-2", contenido: "<h1>La Huida</h1><p>Los drones de seguridad comenzaron a rodear el edificio. Con solo su teclado y un viejo generador de pulsos EMP, tenía que abrirse paso antes de que borraran su mente.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "El Caballero del Atardecer",
    categoria: "Épico",
    portada: "/img/cuentos/template-3.png",
    paginas: [
      { id: "page-1", contenido: "<h1>La Espada de Fuego</h1><p>Con armadura oxidada pero corazón valiente, Sir Oslac se enfrentó al dragón que oscurecía el cielo. No utilizó fuerza bruta, sino música. Resultó que la bestia solo tenía problemas para dormir.</p>", colorFondo: "#ffffff", ilustracion: "/img/cuentos/template-3.png" },
      { id: "page-2", contenido: "<h1>El Pacto</h1><p>El dragón, ahora calmado, le ofreció una escama dorada en señal de gratitud. Desde ese día, Sir Oslac fue conocido como el domador de bestias, protegiendo el reino con empatía.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "La Criatura del Lago de Cristal",
    categoria: "Misterio",
    portada: "/img/cuentos/cuento-monstruo.png",
    paginas: [
      { id: "page-1", contenido: "<h1>Aguas Silenciosas</h1><p>Nadie se atrevía a nadar en el lago. Se decía que un monstruo robaba los reflejos de las personas. Una tarde, una valiente exploradora decidió sumergirse para averiguar la verdad.</p>", colorFondo: "#ffffff", ilustracion: "/img/cuentos/cuento-monstruo.png" },
      { id: "page-2", contenido: "<h1>El Verdadero Monstruo</h1><p>Bajo el agua, descubrió una civilización antigua atrapada en burbujas de cristal. No era un monstruo, sino guardianes que protegían su ciudad secreta.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "La Llave de los Mundos",
    categoria: "Fantasía",
    portada: "/img/cuentos/hero-decor.jpg",
    paginas: [
      { id: "page-1", contenido: "<h1>El hallazgo</h1><p>En el desván de su abuela, Elara encontró una llave dorada que no encajaba en ninguna puerta de la casa, pero vibraba cuando miraba hacia el bosque.</p>", colorFondo: "#ffffff", ilustracion: "/img/cuentos/hero-decor.jpg" },
      { id: "page-2", contenido: "<h1>El portal</h1><p>Caminó hacia el viejo roble. En su tronco había una cerradura invisible a los ojos humanos. Al girar la llave, la madera se disolvió revelando un cielo violeta.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "El Viaje del Pequeño Gran Monstruo",
    categoria: "Aventura",
    portada: "/img/headers/monster-writer.png",
    paginas: [
      { id: "page-1", contenido: "<h1>Un escritor incomprendido</h1><p>Todos esperaban que Grunk asustara niños, pero él solo quería escribir poesía. Sus grandes garras hacían difícil sostener un lápiz, pero no su pasión.</p>", colorFondo: "#ffffff", ilustracion: "/img/headers/monster-writer.png" },
      { id: "page-2", contenido: "<h1>El festival</h1><p>Llegó el día del festival de talentos monstruosos. Mientras otros mostraban sus rugidos, Grunk recitó un poema sobre la luna que hizo llorar a todos.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "El Reino del Cielo",
    categoria: "Cuento de Hadas",
    portada: "/img/headers/bg-cuento-banner.png",
    paginas: [
      { id: "page-1", contenido: "<h1>Ciudades en las nubes</h1><p>Por encima de la lluvia y las tormentas, flotan las islas de algodón de azúcar donde habitan los guardianes del viento.</p>", colorFondo: "#ffffff", ilustracion: "/img/headers/bg-cuento-banner.png" },
      { id: "page-2", contenido: "<h1>La tormenta perdida</h1><p>Un día, un pequeño huracán se perdió y terminó en el palacio real. El príncipe de las nubes tuvo que ayudarlo a encontrar su camino a casa.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "El Grimorio Perdido",
    categoria: "Magia",
    portada: "/img/headers/hero-editor-magico.jpg",
    paginas: [
      { id: "page-1", contenido: "<h1>La biblioteca infinita</h1><p>Entre millones de tomos polvorientos, un aprendiz de mago buscaba el único libro que no estaba escrito: aquel que escribía tus pensamientos en tiempo real.</p>", colorFondo: "#ffffff", ilustracion: "/img/headers/hero-editor-magico.jpg" },
      { id: "page-2", contenido: "<h1>El secreto</h1><p>Cuando finalmente lo encontró, el libro estaba lleno de advertencias sobre el poder de las palabras, y cómo cada pensamiento podía alterar el universo.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  },
  {
    titulo: "La Leyenda del Dragón de Papel",
    categoria: "Fábula",
    portada: "/img/headers/story-header-bg.png",
    paginas: [
      { id: "page-1", contenido: "<h1>Un origen humilde</h1><p>En el taller de un anciano artesano, un cometa con forma de dragón cobró vida. A diferencia de los dragones reales, él no escupía fuego, sino historias.</p>", colorFondo: "#ffffff", ilustracion: "/img/headers/story-header-bg.png" },
      { id: "page-2", contenido: "<h1>El vuelo</h1><p>Al elevarse por primera vez, las palabras pintadas en sus alas comenzaron a brillar, lloviendo cuentos sobre el pueblo que dormía.</p>", colorFondo: "#ffffff", ilustracion: null }
    ]
  }
];

async function seed() {
  console.log('Obteniendo estudiantes desde la API legacy de DAEMON...');
  const res = await fetch('https://daemon-5vo1.onrender.com/api/v1/cuentos');
  const data = await res.json();
  
  const estudiantesMap = new Map();
  data.forEach(c => {
    if (c.id_alumno && c.autor) {
      estudiantesMap.set(c.id_alumno, {
        id_alumno: c.id_alumno,
        autor: c.autor,
        avatar: c.avatar || '/img/avatars/default.png'
      });
    }
  });
  
  const estudiantes = Array.from(estudiantesMap.values());
  console.log(`Encontrados ${estudiantes.length} estudiantes únicos.`);
  
  console.log("Limpiando base de datos antigua...");
  const cuentosRef = collection(db, "cuentos");
  const viejosSnapshot = await getDocs(cuentosRef);
  let eliminados = 0;
  for (const docSnap of viejosSnapshot.docs) {
    await deleteDoc(docSnap.ref);
    eliminados++;
  }
  console.log(`Borrados ${eliminados} cuentos obsoletos.`);
  
  for (let i = 0; i < estudiantes.length; i++) {
    const estudiante = estudiantes[i];
    const plantilla = plantillasCuentos[i % plantillasCuentos.length];
    
    // Formato exacto de CuentoPayload
    const nuevoCuento = {
      titulo: plantilla.titulo,
      descripcion: "Una historia increíble generada de forma automática.",
      contenido: plantilla.paginas[0].contenido, // Compatibility
      data_1: plantilla.paginas[0].contenido, // Legacy compatibility
      paginas: plantilla.paginas, // Formato multi-página
      categoria: plantilla.categoria,
      rango_edad: "9 - 12 años",
      visibilidad: "publico",
      estado: "publicado",
      portada: plantilla.portada,
      img_1: plantilla.portada, // Legacy compatibility
      palabras: 200,
      tiempo_lectura: 2,
      autor: estudiante.autor,
      avatar: estudiante.avatar,
      id_alumno: estudiante.id_alumno,
      fecha_creacion: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
      reacciones_count: Math.floor(Math.random() * 50) + 1
    };
    
    try {
      await addDoc(cuentosRef, nuevoCuento);
      console.log(`[EXITO] Cuento estructurado multi-página para ${estudiante.autor} insertado.`);
    } catch (e) {
      console.error(`[ERROR] Insertando para ${estudiante.autor}:`, e);
    }
  }
  
  console.log('¡Inyección masiva completada con éxito!');
  process.exit(0);
}

seed();
