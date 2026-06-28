<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class SaludController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'app' => 'DAEMON API',
            'database' => $this->estadoBaseDatos(),
            'assets' => [
                'public_url_configured' => filled(config('daemon.asset_public_url')),
                'cloud_url_configured' => filled(config('daemon.asset_cloud_url')),
                'uploads_disk' => env('UPLOADS_DISK', 'public') ?: 'public',
            ],
        ]);
    }

    /**
     * @return array{ok: bool, error?: string}
     */
    private function estadoBaseDatos(): array
    {
        try {
            DB::select('select 1');

            return ['ok' => true];
        } catch (Throwable $e) {
            return [
                'ok' => false,
                'error' => class_basename($e),
            ];
        }
    }
}
