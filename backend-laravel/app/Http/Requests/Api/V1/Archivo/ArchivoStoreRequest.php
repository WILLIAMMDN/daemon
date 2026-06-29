<?php

namespace App\Http\Requests\Api\V1\Archivo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArchivoStoreRequest extends FormRequest
{
    private const EVIDENCE_FOLDERS = ['entrega', 'entregas', 'evidencia', 'evidencias'];

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $carpeta = (string) $this->input('carpeta', 'general');
        $esEvidencia = in_array($carpeta, self::EVIDENCE_FOLDERS, true);

        return [
            'archivo' => [
                'required',
                'file',
                $esEvidencia ? 'max:20480' : 'max:8192',
                $esEvidencia
                    ? 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,ppt,pptx,txt,csv,mp3,wav,mp4,webm'
                    : 'mimes:jpg,jpeg,png,gif,webp',
            ],
            'carpeta' => ['nullable', 'string', 'max:40', Rule::in([
                'general',
                'perfil',
                'perfiles',
                'avatar',
                'fondo',
                'fondos',
                'heroe',
                'heroes',
                'bot',
                'bots',
                'entrega',
                'entregas',
                'evidencia',
                'evidencias',
                'cuento',
                'cuentos',
            ])],
        ];
    }
}
