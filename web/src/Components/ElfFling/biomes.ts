/**
 * The course's biomes, by distance: the scenery behind (and in front of) the course. A run
 * starts in the snowy hills; once the first sun has set (dayNight.ts), it follows a mountain
 * stream up into the mountains, after the second, heads into the boreal forest, after the
 * third, out onto the Arctic tundra under the northern lights, and after the fourth, into
 * Santa's village at the North Pole, where the journey ends (journey.ts). Each fades in over
 * BLEND metres of its start, over the one before. After each journey's end it all starts over,
 * the hills fading in over the village.
 */

import { JOURNEY_LENGTH } from "Components/ElfFling/journeyMap";

export type IBiomeId = "hills" | "mountainStream" | "borealForest" | "tundra" | "northPole";

export const BIOMES: Array<{ id: IBiomeId; name: string; from: number }> = [
	{ id: "hills", name: "The snowy hills", from: 0 },
	// The first dusk ends at 4,000 m, the second at 8,000 m, the third at 12,000 m, the fourth at 16,000 m.
	{ id: "mountainStream", name: "The Mountain Stream", from: 4000 },
	{ id: "borealForest", name: "The Boreal Forest", from: 8000 },
	{ id: "tundra", name: "The Arctic Tundra", from: 12000 },
	{ id: "northPole", name: "The North Pole", from: 16000 },
];

/** How far a biome takes to fade in, in metres. */
const BLEND = 400;
/** How long (in metres) a biome's name shows as the elf arrives. */
export const BIOME_TITLE_METRES = 160;

function smooth(t: number): number {
	return t * t * (3 - 2 * t);
}

/** How far into its own journey x is: the course starts over after each journey's end. */
function alongJourney(x: number): number {
	return x < JOURNEY_LENGTH ? x : x % JOURNEY_LENGTH;
}

/** How much of each biome there is at x (0 to 1, adding up to 1): each fades in over the one before. */
export function biomeWeights(x: number): Record<IBiomeId, number> {
	const along = alongJourney(x);
	const fadedIn = BIOMES.map((biome, index) =>
		index === 0 ? 1 : smooth(Math.min(1, Math.max(0, (along - biome.from) / BLEND))),
	);
	const weights = Object.fromEntries(
		BIOMES.map((biome, index) => [biome.id, fadedIn[index] * (1 - (fadedIn[index + 1] ?? 0))]),
	) as Record<IBiomeId, number>;

	// Starting over: the hills fade in over the village just left.
	if (x >= JOURNEY_LENGTH && along < BLEND) {
		const hills = smooth(along / BLEND);

		return { ...weights, hills, northPole: 1 - hills };
	}

	return weights;
}

/** The biome the elf has just come into at x (for its name over the game), if any. */
export function arrivingIn(x: number): { name: string; along: number } | null {
	const along = alongJourney(x);
	const biome = BIOMES.find(
		(candidate) => candidate.from > 0 && along >= candidate.from && along < candidate.from + BIOME_TITLE_METRES,
	);

	return biome ? { name: biome.name, along: (along - biome.from) / BIOME_TITLE_METRES } : null;
}
