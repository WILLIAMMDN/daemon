<?php

use App\Http\Controllers\Api\V1\AlumnoController;
use App\Http\Controllers\Api\V1\ArchivoController;
use App\Http\Controllers\Api\V1\AutenticacionController;
use App\Http\Controllers\Api\V1\CertificadoController;
use App\Http\Controllers\Api\V1\ChatbotController;
use App\Http\Controllers\Api\V1\CompetenciaController;
use App\Http\Controllers\Api\V1\CuentoController;
use App\Http\Controllers\Api\V1\DocenteController;
use App\Http\Controllers\Api\V1\EvaluacionController;
use App\Http\Controllers\Api\V1\MisionController;
use App\Http\Controllers\Api\V1\RankingController;
use App\Http\Controllers\Api\V1\TiendaController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/salud', fn () => ['ok' => true, 'app' => 'DAEMON API']);
    Route::post('/auth/login', [AutenticacionController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/auth/registro', [AutenticacionController::class, 'registro'])->middleware('throttle:5,1');
    Route::post('/auth/recuperar', [AutenticacionController::class, 'recuperar'])->middleware('throttle:5,1');
    Route::post('/auth/firebase', [AutenticacionController::class, 'firebase'])->middleware('throttle:10,1');
    Route::post('/auth/google', [AutenticacionController::class, 'google'])->middleware('throttle:10,1');
    Route::post('/login-google', [AutenticacionController::class, 'google'])->middleware('throttle:10,1');
    Route::get('/ranking', [RankingController::class, 'index']);
    Route::get('/cuentos', [CuentoController::class, 'index']);
    Route::get('/cuentos/{cuento}', [CuentoController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/yo', [AutenticacionController::class, 'yo']);
        Route::post('/auth/logout', [AutenticacionController::class, 'logout']);
        Route::post('/auth/cambiar-clave', [AutenticacionController::class, 'cambiarClave'])->middleware('throttle:5,1');
        Route::post('/auth/me/sync-password', [AutenticacionController::class, 'sincronizarClave'])->middleware('throttle:5,1');
        Route::post('/auth/firebase/perfil', [AutenticacionController::class, 'completarPerfilFirebase'])->middleware('throttle:10,1');
        Route::post('/auth/google/perfil', [AutenticacionController::class, 'completarPerfilGoogle'])->middleware('throttle:10,1');
        Route::post('/auth/usuarios', [AutenticacionController::class, 'crearUsuario'])->middleware('role:admin');

        Route::middleware('role:alumno')->group(function (): void {
            Route::get('/alumno/panel', [AlumnoController::class, 'panel']);
            Route::get('/alumno/perfil/{usuario?}', [AlumnoController::class, 'perfil']);
            Route::post('/alumno/perfil', [AlumnoController::class, 'actualizarPerfil']);
            Route::get('/tienda', [TiendaController::class, 'index']);
            Route::post('/tienda/canjear/{premio}', [TiendaController::class, 'canjear']);
            Route::get('/tienda/canjes', [TiendaController::class, 'canjes']);
            Route::get('/evaluaciones/activas', [EvaluacionController::class, 'activas']);
            Route::post('/evaluaciones/{evaluacion}/responder', [EvaluacionController::class, 'responder']);
            Route::post('/competencia/votar', [CompetenciaController::class, 'votar']);
            Route::get('/cuentos/mio/actual', [CuentoController::class, 'mio']);
            Route::post('/cuentos', [CuentoController::class, 'guardar']);
            Route::get('/chatbot/bot', [ChatbotController::class, 'bot']);
            Route::post('/chatbot/bot', [ChatbotController::class, 'guardarBot']);
            Route::get('/chatbot/mensajes', [ChatbotController::class, 'mensajes']);
            Route::post('/chatbot/mensajes', [ChatbotController::class, 'chat']);
            Route::delete('/chatbot/mensajes', [ChatbotController::class, 'limpiar']);
            Route::get('/chatbot/cerebro', [ChatbotController::class, 'cargarCerebro']);
            Route::post('/chatbot/cerebro', [ChatbotController::class, 'guardarCerebro']);
        });

        Route::middleware('role:docente,admin')->group(function (): void {
            Route::get('/docente/panel', [DocenteController::class, 'panel']);
            Route::get('/docente/alumnos', [DocenteController::class, 'alumnos']);
            Route::post('/docente/tokens', [DocenteController::class, 'asignarTokens']);
            Route::get('/docente/historial-tokens', [DocenteController::class, 'historialTokens']);
            Route::apiResource('/docente/insignias', DocenteController::class)->only(['store', 'update', 'destroy']);
            Route::get('/docente/insignias', [DocenteController::class, 'insignias']);
            Route::post('/docente/insignias/asignar', [DocenteController::class, 'asignarInsignia']);

            Route::post('/misiones', [MisionController::class, 'store']);
            Route::get('/misiones/entregas', [MisionController::class, 'entregas']);
            Route::put('/misiones/{mision}', [MisionController::class, 'update']);
            Route::delete('/misiones/{mision}', [MisionController::class, 'destroy']);
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
            Route::post('/evaluaciones/{evaluacion}/preguntas', [EvaluacionController::class, 'guardarPreguntas']);

            Route::post('/competencia/control', [CompetenciaController::class, 'control']);
            Route::get('/competencia/historial', [CompetenciaController::class, 'historial']);
        });

        Route::get('/misiones', [MisionController::class, 'index']);
        Route::get('/misiones/{mision}', [MisionController::class, 'show']);
        Route::get('/evaluaciones/resultados', [EvaluacionController::class, 'resultados']);

        Route::get('/competencia/estado', [CompetenciaController::class, 'estado']);
        Route::get('/competencia/chat', [CompetenciaController::class, 'chat']);
        Route::post('/competencia/chat', [CompetenciaController::class, 'enviarChat']);
        Route::get('/comunidad', [AlumnoController::class, 'comunidad']);
        Route::post('/misiones/{mision}/entregar', [MisionController::class, 'entregar'])->middleware('role:alumno');
        Route::post('/archivos', [ArchivoController::class, 'store']);
        Route::get('/certificados/{usuario?}', [CertificadoController::class, 'show']);
    });
});
