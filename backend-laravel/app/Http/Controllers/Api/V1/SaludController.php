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
        $database = $this->estadoBaseDatos();
        $ok = $database['ok'];

        return response()->json([
            'ok' => $ok,
            'app' => 'DAEMON API',
            'version' => config('app.version'),
            'commit' => config('app.commit'),
            'database' => $database,
            'assets' => [
                'public_url_configured' => filled(config('daemon.asset_public_url')),
                'cloud_url_configured' => filled(config('daemon.asset_cloud_url')),
                'uploads_disk' => env('UPLOADS_DISK', 'public') ?: 'public',
                'private_uploads_disk' => config('daemon.private_uploads_disk'),
            ],
            'checked_at' => now()->toIso8601String(),
        ], $ok ? 200 : 503);
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
                'error' => 'database_unavailable',
            ];
        }
    }
}
