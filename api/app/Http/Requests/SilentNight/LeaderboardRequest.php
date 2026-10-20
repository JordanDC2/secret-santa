<?php

namespace App\Http\Requests\SilentNight;

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
            'board' => ['required', Rule::in(['night', 'krampus', 'kills'])],
            'period' => ['required', Rule::in(['week', 'all'])],
        ];
    }
}
