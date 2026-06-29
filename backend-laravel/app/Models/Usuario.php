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
        'telefono',
        'usuario',
        'password_hash',
        'nivel',
        'pro_tokens',
        'rango',
        'biografia',
        'fecha_registro',
        'tokens',
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
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'tokens' => 'integer',
            'pro_tokens' => 'integer',
            'mision_actual' => 'integer',
            'id_institucion' => 'integer',
            'id_aula' => 'integer',
            'perfil_completo' => 'boolean',
            'fecha_registro' => 'datetime',
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

    public function bot(): HasMany
    {
        return $this->hasMany(BotAlumno::class, 'id_alumno');
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class, 'id_alumno');
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
