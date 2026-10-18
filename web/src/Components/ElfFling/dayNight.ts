/**
 * Day and night along the course, by distance: every run starts at night, the sun comes up on
 * long runs, and night falls again further on. Day is harder: it's warmer, so the snow melts
 * (slides slow sooner) and the course's goodies (power-ups, crackers, ornaments, Yule logs)
 * turn up less often. Coins don't mind the weather.
 */

/** One full night-and-day, in metres, and where in it the sun rises and sets. */
const CYCLE = 4000;
const DAWN = { from: 1500, to: 2000 };
const DUSK = { from: 3500, to: 4000 };

/** How warm it is at x: 0 at night, 1 in full day, easing in between at dawn and dusk. */
export function warmth(x: number): number {
	const along = ((x % CYCLE) + CYCLE) % CYCLE;

	if (along < DAWN.from || along >= DUSK.to) {
		return 0;
	}

	if (along < DAWN.to) {
		return smooth((along - DAWN.from) / (DAWN.to - DAWN.from));
	}

	if (along < DUSK.from) {
		return 1;
	}

	return 1 - smooth((along - DUSK.from) / (DUSK.to - DUSK.from));
}

/** Where the sun is in its day at x: 0 as it rises at dawn, 1 as it sets at dusk; null at night. */
export function sunAt(x: number): number | null {
	const along = ((x % CYCLE) + CYCLE) % CYCLE;

	return along < DAWN.from || along >= DUSK.to ? null : (along - DAWN.from) / (DUSK.to - DAWN.from);
}

/** In full day, goodies are this many times further apart. */
export const DAY_SCARCITY = 2;
/** In full day, slush adds this share to the snow's friction. */
export const MELT_FRICTION = 0.6;

/** How much further apart goodies are at x: 1 at night, up to DAY_SCARCITY in full day. */
export function scarcity(x: number): number {
	return 1 + (DAY_SCARCITY - 1) * warmth(x);
}

function smooth(t: number): number {
	return t * t * (3 - 2 * t);
}
