<?php

use App\Http\Controllers\Api\V1\AcademicoController;
use App\Http\Controllers\Api\V1\AlumnoAdminController;
use App\Http\Controllers\Api\V1\AlumnoController;
use App\Http\Controllers\Api\V1\ArchivoAdminController;
use App\Http\Controllers\Api\V1\ArchivoController;
use App\Http\Controllers\Api\V1\ArcCohortSessionOpsController;
use App\Http\Controllers\Api\V1\ArcCourseStudioController;
use App\Http\Controllers\Api\V1\ArcStudentContextController;
use App\Http\Controllers\Api\V1\AutenticacionController;
use App\Http\Controllers\Api\V1\BienestarDigitalController;
use App\Http\Controllers\Api\V1\CertificadoController;
use App\Http\Controllers\Api\V1\ChatbotController;
use App\Http\Controllers\Api\V1\CompetenciaController;
use App\Http\Controllers\Api\V1\ComunidadController;
use App\Http\Controllers\Api\V1\CuentoController;
use App\Http\Controllers\Api\V1\CuentoV2Controller;
use App\Http\Controllers\Api\V1\DocenteController;
use App\Http\Controllers\Api\V1\EvaluacionController;
use App\Http\Controllers\Api\V1\IaModeloAdminController;
use App\Http\Controllers\Api\V1\InstitucionController;
use App\Http\Controllers\Api\V1\InteroperabilidadAdminController;
use App\Http\Controllers\Api\V1\LearningCoreAuthoringController;
use App\Http\Controllers\Api\V1\LearningCoreStudentController;
use App\Http\Controllers\Api\V1\MascotaCatalogoController;
use App\Http\Controllers\Api\V1\MascotaController;
use App\Http\Controllers\Api\V1\MisionController;
use App\Http\Controllers\Api\V1\NotificacionController;
use App\Http\Controllers\Api\V1\PrivacidadController;
use App\Http\Controllers\Api\V1\ProyectoController;
use App\Http\Controllers\Api\V1\PulseAdminController;
use App\Http\Controllers\Api\V1\PulseController;
use App\Http\Controllers\Api\V1\RankingController;
use App\Http\Controllers\Api\V1\SaludController;
use App\Http\Controllers\Api\V1\SeguridadComunidadController;
use App\Http\Controllers\Api\V1\TelemetriaController;
use App\Http\Controllers\Api\V1\TiendaController;
use App\Http\Controllers\Api\V1\TutorPortalController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Broadcast::routes(['middleware' => ['auth:sanctum']]);
    require base_path('routes/channels.php');
    Route::get('/salud', SaludController::class);
    Route::post('/auth/login', [AutenticacionController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/registro', [AutenticacionController::class, 'registro'])->middleware('throttle:5,1');
    Route::post('/auth/recuperar', [AutenticacionController::class, 'recuperar'])->middleware('throttle:5,1');
    Route::post('/auth/confirmar-reset', [AutenticacionController::class, 'confirmarReset'])->middleware('throttle:10,1');
    Route::post('/auth/confirmar-verificar', [AutenticacionController::class, 'confirmarVerificacion'])->middleware('throttle:10,1');
    Route::post('/auth/firebase', [AutenticacionController::class, 'firebase'])->middleware('throttle:10,1');
    Route::post('/auth/tutor/firebase', [AutenticacionController::class, 'firebaseTutor'])->middleware('throttle:10,1');
    Route::post('/auth/firebase/perfil', [AutenticacionController::class, 'completarPerfilFirebase'])->middleware('throttle:10,1');
    Route::post('/auth/google', [AutenticacionController::class, 'google'])->middleware('throttle:10,1');
    Route::get('/cuentos', [CuentoController::class, 'index']);
    Route::get('/cuentos/{cuento}', [CuentoController::class, 'show']);
    Route::get('/cuentos-v2/galeria', [CuentoV2Controller::class, 'galeria'])->middleware('throttle:30,1');
    Route::get('/cuentos-v2/{cuentoId}/comentarios', [CuentoV2Controller::class, 'comentarios'])->middleware('throttle:60,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/yo', [AutenticacionController::class, 'yo']);
        Route::post('/auth/logout', [AutenticacionController::class, 'logout']);
        Route::post('/auth/cambiar-clave', [AutenticacionController::class, 'cambiarClave'])->middleware('throttle:5,1');
        Route::post('/auth/enviar-verificacion', [AutenticacionController::class, 'enviarVerificacion'])->middleware('throttle:5,1');
        Route::patch('/auth/me/perfil', [AutenticacionController::class, 'completarPerfil'])->middleware('throttle:10,1');
        Route::post('/auth/me/tour', [AutenticacionController::class, 'completarTour'])->middleware('throttle:10,1');
        Route::post('/auth/me/sync-password', [AutenticacionController::class, 'sincronizarClave'])->middleware('throttle:5,1');
        // DEPRECATED 2026-08-04: el token viaja ahora en la respuesta de
        // /auth/login (campo `firebase_token`). Este endpoint se conserva
        // por compatibilidad con clientes externos y sera removido.
        // Migrar a /auth/login. Ver PR #66.
        Route::post('/auth/firebase-token', [AutenticacionController::class, 'firebaseToken'])->middleware('throttle:10,1');
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
        Route::get('/cuentos-v2/mios', [CuentoV2Controller::class, 'mios'])->middleware('throttle:30,1');
        Route::post('/cuentos-v2/borradores', [CuentoV2Controller::class, 'reservarBorrador'])->middleware('throttle:20,1');
        Route::put('/cuentos-v2/borradores/{cuentoId}', [CuentoV2Controller::class, 'guardarBorrador'])->middleware('throttle:20,1');
        Route::get('/cuentos-v2/{cuentoId}', [CuentoV2Controller::class, 'detalle'])->middleware('throttle:60,1');
        Route::get('/academico/artefactos/{artefacto}/contenido', [LearningCoreStudentController::class, 'descargarArtefacto']);

        Route::middleware('role:alumno')->group(function (): void {
            Route::get('/alumno/panel', [AlumnoController::class, 'panel']);
            Route::get('/alumno/home-context', [ArcStudentContextController::class, 'home']);
            Route::get('/alumno/learning-context', [ArcStudentContextController::class, 'learning']);
            Route::get('/alumno/agenda', [ArcStudentContextController::class, 'agenda']);
            Route::get('/alumno/pulse', [PulseController::class, 'show']);
            Route::get('/alumno/pulse/transacciones', [PulseController::class, 'transacciones']);
            Route::get('/alumno/pulse/logros', [PulseController::class, 'logros']);
            Route::get('/alumno/rutas', [LearningCoreStudentController::class, 'rutas']);
            Route::get('/alumno/rutas/{ruta}', [LearningCoreStudentController::class, 'ruta']);
            Route::get('/alumno/aprender/mapa', [LearningCoreStudentController::class, 'mapa']);
            Route::get('/alumno/aprender/siguiente', [LearningCoreStudentController::class, 'siguiente']);
            Route::post('/alumno/aprender/experiencias/{experiencia}/intentos', [LearningCoreStudentController::class, 'iniciarIntento'])->middleware('throttle:30,1');
            Route::post('/alumno/aprender/intentos/{intento}/evidencias', [LearningCoreStudentController::class, 'evidencia'])->middleware('throttle:30,1');
            Route::post('/alumno/aprender/intentos/{intento}/artefactos', [LearningCoreStudentController::class, 'subirArtefacto'])->middleware('throttle:30,1');
            Route::delete('/alumno/aprender/intentos/{intento}/artefactos/{artefacto}', [LearningCoreStudentController::class, 'eliminarArtefacto'])->middleware('throttle:30,1');
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
            Route::post('/cuentos-v2/{cuentoId}/publicacion', [CuentoV2Controller::class, 'solicitarPublicacion'])->middleware('throttle:10,1');
            Route::post('/cuentos-v2/{cuentoId}/eliminacion', [CuentoV2Controller::class, 'eliminar'])->middleware('throttle:10,1');
            Route::post('/cuentos-v2/{cuentoId}/comentarios', [CuentoV2Controller::class, 'comentar'])->middleware('throttle:5,1');
            Route::patch('/cuentos-v2/{cuentoId}/comentarios/{comentarioId}', [CuentoV2Controller::class, 'editarComentario'])->middleware('throttle:10,1');
            Route::delete('/cuentos-v2/{cuentoId}/comentarios/{comentarioId}', [CuentoV2Controller::class, 'eliminarComentario'])->middleware('throttle:10,1');
            Route::post('/cuentos-v2/ia/asistencia', [CuentoV2Controller::class, 'asistir'])->middleware('throttle:10,1');
            Route::post('/cuentos-v2/{cuentoId}/activos', [CuentoV2Controller::class, 'subirActivo'])->middleware('throttle:20,1');
            Route::get('/cuentos-v2/{cuentoId}/activos/url', [CuentoV2Controller::class, 'urlActivo'])->middleware('throttle:60,1');
            Route::post('/cuentos-v2/{cuentoId}/activos/eliminacion', [CuentoV2Controller::class, 'eliminarActivo'])->middleware('throttle:30,1');
            Route::post('/cuentos-v2/{cuentoId}/activos/limpieza', [CuentoV2Controller::class, 'limpiarActivos'])->middleware('throttle:10,1');
            Route::post('/cuentos-v2/{cuentoId}/reaccion', [CuentoV2Controller::class, 'reaccionar'])->middleware('throttle:30,1');
            Route::get('/cuentos-v2/{cuentoId}/estadisticas', [CuentoV2Controller::class, 'estadisticas'])->middleware('throttle:60,1');
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
                Route::get('/', [AcademicoController::class, 'catalogo'])->middleware('ability:course:read');
                Route::post('/periodos', [AcademicoController::class, 'crearPeriodo']);
                Route::post('/cursos', [AcademicoController::class, 'crearCurso'])->middleware('ability:course:write');
                Route::put('/cursos/{curso}', [AcademicoController::class, 'actualizarCurso'])->middleware('ability:course:write');
                Route::post('/cursos/{curso}/unidades', [AcademicoController::class, 'crearUnidad']);
                Route::put('/unidades/{unidad}', [AcademicoController::class, 'actualizarUnidad'])->middleware('ability:course:write');
                Route::post('/unidades/{unidad}/lecciones', [AcademicoController::class, 'crearLeccion'])->middleware('ability:course:write');
                Route::put('/lecciones/{leccion}', [AcademicoController::class, 'actualizarLeccion'])->middleware('ability:course:write');
                Route::post('/objetivos', [AcademicoController::class, 'crearObjetivo'])->middleware('ability:course:write');
                Route::put('/aulas/{aula}/curso', [AcademicoController::class, 'vincularAula']);
                Route::post('/aulas/{aula}/usuarios/{usuario}', [AcademicoController::class, 'matricular']);
                Route::get('/cohortes', [ArcCohortSessionOpsController::class, 'cohortes']);
                Route::get('/aulas/{aula}/sesiones', [ArcCohortSessionOpsController::class, 'sesiones']);
                Route::post('/aulas/{aula}/sesiones', [AcademicoController::class, 'crearSesion']);
                Route::put('/sesiones/{sesion}', [AcademicoController::class, 'actualizarSesion']);
                Route::post('/cursos/{curso}/versiones', [LearningCoreAuthoringController::class, 'crearVersion'])->middleware('ability:course:write');
                Route::put('/versiones/{version}', [LearningCoreAuthoringController::class, 'actualizarVersion'])->middleware('ability:course:write');
                Route::post('/versiones/{version}/unidades', [LearningCoreAuthoringController::class, 'crearUnidad'])->middleware('ability:course:write');
                Route::post('/versiones/{version}/publicar', [LearningCoreAuthoringController::class, 'publicarVersion'])->middleware('ability:course:publish');
                Route::post('/versiones/{version}/archivar', [LearningCoreAuthoringController::class, 'archivarVersion'])->middleware('ability:course:publish');
                Route::put('/aulas/{aula}/version', [LearningCoreAuthoringController::class, 'vincularAula'])->middleware('ability:course:publish');
                Route::post('/versiones/{version}/rutas', [LearningCoreAuthoringController::class, 'crearRuta'])->middleware('ability:course:write');
                Route::put('/rutas/{ruta}', [LearningCoreAuthoringController::class, 'actualizarRuta'])->middleware('ability:course:write');
                Route::post('/rutas/{ruta}/hitos', [LearningCoreAuthoringController::class, 'crearHito'])->middleware('ability:course:write');
                Route::put('/hitos/{hito}', [LearningCoreAuthoringController::class, 'actualizarHito'])->middleware('ability:course:write');
                Route::delete('/hitos/{hito}', [LearningCoreAuthoringController::class, 'eliminarHito'])->middleware('ability:course:write');
                Route::put('/hitos/{hito}/prerrequisitos', [LearningCoreAuthoringController::class, 'prerrequisitos'])->middleware('ability:course:write');
                Route::post('/hitos/{hito}/experiencias', [LearningCoreAuthoringController::class, 'crearExperiencia'])->middleware('ability:course:write');
                Route::put('/experiencias/{experiencia}', [LearningCoreAuthoringController::class, 'actualizarExperiencia'])->middleware('ability:course:write');
                Route::delete('/experiencias/{experiencia}', [LearningCoreAuthoringController::class, 'eliminarExperiencia'])->middleware('ability:course:write');
                Route::put('/experiencias/{experiencia}/objetivos', [LearningCoreAuthoringController::class, 'objetivosExperiencia'])->middleware('ability:course:write');
                Route::post('/rutas/{ruta}/publicar', [LearningCoreAuthoringController::class, 'publicarRuta'])->middleware('ability:course:publish');
                Route::post('/rutas/{ruta}/archivar', [LearningCoreAuthoringController::class, 'archivarRuta'])->middleware('ability:course:publish');

                // Course Operations / Studio: superficie canónica de autoría.
                // Studio y un futuro adaptador MCP consumen exactamente esto.
                Route::prefix('studio')->group(function (): void {
                    Route::middleware('ability:course:read')->group(function (): void {
                        Route::get('/catalogo', [ArcCourseStudioController::class, 'catalogo']);
                        Route::get('/cursos', [ArcCourseStudioController::class, 'cursos']);
                        Route::get('/cursos/{curso}', [ArcCourseStudioController::class, 'curso']);
                        Route::get('/versiones/{version}', [ArcCourseStudioController::class, 'version']);
                        Route::get('/versiones/{version}/validacion', [ArcCourseStudioController::class, 'validar']);
                    });
                    Route::post('/versiones/{version}/borrador', [ArcCourseStudioController::class, 'crearBorrador'])
                        ->middleware('ability:course:write');
                    // La publicacion exige su propio alcance. Un token de
                    // servicio headless nunca lo recibe: publicar es humano.
                    Route::post('/versiones/{version}/publicacion', [ArcCourseStudioController::class, 'publicar'])
                        ->middleware('ability:course:publish');
                });
                Route::get('/objetivos', [AcademicoController::class, 'objetivos'])->middleware('ability:course:read');
                Route::put('/objetivos/{objetivo}', [AcademicoController::class, 'actualizarObjetivo'])->middleware('ability:course:write');
                Route::get('/revisiones', [LearningCoreStudentController::class, 'revisiones']);
                Route::get('/revisiones/{intento}', [LearningCoreStudentController::class, 'detalleRevision']);
                Route::post('/intentos/{intento}/evaluar', [LearningCoreStudentController::class, 'evaluar']);
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
            Route::post('/cuentos-v2/admin/{cuentoId}/publicacion', [CuentoV2Controller::class, 'publicarModerado'])->middleware('throttle:20,1');
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

            Route::middleware('role:admin')->prefix('pulse/admin')->group(function (): void {
                Route::get('/politicas', [PulseAdminController::class, 'politicas']);
                Route::post('/politicas', [PulseAdminController::class, 'crearPolitica'])->middleware('throttle:20,1');
                Route::put('/politicas/{politica}', [PulseAdminController::class, 'actualizarPolitica'])->middleware('throttle:20,1');
                Route::get('/logros', [PulseAdminController::class, 'logros']);
                Route::post('/logros', [PulseAdminController::class, 'crearLogro'])->middleware('throttle:20,1');
                Route::put('/logros/{logro}', [PulseAdminController::class, 'actualizarLogro'])->middleware('throttle:20,1');
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
