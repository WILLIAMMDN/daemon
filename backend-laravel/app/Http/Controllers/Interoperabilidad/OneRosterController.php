<?php

namespace App\Http\Controllers\Interoperabilidad;

use App\Http\Controllers\Controller;
use App\Models\Aula;
use App\Models\ClienteOneRoster;
use App\Services\Interoperabilidad\OneRosterService;
use Illuminate\Http\Request;

class OneRosterController extends Controller
{
    public function __construct(private readonly OneRosterService $oneRoster) {}

    public function index(Request $request, string $tipo)
    {
        $cliente = $this->cliente($request);

        return match ($tipo) {
            'academicSessions' => $this->oneRoster->academicSessions($request, $cliente),
            'courses' => $this->oneRoster->courses($request, $cliente),
            'classes' => $this->oneRoster->classes($request, $cliente),
            'orgs', 'schools' => $this->oneRoster->orgs($request, $cliente),
            'users' => $this->oneRoster->users($request, $cliente),
            'students' => $this->oneRoster->users($request, $cliente, 'alumno'),
            'teachers' => $this->oneRoster->users($request, $cliente, 'docente'),
            'enrollments' => $this->oneRoster->enrollments($request, $cliente),
            default => abort(404),
        };
    }

    public function show(Request $request, string $tipo, string $sourcedId)
    {
        abort_unless(in_array($tipo, ['academicSessions', 'courses', 'classes', 'orgs', 'users', 'enrollments'], true), 404);

        return $this->oneRoster->item($tipo, $sourcedId, $this->cliente($request));
    }

    public function classUsers(Request $request, string $classSourcedId, string $tipo)
    {
        abort_unless(in_array($tipo, ['students', 'teachers'], true), 404);
        $cliente = $this->cliente($request);
        $aula = Aula::where('sourced_id', $classSourcedId)->firstOrFail();

        return $this->oneRoster->users($request, $cliente, $tipo === 'students' ? 'alumno' : 'docente', $aula);
    }

    private function cliente(Request $request): ClienteOneRoster
    {
        return $request->attributes->get('oneroster_client');
    }
}
