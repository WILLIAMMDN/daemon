<?php

namespace App\Http\Requests\Api\V1\Archivo;

use Illuminate\Foundation\Http\FormRequest;

class ArchivoStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'archivo' => ['required', 'file', 'max:25600', 'mimes:jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,ppt,pptx,xls,xlsx,txt,csv,zip,mp3,wav,mp4,webm'],
            'carpeta' => ['nullable', 'alpha_dash', 'max:40'],
        ];
    }
}
