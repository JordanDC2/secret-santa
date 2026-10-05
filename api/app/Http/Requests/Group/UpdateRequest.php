<?php

namespace App\Http\Requests\Group;

use App\Models\Group;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
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
            // Either may be sent on its own: the card edits the name and the description separately.
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'exchange_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', $this->sensibleExchangeDate(...)],
            // A single amount sends only budget_max; a range sends both, low to high.
            'budget_min' => ['sometimes', 'nullable', 'integer', 'min:0', 'lt:budget_max'],
            'budget_max' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000', 'required_with:budget_min'],
        ];
    }

    /**
     * A new date must be between today and two years out, so a mistyped year (the browser's
     * date field takes any) can't slip in. Saving the date the group already has is fine, so
     * the budget stays editable after an exchange has passed.
     */
    private function sensibleExchangeDate(string $attribute, mixed $value, Closure $fail): void
    {
        $group = $this->route('group');

        if (! is_string($value) || ($group instanceof Group && $value === $group->exchange_date?->toDateString())) {
            return;
        }

        $today = now(config('app.reminder_timezone'));

        if ($value < $today->toDateString()) {
            $fail("Pick a date that hasn't passed yet.");
        } elseif ($value > $today->copy()->addYears(2)->toDateString()) {
            $fail('Pick a date within the next two years.');
        }
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'budget_min.lt' => 'The low end of the budget must be less than the high end.',
            'budget_max.required_with' => 'Add the high end of the budget too.',
        ];
    }
}
