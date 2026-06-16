<?php

namespace Tests\Unit;

use App\Http\Requests\Api\V1\Auth\CambiarClaveRequest;
use App\Http\Requests\Api\V1\Auth\RecuperarClaveRequest;
use App\Http\Requests\Api\V1\Auth\RegistroAlumnoRequest;
use Tests\TestCase;

class AuthRequestRulesTest extends TestCase
{
    public function test_public_registration_does_not_accept_role(): void
    {
        $rules = (new RegistroAlumnoRequest)->rules();

        $this->assertArrayNotHasKey('rol', $rules);
        $this->assertContains('min:8', $rules['password']);
    }

    public function test_password_change_requires_current_password_and_confirmation(): void
    {
        $rules = (new CambiarClaveRequest)->rules();

        $this->assertContains('required', $rules['password_actual']);
        $this->assertContains('confirmed', $rules['password']);
        $this->assertContains('min:8', $rules['password']);
    }

    public function test_password_recovery_requires_user_or_email(): void
    {
        $rules = (new RecuperarClaveRequest)->rules();

        $this->assertContains('required_without:email', $rules['usuario']);
        $this->assertContains('required_without:usuario', $rules['email']);
    }
}
