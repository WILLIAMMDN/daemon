<?php

namespace App\Http\Controllers\Interoperabilidad;

use App\Http\Controllers\Controller;
use App\Models\ClienteOneRoster;
use App\Services\Interoperabilidad\OneRosterGradebookService;
use Illuminate\Http\Request;

class OneRosterGradebookController extends Controller
{
    public function __construct(private readonly OneRosterGradebookService $gradebook) {}

    public function index(Request $request, string $tipo)
    {
        return match ($tipo) {
            'categories' => $this->gradebook->categories($request, $this->cliente($request)),
            'lineItems' => $this->gradebook->lineItems($request, $this->cliente($request)),
            'results' => $this->gradebook->results($request, $this->cliente($request)),
            default => abort(404),
        };
    }

    public function show(Request $request, string $tipo, string $sourcedId)
    {
        abort_unless(in_array($tipo, ['categories', 'lineItems', 'results'], true), 404);

        return $this->gradebook->item($tipo, $sourcedId, $this->cliente($request));
    }

    private function cliente(Request $request): ClienteOneRoster
    {
        return $request->attributes->get('oneroster_client');
    }
}
