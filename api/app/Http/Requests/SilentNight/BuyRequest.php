<?php

namespace App\Http\Requests\SilentNight;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BuyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Which item; Buy checks it's for sale, its price and whether it's affordable.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['cellar', 'patron', 'cast', 'gun'])],
            'item' => ['required', 'string', 'max:40'],
        ];
    }
}
