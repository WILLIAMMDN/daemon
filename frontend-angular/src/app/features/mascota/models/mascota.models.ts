export type MascotaSlotCodigo =
  | 'fondo'
  | 'espalda'
  | 'piel'
  | 'atuendo'
  | 'ojos'
  | 'rostro'
  | 'cuello'
  | 'cabeza'
  | 'mano'
  | 'aura';

export interface MascotaLienzo {
  ancho: number;
  alto: number;
}

export interface MascotaEspecie {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  asset_base: string;
  asset_miniatura: string;
  lienzo: MascotaLienzo;
}

export interface MascotaCapa {
  id: string | number;
  tipo: 'base' | 'cosmetico';
  slot: string;
  orden: number;
  asset: string;
  alt: string;
}

export interface MascotaCosmetico {
  id: number;
  codigo: string;
  nombre: string;
  slot: MascotaSlotCodigo;
  rareza: 'comun' | 'especial' | 'epico' | 'legendario';
  orden_capa: number;
  asset_capa: string;
  asset_miniatura: string;
  poseido: boolean;
  equipado: boolean;
  compatible: boolean;
  tienda?: { id_premio: number; precio: number; stock: number } | null;
  especies: Array<{ id: number; nombre: string }>;
}

export interface MascotaSlot {
  codigo: MascotaSlotCodigo;
  etiqueta: string;
  orden_sugerido: number;
}

export interface MascotaEstado {
  saldo: number;
  mascota: {
    id: number;
    nombre: string;
    especie: MascotaEspecie;
    capas: MascotaCapa[];
  };
  especies: MascotaEspecie[];
  slots: MascotaSlot[];
  cosmeticos: MascotaCosmetico[];
  resumen: { poseidos: number; equipados: number; disponibles: number };
}
