/**
 * Glass Christmas ornaments hanging in the sky (a shop upgrade). An elf that flies into one
 * shatters it and gets a kick up and forward, like a cracker in mid-air. A fresh, random
 * layout each round.
 */

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

const FIRST_AT = { min: 15, max: 25 };
const GAP = { min: 7, max: 16 };
const HEIGHT = { min: 5, max: 26 };
const COURSE_LENGTH = 1500;

export function layOrnaments(random: () => number = Math.random): IOrnament[] {
	const between = (range: { min: number; max: number }) => range.min + random() * (range.max - range.min);
	const ornaments: IOrnament[] = [];

	for (let x = between(FIRST_AT); x < COURSE_LENGTH; x += between(GAP)) {
		ornaments.push({ x, y: between(HEIGHT), shatteredAt: null });
	}

	return ornaments;
}

/** The whole ornament an elf at (x, y) is hitting, as its index, or -1. */
export function ornamentHit(ornaments: IOrnament[], x: number, y: number): number {
	return ornaments.findIndex(
		(ornament) =>
			ornament.shatteredAt === null &&
			Math.abs(ornament.x - x) <= HIT_RADIUS &&
			Math.hypot(ornament.x - x, ornament.y - y) <= HIT_RADIUS,
	);
}

/** The elf's speed just after shattering an ornament. */
export function kickedVelocity(vx: number, vy: number): { vx: number; vy: number } {
	return { vx: Math.min(MAX_FORWARD, Math.max(0, vx) + KICK_FORWARD), vy: Math.max(vy, 0) + KICK_UP };
}
