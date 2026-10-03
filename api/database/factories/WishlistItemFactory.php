<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WishlistItem>
 */
class WishlistItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'url' => fake()->optional()->url(),
            'price' => fake()->optional()->randomFloat(2, 5, 200),
            'notes' => fake()->optional()->sentence(),
            'rating' => fake()->numberBetween(1, 5),
        ];
    }

    public function claimedBy(User $user, int $quantity = 1): static
    {
        return $this->afterCreating(fn (WishlistItem $item) => $item->claims()->create([
            'user_id' => $user->id,
            'quantity' => $quantity,
        ]));
    }
}
