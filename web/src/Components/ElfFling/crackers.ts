/**
 * Christmas crackers lying in the snow along the course. An elf that bounces or slides into
 * one pops it, which launches the elf up and forward again. A fresh, random layout each round.
 */

export type ICracker = {
	/** Metres from the start (the same scale as the elf's x). */
	x: number;
	/** Game time it went bang, or null while it's still waiting. */
	poppedAt: number | null;
};

/** How long a cracker is; also how close the elf's centre must come to set one off. */
export const CRACKER_LENGTH = 0.8;
const REACH_X = 0.55;
/** Only an elf down at snow level (bouncing or sliding) can touch one. */
const REACH_Y = 0.65;

/** The bang: straight up this fast, and this much extra speed forward (up to a limit). */
const POP_UP = 10;
const POP_FORWARD = 6;
const MAX_FORWARD = 32;

/** Where they lie: the first a little way out, then irregular gaps, far past any real throw. */
const FIRST_AT = { min: 18, max: 40 };
const GAP = { min: 16, max: 42 };
const COURSE_LENGTH = 1500;

export function layCrackers(random: () => number = Math.random): ICracker[] {
	const between = (range: { min: number; max: number }) => range.min + random() * (range.max - range.min);
	const crackers: ICracker[] = [];

	for (let x = between(FIRST_AT); x < COURSE_LENGTH; x += between(GAP)) {
		crackers.push({ x, poppedAt: null });
	}

	return crackers;
}

/** The unpopped cracker an elf at (x, y) is touching, as its index, or -1. */
export function crackerTouching(crackers: ICracker[], x: number, y: number): number {
	if (y > REACH_Y) {
		return -1;
	}

	return crackers.findIndex((cracker) => cracker.poppedAt === null && Math.abs(cracker.x - x) <= REACH_X);
}

/** The elf's speed just after a cracker goes off under it. */
export function poppedVelocity(vx: number): { vx: number; vy: number } {
	return { vx: Math.min(MAX_FORWARD, Math.max(0, vx) * 0.9 + POP_FORWARD), vy: POP_UP };
}
