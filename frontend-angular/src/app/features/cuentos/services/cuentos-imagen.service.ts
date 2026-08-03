import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CuentosImagenService {
  readonly MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
  readonly TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

  validarImagen(file: File): string | null {
    if (!this.TIPOS_IMAGEN.includes(file.type)) {
      return 'Formato no soportado. Usa PNG, JPG, WEBP o GIF.';
    }
    if (file.size > this.MAX_IMAGEN_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return `La imagen pesa ${mb}MB. El máximo permitido es 5MB.`;
    }
    return null;
  }

  comprimirABlob(
    file: File | Blob,
    maxAncho: number,
    maxAlto: number,
    calidad: number,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;
        if (width > maxAncho || height > maxAlto) {
          const ratio = Math.min(maxAncho / width, maxAlto / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto 2D del canvas.'));
          return;
        }
        ctx.fillStyle = 'var(--daemon-on-primary)';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo comprimir la imagen.'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          calidad,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo cargar la imagen. ¿Formato no soportado?'));
      };

      img.src = url;
    });
  }
}
