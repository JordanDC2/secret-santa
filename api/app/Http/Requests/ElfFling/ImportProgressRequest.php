<?php

namespace App\Http\Requests\ElfFling;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * What a browser saved before accounts kept it: only things the shop sells, at levels it
     * has (amounts are trusted; the bounds are just what the database can store).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'coins' => ['required', 'integer', 'min:0', 'max:'.config('elf_fling.max_coins')],
            'upgrades' => ['present', 'array'],
            'skins' => ['present', 'array'],
            'skins.*' => [Rule::in(array_keys(config('elf_fling.skins')))],
            'batters' => ['present', 'array'],
            'batters.*' => [Rule::in(array_keys(config('elf_fling.batters')))],
            'best_distance' => ['nullable', 'numeric', 'min:0', 'max:'.config('elf_fling.max_distance')],
        ];

        foreach (config('elf_fling.upgrades') as $upgrade => $prices) {
            $rules["upgrades.{$upgrade}"] = ['sometimes', 'integer', 'min:0', 'max:'.count($prices)];
        }

        return $rules;
    }

    /**
     * The device's progress, kept to the upgrades the shop knows.
     *
     * @return array{coins: int, upgrades: array<string, int>, skins: array<int, string>, batters: array<int, string>, best_distance: float|null}
     */
    public function device(): array
    {
        $known = array_keys(config('elf_fling.upgrades'));

        return [
            'coins' => $this->integer('coins'),
            'upgrades' => array_map('intval', array_intersect_key((array) $this->input('upgrades'), array_flip($known))),
            'skins' => array_values((array) $this->input('skins')),
            'batters' => array_values((array) $this->input('batters')),
            'best_distance' => $this->filled('best_distance') ? $this->float('best_distance') : null,
        ];
    }
}
