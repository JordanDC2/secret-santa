/**
 * Glass Christmas ornaments hanging in the sky (a shop upgrade). An elf that flies into one
 * shatters it and gets a kick up and forward, like a cracker in mid-air. Laid out as the elf
 * goes (course.ts).
 */

import { between, type ILayout } from "Components/ElfFling/course";

export type IOrnament = {
	x: number;
	y: number;
	/** Game time it shattered, or null while it's still hanging there. */
	shatteredAt: number | null;
};

/** The ornament's size; the elf's centre must come this close to hit one. */
export const ORNAMENT_RADIUS = 0.45;
const HIT_RADIUS = 1.3;

/** The kick: at least this much upward speed, plus this much forward (up to a limit). */
const KICK_UP = 9;
const KICK_FORWARD = 4;
const MAX_FORWARD = 34;

const HEIGHT = { min: 5, max: 26 };

export const ORNAMENT_LAYOUT: ILayout<IOrnament> = {
	firstAt: { min: 15, max: 25 },
	gap: { min: 7, max: 16 },
	place: (x, random) => [{ x, y: between(HEIGHT, random), shatteredAt: null }],
};

/** The whole ornament an elf at (x, y) is hitting (extraReach further, as a giant snowball), as its index, or -1. */
export function ornamentHit(ornaments: IOrnament[], x: number, y: number, extraReach = 0): number {
	const radius = HIT_RADIUS + extraReach;

	return ornaments.findIndex(
		(ornament) =>
			ornament.shatteredAt === null &&
			Math.abs(ornament.x - x) <= radius &&
			Math.hypot(ornament.x - x, ornament.y - y) <= radius,
	);
}

/** The elf's speed just after shattering an ornament. */
export function kickedVelocity(vx: number, vy: number): { vx: number; vy: number } {
	return { vx: Math.min(MAX_FORWARD, Math.max(0, vx) + KICK_FORWARD), vy: Math.max(vy, 0) + KICK_UP };
}
