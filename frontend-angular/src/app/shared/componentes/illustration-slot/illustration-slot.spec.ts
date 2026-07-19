import { TestBed } from '@angular/core/testing';
import { IllustrationSlot } from './illustration-slot';

describe('IllustrationSlot', () => {
  it('preserva la región visual y muestra fallback cuando falla el asset', async () => {
    await TestBed.configureTestingModule({ imports: [IllustrationSlot] }).compileComponents();
    const fixture = TestBed.createComponent(IllustrationSlot);
    fixture.componentRef.setInput('src', '/img/no-existe.webp');
    fixture.componentRef.setInput('alt', 'Guía del catálogo');
    fixture.componentRef.setInput('assetName', 'course-catalog-guide.webp');
    fixture.detectChanges();

    const image = (fixture.nativeElement as HTMLElement).querySelector('img');
    image?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const figure = (fixture.nativeElement as HTMLElement).querySelector('figure');
    expect(figure?.getAttribute('data-asset-name')).toBe('course-catalog-guide.webp');
    expect(figure?.getAttribute('aria-label')).toBe('Guía del catálogo');
    expect(figure?.querySelector('img')).toBeNull();
    expect(figure?.querySelector('.illustration-slot__fallback')).not.toBeNull();
  });

  it('prioriza el asset cuando el slot se encuentra sobre el pliegue', async () => {
    await TestBed.configureTestingModule({ imports: [IllustrationSlot] }).compileComponents();
    const fixture = TestBed.createComponent(IllustrationSlot);
    fixture.componentRef.setInput('src', '/img/hero-monster.png');
    fixture.componentRef.setInput('eager', true);
    fixture.detectChanges();

    const image = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(image?.getAttribute('loading')).toBe('eager');
    expect(image?.getAttribute('fetchpriority')).toBe('high');
  });
});
