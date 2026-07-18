import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { ActualizacionApp } from './actualizacion-app';

describe('ActualizacionApp', () => {
  const versionUpdates = new Subject<any>();
  const unrecoverable = new Subject<any>();
  const routerEvents = new Subject<any>();
  const listeners = new Map<string, (event: any) => void>();
  const storage = new Map<string, string>();
  const reload = jest.fn();
  const checkForUpdate = jest.fn<Promise<boolean>, []>();
  const activateUpdate = jest.fn<Promise<boolean>, []>();

  const fakeWindow = {
    addEventListener: jest.fn((type: string, listener: (event: any) => void) => listeners.set(type, listener)),
    removeEventListener: jest.fn((type: string) => listeners.delete(type)),
    location: { reload },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  };

  beforeEach(() => {
    listeners.clear();
    storage.clear();
    jest.clearAllMocks();
    checkForUpdate.mockResolvedValue(true);
    activateUpdate.mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        ActualizacionApp,
        { provide: DOCUMENT, useValue: { defaultView: fakeWindow } },
        { provide: Router, useValue: { events: routerEvents } },
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: true,
            versionUpdates,
            unrecoverable,
            checkForUpdate,
            activateUpdate,
          },
        },
      ],
    });
  });

  it('revisa actualizaciones sin recargar una sesión sana', async () => {
    const service = TestBed.inject(ActualizacionApp);
    service.iniciar();
    await Promise.resolve();

    expect(checkForUpdate).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('activa la versión nueva y recarga una sola vez si falla un chunk', async () => {
    const service = TestBed.inject(ActualizacionApp);
    service.iniciar();

    listeners.get('unhandledrejection')?.({
      reason: new TypeError('Failed to fetch dynamically imported module: chunk-old.js'),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(activateUpdate).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.has('daemon_chunk_recovery_at')).toBe(true);
  });

  it('no recarga por errores ajenos a la carga de módulos', async () => {
    const service = TestBed.inject(ActualizacionApp);
    service.iniciar();

    listeners.get('error')?.({ error: new Error('Validación de formulario') });
    await Promise.resolve();

    expect(activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});
