<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class ManagedProfileRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:255'],
            // Optional: a pet named Biscuit doesn't need one.
            'last_name' => ['nullable', 'string', 'max:255'],
            'kind' => ['required', 'in:child,pet'],
        ];
    }
}
