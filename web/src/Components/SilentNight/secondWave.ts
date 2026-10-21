/**
 * The second wave of patrons' blessings that act over time (the rest are worked into stats.ts
 * and combat.ts): La Befana's coal bombs, dropped as the elf dashes; the Yule Goat's charge
 * through the crowd and his straw that burns when the elf is hit; Mari Lwyd's song, driving
 * enemies back, and her chant.
 */

import { burst } from "Components/SilentNight/weapons";
import { hurtEnemy, near, touches, type IGrid } from "Components/SilentNight/combat";
import { byRank, rank } from "Components/SilentNight/stats";
import type { IEvents, IWorld } from "Components/SilentNight/types";

/** How long a coal bomb sits on the snow before it goes off. */
const FUSE = 0.6;

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

		if (straw === 1 || rank(player, "burningCoal") > 0) {
			near(grid, x, y - 4, effect.radius, (enemy) => {
				if (touches(enemy, x, y - 4, effect.radius)) {
					enemy.burnUntil = world.time + 3;
					enemy.burnDamage = 6;
				}
			});
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
				enemy.frozenUntil = world.time + 1.5;
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
