/**
 * Chimneys (gem shop): rare brick chimneys standing up out of the snow. An elf that drops into
 * the top of one goes down it into Christmas pinball (Components/Pinball), the secret level.
 * When the last ball drains, the chimney shoots the elf back out, up and forward, and the
 * pinball points count towards the throw's score. Laid out as the elf goes (course.ts).
 */

import type { ILayout } from "Components/ElfFling/course";

export type IChimney = {
	x: number;
	/** Game time the elf went down it, or null while it's waiting. */
	enteredAt: number | null;
};

/** How tall a chimney stands, and how wide its top is. */
export const CHIMNEY_HEIGHT = 2.6;
export const CHIMNEY_WIDTH = 1.4;
/** How far either side of the middle, and how far above the top, a falling elf drops in. */
const MOUTH_REACH = 1.4;
const MOUTH_DEPTH = 2.5;
/** Coming back out: shot up and forward, fast. */
export const CHIMNEY_LAUNCH = { forward: 34, up: 18 };

/** Rare: a kilometre or two apart, the first a good way out. */
export const CHIMNEY_LAYOUT: ILayout<IChimney> = {
	firstAt: { min: 500, max: 1200 },
	gap: { min: 1200, max: 2400 },
	place: (x) => [{ x, enteredAt: null }],
	scarcerByDay: true,
};

/** The chimney a falling elf at (x, y) is dropping into, as its index, or -1. */
export function chimneyEntered(chimneys: IChimney[], x: number, y: number, vy: number): number {
	if (vy >= 0 || y > CHIMNEY_HEIGHT + MOUTH_DEPTH || y < CHIMNEY_HEIGHT - 0.2) {
		return -1;
	}

	return chimneys.findIndex((chimney) => chimney.enteredAt === null && Math.abs(chimney.x - x) <= MOUTH_REACH);
}
