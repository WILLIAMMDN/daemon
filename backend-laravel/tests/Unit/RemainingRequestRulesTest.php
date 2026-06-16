<?php

namespace Tests\Unit;

use App\Http\Requests\Api\V1\Alumno\ActualizarPerfilRequest;
use App\Http\Requests\Api\V1\Archivo\ArchivoStoreRequest;
use App\Http\Requests\Api\V1\Chatbot\EnviarMensajeRequest;
use App\Http\Requests\Api\V1\Chatbot\GuardarBotRequest;
use App\Http\Requests\Api\V1\Competencia\ControlCompetenciaRequest;
use App\Http\Requests\Api\V1\Competencia\VotarRequest;
use App\Http\Requests\Api\V1\Cuento\GuardarCuentoRequest;
use Tests\TestCase;

class RemainingRequestRulesTest extends TestCase
{
    public function test_profile_update_limits_user_images(): void
    {
        $rules = (new ActualizarPerfilRequest)->rules();

        $this->assertContains('image', $rules['avatar']);
        $this->assertContains('max:4096', $rules['avatar']);
        $this->assertContains('max:8192', $rules['fondo']);
    }

    public function test_file_upload_has_allowlist_and_size_limit(): void
    {
        $rules = (new ArchivoStoreRequest)->rules();

        $this->assertContains('file', $rules['archivo']);
        $this->assertContains('max:25600', $rules['archivo']);
        $this->assertNotContains('mimes:php', $rules['archivo']);
    }

    public function test_chatbot_messages_are_bounded(): void
    {
        $rules = (new EnviarMensajeRequest)->rules();

        $this->assertContains('required', $rules['content']);
        $this->assertContains('max:10000', $rules['content']);
    }

    public function test_bot_configuration_requires_name_and_image_avatar(): void
    {
        $rules = (new GuardarBotRequest)->rules();

        $this->assertContains('required', $rules['nombre_bot']);
        $this->assertContains('image', $rules['avatar']);
    }

    public function test_competition_vote_and_control_are_bounded(): void
    {
        $voteRules = (new VotarRequest)->rules();
        $controlRules = (new ControlCompetenciaRequest)->rules();

        $this->assertContains('between:1,10', $voteRules['puntuacion']);
        $this->assertContains('between:10,600', $controlRules['duracion']);
        $this->assertContains('in:candidato,iniciar,cerrar,premiar,reiniciar', $controlRules['accion']);
    }

    public function test_story_request_supports_six_scenes(): void
    {
        $rules = (new GuardarCuentoRequest)->rules();

        $this->assertContains('required', $rules['titulo']);
        $this->assertArrayHasKey('data_6', $rules);
        $this->assertArrayHasKey('pos_6', $rules);
    }
}
