<?php

use App\Http\Controllers\Api\V1\AcademicoController;
use App\Http\Controllers\Api\V1\AlumnoAdminController;
use App\Http\Controllers\Api\V1\AlumnoController;
use App\Http\Controllers\Api\V1\ArchivoAdminController;
use App\Http\Controllers\Api\V1\ArchivoController;
use App\Http\Controllers\Api\V1\AutenticacionController;
use App\Http\Controllers\Api\V1\BienestarDigitalController;
use App\Http\Controllers\Api\V1\CertificadoController;
use App\Http\Controllers\Api\V1\ChatbotController;
use App\Http\Controllers\Api\V1\CompetenciaController;
use App\Http\Controllers\Api\V1\ComunidadController;
use App\Http\Controllers\Api\V1\CuentoController;
use App\Http\Controllers\Api\V1\DocenteController;
use App\Http\Controllers\Api\V1\EvaluacionController;
use App\Http\Controllers\Api\V1\IaModeloAdminController;
use App\Http\Controllers\Api\V1\InstitucionController;
use App\Http\Controllers\Api\V1\InteroperabilidadAdminController;
use App\Http\Controllers\Api\V1\MascotaCatalogoController;
use App\Http\Controllers\Api\V1\MascotaController;
use App\Http\Controllers\Api\V1\MisionController;
use App\Http\Controllers\Api\V1\NotificacionController;
use App\Http\Controllers\Api\V1\PrivacidadController;
use App\Http\Controllers\Api\V1\RankingController;
use App\Http\Controllers\Api\V1\SaludController;
use App\Http\Controllers\Api\V1\SeguridadComunidadController;
use App\Http\Controllers\Api\V1\TelemetriaController;
use App\Http\Controllers\Api\V1\TiendaController;
use App\Http\Controllers\Api\V1\TutorPortalController;
use App\Http\Controllers\Api\V1\ProyectoController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/salud', SaludController::class);
    Route::post('/auth/login', [AutenticacionController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/registro', [AutenticacionController::class, 'registro'])->middleware('throttle:5,1');
    Route::post('/auth/recuperar', [AutenticacionController::class, 'recuperar'])->middleware('throttle:5,1');
    Route::post('/auth/confirmar-reset', [AutenticacionController::class, 'confirmarReset'])->middleware('throttle:10,1');
    Route::post('/auth/confirmar-verificar', [AutenticacionController::class, 'confirmarVerificacion'])->middleware('throttle:10,1');
    Route::post('/auth/firebase', [AutenticacionController::class, 'firebase'])->middleware('throttle:10,1');
    Route::post('/auth/firebase/vincular-legacy', [AutenticacionController::class, 'vincularCuentaLegacyFirebase'])->middleware('throttle:5,1');
    Route::post('/auth/tutor/firebase', [AutenticacionController::class, 'firebaseTutor'])->middleware('throttle:10,1');
    Route::post('/auth/firebase/perfil', [AutenticacionController::class, 'completarPerfilFirebase'])->middleware('throttle:10,1');
    Route::post('/auth/google', [AutenticacionController::class, 'google'])->middleware('throttle:10,1');
    Route::get('/cuentos', [CuentoController::class, 'index']);
    Route::get('/cuentos/{cuento}', [CuentoController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/yo', [AutenticacionController::class, 'yo']);
        Route::post('/auth/logout', [AutenticacionController::class, 'logout']);
        Route::post('/auth/cambiar-clave', [AutenticacionController::class, 'cambiarClave'])->middleware('throttle:5,1');
        Route::post('/auth/enviar-verificacion', [AutenticacionController::class, 'enviarVerificacion'])->middleware('throttle:5,1');
        Route::patch('/auth/me/perfil', [AutenticacionController::class, 'completarPerfil'])->middleware('throttle:10,1');
        Route::post('/auth/me/tour', [AutenticacionController::class, 'completarTour'])->middleware('throttle:10,1');
        Route::post('/auth/me/sync-password', [AutenticacionController::class, 'sincronizarClave'])->middleware('throttle:5,1');
        Route::get('/privacidad/exportar', [PrivacidadController::class, 'exportar'])->middleware('throttle:3,60');
        Route::post('/privacidad/eliminacion', [PrivacidadController::class, 'solicitarEliminacion'])->middleware('throttle:3,60');
        Route::post('/auth/google/perfil', [AutenticacionController::class, 'completarPerfilGoogle'])->middleware('throttle:10,1');
        Route::post('/auth/usuarios', [AutenticacionController::class, 'crearUsuario'])->middleware('role:admin');
        Route::post('/telemetria/eventos', [TelemetriaController::class, 'store'])->middleware('throttle:120,1');
        Route::post('/comunidad/reportes', [SeguridadComunidadController::class, 'reportar'])->middleware('throttle:10,1');
        Route::post('/comunidad/bloqueos/{usuario}', [SeguridadComunidadController::class, 'bloquear'])->middleware('throttle:30,1');
        Route::delete('/comunidad/bloqueos/{usuario}', [SeguridadComunidadController::class, 'desbloquear'])->middleware('throttle:30,1');

        Route::get('/notificaciones', [NotificacionController::class, 'index']);
        Route::post('/notificaciones/marcar-todas', [NotificacionController::class, 'marcarTodasLeidas']);
        Route::post('/notificaciones/{notificacion}/marcar-leida', [NotificacionController::class, 'marcarLeida']);

        Route::middleware('role:alumno')->group(function (): void {
            Route::get('/alumno/panel', [AlumnoController::class, 'panel']);
            Route::get('/alumno/proyectos', [ProyectoController::class, 'index']);
            Route::get('/alumno/aprendizaje', [AcademicoController::class, 'alumno']);
            Route::put('/alumno/aprendizaje/lecciones/{leccion}/progreso', [AcademicoController::class, 'progreso'])->middleware('throttle:60,1');
            Route::get('/ranking', [RankingController::class, 'index']);
            Route::get('/alumno/bienestar-digital', [BienestarDigitalController::class, 'estado']);
            Route::post('/alumno/bienestar-digital/latido', [BienestarDigitalController::class, 'latido'])->middleware('throttle:90,1');
            Route::get('/alumno/perfil/{usuario?}', [AlumnoController::class, 'perfil']);
            Route::post('/alumno/perfil', [AlumnoController::class, 'actualizarPerfil']);
            Route::get('/tienda', [TiendaController::class, 'index']);
            Route::post('/tienda/canjear/{premio}', [TiendaController::class, 'canjear']);
            Route::get('/tienda/canjes', [TiendaController::class, 'canjes']);
            Route::get('/mascota', [MascotaController::class, 'show']);
            Route::patch('/mascota', [MascotaController::class, 'update'])->middleware('throttle:30,1');
            Route::post('/mascota/equipar', [MascotaController::class, 'equipar'])->middleware('throttle:60,1');
            Route::delete('/mascota/equipamiento/{slot}', [MascotaController::class, 'quitar'])->middleware('throttle:60,1');
            Route::get('/evaluaciones/activas', [EvaluacionController::class, 'activas']);
            Route::post('/evaluaciones/{evaluacion}/responder', [EvaluacionController::class, 'responder']);
            Route::post('/competencia/votar', [CompetenciaController::class, 'votar']);
            Route::get('/cuentos/mio/actual', [CuentoController::class, 'mio']);
            Route::post('/cuentos', [CuentoController::class, 'guardar'])->middleware('throttle:20,1');
            Route::delete('/cuentos/mio', [CuentoController::class, 'eliminarPropio']);
            Route::get('/chatbot/bot', [ChatbotController::class, 'bot']);
            Route::post('/chatbot/bot', [ChatbotController::class, 'guardarBot']);
            Route::get('/chatbot/mensajes', [ChatbotController::class, 'mensajes']);
            Route::get('/chatbot/modelos', [ChatbotController::class, 'modelos']);
            Route::post('/chatbot/mensajes', [ChatbotController::class, 'chat']);
            Route::delete('/chatbot/mensajes', [ChatbotController::class, 'limpiar']);
            Route::get('/chatbot/cerebro', [ChatbotController::class, 'cargarCerebro']);
            Route::post('/chatbot/cerebro', [ChatbotController::class, 'guardarCerebro']);
        });

        Route::middleware('role:tutor')->prefix('tutor')->group(function (): void {
            Route::get('/invitaciones', [TutorPortalController::class, 'invitaciones']);
            Route::post('/invitaciones/{consentimiento}/aceptar', [TutorPortalController::class, 'aceptar'])->middleware('throttle:10,1');
            Route::get('/panel', [TutorPortalController::class, 'panel']);
            Route::put('/alumnos/{alumno}/limite-pantalla', [TutorPortalController::class, 'actualizarLimite'])->middleware('throttle:20,1');
        });

        Route::middleware('role:docente,admin')->group(function (): void {
            Route::prefix('academico')->group(function (): void {
                Route::get('/', [AcademicoController::class, 'catalogo']);
                Route::post('/periodos', [AcademicoController::class, 'crearPeriodo']);
                Route::post('/cursos', [AcademicoController::class, 'crearCurso']);
                Route::put('/cursos/{curso}', [AcademicoController::class, 'actualizarCurso']);
                Route::post('/cursos/{curso}/unidades', [AcademicoController::class, 'crearUnidad']);
                Route::put('/unidades/{unidad}', [AcademicoController::class, 'actualizarUnidad']);
                Route::post('/unidades/{unidad}/lecciones', [AcademicoController::class, 'crearLeccion']);
                Route::put('/lecciones/{leccion}', [AcademicoController::class, 'actualizarLeccion']);
                Route::post('/objetivos', [AcademicoController::class, 'crearObjetivo']);
                Route::put('/aulas/{aula}/curso', [AcademicoController::class, 'vincularAula']);
                Route::post('/aulas/{aula}/usuarios/{usuario}', [AcademicoController::class, 'matricular']);
            });
            Route::get('/docente/panel', [DocenteController::class, 'panel']);
            Route::get('/docente/alumnos', [DocenteController::class, 'alumnos']);
            Route::get('/docente/docentes', [DocenteController::class, 'docentes']);
            Route::get('/docente/aulas', [DocenteController::class, 'aulas']);
            Route::post('/docente/aulas', [DocenteController::class, 'crearAula']);
            Route::put('/docente/aulas/{aula}', [DocenteController::class, 'actualizarAula']);
            Route::delete('/docente/aulas/{aula}', [DocenteController::class, 'eliminarAula']);
            Route::patch('/docente/usuarios/{usuario}/aula', [DocenteController::class, 'asignarAulaUsuario']);
            Route::get('/cuentos/admin', [CuentoController::class, 'adminIndex']);
            Route::put('/cuentos/{cuento}', [CuentoController::class, 'adminUpdate']);
            Route::delete('/cuentos/{cuento}', [CuentoController::class, 'adminDestroy']);
            Route::post('/cuentos/{cuento}/publicar', [CuentoController::class, 'adminPublicar']);
            Route::post('/docente/tokens', [DocenteController::class, 'asignarTokens']);
            Route::get('/docente/historial-tokens', [DocenteController::class, 'historialTokens']);
            Route::apiResource('/docente/insignias', DocenteController::class)->only(['store', 'update', 'destroy']);
            Route::get('/docente/insignias', [DocenteController::class, 'insignias']);
            Route::post('/docente/insignias/asignar', [DocenteController::class, 'asignarInsignia']);

            Route::middleware('role:admin')->prefix('privacidad/admin')->group(function (): void {
                Route::get('/solicitudes', [PrivacidadController::class, 'solicitudes']);
                Route::patch('/solicitudes/{solicitud}', [PrivacidadController::class, 'resolver']);
            });

            Route::middleware('role:admin')->prefix('moderacion/admin')->group(function (): void {
                Route::get('/reportes', [SeguridadComunidadController::class, 'reportes']);
                Route::patch('/reportes/{reporte}', [SeguridadComunidadController::class, 'resolver']);
            });

            Route::apiResource('instituciones', InstitucionController::class);

            Route::middleware('role:admin')->prefix('interoperabilidad/admin')->group(function (): void {
                Route::get('/', [InteroperabilidadAdminController::class, 'index']);
                Route::post('/oneroster/clientes', [InteroperabilidadAdminController::class, 'crearClienteOneRoster'])->middleware('throttle:10,1');
                Route::delete('/oneroster/clientes/{cliente}', [InteroperabilidadAdminController::class, 'revocarClienteOneRoster']);
                Route::post('/lti/registros', [InteroperabilidadAdminController::class, 'crearRegistroLti'])->middleware('throttle:10,1');
                Route::post('/lti/registros/{registro}/verificar', [InteroperabilidadAdminController::class, 'verificarRegistroLti'])->middleware('throttle:10,1');
                Route::post('/lti/registros/{registro}/vinculos', [InteroperabilidadAdminController::class, 'vincularUsuarioLti'])->middleware('throttle:20,1');
            });

            Route::middleware('role:admin')->prefix('archivos/admin')->group(function (): void {
                Route::get('/', [ArchivoAdminController::class, 'index']);
                Route::get('/prefijos', [ArchivoAdminController::class, 'prefijos']);
                Route::delete('/', [ArchivoAdminController::class, 'destroy']);
                Route::delete('/bulk', [ArchivoAdminController::class, 'destroyBulk']);
            });

            Route::middleware('role:admin')->prefix('alumnos/admin')->group(function (): void {
                Route::get('/', [AlumnoAdminController::class, 'index']);
                Route::get('/estadisticas', [AlumnoAdminController::class, 'estadisticas']);
                Route::post('/', [AlumnoAdminController::class, 'store']);
                Route::get('/{usuario}', [AlumnoAdminController::class, 'show']);
                Route::put('/{usuario}', [AlumnoAdminController::class, 'update']);
                Route::delete('/{usuario}', [AlumnoAdminController::class, 'destroy']);
                Route::post('/{usuario}/resetear-clave', [AlumnoAdminController::class, 'resetearClave']);
            });

            Route::middleware('role:admin')->prefix('ia-modelos/admin')->group(function (): void {
                Route::get('/', [IaModeloAdminController::class, 'index']);
                Route::get('/estadisticas', [IaModeloAdminController::class, 'estadisticas']);
                Route::post('/', [IaModeloAdminController::class, 'store']);
                Route::get('/{modelo}', [IaModeloAdminController::class, 'show']);
                Route::put('/{modelo}', [IaModeloAdminController::class, 'update']);
                Route::delete('/bulk', [IaModeloAdminController::class, 'destroyBulk']);
                Route::delete('/{modelo}', [IaModeloAdminController::class, 'destroy']);
            });

            Route::middleware('role:admin')->prefix('mascota/admin')->group(function (): void {
                Route::get('/catalogo', [MascotaCatalogoController::class, 'index']);
                Route::post('/especies', [MascotaCatalogoController::class, 'store']);
                Route::put('/especies/{especie}', [MascotaCatalogoController::class, 'update']);
            });

            Route::get('/chatbot/admin/bots', [ChatbotController::class, 'adminIndex']);
            Route::get('/chatbot/admin/bots/{bot}', [ChatbotController::class, 'adminShow']);
            Route::put('/chatbot/admin/bots/{bot}', [ChatbotController::class, 'adminUpdate']);
            Route::delete('/chatbot/admin/bots/{bot}', [ChatbotController::class, 'adminDestroy']);
            Route::post('/chatbot/admin/bots/{bot}/limpiar-chat', [ChatbotController::class, 'adminLimpiarChat']);

            Route::post('/misiones', [MisionController::class, 'store']);
            Route::get('/misiones/entregas', [MisionController::class, 'entregas']);
            Route::put('/misiones/{mision}', [MisionController::class, 'update']);
            Route::delete('/misiones/{mision}', [MisionController::class, 'destroy']);
            Route::post('/misiones/bulk-destroy', [MisionController::class, 'bulkDestroy']);
            Route::post('/misiones/entregas/{entrega}/revisar', [MisionController::class, 'revisar']);

            Route::get('/tienda/administrar', [TiendaController::class, 'administrar']);
            Route::post('/tienda/premios', [TiendaController::class, 'store']);
            Route::put('/tienda/premios/{premio}', [TiendaController::class, 'update']);
            Route::delete('/tienda/premios/{premio}', [TiendaController::class, 'destroy']);
            Route::post('/tienda/canjes/{canje}/entregar', [TiendaController::class, 'entregar']);

            Route::get('/evaluaciones', [EvaluacionController::class, 'index']);
            Route::post('/evaluaciones', [EvaluacionController::class, 'store']);
            Route::put('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'update']);
            Route::delete('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'destroy']);
            Route::post('/evaluaciones/{evaluacion}/publicar', [EvaluacionController::class, 'publicar']);
            Route::post('/evaluaciones/{evaluacion}/despublicar', [EvaluacionController::class, 'despublicar']);
            Route::post('/evaluaciones/{evaluacion}/preguntas', [EvaluacionController::class, 'guardarPreguntas']);

            Route::post('/competencia/control', [CompetenciaController::class, 'control']);
            Route::get('/competencia/historial', [CompetenciaController::class, 'historial']);
        });

        Route::middleware('role:alumno,docente,admin')->group(function (): void {
            Route::get('/misiones', [MisionController::class, 'index']);
            Route::get('/misiones/{mision}', [MisionController::class, 'show']);
            Route::get('/evaluaciones/resultados', [EvaluacionController::class, 'resultados']);
            Route::get('/competencia/estado', [CompetenciaController::class, 'estado']);
            Route::get('/competencia/chat', [CompetenciaController::class, 'chat']);
            Route::post('/competencia/chat', [CompetenciaController::class, 'enviarChat']);
            Route::get('/comunidad', [AlumnoController::class, 'comunidad']);
            Route::post('/misiones/{mision}/entregar', [MisionController::class, 'entregar'])->middleware(['role:alumno', 'throttle:20,1']);
            Route::post('/archivos', [ArchivoController::class, 'store'])->middleware('throttle:20,1');
            Route::get('/certificados/{usuario?}', [CertificadoController::class, 'show']);

            Route::middleware('role:docente,admin')->prefix('comunidad')->group(function (): void {
                Route::get('/mensajes', [ComunidadController::class, 'mensajes']);
                Route::get('/mensajes/estadisticas', [ComunidadController::class, 'estadisticas']);
                Route::post('/mensajes', [ComunidadController::class, 'crearMensaje']);
                Route::delete('/mensajes/bulk', [ComunidadController::class, 'eliminarMensajesBulk']);
                Route::delete('/mensajes/{mensaje}', [ComunidadController::class, 'eliminarMensaje']);
            });
        });
    });
});
