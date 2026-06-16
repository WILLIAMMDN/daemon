<?php

namespace Tests\Unit;

use App\Http\Requests\Api\V1\Docente\AsignarTokensRequest;
use App\Http\Requests\Api\V1\Evaluacion\GuardarPreguntasRequest;
use App\Http\Requests\Api\V1\Mision\EntregarMisionRequest;
use App\Http\Requests\Api\V1\Mision\MisionStoreRequest;
use App\Http\Requests\Api\V1\Tienda\PremioStoreRequest;
use Tests\TestCase;

class ModuleRequestRulesTest extends TestCase
{
    public function test_token_assignment_has_bounded_amount_and_student_target(): void
    {
        $rules = (new AsignarTokensRequest)->rules();

        $this->assertContains('exists:usuarios,id', $rules['id_alumno']);
        $this->assertContains('between:-100000,100000', $rules['cantidad']);
    }

    public function test_mission_creation_requires_core_fields(): void
    {
        $rules = (new MisionStoreRequest)->rules();

        $this->assertContains('required', $rules['titulo']);
        $this->assertContains('required', $rules['recompensa']);
        $this->assertContains('in:TODOS,KIDS,TEENS,PRO', $rules['nivel_requerido']);
    }

    public function test_mission_delivery_blocks_script_like_extensions_by_mime_allowlist(): void
    {
        $rules = (new EntregarMisionRequest)->rules();

        $this->assertContains('file', $rules['archivo']);
        $this->assertContains('max:20480', $rules['archivo']);
        $this->assertNotContains('mimes:php', $rules['archivo']);
    }

    public function test_prize_creation_requires_store_economy_fields(): void
    {
        $rules = (new PremioStoreRequest)->rules();

        $this->assertContains('min:0', $rules['precio']);
        $this->assertContains('min:0', $rules['stock']);
        $this->assertContains('in:fisico,digital', $rules['tipo_entrega']);
    }

    public function test_question_bank_requires_correct_answer(): void
    {
        $rules = (new GuardarPreguntasRequest)->rules();

        $this->assertContains('required', $rules['preguntas']);
        $this->assertContains('required', $rules['preguntas.*.respuesta_correcta']);
    }
}
