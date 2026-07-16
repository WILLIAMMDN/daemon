import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';

/**
 * Sustituye una imagen que no pudo cargarse por un recurso local conocido.
 * Si el fallback también falla, emite el evento una sola vez y evita un bucle.
 */
@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  @Input('appImageFallback') fallbackSrc = '';
  @Output() readonly imageFallbackFailed = new EventEmitter<void>();

  private ultimoOrigenFallido = '';

  constructor(
    private readonly elementRef: ElementRef<HTMLImageElement>,
    private readonly renderer: Renderer2,
  ) {}

  @HostListener('error')
  aplicarFallback(): void {
    const imagen = this.elementRef.nativeElement;
    const fallback = this.fallbackSrc.trim();
    const origenActual = imagen.currentSrc || imagen.src || imagen.getAttribute('src') || '';
    const fallbackAbsoluto = fallback
      ? new URL(fallback, imagen.ownerDocument.baseURI).href
      : '';

    if (!fallback || origenActual === fallbackAbsoluto || origenActual === this.ultimoOrigenFallido) {
      this.renderer.setAttribute(imagen, 'data-fallback-failed', 'true');
      this.imageFallbackFailed.emit();
      return;
    }

    this.ultimoOrigenFallido = origenActual;
    this.renderer.setAttribute(imagen, 'data-fallback-applied', 'true');
    this.renderer.setAttribute(imagen, 'src', fallback);
  }
}
