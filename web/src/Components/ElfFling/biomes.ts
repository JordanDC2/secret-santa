/**
 * The course's biomes, by distance: what the scenery behind the course is. A run starts in the
 * snowy hills; once the first sun has set (dayNight.ts), it heads into the boreal forest. Each
 * fades in over BLEND metres of its start.
 */

export type IBiomeId = "hills" | "borealForest";

export const BIOMES: Array<{ id: IBiomeId; name: string; from: number }> = [
	{ id: "hills", name: "The snowy hills", from: 0 },
	// The first dusk ends at 4,000 m.
	{ id: "borealForest", name: "The Boreal Forest", from: 4000 },
];

/** How far a biome takes to fade in, in metres. */
const BLEND = 400;
/** How long (in metres) a biome's name shows as the elf arrives. */
export const BIOME_TITLE_METRES = 160;

/** How much of the boreal forest there is at x: 0 before it, 1 once it's fully in. */
export function forestAt(x: number): number {
	const start = BIOMES.find((biome) => biome.id === "borealForest")!.from;
	const t = Math.min(1, Math.max(0, (x - start) / BLEND));

	return t * t * (3 - 2 * t);
}

/** The biome the elf has just come into at x (for its name over the game), if any. */
export function arrivingIn(x: number): { name: string; along: number } | null {
	const biome = BIOMES.find(
		(candidate) => candidate.from > 0 && x >= candidate.from && x < candidate.from + BIOME_TITLE_METRES,
	);

	return biome ? { name: biome.name, along: (x - biome.from) / BIOME_TITLE_METRES } : null;
}
