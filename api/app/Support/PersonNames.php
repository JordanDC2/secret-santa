<?php

namespace App\Support;

use App\Models\Group;
use App\Models\User;

/**
 * How people are named around the app: by first name, with just enough of the last name to
 * tell apart two people in the same group who share one ("Nick C." and "Nick S.", or "Nick Ca."
 * and "Nick Co." when the initials match too). Wishlists and "who you drew" use full names
 * instead (User::$full_name), so there's no doubt whose list or which person it is.
 */
class PersonNames
{
    /**
     * Each member's name as the group shows it, keyed by user id.
     *
     * @return array<int, string>
     */
    public static function forGroup(Group $group): array
    {
        return self::among($group->members);
    }

    /**
     * One person's name as the given group shows it. Someone who isn't a member (say, they
     * left) is just their first name.
     */
    public static function inGroup(User $person, Group $group): string
    {
        return self::forGroup($group)[$person->id] ?? $person->first_name;
    }

    /**
     * Each person's name, told apart from the others in the same list, keyed by user id.
     *
     * @param  iterable<User>  $people
     * @return array<int, string>
     */
    public static function among(iterable $people): array
    {
        $byFirstName = [];
        foreach ($people as $person) {
            $byFirstName[mb_strtolower(trim($person->first_name))][] = $person;
        }

        $names = [];
        foreach ($byFirstName as $namesakes) {
            foreach ($namesakes as $person) {
                $names[$person->id] = count($namesakes) === 1
                    ? $person->first_name
                    : self::toldApart($person, $namesakes);
            }
        }

        return $names;
    }

    /**
     * The first name plus the shortest start of the last name no namesake shares.
     *
     * @param  array<int, User>  $namesakes  Everyone with this first name, the person included.
     */
    private static function toldApart(User $person, array $namesakes): string
    {
        $lastName = trim((string) $person->last_name);
        if ($lastName === '') {
            return $person->first_name;
        }

        $others = array_filter($namesakes, fn (User $other) => $other->id !== $person->id);
        $length = mb_strlen($lastName);

        for ($letters = 1; $letters < $length; $letters++) {
            $start = mb_strtolower(mb_substr($lastName, 0, $letters));
            $shared = array_filter(
                $others,
                fn (User $other) => mb_strtolower(mb_substr(trim((string) $other->last_name), 0, $letters)) === $start,
            );

            if ($shared === []) {
                return $person->first_name.' '.mb_substr($lastName, 0, $letters).'.';
            }
        }

        return $person->first_name.' '.$lastName;
    }
}
