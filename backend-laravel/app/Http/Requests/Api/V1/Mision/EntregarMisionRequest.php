<?php

namespace App\Http\Requests\Api\V1\Mision;

use Illuminate\Foundation\Http\FormRequest;

class EntregarMisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->rol === 'alumno';
    }

    public function rules(): array
    {
        return [
            'texto' => ['nullable', 'string'],
            'archivo' => ['nullable', 'file', 'max:20480', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,ppt,pptx,txt,csv,mp3,wav,mp4,webm'],
        ];
    }
}
