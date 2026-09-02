<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Pulse\LecturasPulse;
use Illuminate\Http\Request;

class PulseController extends Controller
{
    public function __construct(private readonly LecturasPulse $pulse) {}

    public function show(Request $request): array
    {
        return $this->pulse->snapshot($request->user());
    }

    public function transacciones(Request $request)
    {
        return $this->pulse->transacciones($request->user(), (int) $request->integer('per_page', 25));
    }

    public function logros(Request $request): array
    {
        return ['data' => $this->pulse->logros($request->user())];
    }
}
