import { CuentosImagenService } from './cuentos-imagen.service';

describe('CuentosImagenService', () => {
  const service = new CuentosImagenService();

  it('acepta únicamente los MIME de imagen configurados', () => {
    const imagen = new File(['fixture'], 'portada.webp', { type: 'image/webp' });
    const texto = new File(['fixture'], 'portada.txt', { type: 'text/plain' });

    expect(service.validarImagen(imagen)).toBeNull();
    expect(service.validarImagen(texto)).toContain('Formato no soportado');
  });

  it('rechaza archivos que superan el límite centralizado', () => {
    const archivoGrande = new File([new Uint8Array(service.MAX_IMAGEN_BYTES + 1)], 'portada.jpg', {
      type: 'image/jpeg',
    });

    expect(service.validarImagen(archivoGrande)).toContain('máximo permitido es 5MB');
  });
});
