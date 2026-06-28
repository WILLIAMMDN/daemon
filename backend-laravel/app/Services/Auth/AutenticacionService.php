<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;
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
            'telefono' => $datos['telefono'] ?? null,
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

    public function autenticarConFirebase(array $claims, bool $crearCuenta = false): ?Usuario
    {
        $firebaseUid = (string) $claims['uid'];
        $email = $claims['email'] ?? null;
        $telefono = $claims['phone_number'] ?? null;
        $googleId = $claims['google_id'] ?? null;

        // Si el token trae email, exigimos que Firebase lo tenga verificado.
        // El login solo por telefono no pasa por este chequeo porque no lleva email.
        if ($email !== null && ! ($claims['email_verified'] ?? false)) {
            throw new InvalidArgumentException('Firebase no confirmo el correo de la cuenta.');
        }

        $usuario = Usuario::where('firebase_uid', $firebaseUid)->first()
            ?? ($email ? Usuario::where('email', $email)->first() : null)
            ?? ($telefono ? Usuario::where('telefono', $telefono)->first() : null);

        if ($usuario) {
            $actualizacion = [
                'firebase_uid' => $firebaseUid,
            ];

            if ($email && ! $usuario->email) {
                $actualizacion['email'] = $email;
            }

            if ($telefono && ! $usuario->telefono) {
                $actualizacion['telefono'] = $telefono;
            }

            if ($googleId && ! $usuario->google_id) {
                $actualizacion['google_id'] = $googleId;
            }

            if (($claims['picture'] ?? null) && ! $usuario->avatar) {
                $actualizacion['avatar'] = $claims['picture'];
            }

            $usuario->update($actualizacion);

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
            'nombre_completo' => $claims['name'] ?? $email ?? $telefono ?? 'Usuario Firebase',
            'email' => $email,
            'telefono' => $telefono,
            'usuario' => $this->generarUsuarioFirebase($claims),
            'password_hash' => Hash::make(Str::random(40)),
            'nivel' => 'TEENS',
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => $claims['picture'] ?? null,
            'google_id' => $googleId,
            'firebase_uid' => $firebaseUid,
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
            'telefono' => $datos['telefono'] ?? null,
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

    /**
     * Sincroniza la clave de DAEMON con la clave que el usuario acaba de
     * setear en Firebase. Pensado para usarse despues de un password reset
     * donde el usuario ya esta autenticado por Sanctum.
     */
    public function sincronizarClave(Usuario $usuario, string $passwordNueva): void
    {
        $usuario->update(['password_hash' => Hash::make($passwordNueva)]);
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
        return $this->generarUsuarioUnico(Str::before($email, '@'), 'google');
    }

    private function generarUsuarioFirebase(array $claims): string
    {
        $base = $claims['email'] ?? $claims['phone_number'] ?? $claims['uid'] ?? 'firebase';

        return $this->generarUsuarioUnico((string) $base, 'firebase');
    }

    private function generarUsuarioUnico(string $valor, string $fallback): string
    {
        $base = Str::of(Str::before($valor, '@'))
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9_-]+/', '')
            ->trim('-_')
            ->limit(40, '')
            ->toString();

        $base = $base !== '' ? $base : $fallback;
        $usuario = $base;

        while (Usuario::where('usuario', $usuario)->exists()) {
            $usuario = Str::limit($base, 40, '').random_int(1000, 9999);
        }

        return $usuario;
    }
}
