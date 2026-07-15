<?php

namespace App\Services\Auth;

use App\Models\Usuario;
use App\Services\Privacidad\PrivacidadService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Laravel\Socialite\Two\User as SocialiteUser;

class AutenticacionService
{
    public function __construct(private readonly PrivacidadService $privacidad) {}

    public function intentarLogin(array $credenciales): ?Usuario
    {
        $usuario = Usuario::where('usuario', $credenciales['usuario'])->first();

        if (! $usuario || ! Hash::check($credenciales['password'], $usuario->password_hash)) {
            return null;
        }

        $usuario->tokens()->delete();

        return $usuario;
    }

    public function registrarAlumno(array $datos, array $contexto = []): Usuario
    {
        // Flujo minimalista: solo email + password son requeridos. El
        // resto del perfil lo pide /bienvenida despues. Si el cliente
        // manda datos extra (compatibilidad), los respetamos y marcamos
        // perfil_completo segun corresponda.
        $datosRequeridosCompletos = ! empty($datos['nombre_completo'])
            && ! empty($datos['usuario'])
            && ! empty($datos['nivel'])
            && ! empty($datos['acepta_privacidad'])
            && ($datos['nivel'] !== 'KIDS'
                || (! empty($datos['email_tutor']) && ! empty($datos['autorizacion_tutor_declarada'])));

        $usuario = DB::transaction(function () use ($datos, $datosRequeridosCompletos, $contexto): Usuario {
            $usuario = Usuario::create([
                'nombre_completo' => $datos['nombre_completo'] ?? null,
                'email' => $datos['email'] ?? null,
                'telefono' => $datos['telefono'] ?? null,
                'usuario' => $datos['usuario'] ?? null,
                'password_hash' => Hash::make($datos['password']),
                'nivel' => $datos['nivel'] ?? null,
                'perfil_completo' => $datosRequeridosCompletos,
                'rol' => 'alumno',
                'tokens' => 100,
                'avatar' => null,
            ]);

            if ($datosRequeridosCompletos) {
                $this->privacidad->registrarConsentimiento(
                    $usuario,
                    $datos,
                    $contexto['ip'] ?? null,
                    $contexto['user_agent'] ?? null,
                );
            }

            return $usuario;
        });

        // Disparamos el envio del correo de verificacion en background
        // para no bloquear la respuesta del registro. Si falla (mailer
        // caido, Resend rate limit, etc.) el usuario sigue existiendo y
        // puede pedir reenvio desde el panel sin perder la cuenta.
        $this->solicitarVerificacionSiPendiente($usuario);

        return $usuario;
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
            $actualizacion = [
                'google_id' => $googleUser->getId(),
            ];

            // Solo rellenamos avatar / nombre si estan vacios: nunca
            // pisamos lo que el usuario ya configuro manualmente.
            if (! $usuario->avatar) {
                $actualizacion['avatar'] = $googleUser->getAvatar();
            }
            if (! $usuario->nombre_completo && $googleUser->getName()) {
                $actualizacion['nombre_completo'] = $googleUser->getName();
            }

            $usuario->update($actualizacion);

            // Google ya valido el correo, asi que marcamos como verificado.
            // Idempotente: si ya estaba verificado, no se vuelve a escribir.
            $usuario->markEmailAsVerified();

            $usuario->tokens()->delete();

            return $usuario->fresh();
        }

        if (! $crearCuenta) {
            return null;
        }

        // Registro nuevo desde Google: pre-llenamos nombre (de Google)
        // pero dejamos perfil_completo=false porque el usuario todavia
        // no eligio su "usuario" (handle) ni su nivel. /bienvenida se
        // encarga de pedir lo que falta.
        $usuario = Usuario::create([
            'nombre_completo' => $googleUser->getName() ?: null,
            'email' => $email,
            'usuario' => null,
            'password_hash' => Hash::make(Str::random(32)),
            'nivel' => null,
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => $googleUser->getAvatar(),
            'google_id' => $googleUser->getId(),
            'email_verified_at' => now(), // Google ya valido el correo.
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

            // Si Firebase nos confirma que el email esta verificado, lo
            // marcamos en la DB. Idempotente via markEmailAsVerified().
            if ($email && ($claims['email_verified'] ?? false)) {
                $usuario->markEmailAsVerified();
            }

            $usuario->tokens()->delete();

            return $usuario->fresh();
        }

        if (! $crearCuenta) {
            return null;
        }

        $usuario = Usuario::create([
            // Registro minimalista: pre-llenamos solo lo que ya viene
            // validado de Firebase. El resto lo pide /bienvenida.
            'nombre_completo' => $claims['name'] ?? null,
            'email' => $email,
            'telefono' => $telefono,
            'usuario' => null,
            'password_hash' => Hash::make(Str::random(40)),
            'nivel' => null,
            'perfil_completo' => false,
            'rol' => 'alumno',
            'tokens' => 100,
            'avatar' => $claims['picture'] ?? null,
            'google_id' => $googleId,
            'firebase_uid' => $firebaseUid,
            // Solo marcamos como verificado si Firebase confirmo el email
            // en sus claims. Si email_verified es false, la cuenta nace
            // sin verificar y el usuario usa el correo de verificacion
            // nativo de Firebase desde el frontend.
            'email_verified_at' => ($email && ($claims['email_verified'] ?? false)) ? now() : null,
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
            'nivel' => $datos['nivel'] ?? 'TEENS',
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

    public function completarPerfil(Usuario $usuario, array $datos, array $contexto = []): Usuario
    {
        DB::transaction(function () use ($usuario, $datos, $contexto): void {
            $usuario->update([
                'nombre_completo' => $datos['nombre_completo'],
                'usuario' => $datos['usuario'],
                'nivel' => $datos['nivel'],
                'perfil_completo' => true,
            ]);

            $this->privacidad->registrarConsentimiento(
                $usuario,
                $datos,
                $contexto['ip'] ?? null,
                $contexto['user_agent'] ?? null,
            );
        });

        return $usuario->fresh();
    }

    public function emitirToken(Usuario $usuario, string $nombre = 'angular'): string
    {
        return $usuario->createToken($nombre)->plainTextToken;
    }

    private function solicitarVerificacionSiPendiente(Usuario $usuario): void
    {
        if (! $usuario->email || $usuario->hasVerifiedEmail() || ! app()->bound(EmailVerificationService::class)) {
            return;
        }

        try {
            app(EmailVerificationService::class)->solicitar($usuario);
        } catch (\Throwable $exception) {
            // No rompemos el registro si el envio falla: el usuario
            // puede reenviar manualmente desde /auth/enviar-verificacion.
            report($exception);
        }
    }
}
