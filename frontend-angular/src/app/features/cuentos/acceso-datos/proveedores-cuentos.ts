import { Provider } from '@angular/core';
import { ActualizarBorradorCasoUso } from '../aplicacion/actualizar-borrador.caso-uso';
import { AsistenteLecturaCuento } from '../aplicacion/asistente-lectura-cuento';
import { ComentarCuentoCasoUso } from '../aplicacion/comentar-cuento.caso-uso';
import { CrearBorradorCasoUso } from '../aplicacion/crear-borrador.caso-uso';
import { EliminarCuentoCasoUso } from '../aplicacion/eliminar-cuento.caso-uso';
import { PublicarCuentoCasoUso } from '../aplicacion/publicar-cuento.caso-uso';
import { ReaccionarCuentoCasoUso } from '../aplicacion/reaccionar-cuento.caso-uso';
import { ACTIVOS_CUENTO_REPOSITORIO } from './activos-cuento.repositorio';
import { ASISTENTE_CUENTO_GATEWAY } from './asistente-cuento.gateway';
import { COMANDOS_CUENTO_GATEWAY } from './comandos-cuento.gateway';
import { CUENTO_REPOSITORIO } from './cuento.repositorio';
import { FirestoreCuentoRepositorio } from './firestore/firestore-cuento.repositorio';
import { FirestoreComandosCuentoGateway } from './firestore/firestore-comandos-cuento.gateway';
import { CuentosIaAdapter } from './http/cuentos-ia.adapter';
import { SupabaseActivosCuentoAdapter } from './storage/supabase-activos-cuento.adapter';

export const PROVEEDORES_CUENTOS: readonly Provider[] = [
  FirestoreCuentoRepositorio,
  FirestoreComandosCuentoGateway,
  CuentosIaAdapter,
  SupabaseActivosCuentoAdapter,
  ActualizarBorradorCasoUso,
  AsistenteLecturaCuento,
  ComentarCuentoCasoUso,
  CrearBorradorCasoUso,
  EliminarCuentoCasoUso,
  PublicarCuentoCasoUso,
  ReaccionarCuentoCasoUso,
  { provide: CUENTO_REPOSITORIO, useExisting: FirestoreCuentoRepositorio },
  { provide: ACTIVOS_CUENTO_REPOSITORIO, useExisting: SupabaseActivosCuentoAdapter },
  { provide: COMANDOS_CUENTO_GATEWAY, useExisting: FirestoreComandosCuentoGateway },
  { provide: ASISTENTE_CUENTO_GATEWAY, useExisting: CuentosIaAdapter },
];