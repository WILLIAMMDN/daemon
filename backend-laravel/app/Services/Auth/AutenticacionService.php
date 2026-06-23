<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use InvalidArgumentException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Two\User as SocialiteUser;

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
            'perfil_completo' => true,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => null,
        ]);
    }

    public function autenticarConGoogle(SocialiteUser $googleUser, bool $crearCuenta = false): ?Usuario
    {
        $email = $googleUser->getEmail();

        if (! $email) {
            throw new InvalidArgumentException('Google no devolvio un correo valido.');
        }

        $usuario = Usuario::where('google_id', $googleUser->getId())->first()
            ?? Usuario::where('email', $email)->first();

        if ($usuario) {
            $usuario->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $usuario->avatar ?: $googleUser->getAvatar(),
            ]);

            if (! $crearCuenta && ! $usuario->perfil_completo) {
                $usuario->tokens()->delete();

                return null;
            }

            $usuario->tokens()->delete();

            return $usuario->fresh();
        }

        if (! $crearCuenta) {
            return null;
        }

        $usuario = Usuario::create([
            'nombre_completo' => $googleUser->getName() ?: $email,
            'email' => $email,
            'usuario' => $this->generarUsuarioGoogle($email),
            'password_hash' => Hash::make(Str::random(32)),
            'nivel' => 'TEENS',
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => $googleUser->getAvatar(),
            'google_id' => $googleUser->getId(),
        ]);

        $usuario->tokens()->delete();

        return $usuario->fresh();
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
            'perfil_completo' => true,
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

    public function completarPerfilGoogle(Usuario $usuario, array $datos): Usuario
    {
        $usuario->update([
            'nombre_completo' => $datos['nombre_completo'],
            'usuario' => $datos['usuario'],
            'nivel' => $datos['nivel'],
            'perfil_completo' => true,
        ]);

        return $usuario->fresh();
    }

    public function emitirToken(Usuario $usuario, string $nombre = 'angular'): string
    {
        return $usuario->createToken($nombre)->plainTextToken;
    }

    private function generarUsuarioGoogle(string $email): string
    {
        $base = Str::of(Str::before($email, '@'))
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9_-]+/', '')
            ->trim('-_')
            ->limit(40, '')
            ->toString();

        $base = $base !== '' ? $base : 'google';
        $usuario = $base;

        while (Usuario::where('usuario', $usuario)->exists()) {
            $usuario = Str::limit($base, 40, '').random_int(1000, 9999);
        }

        return $usuario;
    }
}
