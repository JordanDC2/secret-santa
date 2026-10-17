/**
 * The sleigh sighting (a shop upgrade): in some rounds a sleigh crosses the sky ahead, flying
 * forward more slowly than a good throw. An elf that catches it rides along at speed for a
 * few seconds, then is let go with a big forward fling.
 */

export type ISleigh = {
	x: number;
	y: number;
	vx: number;
	/** Game time the elf jumped aboard, or null if it hasn't. */
	boardedAt: number | null;
	/** Whether the ride is over (the elf's been let go). */
	finished: boolean;
};

/** How often a round has a sleigh, once the upgrade's bought. */
const CHANCE = 0.45;
const START_X = { min: 40, max: 140 };
const HEIGHT = { min: 4, max: 11 };
const CRUISE_SPEED = 11;
/** Carrying the elf, it speeds up to this, for this long. */
export const RIDE_SPEED = 30;
export const RIDE_SECONDS = 2.5;
/** The elf is let go with this upward speed. */
export const RELEASE_UP = 6;
/** How close the elf must come to climb aboard: a sleigh is a big target. */
const CATCH_RADIUS = 3;

export function maybeSleigh(random: () => number = Math.random): ISleigh | null {
	if (random() >= CHANCE) {
		return null;
	}

	const between = (range: { min: number; max: number }) => range.min + random() * (range.max - range.min);

	return { x: between(START_X), y: between(HEIGHT), vx: CRUISE_SPEED, boardedAt: null, finished: false };
}

/** When the elf is coming up behind within this distance, the sleigh swoops toward its height. */
const SWOOP_RANGE = 45;
const SWOOP_SPEED = 9;
const LOWEST = 2;

/**
 * Moves the sleigh on: cruising (swooping toward an elf coming up behind, as if to pick it
 * up), carrying the elf at speed, or climbing away afterwards.
 */
export function moveSleigh(sleigh: ISleigh, dt: number, elf: { x: number; y: number }): ISleigh {
	let y = sleigh.y;

	if (sleigh.finished) {
		y += 6 * dt;
	} else if (sleigh.boardedAt === null && elf.x < sleigh.x && sleigh.x - elf.x < SWOOP_RANGE) {
		const toward = Math.max(-SWOOP_SPEED * dt, Math.min(SWOOP_SPEED * dt, elf.y - sleigh.y));
		y = Math.max(LOWEST, y + toward);
	}

	return { ...sleigh, x: sleigh.x + sleigh.vx * dt, y };
}

export function canBoard(sleigh: ISleigh | null, x: number, y: number): boolean {
	return (
		sleigh !== null &&
		sleigh.boardedAt === null &&
		Math.abs(sleigh.x - x) <= CATCH_RADIUS &&
		Math.hypot(sleigh.x - x, sleigh.y - y) <= CATCH_RADIUS
	);
}
