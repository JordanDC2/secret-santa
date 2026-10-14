<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteAccountRequest extends FormRequest
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
        // Someone who only uses "Continue with Google" has no password, so they type their
        // email instead: enough to stop a slip of the finger.
        if (! $this->user()->has_password) {
            return [
                'confirm_email' => ['required', 'string', Rule::in([$this->user()->email])],
            ];
        }

        return [
            'current_password' => ['required', 'current_password:sanctum'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'confirm_email.in' => 'That isn\'t the email on your account.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('confirm_email'))) {
            $this->merge(['confirm_email' => strtolower(trim($this->input('confirm_email')))]);
        }
    }
}
