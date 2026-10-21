/**
 * Krampus's horde: what each kind of enemy is like and how it moves, and the bosses' attacks.
 * Ordinary enemies chase the elf, crowding without stacking (the broken wind-up toys zigzag, the
 * porcelain angels keep their distance and throw shards, the carollers' wailing slows the elf).
 * Bosses take turns at their attacks: the Mouse King charges and calls his rats, the Ghost of
 * Christmas Yet to Come vanishes and reappears and looses dark orbs, the Yule Cat pounces, and
 * Krampus lashes with his chains, slams his birch rod and calls his imps.
 */

import { hurtEnemy, hurtPlayer, near, reachesPlayer, type IGrid } from "Components/SilentNight/combat";
import { PLAYER_RADIUS } from "Components/SilentNight/constants";
import type { IEnemy, IEnemyKind, IEvents, IWorld } from "Components/SilentNight/types";

export type IEnemyInfo = {
	kind: IEnemyKind;
	name: string;
	health: number;
	speed: [number, number];
	damage: number;
	radius: number;
	experience: number;
	boss?: boolean;
};

export const ENEMIES: Record<IEnemyKind, IEnemyInfo> = {
	gingerbread: {
		kind: "gingerbread",
		name: "Feral gingerbread man",
		health: 22,
		speed: [22, 32],
		damage: 5,
		radius: 5,
		experience: 1,
	},
	windup: {
		kind: "windup",
		name: "Broken wind-up toy",
		health: 14,
		speed: [34, 42],
		damage: 4,
		radius: 4.5,
		experience: 1,
	},
	golem: { kind: "golem", name: "Coal golem", health: 110, speed: [12, 15], damage: 12, radius: 8, experience: 6 },
	caroller: {
		kind: "caroller",
		name: "Wailing caroller",
		health: 40,
		speed: [18, 22],
		damage: 6,
		radius: 5,
		experience: 3,
	},
	angel: {
		kind: "angel",
		name: "Cracked porcelain angel",
		health: 34,
		speed: [24, 28],
		damage: 6,
		radius: 5,
		experience: 4,
	},
	imp: { kind: "imp", name: "Krampus's imp", health: 18, speed: [44, 52], damage: 7, radius: 4.5, experience: 2 },
	rat: { kind: "rat", name: "Rat", health: 9, speed: [46, 54], damage: 4, radius: 3.5, experience: 1 },
	mouseKing: {
		kind: "mouseKing",
		name: "The Mouse King",
		health: 2000,
		speed: [26, 26],
		damage: 10,
		radius: 12,
		experience: 60,
		boss: true,
	},
	ghost: {
		kind: "ghost",
		name: "The Ghost of Christmas Yet to Come",
		health: 9000,
		speed: [20, 20],
		damage: 16,
		radius: 11,
		experience: 120,
		boss: true,
	},
	yuleCat: {
		kind: "yuleCat",
		name: "The Yule Cat",
		health: 22000,
		speed: [34, 34],
		damage: 18,
		radius: 13,
		experience: 200,
		boss: true,
	},
	krampus: {
		kind: "krampus",
		name: "Krampus",
		health: 60000,
		speed: [28, 28],
		damage: 20,
		radius: 14,
		experience: 0,
		boss: true,
	},
};

/** Ordinary enemies grow tougher, harder-hitting and quicker as the night goes on, faster toward dawn. */
function toughness(time: number) {
	return {
		health: 1 + time / 400 + (time / 500) ** 2 + (time / 700) ** 3,
		damage: 1 + 0.5 * (time / 600) ** 2,
		speed: 1 + Math.min(0.5, time / 1200),
	};
}

/** Elites: an ordinary enemy grown huge, worth a chest. */
export const ELITE = { health: 8, damage: 1.5, size: 1.5, experience: 10 };

export function spawnEnemy(world: IWorld, kind: IEnemyKind, x: number, y: number, elite = false): IEnemy {
	const info = ENEMIES[kind];
	const tough = info.boss ? { health: 1, damage: 1, speed: 1 } : toughness(world.time);
	// Krampus grows stronger for every bargain the elf took from him.
	const bargains = kind === "krampus" ? world.player.bargains.length : 0;
	const health = info.health * tough.health * (elite ? ELITE.health : 1) * (1 + 0.4 * bargains);
	const enemy: IEnemy = {
		id: world.nextId++,
		kind,
		x,
		y,
		health,
		maxHealth: health,
		speed: (info.speed[0] + Math.random() * (info.speed[1] - info.speed[0])) * tough.speed,
		damage: info.damage * tough.damage * (elite ? ELITE.damage : 1) * (1 + 0.15 * bargains),
		radius: info.radius * (elite ? ELITE.size : 1),
		facing: 1,
		hitAt: -1,
		stride: Math.random(),
		elite,
		boss: Boolean(info.boss),
		push: { x: 0, y: 0 },
		slowUntil: 0,
		slow: 0,
		frozenUntil: 0,
		burnUntil: 0,
		burnDamage: 0,
		burnTickAt: 0,
		stunUntil: 0,
		actAt: world.time + 1.5 + Math.random(),
		action: null,
		target: null,
		experience: info.experience * (elite ? ELITE.experience : 1),
	};
	world.enemies.push(enemy);

	return enemy;
}

/** How hard enemies push apart when they crowd. */
const CROWDING = 8;

export function moveEnemies(world: IWorld, grid: IGrid, dt: number, events: IEvents) {
	const { player } = world;

	for (const enemy of world.enemies) {
		if (enemy.health <= 0) {
			continue;
		}

		// Burning: a little harm twice a second.
		if (world.time < enemy.burnUntil && world.time >= enemy.burnTickAt) {
			enemy.burnTickAt = world.time + 0.5;
			hurtEnemy(world, grid, enemy, enemy.burnDamage * 0.5, null, null, events, 0, true);
		}

		// Knocked back: carried along, slowing.
		enemy.x += enemy.push.x * dt;
		enemy.y += enemy.push.y * dt;
		enemy.push.x *= Math.pow(0.0005, dt);
		enemy.push.y *= Math.pow(0.0005, dt);

		if (world.time < enemy.frozenUntil || world.time < enemy.stunUntil) {
			continue;
		}

		const slowed = world.time < enemy.slowUntil ? 1 - enemy.slow : 1;

		if (world.time >= enemy.slowUntil) {
			enemy.slow = 0;
		}

		if (enemy.boss) {
			moveBoss(world, enemy, dt * slowed, events);
			continue;
		}

		const dx = player.x - enemy.x;
		const dy = player.y - enemy.y;
		const distance = Math.hypot(dx, dy) || 1;
		let mx = dx / distance;
		let my = dy / distance;

		// The porcelain angels keep their distance and throw shards.
		if (enemy.kind === "angel") {
			const keep = distance < 75 ? -1 : distance > 100 ? 1 : 0;
			mx *= keep;
			my *= keep;

			if (world.time >= enemy.actAt && distance < 150) {
				enemy.actAt = world.time + 3.2;
				world.shots.push({
					x: enemy.x,
					y: enemy.y - 6,
					vx: (dx / distance) * 60,
					vy: (dy / distance) * 60,
					until: world.time + 3,
					damage: 6,
					pierce: 0,
					radius: 2,
					weapon: null,
					hostile: true,
					kind: "shard",
					struck: new Set(),
				});
			}
		}

		// The broken wind-up toys lurch from side to side.
		if (enemy.kind === "windup") {
			const swerve = Math.sin(world.time * 5 + enemy.stride * 10) * 0.8;
			const sx = -my * swerve;
			const sy = mx * swerve;
			mx += sx;
			my += sy;
		}

		// A caroller's wailing slows the elf near it.
		if (enemy.kind === "caroller" && distance < 56) {
			player.slowedUntil = world.time + 0.3;
		}

		let vx = mx * enemy.speed * slowed;
		let vy = my * enemy.speed * slowed;

		near(grid, enemy.x, enemy.y, CROWDING, (other) => {
			if (other === enemy) {
				return;
			}

			const ox = enemy.x - other.x;
			const oy = enemy.y - other.y;
			const apart = Math.hypot(ox, oy);
			const room = (enemy.radius + other.radius) * 0.8;

			if (apart > 0 && apart < room) {
				const push = ((room - apart) / room) * 40;
				vx += (ox / apart) * push;
				vy += (oy / apart) * push;
			}
		});

		enemy.x += vx * dt;
		enemy.y += vy * dt;
		enemy.facing = dx >= 0 ? 1 : -1;

		if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < PLAYER_RADIUS + enemy.radius) {
			hurtPlayer(world, enemy.damage, events, enemy);
		}
	}
}

/** Moves the hostile shots (shards, orbs, chains), hurting the elf if they reach it. */
export function moveHostileShots(world: IWorld, events: IEvents) {
	for (const shot of world.shots) {
		if (shot.hostile && world.time < shot.until && reachesPlayer(world, shot.x, shot.y, shot.radius)) {
			hurtPlayer(world, shot.damage, events);
			shot.until = 0;
		}
	}
}

/** Called in, round a boss. */
function summon(world: IWorld, kind: IEnemyKind, x: number, y: number, count: number, spread: number) {
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		spawnEnemy(world, kind, x + Math.cos(angle) * spread, y + Math.sin(angle) * spread);
	}
}

/** A ring of hostile shots from a point. */
function ring(
	world: IWorld,
	x: number,
	y: number,
	count: number,
	speed: number,
	damage: number,
	kind: "orb" | "chain",
) {
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		world.shots.push({
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			until: world.time + 3,
			damage,
			pierce: 0,
			radius: 3,
			weapon: null,
			hostile: true,
			kind,
			struck: new Set(),
		});
	}
}

/** The bosses: chase, then take turns at their attacks (each warned of first). */
function moveBoss(world: IWorld, boss: IEnemy, dt: number, events: IEvents) {
	const { player } = world;
	const dx = player.x - boss.x;
	const dy = player.y - boss.y;
	const distance = Math.hypot(dx, dy) || 1;
	boss.facing = dx >= 0 ? 1 : -1;
	const enraged = boss.health < boss.maxHealth / 2;

	// In the middle of an attack.
	if (boss.action === "charge" || boss.action === "pounce") {
		if (world.time < boss.actAt - (boss.action === "pounce" ? 0.45 : 0.9)) {
			// Winding up.
			return;
		}

		if (boss.target) {
			const tx = boss.target.x - boss.x;
			const ty = boss.target.y - boss.y;
			const left = Math.hypot(tx, ty);
			const speed = boss.action === "pounce" ? 260 : 125;

			if (left > 2) {
				boss.x += (tx / left) * Math.min(left, speed * dt);
				boss.y += (ty / left) * Math.min(left, speed * dt);
			}
		}

		if (world.time >= boss.actAt) {
			// The Yule Cat lands with a thump that hurts all round it.
			if (boss.action === "pounce") {
				world.effects.push({
					kind: "pounce",
					x: boss.x,
					y: boss.y,
					at: world.time,
					until: world.time + 0.4,
					radius: 28,
					angle: 0,
					data: [],
				});

				if (Math.hypot(player.x - boss.x, player.y - boss.y) < 28) {
					hurtPlayer(world, 20, events);
				}
			}

			boss.action = null;
			boss.target = null;
			boss.actAt = world.time + (enraged ? 1.6 : 2.6);
		}

		touch(world, boss, events);

		return;
	}

	if (boss.action === "slam") {
		if (world.time >= boss.actAt) {
			world.effects.push({
				kind: "slam",
				x: boss.x,
				y: boss.y,
				at: world.time,
				until: world.time + 0.4,
				radius: 44,
				angle: 0,
				data: [],
			});

			if (Math.hypot(player.x - boss.x, player.y - boss.y) < 44) {
				hurtPlayer(world, 22, events);
			}

			boss.action = null;
			boss.actAt = world.time + (enraged ? 1.6 : 2.6);
		}

		return;
	}

	if (boss.action === "blink") {
		if (world.time >= boss.actAt) {
			const angle = Math.random() * Math.PI * 2;
			boss.x = player.x + Math.cos(angle) * 46;
			boss.y = player.y + Math.sin(angle) * 46;
			boss.action = null;
			boss.actAt = world.time + (enraged ? 2 : 3);
		}

		return;
	}

	// Walking toward the elf.
	boss.x += (dx / distance) * boss.speed * (enraged ? 1.25 : 1) * dt;
	boss.y += (dy / distance) * boss.speed * (enraged ? 1.25 : 1) * dt;
	touch(world, boss, events);

	if (world.time < boss.actAt) {
		return;
	}

	const turn = Math.floor(world.time * 7) % 2;

	switch (boss.kind) {
		case "mouseKing":
			if (turn === 0) {
				boss.action = "charge";
				boss.target = { x: player.x + (dx / distance) * 30, y: player.y + (dy / distance) * 30 };
				boss.actAt = world.time + 1.4;
			} else {
				summon(world, "rat", boss.x, boss.y, enraged ? 7 : 5, 18);
				boss.actAt = world.time + 3.5;
			}

			break;
		case "ghost":
			if (turn === 0) {
				boss.action = "blink";
				boss.actAt = world.time + 0.5;
			} else {
				ring(world, boss.x, boss.y - 10, enraged ? 14 : 10, 55, 10, "orb");
				boss.actAt = world.time + 3;
			}

			break;
		case "yuleCat":
			boss.action = "pounce";
			boss.target = { x: player.x, y: player.y };
			boss.actAt = world.time + 1.05;
			break;
		case "krampus": {
			const choice = Math.floor(world.time * 13) % 3;

			if (choice === 0) {
				// Chains lashed out toward the elf.
				for (const spread of [-0.25, 0, 0.25]) {
					const angle = Math.atan2(dy, dx) + spread;
					world.shots.push({
						x: boss.x,
						y: boss.y - 12,
						vx: Math.cos(angle) * 110,
						vy: Math.sin(angle) * 110,
						until: world.time + 2,
						damage: 14,
						pierce: 0,
						radius: 3,
						weapon: null,
						hostile: true,
						kind: "chain",
						struck: new Set(),
					});
				}

				boss.actAt = world.time + (enraged ? 1.8 : 2.6);
			} else if (choice === 1) {
				boss.action = "slam";
				boss.actAt = world.time + 0.8;
			} else {
				summon(world, "imp", boss.x, boss.y, enraged ? 9 : 6, 22);
				boss.actAt = world.time + (enraged ? 2.2 : 3.2);
			}

			break;
		}
		default:
			break;
	}
}

function touch(world: IWorld, enemy: IEnemy, events: IEvents) {
	if (Math.hypot(enemy.x - world.player.x, enemy.y - world.player.y) < PLAYER_RADIUS + enemy.radius) {
		hurtPlayer(world, enemy.damage, events, enemy);
	}
}
