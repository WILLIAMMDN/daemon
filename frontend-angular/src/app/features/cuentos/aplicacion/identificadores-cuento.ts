export function crearClaveIdempotencia(prefijo: string): string {
  const cryptoDisponible = globalThis.crypto;
  if (cryptoDisponible?.randomUUID) return `${prefijo}:${cryptoDisponible.randomUUID()}`;

  const bytes = new Uint8Array(16);
  cryptoDisponible?.getRandomValues(bytes);
  const aleatorio = Array.from(bytes, (valor) => valor.toString(16).padStart(2, '0')).join('');
  if (!aleatorio || /^0+$/.test(aleatorio)) {
    throw new Error('El navegador no ofrece un generador criptográfico de identificadores.');
  }
  return `${prefijo}:${aleatorio}`;
}

export function crearIdPagina(): string {
  return crearClaveIdempotencia('pagina').replace(':', '-');
}
