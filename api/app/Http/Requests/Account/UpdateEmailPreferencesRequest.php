<?php

namespace App\Http\Requests\Account;

use App\Enums\EmailKind;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Any of the email kinds, each on or off, e.g. {"santa_chat": false}.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return collect(EmailKind::cases())
            ->mapWithKeys(fn (EmailKind $kind) => [$kind->value => ['sometimes', 'boolean']])
            ->all();
    }
}
