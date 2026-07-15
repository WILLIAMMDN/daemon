<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'usuarios';

    public $timestamps = false;

    protected $fillable = [
        'nombre_completo',
        'email',
        'email_verified_at',
        'telefono',
        'usuario',
        'password_hash',
        'nivel',
        'pro_tokens',
        'rango',
        'biografia',
        'fecha_registro',
        'tokens',
        'experiencia',
        'avatar',
        'google_id',
        'firebase_uid',
        'perfil_completo',
        'rol',
        'id_institucion',
        'id_aula',
        'insignia',
        'mision_actual',
        'fondo',
        'heroe',
        'genero',
        'tour_completado',
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'tokens' => 'integer',
            'experiencia' => 'integer',
            'pro_tokens' => 'integer',
            'mision_actual' => 'integer',
            'id_institucion' => 'integer',
            'id_aula' => 'integer',
            'perfil_completo' => 'boolean',
            'tour_completado' => 'boolean',
            'fecha_registro' => 'datetime',
            'email_verified_at' => 'datetime',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Determina si el correo electronico de la cuenta ya fue verificado.
     * NULL en email_verified_at => no verificado. Cualquier timestamp => verificado.
     */
    public function hasVerifiedEmail(): bool
    {
        return $this->email_verified_at !== null;
    }

    /**
     * Marca el correo como verificado a fecha/hora actual. Persiste el cambio
     * en la base de datos. Idempotente: si ya estaba verificado, no hace nada.
     */
    public function markEmailAsVerified(): bool
    {
        if ($this->hasVerifiedEmail()) {
            return false;
        }

        $this->email_verified_at = now();
        $this->save();

        return true;
    }

    public function bot(): HasMany
    {
        return $this->hasMany(BotAlumno::class, 'id_alumno');
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class, 'id_alumno');
    }

    public function consentimientosPrivacidad(): HasMany
    {
        return $this->hasMany(ConsentimientoPrivacidad::class, 'usuario_id');
    }

    public function solicitudesPrivacidad(): HasMany
    {
        return $this->hasMany(SolicitudPrivacidad::class, 'usuario_id');
    }

    public function alumnosTutorizados(): HasMany
    {
        return $this->hasMany(TutorAlumno::class, 'tutor_id');
    }

    public function tutoresVinculados(): HasMany
    {
        return $this->hasMany(TutorAlumno::class, 'alumno_id');
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'id_institucion');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'id_aula');
    }
}
