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

    public function test_blocked_pairs_are_never_drawn(): void
    {
        $action = new GenerateAssignments;
        // 1 and 2 are a couple (both ways); 3 may not draw 4, but 4 may draw 3.
        $blocked = [[1, 2], [2, 1], [3, 4]];

        for ($i = 0; $i < 200; $i++) {
            $assignments = $action([1, 2, 3, 4, 5], $blocked);

            $this->assertNotNull($assignments);
            $this->assertNotSame(2, $assignments[1]);
            $this->assertNotSame(1, $assignments[2]);
            $this->assertNotSame(4, $assignments[3]);
            $this->assertEqualsCanonicalizing([1, 2, 3, 4, 5], array_values($assignments));
        }
    }

    public function test_one_way_blocks_still_allow_the_reverse(): void
    {
        $action = new GenerateAssignments;

        // In a group of 3, if 1 can't draw 2 then 1 must draw 3, 3 must draw 2 and 2 draws 1.
        $this->assertSame([1 => 3, 2 => 1, 3 => 2], $action([1, 2, 3], [[1, 2]]));
    }

    public function test_it_reports_when_exclusions_make_a_draw_impossible(): void
    {
        $action = new GenerateAssignments;

        // Two people who can't draw each other have no one else to draw.
        $this->assertNull($action([1, 2], [[1, 2], [2, 1]]));

        // Everyone blocked from drawing 3 means nobody can be 3's Santa.
        $this->assertNull($action([1, 2, 3], [[1, 3], [2, 3]]));
    }
}
