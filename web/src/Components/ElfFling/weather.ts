/**
 * Winter weather on the course (gem shop unlocks, laid out as the elf goes; see course.ts):
 *
 * - High winds: bands of gusts high up among the top sky coins, and some above them all.
 *   Inside one, the elf is pushed forward, a reward for a big launch.
 * - Updrafts: rare columns of rising air from the snow up into the sky. Inside one, the elf is
 *   lifted hard: the way up to the winds and sky coins. A sliding elf is lifted off the snow.
 */

import { between, type ILayout } from "Components/ElfFling/course";

/** A band of wind from x to x + length, centred at height y. */
export type IGust = { x: number; y: number; length: number };

/** A column of rising air centred on x, from the snow up to `top`. */
export type IUpdraft = { x: number; top: number };

/** How hard a gust pushes forward, and an updraft lifts, in m/s per second. */
export const GUST_PUSH = 4;
export const UPDRAFT_LIFT = 60;
/** A gust band's height, and an updraft's width, in metres. */
export const GUST_DEPTH = 10;
export const UPDRAFT_WIDTH = 12;

export const GUST_LAYOUT: ILayout<IGust> = {
	firstAt: { min: 60, max: 150 },
	gap: { min: 80, max: 200 },
	place: (x, random) => [
		{
			x,
			// Most among the upper sky coins; some higher still, above them all.
			y: random() < 0.4 ? between({ min: 56, max: 75 }, random) : between({ min: 30, max: 48 }, random),
			length: between({ min: 30, max: 60 }, random),
		},
	],
};

export const UPDRAFT_LAYOUT: ILayout<IUpdraft> = {
	firstAt: { min: 150, max: 400 },
	gap: { min: 600, max: 1200 },
	place: (x) => [{ x, top: 45 }],
};

export function inGust(gusts: IGust[], x: number, y: number): boolean {
	return gusts.some((gust) => x >= gust.x && x <= gust.x + gust.length && Math.abs(y - gust.y) <= GUST_DEPTH / 2);
}

export function inUpdraft(updrafts: IUpdraft[], x: number, y: number): boolean {
	return updrafts.some((updraft) => Math.abs(x - updraft.x) <= UPDRAFT_WIDTH / 2 && y <= updraft.top);
}
