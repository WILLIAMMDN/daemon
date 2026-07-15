<?php

namespace Tests\Unit;

use App\Enums\NivelAlumno;
use App\Http\Requests\Api\V1\Auth\CambiarClaveRequest;
use App\Http\Requests\Api\V1\Auth\CompletarPerfilFirebaseRequest;
use App\Http\Requests\Api\V1\Auth\FirebaseTutorLoginRequest;
use App\Http\Requests\Api\V1\Auth\RecuperarClaveRequest;
use App\Http\Requests\Api\V1\Auth\RegistroAlumnoRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class AuthRequestRulesTest extends TestCase
{
    public function test_public_registration_does_not_accept_role(): void
    {
        $rules = (new RegistroAlumnoRequest)->rules();

        $this->assertArrayNotHasKey('rol', $rules);
        $this->assertContains('min:8', $rules['password']);
        $this->assertContains('unique:usuarios,email', $rules['email']);
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

    public function test_firebase_profile_completion_requires_token_and_profile_fields(): void
    {
        $rules = (new CompletarPerfilFirebaseRequest)->rules();

        $this->assertContains('required', $rules['id_token']);
        $this->assertContains('max:8192', $rules['id_token']);
        $this->assertContains('alpha_dash', $rules['usuario']);
        $this->assertContains('accepted', $rules['acepta_privacidad']);
        $this->assertContains('exclude_unless:nivel,KIDS', $rules['email_tutor']);
        $this->assertSame(['KIDS', 'TEENS'], NivelAlumno::values());
        $this->assertTrue(Validator::make(['nivel' => 'KIDS'], ['nivel' => $rules['nivel']])->passes());
        $this->assertTrue(Validator::make(['nivel' => 'TEENS'], ['nivel' => $rules['nivel']])->passes());
        $this->assertFalse(Validator::make(['nivel' => 'PRO'], ['nivel' => $rules['nivel']])->passes());
    }

    public function test_tutor_firebase_creation_requires_explicit_privacy_acceptance(): void
    {
        $rules = (new FirebaseTutorLoginRequest)->rules();

        $this->assertContains('required', $rules['id_token']);
        $this->assertContains('boolean', $rules['crear_cuenta']);
        $this->assertContains('exclude_unless:crear_cuenta,true', $rules['acepta_privacidad']);
        $this->assertContains('accepted', $rules['acepta_privacidad']);
        $this->assertFalse(Validator::make([
            'id_token' => 'firebase-token',
            'crear_cuenta' => true,
        ], $rules)->passes());
        $this->assertTrue(Validator::make([
            'id_token' => 'firebase-token',
            'crear_cuenta' => true,
            'acepta_privacidad' => true,
        ], $rules)->passes());
    }
}
