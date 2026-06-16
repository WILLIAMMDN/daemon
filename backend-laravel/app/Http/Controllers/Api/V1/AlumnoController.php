<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Alumno\ActualizarPerfilRequest;
use App\Http\Resources\Api\V1\UsuarioResource;
use App\Models\Usuario;
use App\Services\Alumno\AlumnoService;
use Illuminate\Http\Request;

class AlumnoController extends Controller
{
    public function __construct(private readonly AlumnoService $alumnos) {}

    public function panel(Request $request)
    {
        $panel = $this->alumnos->panel($request->user());
        $panel['usuario'] = UsuarioResource::make($panel['usuario']);

        return $panel;
    }

    public function perfil(Request $request, ?Usuario $usuario = null)
    {
        $perfil = $this->alumnos->perfil($usuario ?? $request->user());
        $perfil['usuario'] = UsuarioResource::make($perfil['usuario']);

        return $perfil;
    }

    public function actualizarPerfil(ActualizarPerfilRequest $request)
    {
        $datos = $request->validated();
        $usuario = $request->user();

        foreach (['avatar', 'fondo', 'heroe'] as $campo) {
            if ($request->hasFile($campo)) {
                $datos[$campo] = $request->file($campo)->store("usuarios/{$usuario->id}", 'public');
            }
        }

        return UsuarioResource::make($this->alumnos->actualizarPerfil($usuario, $datos));
    }

    public function comunidad()
    {
        return UsuarioResource::collection($this->alumnos->comunidad());
    }
}
