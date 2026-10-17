<?php

namespace App\Http\Requests\ElfFling;

use App\Models\ElfFlingProgress;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLooksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Only looks the player owns can be put to use.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $progress = ElfFlingProgress::for($this->user());

        return [
            'skin' => ['sometimes', 'string', Rule::in($progress->ownedSkins())],
            'batter' => ['sometimes', 'string', Rule::in($progress->ownedBatters())],
        ];
    }
}
