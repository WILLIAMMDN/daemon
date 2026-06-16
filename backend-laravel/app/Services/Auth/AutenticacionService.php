<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;

class AutenticacionService
{
    public function intentarLogin(array $credenciales): ?Usuario
    {
        $usuario = Usuario::where('usuario', $credenciales['usuario'])->first();

        if (! $usuario || ! Hash::check($credenciales['password'], $usuario->password_hash)) {
            return null;
        }

        $usuario->tokens()->delete();

        return $usuario;
    }

    public function registrarAlumno(array $datos): Usuario
    {
        return Usuario::create([
            'nombre_completo' => $datos['nombre_completo'],
            'email' => $datos['email'] ?? null,
            'usuario' => $datos['usuario'],
            'password_hash' => Hash::make($datos['password']),
            'nivel' => $datos['nivel'] ?? 'TEENS',
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => null,
        ]);
    }

    public function crearUsuarioInterno(array $datos): Usuario
    {
        $rol = $datos['rol'];

        return Usuario::create([
            'nombre_completo' => $datos['nombre_completo'],
            'email' => $datos['email'] ?? null,
            'usuario' => $datos['usuario'],
            'password_hash' => Hash::make($datos['password']),
            'nivel' => $rol === 'docente' ? 'DOCENTE' : ($datos['nivel'] ?? 'TEENS'),
            'rol' => $rol,
            'tokens' => $rol === 'alumno' ? 100 : 0,
            'avatar' => null,
        ]);
    }

    public function cambiarClave(Usuario $usuario, string $passwordActual, string $passwordNueva): bool
    {
        if (! Hash::check($passwordActual, $usuario->password_hash)) {
            return false;
        }

        $usuario->update(['password_hash' => Hash::make($passwordNueva)]);
        $usuario->tokens()->where('id', '!=', $usuario->currentAccessToken()?->id)->delete();

        return true;
    }

    public function emitirToken(Usuario $usuario, string $nombre = 'angular'): string
    {
        return $usuario->createToken($nombre)->plainTextToken;
    }
}
