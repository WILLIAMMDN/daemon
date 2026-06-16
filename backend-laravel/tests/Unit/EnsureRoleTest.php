<?php

namespace Tests\Unit;

use App\Http\Middleware\EnsureRole;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class EnsureRoleTest extends TestCase
{
    public function test_allows_authorized_roles(): void
    {
        $request = Request::create('/api/v1/docente/panel');
        $request->setUserResolver(fn () => (object) ['rol' => 'docente']);

        $response = (new EnsureRole)->handle($request, fn () => response('ok'), 'docente', 'admin');

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_blocks_unauthorized_roles(): void
    {
        $request = Request::create('/api/v1/docente/panel');
        $request->setUserResolver(fn () => (object) ['rol' => 'alumno']);

        $this->expectException(HttpException::class);

        (new EnsureRole)->handle($request, fn () => response('ok'), 'docente', 'admin');
    }
}
