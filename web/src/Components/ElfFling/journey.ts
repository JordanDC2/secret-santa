/**
 * Journey's End: the course runs from the snowy hills to Santa's village at the North Pole
 * (biomes.ts), with a clear runway up to it (where everything is: journeyMap.ts). Coming up
 * to the village centre, the run is taken over: the elf bounces in to the centre, in front of Santa's workshop; little folk pour
 * out of the doors and celebrate under fireworks; then they carry the elf off to the village's
 * own stack of presents, just past the centre, and toss it up on top. There, it waits for a tap
 * to hop off and be swung again: round 2, the course starting over from the hills, with the
 * distance carrying on. And so on, at the end of every journey. Times in seconds; places in metres.
 */

import { launchX } from "Components/ElfFling/journeyMap";
import { ELF_RADIUS, STACK } from "Components/ElfFling/physics";
import type { ISkinId } from "Components/ElfFling/skins";

/** How long each part of the welcome takes. */
const ROLL_IN = 2.2;
const PARTY = 4.5;
const GATHER = 0.7;
const CARRY = 2;
const TOSS = 0.9;

/** Carried, the elf rides this high, on the crowd's heads. */
const CARRY_HEIGHT = 0.55;
/** The toss onto the presents peaks this far above the top of the stack. */
const TOSS_PEAK = 2.5;

/** Who comes out to celebrate, in the order they come out of the door: mostly elves. */
export const CROWD: ISkinId[] = ["elf", "elf", "santa", "elf", "mrsClaus", "elf", "snowman", "elf", "reindeer", "elf"];

/**
 * A welcome under way: when it started, where the elf was then, which village it's at, and
 * (once the elf's hopped off for the next round) when that was.
 */
export type ICelebration = {
	startedAt: number;
	from: { x: number; y: number };
	centre: number;
	launchedAt: number | null;
};

export type ICelebrationStage = "rolling" | "party" | "carrying" | "tossing" | "waiting" | "after";

/** Which part of the welcome it's in, and how far through that part (0 to 1). */
export function celebrationStage(celebration: ICelebration, time: number): { stage: ICelebrationStage; along: number } {
	if (celebration.launchedAt !== null) {
		return { stage: "after", along: 1 };
	}

	let t = time - celebration.startedAt;

	for (const [stage, length] of [
		["rolling", ROLL_IN],
		["party", PARTY],
		["carrying", GATHER + CARRY],
		["tossing", TOSS],
	] as const) {
		if (t < length) {
			return { stage, along: t / length };
		}

		t -= length;
	}

	return { stage: "waiting", along: 1 };
}

function ease(t: number): number {
	return t * t * (3 - 2 * t);
}

/** Where the elf sits on top of the stack of presents, ready to hop off. */
export function onTheStack(round: number): { x: number; y: number } {
	return { x: launchX(round) + STACK.left + 0.1, y: STACK.top + ELF_RADIUS };
}

/** The elf's place through the welcome (scripted, not physics); `round` is the one about to start. */
export function elfDuringCelebration(
	celebration: ICelebration,
	time: number,
	round: number,
): { x: number; y: number; spin: number } {
	const { stage, along } = celebrationStage(celebration, time);
	const { centre, from } = celebration;
	const carriedTo = launchX(round) - 0.8;
	const stack = onTheStack(round);

	switch (stage) {
		case "rolling": {
			// Bouncing in, lower and lower, and rolling as it goes.
			const p = ease(along);
			const bounce = Math.abs(Math.sin(along * Math.PI * 3)) * 1.2 * (1 - along);

			return {
				x: from.x + (centre - from.x) * p,
				y: Math.max(ELF_RADIUS, from.y + (ELF_RADIUS - from.y) * p + bounce),
				spin: -along * Math.PI * 4,
			};
		}
		case "party":
			// Hopping for joy.
			return { x: centre, y: ELF_RADIUS + Math.abs(Math.sin(along * PARTY * 5)) * 0.35, spin: 0 };
		case "carrying": {
			const t = along * (GATHER + CARRY);
			const lifted = Math.min(1, t / GATHER);
			const carried = ease(Math.max(0, (t - GATHER) / CARRY));

			return {
				x: centre + (carriedTo - centre) * carried,
				y: ELF_RADIUS + CARRY_HEIGHT * lifted + Math.abs(Math.sin(t * 9)) * 0.08,
				spin: 0,
			};
		}
		case "tossing": {
			// Up in an arc, turning a somersault, and down onto the top present.
			const startY = ELF_RADIUS + CARRY_HEIGHT;
			const peak = stack.y + TOSS_PEAK;
			const y =
				along < 0.5
					? startY + (peak - startY) * Math.sin(along * Math.PI)
					: stack.y + (peak - stack.y) * Math.sin(along * Math.PI);

			return { x: carriedTo + (stack.x - carriedTo) * along, y, spin: -along * Math.PI * 2 };
		}
		default:
			return { ...stack, spin: 0 };
	}
}

/**
 * Where crowd member `index` is (feet on the snow at y 0, or carrying), or null while they're
 * still inside the workshop. They come out of the door one after another and spread out round
 * the elf, bounce, gather under it to carry it to the presents, then cheer beside the stack.
 */
export function crowdMember(
	celebration: ICelebration,
	time: number,
	round: number,
	index: number,
): { x: number; y: number; squash: number } | null {
	const { stage, along } = celebrationStage(celebration, time);
	const { centre } = celebration;
	const count = CROWD.length;
	const elf = elfDuringCelebration(celebration, time, round);
	// Their places round the elf at the party, either side of it, and after, past the stack (in view while the elf waits on it).
	const side = index % 2 === 0 ? -1 : 1;
	const partySpot = centre + side * (1 + Math.floor(index / 2) * 0.95);
	const cheerSpot = launchX(round) + 3.4 + index * 0.55;
	const hop = (speed: number) => Math.abs(Math.sin((time - celebration.startedAt) * speed + index * 1.7));

	if (stage === "rolling") {
		return null;
	}

	if (stage === "party") {
		const t = along * PARTY;
		const out = t - index * 0.18;

		if (out < 0) {
			return null;
		}

		// Hopping out of the door to their place, then bouncing.
		if (out < 0.8) {
			const p = out / 0.8;

			return { x: centre + (partySpot - centre) * p, y: Math.sin(p * Math.PI) * 0.9, squash: 0 };
		}

		const bounce = hop(7);

		return { x: partySpot, y: bounce * 0.55, squash: bounce < 0.15 ? 0.2 : 0 };
	}

	if (stage === "carrying") {
		const t = along * (GATHER + CARRY);
		const underElf = elf.x + (index - (count - 1) / 2) * 0.3;
		const p = Math.min(1, t / GATHER);

		return { x: partySpot + (underElf - partySpot) * p, y: hop(9) * 0.08, squash: 0 };
	}

	if (stage === "tossing") {
		const underElf = launchX(round) - 0.8 + (index - (count - 1) / 2) * 0.3;

		return { x: underElf + (cheerSpot - underElf) * ease(along), y: hop(7) * 0.3, squash: 0 };
	}

	const bounce = hop(6 + (index % 3));

	return { x: cheerSpot, y: bounce * 0.5, squash: bounce < 0.15 ? 0.2 : 0 };
}

/** Fireworks go up every this many seconds, from the party until the elf's off again (when the music stops too). */
const FIREWORK_EVERY = 0.45;
/** How long a burst lasts. */
const BURST_SECONDS = 1.4;

/** The fireworks' times, from the start of the welcome: the first goes up as the party starts. */
function fireworksWindow(celebration: ICelebration, time: number): { from: number; to: number } {
	const from = celebration.startedAt + ROLL_IN;
	const to = celebration.launchedAt === null ? time : Math.min(time, celebration.launchedAt);

	return { from, to };
}

/** How many fireworks have gone up so far (for the bangs). */
export function fireworksSoFar(celebration: ICelebration | null, time: number): number {
	if (!celebration) {
		return 0;
	}

	const { from, to } = fireworksWindow(celebration, time);

	return to < from ? 0 : Math.floor((to - from) / FIREWORK_EVERY) + 1;
}

/** The bursts in the sky now: each one's number, where it is, and how far through it is (0 to 1). */
export function burstsNow(
	celebration: ICelebration,
	time: number,
	hash: (n: number) => number,
): Array<{ id: number; x: number; y: number; age: number }> {
	const { from } = fireworksWindow(celebration, time);
	const count = fireworksSoFar(celebration, time);
	const bursts = [];

	for (let id = Math.max(0, count - Math.ceil(BURST_SECONDS / FIREWORK_EVERY) - 1); id < count; id++) {
		const age = (time - (from + id * FIREWORK_EVERY)) / BURST_SECONDS;

		if (age >= 0 && age < 1) {
			bursts.push({
				id,
				x: celebration.centre + (hash(id * 7 + 1) - 0.3) * 18,
				y: 5 + hash(id * 11 + 2) * 3.5,
				age,
			});
		}
	}

	return bursts;
}
