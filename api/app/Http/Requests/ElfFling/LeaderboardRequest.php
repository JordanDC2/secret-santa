<?php

namespace App\Http\Requests\ElfFling;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaderboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'board' => ['required', Rule::in(['distance', 'score', 'coins', 'swings'])],
            'period' => ['required', Rule::in(['week', 'all'])],
        ];
    }
}
