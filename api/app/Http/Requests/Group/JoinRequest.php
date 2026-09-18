<?php

namespace App\Http\Requests\Group;

use Illuminate\Foundation\Http\FormRequest;

class JoinRequest extends FormRequest
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
            'join_code' => ['required', 'string'],
        ];
    }
}
