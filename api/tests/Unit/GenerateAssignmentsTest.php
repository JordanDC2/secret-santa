<?php

namespace Tests\Unit;

use App\Actions\Groups\GenerateAssignments;
use PHPUnit\Framework\TestCase;

class GenerateAssignmentsTest extends TestCase
{
    public function test_no_one_is_assigned_to_themselves(): void
    {
        $action = new GenerateAssignments;

        for ($i = 0; $i < 100; $i++) {
            $assignments = $action([1, 2, 3, 4, 5]);

            foreach ($assignments as $giverId => $receiverId) {
                $this->assertNotSame($giverId, $receiverId);
            }
        }
    }

    public function test_every_member_gives_and_receives_exactly_once(): void
    {
        $action = new GenerateAssignments;
        $memberIds = [1, 2, 3, 4];

        $assignments = $action($memberIds);

        $this->assertSame($memberIds, array_keys($assignments));
        $this->assertEqualsCanonicalizing($memberIds, array_values($assignments));
    }

    public function test_it_works_for_the_minimum_group_size_of_two(): void
    {
        $action = new GenerateAssignments;

        $assignments = $action([1, 2]);

        $this->assertSame([1 => 2, 2 => 1], $assignments);
    }
}
