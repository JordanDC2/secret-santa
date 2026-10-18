/**
 * Snowmen: the course's one hazard, and a rare one. An elf that bounces or slides into a
 * snowman loses its speed (all of it, unless it has the padded snowsuit) and knocks the
 * snowman over. Flying over one, or jumping, is safe. Laid out as the elf goes (course.ts).
 */

import type { ILayout } from "Components/ElfFling/course";

export type ISnowman = {
	x: number;
	/** Game time it was knocked over, or null while it's standing. */
	toppledAt: number | null;
};

/** How tall a snowman stands; an elf whose centre is below this hits it. */
export const SNOWMAN_HEIGHT = 1.7;
const HIT_HALF_WIDTH = 0.55;

/** Far apart on purpose: most throws meet none, a long one maybe one or two. */
export const SNOWMAN_LAYOUT: ILayout<ISnowman> = {
	firstAt: { min: 120, max: 220 },
	gap: { min: 260, max: 460 },
	place: (x) => [{ x, toppledAt: null }],
};

/** The standing snowman an elf at (x, y) is running into, as its index, or -1. */
export function snowmanHit(snowmen: ISnowman[], x: number, y: number): number {
	if (y > SNOWMAN_HEIGHT) {
		return -1;
	}

	return snowmen.findIndex((snowman) => snowman.toppledAt === null && Math.abs(snowman.x - x) <= HIT_HALF_WIDTH);
}
