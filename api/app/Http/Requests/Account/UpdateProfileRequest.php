<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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
        $user = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            // Email is the login and where assignments go, so changing it needs the password.
            'current_password' => [
                Rule::requiredIf(fn () => $this->string('email')->lower()->value() !== strtolower($user->email)),
                'nullable',
                'current_password:sanctum',
            ],
        ];
    }

    /**
     * Emails are case-insensitive: store and compare them lowercased so "Holly@x.com" and
     * "holly@x.com" are the same account.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }
}
