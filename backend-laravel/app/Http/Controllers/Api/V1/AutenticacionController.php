<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\CambiarClaveRequest;
use App\Http\Requests\Api\V1\Auth\CompletarPerfilGoogleRequest;
use App\Http\Requests\Api\V1\Auth\CrearUsuarioRequest;
use App\Http\Requests\Api\V1\Auth\FirebaseLoginRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RecuperarClaveRequest;
use App\Http\Requests\Api\V1\Auth\RegistroAlumnoRequest;
use App\Http\Requests\Api\V1\Auth\SyncPasswordRequest;
use App\Http\Resources\Api\V1\UsuarioResource;
use App\Services\Auth\AutenticacionService;
use App\Services\Auth\FirebaseTokenVerifier;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;
use Throwable;
use UnexpectedValueException;

class AutenticacionController extends Controller
{
    public function __construct(
        private readonly AutenticacionService $autenticacion,
        private readonly FirebaseTokenVerifier $firebase,
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
        $request->validated();

        return response()->json([
            'message' => 'Si la cuenta existe, se enviaran instrucciones de recuperacion al canal configurado.',
        ], 202);
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

            if (array_key_exists('email_verified', $raw) && ! $raw['email_verified']) {
                return response()->json(['message' => 'Google no pudo confirmar el correo de la cuenta.'], 422);
            }

            $usuario = $this->autenticacion->autenticarConGoogle($googleUser, (bool) ($datos['crear_cuenta'] ?? false));

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
        $usuario = $this->autenticacion->completarPerfilGoogle($request->user(), $request->validated());

        return response()->json(['usuario' => UsuarioResource::make($usuario)]);
    }

    public function completarPerfilFirebase(CompletarPerfilGoogleRequest $request)
    {
        // Reusamos el handler de Google porque ambos flujos (Google y Firebase)
        // terminan con un usuario ya autenticado en DAEMON y pendiente de
        // completar nombre, usuario y nivel. Las reglas de validacion son las mismas.
        return $this->completarPerfilGoogle($request);
    }

    public function yo(Request $request)
    {
        return UsuarioResource::make($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return ['message' => 'Sesion cerrada.'];
    }

    private function respuestaAutenticada($usuario, int $estado = 200)
    {
        return response()->json([
            'token' => $this->autenticacion->emitirToken($usuario),
            'usuario' => UsuarioResource::make($usuario),
        ], $estado);
    }
}
