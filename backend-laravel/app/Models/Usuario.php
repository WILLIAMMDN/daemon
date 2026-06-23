<?php

namespace App\Models;

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
        'perfil_completo',
        'rol',
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
}
