<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Group>
 */
class GroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'owner_id' => User::factory(),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Group $group) {
            $group->members()->attach($group->owner_id);
        });
    }
}
