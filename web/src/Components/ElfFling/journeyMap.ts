/**
 * Where everything is on the journey (journey.ts), in metres: how long each journey is, its
 * runway up to the village, and where each round starts. Plain numbers with no imports, so the
 * course (course.ts) and the scenery (biomes.ts) can use them without importing the game's rules.
 */

/** From the start to the village centre: the end of the fifth night (dayNight.ts), so it's dark and the lights are on. */
export const JOURNEY_LENGTH = 20000;
/** How far before the village centre the welcome takes over. */
export const ARRIVAL_DISTANCE = 30;
/** The clear runway up to the village: how long, how fast it carries the elf along (m/s), and how hard it pulls it down (m/s², on top of gravity). */
export const RUNWAY_LENGTH = 150;
export const RUNWAY_SPEED = 16;
export const RUNWAY_PULL = 12;
/** The village's stack of presents (and its reindeer) stand this far past the centre. */
const PILE_PAST_CENTRE = 14;

/** Round 1 starts at the course's own stack of presents; each round after at the last village's. */
export function launchX(round: number): number {
	return round <= 1 ? 0 : (round - 1) * JOURNEY_LENGTH + PILE_PAST_CENTRE;
}

/** Where this round's journey ends: its village centre. */
export function journeyEnd(round: number): number {
	return round * JOURNEY_LENGTH;
}

/** Where the runway up to this round's village starts. */
export function runwayStart(round: number): number {
	return journeyEnd(round) - RUNWAY_LENGTH;
}

/** Kept clear past each village centre: its presents, and room to swing from them. */
const CLEAR_PAST_CENTRE = PILE_PAST_CENTRE + 25;

/**
 * Whether x is somewhere the course lays nothing (course.ts): on a runway, in a village, or
 * by its presents.
 */
export function keptClear(x: number): boolean {
	const along = x % JOURNEY_LENGTH;

	return along >= JOURNEY_LENGTH - RUNWAY_LENGTH || (x >= JOURNEY_LENGTH && along <= CLEAR_PAST_CENTRE);
}
