/**
 * The course's biomes, by distance: the scenery behind (and in front of) the course. A run
 * starts in the snowy hills; once the first sun has set (dayNight.ts), it heads into the boreal
 * forest, and after the second, out onto the Arctic tundra under the northern lights. Each fades
 * in over BLEND metres of its start, over the one before.
 */

export type IBiomeId = "hills" | "borealForest" | "tundra";

export const BIOMES: Array<{ id: IBiomeId; name: string; from: number }> = [
	{ id: "hills", name: "The snowy hills", from: 0 },
	// The first dusk ends at 4,000 m, the second at 8,000 m.
	{ id: "borealForest", name: "The Boreal Forest", from: 4000 },
	{ id: "tundra", name: "The Arctic Tundra", from: 8000 },
];

/** How far a biome takes to fade in, in metres. */
const BLEND = 400;
/** How long (in metres) a biome's name shows as the elf arrives. */
export const BIOME_TITLE_METRES = 160;

function smooth(t: number): number {
	return t * t * (3 - 2 * t);
}

/** How much of each biome there is at x (0 to 1, adding up to 1): each fades in over the one before. */
export function biomeWeights(x: number): Record<IBiomeId, number> {
	const fadedIn = BIOMES.map((biome, index) =>
		index === 0 ? 1 : smooth(Math.min(1, Math.max(0, (x - biome.from) / BLEND))),
	);

	return Object.fromEntries(
		BIOMES.map((biome, index) => [biome.id, fadedIn[index] * (1 - (fadedIn[index + 1] ?? 0))]),
	) as Record<IBiomeId, number>;
}

/** The biome the elf has just come into at x (for its name over the game), if any. */
export function arrivingIn(x: number): { name: string; along: number } | null {
	const biome = BIOMES.find(
		(candidate) => candidate.from > 0 && x >= candidate.from && x < candidate.from + BIOME_TITLE_METRES,
	);

	return biome ? { name: biome.name, along: (x - biome.from) / BIOME_TITLE_METRES } : null;
}
