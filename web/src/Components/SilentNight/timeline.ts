/**
 * The night, minute by minute (the design doc's timeline): which enemies come and how often, an
 * elite now and then, a ring of them closing in twice in the night, a boss every five minutes,
 * and Krampus at dawn. Also when the patrons' shrines and Krampus's altars appear (patrons.ts).
 */

import { NIGHT_SECONDS } from "Components/SilentNight/constants";
import { spawnEnemy } from "Components/SilentNight/enemies";
import { placeShrine } from "Components/SilentNight/patrons";
import { bargain } from "Components/SilentNight/stats";
import type { IEnemyKind, IEvents, IVector, IWorld } from "Components/SilentNight/types";

type IMix = Array<[IEnemyKind, number]>;

/** What comes, by when in the night (in seconds), as kinds and their shares. */
const MIXES: Array<{ until: number; mix: IMix }> = [
	{ until: 120, mix: [["gingerbread", 1]] },
	{
		until: 300,
		mix: [
			["gingerbread", 0.7],
			["windup", 0.3],
		],
	},
	{
		until: 480,
		mix: [
			["gingerbread", 0.4],
			["windup", 0.25],
			["golem", 0.15],
			["caroller", 0.2],
		],
	},
	{
		until: 600,
		mix: [
			["gingerbread", 0.3],
			["windup", 0.2],
			["golem", 0.15],
			["caroller", 0.15],
			["angel", 0.12],
		],
	},
	{
		until: 780,
		mix: [
			["windup", 0.2],
			["golem", 0.15],
			["caroller", 0.15],
			["angel", 0.12],
			["imp", 0.3],
		],
	},
	{
		until: 900,
		mix: [
			["gingerbread", 0.2],
			["golem", 0.15],
			["angel", 0.12],
			["imp", 0.45],
		],
	},
	{
		until: Infinity,
		mix: [
			["gingerbread", 0.15],
			["windup", 0.15],
			["golem", 0.15],
			["caroller", 0.1],
			["angel", 0.1],
			["imp", 0.3],
		],
	},
];

/** Bosses, at their minutes; Krampus at dawn. */
const BOSSES: Array<[number, IEnemyKind]> = [
	[300, "mouseKing"],
	[600, "ghost"],
	[900, "yuleCat"],
	[NIGHT_SECONDS, "krampus"],
];

/** The shrines' and altars' times (seconds). */
const SHRINES = [90, 210, 390, 510, 690, 810, 990, 1110];
const ALTARS = [270, 570, 870];
/** Rings of enemies closing in from all round. */
const RINGS: Array<[number, IEnemyKind]> = [
	[420, "gingerbread"],
	[780, "imp"],
];

const MAX_ENEMIES = 400;
const MAX_ANGELS = 8;

function pick(mix: IMix): IEnemyKind {
	let roll = Math.random();

	for (const [kind, share] of mix) {
		roll -= share;

		if (roll <= 0) {
			return kind;
		}
	}

	return mix[0][0];
}

/** How many enemies come a second at this point in the night (fewer while a boss is about; twice as many with Krampus's Sack). */
export function spawnRate(world: IWorld): number {
	const rate =
		Math.min(20, 0.8 + world.time * 0.01 + (world.time / 400) ** 2) * (bargain(world.player, "sack") ? 2 : 1);

	return world.enemies.some((enemy) => enemy.boss) ? rate * 0.5 : rate;
}

/** Just beyond the edge of the view, any way round (or, given `toward`, somewhere ahead that way). */
function offscreen(world: IWorld, view: { width: number; height: number }, toward?: IVector) {
	const angle = toward
		? Math.atan2(toward.y, toward.x) + (Math.random() - 0.5) * Math.PI * 0.7
		: Math.random() * Math.PI * 2;
	const distance = Math.hypot(view.width, view.height) / 2 + 12;

	return { x: world.player.x + Math.cos(angle) * distance, y: world.player.y + Math.sin(angle) * distance };
}

export function runTimeline(world: IWorld, dt: number, view: { width: number; height: number }, events: IEvents) {
	const { time } = world;
	const once = (name: string, at: number, act: () => void) => {
		if (time >= at && !world.done.has(name)) {
			world.done.add(name);
			act();
		}
	};

	// Enemies left far behind come round again, ahead of the elf, so running away for ever doesn't work.
	const behind = Math.hypot(view.width, view.height) * 0.9;

	for (const enemy of world.enemies) {
		if (!enemy.boss && Math.hypot(enemy.x - world.player.x, enemy.y - world.player.y) > behind) {
			const at = offscreen(world, view, world.player.heading);
			enemy.x = at.x;
			enemy.y = at.y;
		}
	}

	// Ordinary enemies, from the mix for now.
	if (!world.dawn || world.enemies.length < 60) {
		const mix = MIXES.find((band) => time < band.until)!.mix;
		world.spawnOwed += spawnRate(world) * dt;

		while (world.spawnOwed >= 1) {
			world.spawnOwed -= 1;

			if (world.enemies.length < MAX_ENEMIES) {
				const at = offscreen(world, view);
				let kind = pick(mix);

				// The angels hang back and throw, so too many at once is a storm of shards.
				if (kind === "angel" && world.enemies.filter((enemy) => enemy.kind === "angel").length >= MAX_ANGELS) {
					kind = "gingerbread";
				}

				spawnEnemy(world, kind, at.x, at.y);
			}
		}
	}

	// An elite every minute and a quarter, from the second minute.
	if (time >= 120 && time < NIGHT_SECONDS) {
		const at = 120 + 75 * Math.floor((time - 120) / 75);
		once(`elite-${at}`, at, () => {
			const mix = MIXES.find((band) => at < band.until)!.mix;
			const spot = offscreen(world, view);
			spawnEnemy(world, pick(mix), spot.x, spot.y, true);
		});
	}

	for (const [at, kind] of RINGS) {
		once(`ring-${at}`, at, () => {
			const radius = Math.hypot(view.width, view.height) / 2 + 6;

			for (let i = 0; i < 40; i++) {
				const angle = (i / 40) * Math.PI * 2;
				spawnEnemy(world, kind, world.player.x + Math.cos(angle) * radius, world.player.y + Math.sin(angle) * radius);
			}
		});
	}

	for (const [at, kind] of BOSSES) {
		once(`boss-${kind}`, at, () => {
			const spot = offscreen(world, view);
			spawnEnemy(world, kind, spot.x, spot.y);
			events.boss = kind;

			if (kind === "krampus") {
				world.dawn = true;
			}
		});
	}

	for (const at of SHRINES) {
		once(`shrine-${at}`, at, () => placeShrine(world, "shrine"));
	}

	for (const at of ALTARS) {
		once(`altar-${at}`, at, () => placeShrine(world, "altar"));
	}
}
