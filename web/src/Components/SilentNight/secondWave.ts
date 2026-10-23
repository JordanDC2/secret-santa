/**
 * The patrons' blessings that act over time (the rest are worked into stats.ts and combat.ts): La
 * Befana's coal bombs, dropped as the elf dashes, and their soot; the Yule Goat's charge through
 * the crowd and his straw that burns when the elf is hit; Mari Lwyd's song, driving enemies back,
 * her chant and her snapping jaw; Ded Moroz's frost tracks; and the duos that come with a dash or
 * every so often (knock and run, night flight, the frost flower). La Befana's broom too: a burst of
 * speed after dashing through an enemy.
 */

import { burst } from "Components/SilentNight/weapons";
import { freeze, hurtEnemy, near, touches, type IGrid } from "Components/SilentNight/combat";
import { byRank, rank } from "Components/SilentNight/stats";
import type { IEnemy, IEvents, IWorld } from "Components/SilentNight/types";

/** How long a coal bomb sits on the snow before it goes off. */
const FUSE = 0.6;

/** Slowed by `amount` while in soot or frost tracks, and a moment after. */
function slow(world: IWorld, enemy: IEnemy, amount: number) {
	enemy.slowUntil = Math.max(enemy.slowUntil, world.time + 0.2);
	enemy.slow = Math.max(enemy.slow, amount);
}

/** How far (`x`, `y`) is from the line between two points. */
function fromLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
	const lx = x2 - x1;
	const ly = y2 - y1;
	const t = Math.max(0, Math.min(1, ((x - x1) * lx + (y - y1) * ly) / (lx * lx + ly * ly || 1)));

	return Math.hypot(x - x1 - lx * t, y - y1 - ly * t);
}

/** La Befana: a coal bomb left where the elf starts a dash. */
export function dropCoalBomb(world: IWorld) {
	const { player } = world;

	if (rank(player, "coalBombs") === 0) {
		return;
	}

	world.effects.push({
		kind: "coal",
		x: player.x,
		y: player.y,
		at: world.time,
		until: world.time + FUSE,
		radius: 26 * world.numbers.area,
		angle: 0,
		data: [player.x, player.y, byRank(player, "coalBombs", [30, 45, 60]), 0, 0],
	});
}

export function useSecondWave(world: IWorld, grid: IGrid, dt: number, events: IEvents) {
	const { player, numbers } = world;

	// Coal bombs (and burning straw) going off; with Saint Lucia, setting everything they hit alight.
	for (const effect of world.effects) {
		if (effect.kind !== "coal" || effect.data[3] === 1 || world.time < effect.until) {
			continue;
		}

		effect.data[3] = 1;
		const [x, y, damage, , straw] = effect.data;
		burst(world, grid, x, y, effect.radius, damage, null, events);

		// La Befana's soot, where a coal bomb (not burning straw) went off.
		if (straw !== 1 && rank(player, "sootAndAsh") > 0) {
			world.effects.push({
				kind: "soot",
				x,
				y,
				at: world.time,
				until: world.time + 3,
				radius: effect.radius,
				angle: 0,
				data: [],
			});
		}

		if (straw === 1 || rank(player, "burningCoal") > 0) {
			near(grid, x, y - 4, effect.radius, (enemy) => {
				if (touches(enemy, x, y - 4, effect.radius)) {
					enemy.burnUntil = world.time + 3;
					enemy.burnDamage = 6;
				}
			});
		}
	}

	// Soot and frost tracks: slowing whatever's in them.
	for (const effect of world.effects) {
		if (effect.kind === "soot") {
			near(grid, effect.x, effect.y, effect.radius, (enemy) => {
				if (Math.hypot(enemy.x - effect.x, enemy.y - effect.y) < effect.radius) {
					slow(world, enemy, byRank(player, "sootAndAsh", [0.3, 0.4, 0.5]));
				}
			});
		}

		if (effect.kind === "tracks") {
			const [x1, y1, x2, y2] = effect.data;
			const reach = Math.hypot(x2 - x1, y2 - y1) / 2 + effect.radius;
			near(grid, (x1 + x2) / 2, (y1 + y2) / 2, reach, (enemy) => {
				if (fromLine(enemy.x, enemy.y, x1, y1, x2, y2) < effect.radius) {
					slow(world, enemy, byRank(player, "frostTracks", [0.3, 0.4, 0.5]));
				}
			});
		}
	}

	if (world.time < player.dashUntil) {
		// Ded Moroz's frost tracks: a trail of ice laid down the length of each dash.
		if (rank(player, "frostTracks") > 0) {
			if (events.dashed) {
				world.effects.push({
					kind: "tracks",
					x: player.x,
					y: player.y,
					at: world.time,
					until: world.time + 3,
					radius: 8,
					angle: 0,
					data: [player.x, player.y, player.x, player.y],
				});
			}

			for (let i = world.effects.length - 1; i >= 0; i--) {
				if (world.effects[i].kind === "tracks") {
					world.effects[i].data[2] = player.x;
					world.effects[i].data[3] = player.y;
					break;
				}
			}
		}

		// La Befana's broom: dashing through an enemy, a burst of speed.
		if (rank(player, "ridingTheBroom") > 0) {
			near(grid, player.x, player.y - 4, 12, (enemy) => {
				if (touches(enemy, player.x, player.y - 4, 6)) {
					player.hasteUntil = world.time + 2;

					return true;
				}
			});
		}
	}

	if (events.dashed) {
		// The Yule Lads and Mari Lwyd: a knock at the door, and away.
		if (rank(player, "knockAndRun") > 0) {
			const reach = 30 * numbers.area;
			world.effects.push({
				kind: "pounce",
				x: player.x,
				y: player.y - 4,
				at: world.time,
				until: world.time + 0.35,
				radius: reach,
				angle: 0,
				data: [],
			});
			near(grid, player.x, player.y, reach + 10, (enemy) => {
				if (touches(enemy, player.x, player.y - 4, reach)) {
					const dx = enemy.x - player.x;
					const dy = enemy.y - player.y;
					const length = Math.hypot(dx, dy) || 1;

					if (!enemy.boss) {
						enemy.stunUntil = world.time + 0.5;
					}

					hurtEnemy(world, grid, enemy, 10, { x: dx / length, y: dy / length }, null, events, 4);
				}
			});
		}

		// La Befana and the Christkind: safe a moment longer after each dash.
		if (rank(player, "nightFlight") > 0) {
			player.hurtUntil = Math.max(player.hurtUntil, player.dashUntil + 0.5);
		}
	}

	// Mari Lwyd's jaw: snapping at whatever's right beside the elf, every couple of seconds.
	if (rank(player, "snappingJaw") > 0 && world.time >= player.jawAt) {
		let bit = false;
		near(grid, player.x, player.y, 24, (enemy) => {
			if (touches(enemy, player.x, player.y - 4, 8)) {
				const dx = enemy.x - player.x;
				const dy = enemy.y - player.y;
				const length = Math.hypot(dx, dy) || 1;
				hurtEnemy(
					world,
					grid,
					enemy,
					byRank(player, "snappingJaw", [15, 25, 35]),
					{ x: dx / length, y: dy / length },
					null,
					events,
					2,
				);
				bit = true;
			}
		});

		if (bit) {
			player.jawAt = world.time + 2;
			world.effects.push({
				kind: "chant",
				x: player.x,
				y: player.y - 4,
				at: world.time,
				until: world.time + 0.25,
				radius: 14,
				angle: 0,
				data: [],
			});
		}
	}

	// La Flor and Ded Moroz: frost blooming on the nearest enemy, freezing everything close round it.
	if (rank(player, "frostFlower") > 0 && world.time >= player.frostFlowerAt) {
		let target: IEnemy | null = null;
		let best = 110 * numbers.area;
		near(grid, player.x, player.y, best, (enemy) => {
			const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);

			if (distance < best) {
				best = distance;
				target = enemy;
			}
		});

		if (target) {
			const { x, y } = target as IEnemy;
			const reach = 30 * numbers.area;
			player.frostFlowerAt = world.time + 6;
			world.effects.push({
				kind: "frost",
				x,
				y: y - 4,
				at: world.time,
				until: world.time + 0.6,
				radius: reach,
				angle: 0,
				data: [],
			});
			near(grid, x, y, reach + 10, (enemy) => {
				if (!enemy.boss && touches(enemy, x, y - 4, reach)) {
					freeze(world, enemy, 1.5);
				}
			});
			events.froze = true;
		}
	}

	// The Yule Goat's charge: each enemy the dash passes through, hurt once and thrown aside (with Ded Moroz, frozen).
	if (rank(player, "goatCharge") > 0 && world.time < player.dashUntil) {
		near(grid, player.x, player.y - 4, 12, (enemy) => {
			if (player.charged.has(enemy.id) || !touches(enemy, player.x, player.y - 4, 6)) {
				return;
			}

			player.charged.add(enemy.id);
			const side = (enemy.x - player.x) * player.dash.y - (enemy.y - player.y) * player.dash.x > 0 ? 1 : -1;
			hurtEnemy(
				world,
				grid,
				enemy,
				byRank(player, "goatCharge", [20, 35, 50]),
				{ x: -player.dash.y * side, y: player.dash.x * side },
				null,
				events,
				5,
			);

			if (rank(player, "frozenCharge") > 0 && !enemy.boss) {
				freeze(world, enemy, 1.5);
			}
		});
	}

	// Mari Lwyd's song: enemies close round the elf driven back (bosses stand their ground).
	if (rank(player, "fright") > 0) {
		near(grid, player.x, player.y, numbers.song, (enemy) => {
			const dx = enemy.x - player.x;
			const dy = enemy.y - player.y;
			const distance = Math.hypot(dx, dy) || 1;

			if (!enemy.boss && distance < numbers.song) {
				const shove = 220 * (1 - distance / numbers.song) * dt;
				enemy.push.x += (dx / distance) * shove;
				enemy.push.y += (dy / distance) * shove;
			}
		});
	}

	// Mari Lwyd's chant (the pwnco): every few seconds, a ring that hurts and stuns.
	if (rank(player, "pwnco") > 0 && world.time >= player.chantAt) {
		player.chantAt = world.time + byRank(player, "pwnco", [6, 5, 4]);
		const reach = 50 * numbers.area;
		world.effects.push({
			kind: "chant",
			x: player.x,
			y: player.y - 6,
			at: world.time,
			until: world.time + 0.5,
			radius: reach,
			angle: 0,
			data: [],
		});
		near(grid, player.x, player.y, reach, (enemy) => {
			if (touches(enemy, player.x, player.y - 6, reach)) {
				hurtEnemy(world, grid, enemy, 20, null, null, events, 0);

				if (!enemy.boss) {
					enemy.stunUntil = world.time + 0.6;
				}
			}
		});
	}
}
