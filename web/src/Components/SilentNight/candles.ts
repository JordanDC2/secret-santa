/**
 * Candles burning half buried in the snow, and burnt stumps: scattered over the ground the same
 * way every night (one spot per cell, from a hash), so nothing needs remembering until a candle's
 * knocked out. Like Vampire Survivors' braziers, a shot or a blast knocks a candle over, and it
 * leaves something behind: cocoa most often, a crystal, or now and then the Christmas star.
 */

import { hash } from "Components/SilentNight/pixelArt";
import type { IWorld } from "Components/SilentNight/types";

/** Things are scattered one per cell of this many pixels, at most. */
export const PROP_CELL = 72;

export type IProp = { kind: "candle" | "stump"; x: number; y: number; key: string };

/** What's in a cell, if anything. */
export function propAt(cx: number, cy: number): IProp | null {
	const roll = hash(cx * 1.37, cy * 2.71);
	const x = cx * PROP_CELL + hash(cx, cy + 9) * PROP_CELL;
	const y = cy * PROP_CELL + hash(cx + 5, cy) * PROP_CELL;
	const key = `candle-${cx},${cy}`;

	if (roll < 0.1) {
		return { kind: "candle", x, y, key };
	}

	return roll < 0.24 ? { kind: "stump", x, y, key } : null;
}

/** Whether a candle's been knocked out this night. */
export function snuffed(world: IWorld, prop: IProp): boolean {
	return world.done.has(prop.key);
}

/** A shot or blast at (x, y), `radius` across, knocks over any lit candle it reaches. */
export function knockCandles(world: IWorld, x: number, y: number, radius: number) {
	const cx = Math.floor(x / PROP_CELL);
	const cy = Math.floor(y / PROP_CELL);

	for (let ox = -1; ox <= 1; ox++) {
		for (let oy = -1; oy <= 1; oy++) {
			const prop = propAt(cx + ox, cy + oy);

			if (prop?.kind !== "candle" || snuffed(world, prop) || Math.hypot(prop.x - x, prop.y - 4 - y) > radius + 4) {
				continue;
			}

			world.done.add(prop.key);
			const roll = Math.random();
			const kind = roll < 0.55 ? "cocoa" : roll < 0.93 ? "bigCrystal" : "star";
			world.pickups.push({
				id: world.nextId++,
				kind,
				x: prop.x,
				y: prop.y,
				value: kind === "cocoa" ? 30 : kind === "bigCrystal" ? 10 : 0,
				pulled: false,
				at: world.time,
			});
			world.effects.push({
				kind: "crumbs",
				x: prop.x,
				y: prop.y - 4,
				at: world.time,
				until: world.time + 0.5,
				radius: 3,
				angle: 0,
				data: [-1],
			});
		}
	}
}
