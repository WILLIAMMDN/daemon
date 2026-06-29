<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ActualizarPerfilRequest;
use App\Http\Requests\Api\V1\Auth\CambiarClaveRequest;
use App\Http\Requests\Api\V1\Auth\CompletarPerfilGoogleRequest;
use App\Http\Requests\Api\V1\Auth\ConfirmarResetClaveRequest;
use App\Http\Requests\Api\V1\Auth\ConfirmarVerificacionRequest;
use App\Http\Requests\Api\V1\Auth\CrearUsuarioRequest;
use App\Http\Requests\Api\V1\Auth\EnviarVerificacionRequest;
use App\Http\Requests\Api\V1\Auth\FirebaseLoginRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RecuperarClaveRequest;
use App\Http\Requests\Api\V1\Auth\RegistroAlumnoRequest;
use App\Http\Requests\Api\V1\Auth\SyncPasswordRequest;
use App\Http\Resources\Api\V1\UsuarioResource;
use App\Services\Auth\AutenticacionService;
use App\Services\Auth\EmailVerificationService;
use App\Services\Auth\FirebaseTokenVerifier;
use App\Services\Auth\RecuperacionClaveService;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Symfony\Component\HttpFoundation\Cookie;
use Throwable;
use UnexpectedValueException;

class AutenticacionController extends Controller
{
    public function __construct(
        private readonly AutenticacionService $autenticacion,
        private readonly FirebaseTokenVerifier $firebase,
        private readonly RecuperacionClaveService $recuperacionClave,
        private readonly EmailVerificationService $verificacionCorreo,
    ) {}

    public function login(LoginRequest $request)
    {
        $usuario = $this->autenticacion->intentarLogin($request->validated());

        if (! $usuario) {
            return response()->json(['message' => 'Usuario o contrasena incorrectos.'], 422);
        }

        return $this->respuestaAutenticada($usuario);
    }

    public function registro(RegistroAlumnoRequest $request)
    {
        $usuario = $this->autenticacion->registrarAlumno($request->validated());

        return $this->respuestaAutenticada($usuario, 201);
    }

    public function recuperar(RecuperarClaveRequest $request)
    {
        $this->recuperacionClave->solicitar($request->validated());

        return response()->json([
            'message' => 'Si la cuenta existe, se enviaran instrucciones de recuperacion al canal configurado.',
        ], 202);
    }

    /**
     * Confirma el reset de clave a partir del token JWT firmado por el
     * backend. NO requiere sesion: el token ya identifica al usuario.
     */
    public function confirmarReset(ConfirmarResetClaveRequest $request)
    {
        $datos = $request->validated();

        try {
            $usuario = $this->recuperacionClave->confirmar(
                (string) $datos['token'],
                (string) $datos['password'],
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return $this->respuestaAutenticada($usuario);
    }

    /**
     * Re-envia el correo de verificacion al usuario autenticado.
     * Idempotente: si ya esta verificado, responde 200 sin mandar mail.
     */
    public function enviarVerificacion(EnviarVerificacionRequest $request)
    {
        $usuario = $request->user()->fresh();

        if (! $usuario->email) {
            return response()->json([
                'message' => 'Tu cuenta no tiene un correo electronico asociado. Actualiza tu perfil primero.',
            ], 422);
        }

        if ($usuario->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Tu correo ya estaba verificado.',
                'enviado' => false,
                'email_verified_at' => optional($usuario->email_verified_at)->toIso8601String(),
                'usuario' => UsuarioResource::make($usuario),
            ]);
        }

        $enviado = $this->verificacionCorreo->solicitar($usuario, forzar: true);

        if (! $enviado) {
            return response()->json([
                'message' => 'No pudimos enviar el correo de verificacion en este momento. Revisa la configuracion del correo del backend o intentalo nuevamente.',
                'enviado' => false,
                'email_verified_at' => null,
                'usuario' => UsuarioResource::make($usuario),
            ], 503);
        }

        return response()->json([
            'message' => 'Te enviamos un correo con el enlace de verificacion.',
            'enviado' => true,
            'email_verified_at' => optional($usuario->email_verified_at)->toIso8601String(),
            'usuario' => UsuarioResource::make($usuario),
        ]);
    }

    /**
     * Confirma la verificacion de correo a partir del token JWT firmado
     * por el backend. NO requiere sesion: el token ya identifica al
     * usuario. Devuelve el usuario actualizado.
     */
    public function confirmarVerificacion(ConfirmarVerificacionRequest $request)
    {
        $datos = $request->validated();

        try {
            $usuario = $this->verificacionCorreo->confirmar((string) $datos['token']);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Tu correo electronico quedo verificado.',
            'usuario' => UsuarioResource::make($usuario),
        ]);
    }

    public function google(Request $request)
    {
        $datos = $request->validate([
            'id_token' => ['required', 'string'],
            'crear_cuenta' => ['sometimes', 'boolean'],
        ]);

        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromToken($datos['id_token']);
            $raw = $googleUser->getRaw();
            $crearCuenta = (bool) ($datos['crear_cuenta'] ?? false);

            // En REGISTRO (crear_cuenta = true) permitimos que Google
            // aun no haya verificado el correo: el flujo de
            // EmailVerificationService emite un mail DAEMON-brandeado
            // con un JWT propio para cerrar la verificacion.
            // En LOGIN exigimos verificacion previa.
            if (array_key_exists('email_verified', $raw) && ! $raw['email_verified'] && ! $crearCuenta) {
                return response()->json(['message' => 'Google no pudo confirmar el correo de la cuenta.'], 422);
            }

            $usuario = $this->autenticacion->autenticarConGoogle($googleUser, $crearCuenta);

            if (! $usuario) {
                return response()->json([
                    'message' => 'No encontramos una cuenta DAEMON activa para este Google. Para crearla o terminar el registro, usa la opcion de registro.',
                    'requires_registration' => true,
                ], 404);
            }

            return $this->respuestaAutenticada($usuario);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'No se pudo validar la cuenta de Google.'], 422);
        }
    }

    public function firebase(FirebaseLoginRequest $request)
    {
        $datos = $request->validated();

        try {
            $claims = $this->firebase->verify($datos['id_token']);
            $usuario = $this->autenticacion->autenticarConFirebase($claims, (bool) ($datos['crear_cuenta'] ?? false));

            if (! $usuario) {
                return response()->json([
                    'message' => 'No encontramos una cuenta DAEMON activa para este acceso. Para crearla o terminar el registro, usa la opcion de registro.',
                    'requires_registration' => true,
                ], 404);
            }

            return $this->respuestaAutenticada($usuario);
        } catch (InvalidArgumentException|RuntimeException|UnexpectedValueException $exception) {
            report($exception);

            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['message' => 'No se pudo validar la cuenta de Firebase.'], 422);
        }
    }

    public function cambiarClave(CambiarClaveRequest $request)
    {
        $datos = $request->validated();
        $cambiada = $this->autenticacion->cambiarClave($request->user(), $datos['password_actual'], $datos['password']);

        if (! $cambiada) {
            return response()->json(['message' => 'La contrasena actual no es correcta.'], 422);
        }

        return ['message' => 'Contrasena actualizada.'];
    }

    /**
     * Sincroniza la clave local con la que el usuario acaba de setear en
     * Firebase tras un password reset. Requiere Sanctum (el usuario ya
     * paso por /auth/firebase con su nuevo token).
     */
    public function sincronizarClave(SyncPasswordRequest $request)
    {
        $this->autenticacion->sincronizarClave($request->user(), $request->validated()['password']);

        return ['message' => 'Contrasena sincronizada con DAEMON.'];
    }

    public function crearUsuario(CrearUsuarioRequest $request)
    {
        $usuario = $this->autenticacion->crearUsuarioInterno($request->validated());

        return response()->json(['usuario' => UsuarioResource::make($usuario)], 201);
    }

    public function completarPerfilGoogle(CompletarPerfilGoogleRequest $request)
    {
        $usuario = $this->autenticacion->completarPerfil($request->user(), $request->validated());

        return response()->json(['usuario' => UsuarioResource::make($usuario)]);
    }

    public function completarPerfilFirebase(CompletarPerfilGoogleRequest $request)
    {
        // Reusamos el handler de Google porque ambos flujos (Google y Firebase)
        // terminan con un usuario ya autenticado en DAEMON y pendiente de
        // completar nombre, usuario y nivel. Las reglas de validacion son las mismas.
        return $this->completarPerfilGoogle($request);
    }

    /**
     * Endpoint canonico para completar el perfil inicial luego de crear la
     * cuenta. Se usa desde /bienvenida sin importar si el alta fue con Google,
     * Firebase email/password o registro legacy.
     */
    public function completarPerfil(ActualizarPerfilRequest $request)
    {
        $usuario = $this->autenticacion->completarPerfil($request->user(), $request->validated());

        return response()->json(['usuario' => UsuarioResource::make($usuario)]);
    }

    public function yo(Request $request)
    {
        return UsuarioResource::make($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()
            ->json(['message' => 'Sesion cerrada.'])
            ->withoutCookie($this->authCookieName(), '/', null);
    }

    private function respuestaAutenticada($usuario, int $estado = 200)
    {
        $token = $this->autenticacion->emitirToken($usuario);
        $payload = [
            'usuario' => UsuarioResource::make($usuario),
        ];

        if (config('daemon.auth_cookie.expose_bearer_token')) {
            $payload['token'] = $token;
        }

        return response()
            ->json($payload, $estado)
            ->withCookie($this->authCookie($token));
    }

    private function authCookie(string $token): Cookie
    {
        return cookie(
            $this->authCookieName(),
            $this->encodeCookieToken($token),
            (int) config('daemon.auth_cookie.minutes', 480),
            '/',
            null,
            (bool) config('daemon.auth_cookie.secure', false),
            true,
            false,
            (string) config('daemon.auth_cookie.same_site', 'lax'),
        );
    }

    private function authCookieName(): string
    {
        return (string) config('daemon.auth_cookie.name', 'daemon_access');
    }

    private function encodeCookieToken(string $token): string
    {
        return rtrim(strtr(base64_encode($token), '+/', '-_'), '=');
    }
}
