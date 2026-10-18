<?php

namespace App\Http\Requests\ElfFling;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Which item; BuyItem checks it's for sale, its price and whether it's affordable.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['upgrade', 'gemUpgrade', 'skin', 'batter'])],
            'item' => ['required', 'string', 'max:40'],
            // Levels at once (×5, or as many as the coins allow): only the endless upgrades take more than one.
            'count' => ['sometimes', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
