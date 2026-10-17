<?php

namespace App\Http\Requests\ElfFling;

use Illuminate\Foundation\Http\FormRequest;

class RecordThrowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Any real throw goes: the upper bounds are only what the database can store.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'distance' => ['required', 'numeric', 'min:0', 'max:'.config('elf_fling.max_distance')],
            // What the throw collected, before the lucky stocking (the server adds that).
            'coins_collected' => ['required', 'integer', 'min:0', 'max:'.config('elf_fling.max_coins')],
        ];
    }
}
