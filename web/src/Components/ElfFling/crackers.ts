/**
 * Christmas crackers lying in the snow along the course. An elf that bounces or slides into
 * one pops it, which launches the elf up and forward again. Laid out as the elf goes (course.ts).
 */

import { between, type ILayout } from "Components/ElfFling/course";

export type ICracker = {
	/** Metres from the start (the same scale as the elf's x). */
	x: number;
	/** Game time it went bang, or null while it's still waiting. */
	poppedAt: number | null;
	/** A 0–1 random number picked when it's laid out, for its wrapping and its confetti. */
	look: number;
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

/**
 * Where they lie: the first a little way out, then uneven gaps, and now and then a little
 * cluster of two or three a few metres apart, to bounce along.
 */
export const CRACKER_LAYOUT: ILayout<ICracker> = {
	firstAt: { min: 12, max: 45 },
	gap: { min: 12, max: 48 },
	scarcerByDay: true,
	place: (x, random) => {
		const count = random() < 0.25 ? 2 + Math.floor(random() * 2) : 1;
		const crackers: ICracker[] = [];

		for (let i = 0, at = x; i < count; i++, at += between({ min: 3, max: 6 }, random)) {
			crackers.push({ x: at, poppedAt: null, look: random() });
		}

		return crackers;
	},
};

/** The unpopped cracker an elf at (x, y) is touching (extraReach further, as a giant snowball), as its index, or -1. */
export function crackerTouching(crackers: ICracker[], x: number, y: number, extraReach = 0): number {
	if (y > REACH_Y + extraReach) {
		return -1;
	}

	return crackers.findIndex((cracker) => cracker.poppedAt === null && Math.abs(cracker.x - x) <= REACH_X + extraReach);
}

/** The elf's speed just after a cracker goes off under it. */
export function poppedVelocity(vx: number): { vx: number; vy: number } {
	return { vx: Math.min(MAX_FORWARD, Math.max(0, vx) * 0.9 + POP_FORWARD), vy: POP_UP };
}
