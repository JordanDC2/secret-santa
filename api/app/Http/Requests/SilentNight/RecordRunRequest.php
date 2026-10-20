<?php

namespace App\Http\Requests\SilentNight;

use Illuminate\Foundation\Http\FormRequest;

class RecordRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * A night lasts twenty minutes to dawn, and Krampus offers five bargains in all
     * (web/src/Components/SilentNight: constants.ts and bargains.ts). Kills and levels are only
     * kept within what any night could reach.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'seconds' => ['required', 'integer', 'min:0', 'max:1200'],
            'kills' => ['required', 'integer', 'min:0', 'max:1000000'],
            'level' => ['required', 'integer', 'min:1', 'max:1000'],
            'bargains' => ['required', 'integer', 'min:0', 'max:5'],
            'won' => ['required', 'boolean'],
        ];
    }
}
