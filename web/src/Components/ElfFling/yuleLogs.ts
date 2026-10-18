/**
 * Yule log cannons (gem shop): hollow logs lying in the snow, their open ends facing the
 * reindeer. An elf that slides, rolls or skims low into one is caught, held a moment while the
 * log shakes and smokes, then fired out up and forward, however slowly it arrived. Flying over
 * one, or landing on top, does nothing. Laid out as the elf goes (course.ts).
 */

import type { ILayout } from "Components/ElfFling/course";

export type IYuleLog = {
	x: number;
	/** Game time it fired the elf out, or null while it's waiting. */
	firedAt: number | null;
};

/** How long a log holds the elf before firing, in seconds. */
export const LOG_HOLD_SECONDS = 0.6;
/** Firing speed at levels 1, 2 and 3, in m/s, at 45°. */
export const LOG_SPEEDS = [28, 34, 40];
/** How long a log is, and how close to its open end the sliding elf must come. */
export const LOG_LENGTH = 1.6;
const MOUTH_REACH = 0.7;
/** Low enough to go in the open end, rather than over or onto the log. */
const MOUTH_HEIGHT = 0.8;

export const YULE_LOG_LAYOUT: ILayout<IYuleLog> = {
	// Rare, so one is a treat: a few hundred metres apart.
	firstAt: { min: 120, max: 260 },
	gap: { min: 300, max: 600 },
	place: (x) => [{ x, firedAt: null }],
};

/** The unfired log whose open end an elf at (x, y), heading forward, has reached, as its index, or -1. */
export function logCatching(logs: IYuleLog[], x: number, y: number, vx: number): number {
	if (y > MOUTH_HEIGHT || vx <= 0) {
		return -1;
	}

	return logs.findIndex((log) => log.firedAt === null && x >= log.x - MOUTH_REACH && x <= log.x + MOUTH_REACH);
}
