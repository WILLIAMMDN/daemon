<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\CambiarClaveRequest;
use App\Http\Requests\Api\V1\Auth\CrearUsuarioRequest;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RecuperarClaveRequest;
use App\Http\Requests\Api\V1\Auth\RegistroAlumnoRequest;
use App\Http\Resources\Api\V1\UsuarioResource;
use App\Services\Auth\AutenticacionService;
use Illuminate\Http\Request;

class AutenticacionController extends Controller
{
    public function __construct(private readonly AutenticacionService $autenticacion) {}

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

    public function cambiarClave(CambiarClaveRequest $request)
    {
        $datos = $request->validated();
        $cambiada = $this->autenticacion->cambiarClave($request->user(), $datos['password_actual'], $datos['password']);

        if (! $cambiada) {
            return response()->json(['message' => 'La contrasena actual no es correcta.'], 422);
        }

        return ['message' => 'Contrasena actualizada.'];
    }

    public function crearUsuario(CrearUsuarioRequest $request)
    {
        $usuario = $this->autenticacion->crearUsuarioInterno($request->validated());

        return response()->json(['usuario' => UsuarioResource::make($usuario)], 201);
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
