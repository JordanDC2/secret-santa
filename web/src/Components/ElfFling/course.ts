/**
 * The course, laid out as the elf goes: there's no end to it. Coins, crackers, ornaments,
 * snowmen, power-ups, Yule logs, chimneys and the weather are each laid out by a layout (where the first goes, the gap after each, and what to
 * put there), a chunk at a time, always well ahead of the elf; things far behind are dropped,
 * so only a short stretch is ever kept. Nothing's laid on the runways and in the villages at
 * each journey's end (journeyMap.ts).
 *
 * Each round has a seed, and each chunk's randomness comes from the seed and the chunk's
 * number, so a round's course is the same however it's played (and the physics stays pure).
 */

import type { IChimney } from "Components/ElfFling/chimneys";
import { addCoins, type ICoin } from "Components/ElfFling/coins";
import { scarcity } from "Components/ElfFling/dayNight";
import type { ICracker } from "Components/ElfFling/crackers";
import { keptClear } from "Components/ElfFling/journeyMap";
import type { IOrnament } from "Components/ElfFling/ornaments";
import type { IPowerUp } from "Components/ElfFling/powerUps";
import type { IGust, IUpdraft } from "Components/ElfFling/weather";
import type { IYuleLog } from "Components/ElfFling/yuleLogs";
import type { ISnowman } from "Components/ElfFling/snowmen";

export type IRange = { min: number; max: number };

/** How one kind of thing is spread along the course. */
export type ILayout<T> = {
	firstAt: IRange;
	gap: IRange;
	/** What goes at x: usually one thing, sometimes a little pattern. */
	place: (x: number, random: () => number) => T[];
	/** Whether it turns up less often in the day (dayNight.ts): the course's goodies do. */
	scarcerByDay?: boolean;
};

export type ICourseItems = {
	coins: ICoin[];
	crackers: ICracker[];
	ornaments: IOrnament[];
	snowmen: ISnowman[];
	powerUps: IPowerUp[];
	yuleLogs: IYuleLog[];
	gusts: IGust[];
	updrafts: IUpdraft[];
	chimneys: IChimney[];
};

export type ICourse = {
	seed: number;
	/** Laid out up to here, in metres. */
	laidTo: number;
	/** Where each layout puts its next thing. */
	cursors: number[];
};

/** Laid out this much at a time, and kept at least this far ahead of the elf. */
const CHUNK = 250;
const AHEAD = 600;
/** Things further behind the elf than this are dropped. A high, zoomed-out camera can still
    show a couple of hundred metres back, so this leaves room. */
const BEHIND = 400;

/** A number in [min, max) from a 0–1 random number generator. */
/** The high sky, above the sky coins: where an updraft or a huge launch sends the elf. */
export const HIGH_SKY: IRange = { min: 60, max: 140 };

export function between(range: IRange, random: () => number): number {
	return range.min + random() * (range.max - range.min);
}

/** A small, fast seeded random number generator (mulberry32): the same seed, the same numbers. */
export function seededRandom(seed: number): () => number {
	let state = seed >>> 0;

	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** The randomness for one part of the course (a chunk, or the starting positions). */
function randomFor(seed: number, part: number): () => number {
	return seededRandom(Math.imul(seed ^ 0x9e3779b9, 31) + part * 0x85ebca6b);
}

/** Everything a layout puts down from its cursor up to (not including) `to`, except where the course is kept clear. */
function layOut<T extends { x: number }>(
	layout: ILayout<T>,
	cursor: number,
	to: number,
	random: () => number,
): { items: T[]; cursor: number } {
	const items: T[] = [];
	let x = cursor;

	for (; x < to; x += between(layout.gap, random) * (layout.scarcerByDay ? scarcity(x) : 1)) {
		items.push(...layout.place(x, random).filter((item) => !keptClear(item.x)));
	}

	return { items, cursor: x };
}

type ILayouts = {
	coins: ILayout<ICoin>[];
	crackers: ILayout<ICracker> | null;
	ornaments: ILayout<IOrnament> | null;
	snowmen: ILayout<ISnowman>;
	powerUps: ILayout<IPowerUp> | null;
	yuleLogs: ILayout<IYuleLog> | null;
	gusts: ILayout<IGust> | null;
	updrafts: ILayout<IUpdraft> | null;
	chimneys: ILayout<IChimney> | null;
};

/** Every layout in a fixed order, so each keeps its own cursor. Missing ones (not bought) lay nothing. */
function allLayouts(layouts: ILayouts): Array<ILayout<unknown> | null> {
	return [
		...layouts.coins,
		layouts.crackers,
		layouts.ornaments,
		layouts.snowmen,
		layouts.powerUps,
		layouts.yuleLogs,
		layouts.gusts,
		layouts.updrafts,
		layouts.chimneys,
	];
}

/** A new course for a round: nothing laid yet, each layout's first spot picked. */
export function startCourse(layouts: ILayouts, seed: number): ICourse {
	const random = randomFor(seed, -1);

	return {
		seed,
		laidTo: 0,
		cursors: allLayouts(layouts).map((layout) => (layout ? between(layout.firstAt, random) : Infinity)),
	};
}

/**
 * Lays out more course while the elf at x is within AHEAD of the end, and drops what's well
 * behind it. Returns the same objects when there's nothing to do, which is almost every step.
 */
export function keepCourseAhead<T extends ICourseItems & { course: ICourse }>(
	state: T,
	layouts: ILayouts,
	x: number,
): T {
	if (state.course.laidTo >= x + AHEAD) {
		return state;
	}

	let { coins, crackers, ornaments, snowmen, powerUps, yuleLogs, gusts, updrafts, chimneys } = state;
	const cursors = [...state.course.cursors];
	let laidTo = state.course.laidTo;
	const keep = <I extends { x: number }>(items: I[]) => items.filter((item) => item.x >= x - BEHIND);
	coins = keep(coins);
	crackers = keep(crackers);
	ornaments = keep(ornaments);
	snowmen = keep(snowmen);
	powerUps = keep(powerUps);
	yuleLogs = keep(yuleLogs);
	gusts = keep(gusts);
	updrafts = keep(updrafts);
	chimneys = keep(chimneys);

	while (laidTo < x + AHEAD) {
		const to = laidTo + CHUNK;
		const random = randomFor(state.course.seed, laidTo / CHUNK);
		const lay = <I extends { x: number }>(layout: ILayout<I> | null, index: number): I[] => {
			if (!layout) {
				return [];
			}

			const laid = layOut(layout, cursors[index], to, random);
			cursors[index] = laid.cursor;

			return laid.items;
		};

		const newCoins = layouts.coins.flatMap((layout, index) => lay(layout, index));
		const base = layouts.coins.length;
		coins = addCoins(coins, newCoins);
		crackers = [...crackers, ...lay(layouts.crackers, base)];
		ornaments = [...ornaments, ...lay(layouts.ornaments, base + 1)];
		snowmen = [...snowmen, ...lay(layouts.snowmen, base + 2)];
		powerUps = [...powerUps, ...lay(layouts.powerUps, base + 3)];
		yuleLogs = [...yuleLogs, ...lay(layouts.yuleLogs, base + 4)];
		gusts = [...gusts, ...lay(layouts.gusts, base + 5)];
		updrafts = [...updrafts, ...lay(layouts.updrafts, base + 6)];
		chimneys = [...chimneys, ...lay(layouts.chimneys, base + 7)];
		laidTo = to;
	}

	return {
		...state,
		coins,
		crackers,
		ornaments,
		snowmen,
		powerUps,
		yuleLogs,
		gusts,
		updrafts,
		chimneys,
		course: { ...state.course, laidTo, cursors },
	};
}
