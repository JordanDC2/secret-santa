<?php

namespace App\Http\Requests\SilentNight;

use App\Models\SilentNightProgress;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChooseCharacterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Only someone they've unlocked.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'character' => ['required', Rule::in(SilentNightProgress::for($this->user())->ownedCast())],
        ];
    }
}
