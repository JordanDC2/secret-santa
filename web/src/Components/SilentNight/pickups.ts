/**
 * What the elf picks up: crystals of frost (experience), mugs of cocoa (health), the Christmas
 * star (pulls in every crystal there is), coal by the lump and the sack (banked at the night's
 * end), a stopped clock (every ordinary enemy near freezes for ten seconds), a silver bell (every
 * ordinary enemy near is slain), and chests and gear from elites and bosses (gear waits for the
 * player to choose whether to wear it). Things within the
 * elf's reach (stats.ts) fly to it. Too many crystals lying about merge into big ones.
 */

import { freeze, heal, hurtEnemy, near, touches, type IGrid } from "Components/SilentNight/combat";
import { experienceFor } from "Components/SilentNight/constants";
import { openChest } from "Components/SilentNight/levelUp";
import { byRank, rank } from "Components/SilentNight/stats";
import type { IEvents, IWorld } from "Components/SilentNight/types";

const PULL_SPEED = 160;
const MAX_CRYSTALS = 250;

export function movePickups(world: IWorld, grid: IGrid, dt: number, events: IEvents) {
	const { player, numbers } = world;
	// La Flor and Saint Lucia together: crystals come from anywhere in the light. A Yule Lad's meat-hook:
	// further, while dashing.
	const hooked = world.time < player.dashUntil ? 1 + byRank(player, "meatHook", [0.5, 1, 1.5]) : 1;
	const reach = (rank(player, "bloomOfLight") > 0 ? 60 * numbers.light : numbers.reach) * hooked;

	world.pickups = world.pickups.filter((pickup) => {
		const dx = player.x - pickup.x;
		const dy = player.y - 4 - pickup.y;
		const distance = Math.hypot(dx, dy);

		if (pickup.kind !== "chest" && pickup.kind !== "gear" && distance < reach) {
			pickup.pulled = true;
		}

		if (pickup.pulled) {
			const step = Math.min(distance, PULL_SPEED * dt * (1 + (world.time - pickup.at) * 0.2));
			pickup.x += (dx / (distance || 1)) * step;
			pickup.y += (dy / (distance || 1)) * step;
		}

		if (distance > 8) {
			return true;
		}

		if (pickup.gear) {
			world.prompt = { kind: "gear", gear: pickup.gear };
			events.chest = true;
		} else {
			collect(world, grid, pickup.kind, pickup.value, events);
		}

		return false;
	});

	mergeCrystals(world);
}

/** How far round the elf a stopped clock and a silver bell reach: about as far as can be seen. */
const AROUND = 220;

function collect(world: IWorld, grid: IGrid, kind: string, value: number, events: IEvents) {
	const { player } = world;
	events.pickups += 1;

	switch (kind) {
		case "crystal":
		case "bigCrystal":
			player.experience += value;

			while (player.experience >= experienceFor(player.level)) {
				player.experience -= experienceFor(player.level);
				player.level += 1;
				world.levelUpsOwed += 1;
				events.levelUp = true;
			}

			// La Flor and the Christkind: every humble crystal a little healing.
			if (rank(player, "humblestGift") > 0) {
				heal(world, 0.5, events);
				events.healed = false;
			}

			break;
		case "cocoa":
			heal(world, value * world.numbers.cocoa * (1 + byRank(player, "saffronBuns", [0.25, 0.5, 0.75])), events);

			// Saint Lucia's saffron buns: everything close round the elf set burning.
			if (rank(player, "saffronBuns") > 0) {
				const reach = 30 * world.numbers.area;
				world.effects.push({
					kind: "ring",
					x: player.x,
					y: player.y - 6,
					at: world.time,
					until: world.time + 0.4,
					radius: reach,
					angle: 0,
					data: [],
				});
				near(grid, player.x, player.y, reach + 10, (enemy) => {
					if (touches(enemy, player.x, player.y - 6, reach)) {
						enemy.burnUntil = world.time + 3;
						enemy.burnDamage = 6;
						enemy.burnSource = "saffronBuns";
					}
				});
				events.ignited = true;
			}

			break;
		case "star":
			for (const pickup of world.pickups) {
				if (pickup.kind === "crystal" || pickup.kind === "bigCrystal") {
					pickup.pulled = true;
				}
			}

			break;
		case "chest":
			openChest(world, value, events);
			break;
		case "coal":
		case "coalSack":
			world.coalFound += value;
			break;
		case "clock":
			// Time stands still for every enemy near but the bosses.
			for (const enemy of world.enemies) {
				if (!enemy.boss && Math.hypot(enemy.x - player.x, enemy.y - player.y) < AROUND) {
					freeze(world, enemy, 10);
				}
			}

			world.effects.push({
				kind: "frost",
				x: player.x,
				y: player.y - 6,
				at: world.time,
				until: world.time + 0.6,
				radius: AROUND,
				angle: 0,
				data: [],
			});
			events.froze = true;
			events.chest = true;
			break;
		case "bell":
			// Every ordinary enemy near is slain (elites and bosses only shrug).
			for (const enemy of world.enemies) {
				if (!enemy.boss && !enemy.elite && Math.hypot(enemy.x - player.x, enemy.y - player.y) < AROUND) {
					hurtEnemy(world, grid, enemy, enemy.health * 10 + 1000, null, null, events, 0, true);
				}
			}

			world.effects.push({
				kind: "ring",
				x: player.x,
				y: player.y - 6,
				at: world.time,
				until: world.time + 0.6,
				radius: AROUND,
				angle: 0,
				data: [],
			});
			events.blasts += 1;
			events.chest = true;
			break;
	}
}

/** Too many crystals lying about: the furthest from the elf merge into one big one. */
function mergeCrystals(world: IWorld) {
	const crystals = world.pickups.filter((pickup) => pickup.kind === "crystal" || pickup.kind === "bigCrystal");

	if (crystals.length <= MAX_CRYSTALS) {
		return;
	}

	const { player } = world;
	let furthest = crystals[0];
	let total = 0;
	const merged = new Set<number>();

	for (const crystal of crystals) {
		if (Math.hypot(crystal.x - player.x, crystal.y - player.y) > 160 && !crystal.pulled) {
			total += crystal.value;
			merged.add(crystal.id);
			furthest = crystal;
		}
	}

	if (merged.size < 2) {
		return;
	}

	world.pickups = world.pickups.filter((pickup) => !merged.has(pickup.id));
	world.pickups.push({
		id: world.nextId++,
		kind: "bigCrystal",
		x: furthest.x,
		y: furthest.y,
		value: total,
		pulled: false,
		at: world.time,
	});
}
