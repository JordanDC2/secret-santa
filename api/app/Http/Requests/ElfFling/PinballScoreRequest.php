<?php

namespace App\Http\Requests\ElfFling;

use Illuminate\Foundation\Http\FormRequest;

class PinballScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Any real score goes: the upper bound is only what the database can store.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'score' => ['required', 'integer', 'min:0', 'max:'.config('elf_fling.max_coins')],
        ];
    }
}
