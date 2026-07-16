import { ElementRef, Renderer2 } from '@angular/core';
import { ImageFallbackDirective } from './image-fallback.directive';

describe('ImageFallbackDirective', () => {
  let imagen: HTMLImageElement;
  let renderer: Renderer2;
  let directiva: ImageFallbackDirective;

  beforeEach(() => {
    imagen = document.createElement('img');
    renderer = {
      setAttribute: (elemento: Element, nombre: string, valor: string) =>
        elemento.setAttribute(nombre, valor),
    } as Renderer2;
    directiva = new ImageFallbackDirective(new ElementRef(imagen), renderer);
    directiva.fallbackSrc = '/img/bot_default.svg';
  });

  it('reemplaza el recurso roto por el fallback configurado', () => {
    imagen.src = '/img/avatar-inexistente.png';

    directiva.aplicarFallback();

    expect(imagen.getAttribute('src')).toBe('/img/bot_default.svg');
    expect(imagen.getAttribute('data-fallback-applied')).toBe('true');
  });

  it('no crea un bucle cuando también falla el fallback', () => {
    const fallo = jest.fn();
    directiva.imageFallbackFailed.subscribe(fallo);
    imagen.src = '/img/bot_default.svg';

    directiva.aplicarFallback();

    expect(fallo).toHaveBeenCalledTimes(1);
    expect(imagen.getAttribute('data-fallback-failed')).toBe('true');
  });
});
