/**
 * Candles burning half buried in the snow, and burnt stumps: scattered over the ground the same
 * way every night (one spot per cell, from a hash), so nothing needs remembering until a candle's
 * knocked out. Like Vampire Survivors' braziers, a shot or a blast knocks a candle over (or the
 * elf walking into it), and it leaves something behind (candleDrop): coal most often.
 */

import { hash } from "Components/SilentNight/pixelArt";
import type { IPickupKind, IWorld } from "Components/SilentNight/types";

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

/** The lit candles within `reach` of (x, y), for auto-aim to turn to when there's no enemy in reach. */
export function litCandlesNear(world: IWorld, x: number, y: number, reach: number): IProp[] {
	const found: IProp[] = [];
	const span = Math.ceil(reach / PROP_CELL);
	const cx = Math.floor(x / PROP_CELL);
	const cy = Math.floor(y / PROP_CELL);

	for (let ox = -span; ox <= span; ox++) {
		for (let oy = -span; oy <= span; oy++) {
			const prop = propAt(cx + ox, cy + oy);

			if (prop?.kind === "candle" && !snuffed(world, prop) && Math.hypot(prop.x - x, prop.y - y) < reach) {
				found.push(prop);
			}
		}
	}

	return found;
}

/** Whether a candle's been knocked out this night. */
export function snuffed(world: IWorld, prop: IProp): boolean {
	return world.done.has(prop.key);
}

/**
 * What a candle leaves, as Vampire Survivors' light sources do: one thing, drawn by weight, most
 * often a lump of coal (its gold coin), then cocoa (its floor chicken) and a sack of coal (its coin
 * bag), now and then a crystal, and rarely the Christmas star (its vacuum, from level 12), a
 * stopped clock (its Orologion, from level 8) or a silver bell (its Rosary, from level 6). Luck
 * makes everything but the coal likelier, as it does there.
 */
const DROPS: Array<{ kind: IPickupKind; weight: number; value: number; fromLevel: number }> = [
	{ kind: "coal", weight: 50, value: 1, fromLevel: 1 },
	{ kind: "cocoa", weight: 12, value: 30, fromLevel: 1 },
	{ kind: "coalSack", weight: 10, value: 10, fromLevel: 1 },
	{ kind: "bigCrystal", weight: 4, value: 10, fromLevel: 1 },
	{ kind: "star", weight: 2, value: 0, fromLevel: 12 },
	{ kind: "clock", weight: 2, value: 0, fromLevel: 8 },
	{ kind: "bell", weight: 1, value: 0, fromLevel: 6 },
];

function candleDrop(world: IWorld): { kind: IPickupKind; value: number } {
	const possible = DROPS.filter((drop) => world.player.level >= drop.fromLevel);
	const weightOf = (drop: (typeof DROPS)[number]) =>
		drop.kind === "coal" || drop.kind === "coalSack" ? drop.weight : drop.weight * world.numbers.luck;
	let roll = Math.random() * possible.reduce((total, drop) => total + weightOf(drop), 0);

	return possible.find((drop) => (roll -= weightOf(drop)) <= 0) ?? possible[0];
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
			const { kind, value } = candleDrop(world);
			world.pickups.push({
				id: world.nextId++,
				kind,
				x: prop.x,
				y: prop.y,
				value,
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
