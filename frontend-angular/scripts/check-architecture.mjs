import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(projectRoot, 'src', 'app');

const reglas = [
  {
    origen: 'shared',
    destinosProhibidos: ['core', 'features'],
    motivo: 'shared debe ser reutilizable y no conocer infraestructura ni módulos de negocio',
  },
  {
    origen: 'core',
    destinosProhibidos: ['features'],
    motivo: 'core no debe depender de una feature concreta',
  },
];

async function listarTypeScript(directorio) {
  const entradas = await readdir(directorio, { withFileTypes: true });
  const archivos = [];

  for (const entrada of entradas) {
    const ruta = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      archivos.push(...await listarTypeScript(ruta));
    } else if (entrada.isFile() && entrada.name.endsWith('.ts')) {
      archivos.push(ruta);
    }
  }

  return archivos;
}

function extraerImports(contenido) {
  const imports = [];
  const patrones = [
    /(?:import|export)\s+(?:[\s\S]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const patron of patrones) {
    let coincidencia;
    while ((coincidencia = patron.exec(contenido)) !== null) {
      imports.push(coincidencia[1]);
    }
  }

  return imports;
}

function estaDentro(ruta, directorio) {
  const relativa = path.relative(directorio, ruta);
  return relativa === '' || (!relativa.startsWith('..') && !path.isAbsolute(relativa));
}

const errores = [];

for (const regla of reglas) {
  const origen = path.join(appRoot, regla.origen);
  const archivos = await listarTypeScript(origen);

  for (const archivo of archivos) {
    const contenido = await readFile(archivo, 'utf8');

    for (const importacion of extraerImports(contenido)) {
      if (!importacion.startsWith('.')) {
        continue;
      }

      const destino = path.resolve(path.dirname(archivo), importacion);
      for (const destinoProhibido of regla.destinosProhibidos) {
        const limite = path.join(appRoot, destinoProhibido);
        if (estaDentro(destino, limite)) {
          errores.push({ archivo, importacion, motivo: regla.motivo });
        }
      }
    }
  }
}

if (errores.length > 0) {
  console.error('Se detectaron dependencias que rompen las capas del frontend:');
  for (const error of errores) {
    console.error(`- ${path.relative(projectRoot, error.archivo)} -> ${error.importacion}`);
    console.error(`  ${error.motivo}`);
  }
  process.exitCode = 1;
} else {
  console.log('Arquitectura frontend válida: shared y core respetan sus límites.');
}
