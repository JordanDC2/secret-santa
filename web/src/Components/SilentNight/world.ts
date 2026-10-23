/**
 * A night of Silent Night, step by step, with no drawing or React. The elf moves, dashes and
 * fights (weapons.ts); Krampus's horde comes out of the dark on the night's timeline
 * (timeline.ts, enemies.ts); harm goes through combat.ts; experience, cocoa and treasure through
 * pickups.ts and levelUp.ts; the patrons' shrines and Krampus's altars through patrons.ts. While
 * the player's choosing (a level-up, a chest, a shrine), the night waits. Krampus comes at dawn;
 * beat him and the night is won.
 */

import { castMember } from "Components/SilentNight/cast";
import { knockCandles } from "Components/SilentNight/candles";
import { gridOf, near, hurtEnemy, heal } from "Components/SilentNight/combat";
import { moveEnemies, moveHostileShots } from "Components/SilentNight/enemies";
import { nextLevelUp } from "Components/SilentNight/levelUp";
import { FIRST_WAVE, visitShrines } from "Components/SilentNight/patrons";
import { movePickups } from "Components/SilentNight/pickups";
import { byRank, stats } from "Components/SilentNight/stats";
import { runTimeline } from "Components/SilentNight/timeline";
import { dropCoalBomb, useSecondWave } from "Components/SilentNight/secondWave";
import {
	noEvents,
	type ICastId,
	type IEnemy,
	type IEvents,
	type IGunId,
	type IInput,
	type IPatronId,
	type IShot,
	type IWorld,
} from "Components/SilentNight/types";
import { burst, landShells, moveAllies, newWeapon, useWeapons } from "Components/SilentNight/weapons";

import { PLAYER_RADIUS } from "Components/SilentNight/constants";

export { NIGHT_SECONDS, VIEW_HEIGHT } from "Components/SilentNight/constants";

const PLAYER_SPEED = 52;
/** The dash: a short burst, safe from harm, then a moment before the next. */
const DASH_SPEED = 185;
const DASH_SECONDS = 0.16;
const DASH_COOLDOWN = 1.1;

/** A new night, for `character` carrying `gun`, with the Coal Cellar's upgrades and second-wave patrons unlocked so far. */
export function newWorld(
	character: ICastId = "elf",
	cellar: Record<string, number> = {},
	secondWave: IPatronId[] = [],
	gun: IGunId = "gun",
): IWorld {
	const own = castMember(character).weapon;
	const world: IWorld = {
		time: 0,
		numbers: undefined!,
		player: {
			character,
			cellar,
			gear: {},
			x: 0,
			y: 0,
			health: 100,
			facing: 1,
			aim: null,
			moving: false,
			heading: { x: 1, y: 0 },
			dashUntil: 0,
			dashReadyAt: 0,
			dash: { x: 1, y: 0 },
			hurtUntil: 0,
			lastShotAt: -1,
			level: 1,
			experience: 0,
			weapons: [newWeapon(gun), ...(own ? [newWeapon(own)] : [])],
			passives: {},
			blessings: {},
			bargains: [],
			rerolls: 2 + (cellar.dice ?? 0),
			banishes: 2 + (cellar.fire ?? 0),
			patronRerolls: cellar.prayers ?? 0,
			banished: [],
			haloReadyAt: null,
			guardianReadyAt: 0,
			stillSince: 0,
			slowedUntil: 0,
			chantAt: 0,
			charged: new Set(),
		},
		enemies: [],
		shots: [],
		effects: [],
		pickups: [],
		allies: [],
		shrines: [],
		patrons: [...FIRST_WAVE, ...secondWave],
		kills: 0,
		bosses: 0,
		coalFound: 0,
		spawnOwed: 0,
		nextId: 1,
		levelUpsOwed: 0,
		prompt: null,
		done: new Set(),
		dawn: false,
		over: false,
		won: false,
	};
	world.numbers = stats(world.player);
	world.player.health = world.numbers.maxHealth;

	return world;
}

export function dashing(world: IWorld): boolean {
	return world.time < world.player.dashUntil;
}

/** Moves the night on by dt seconds, for a view `view` wide and tall (in the game's pixels). */
export function step(world: IWorld, input: IInput, dt: number, view: { width: number; height: number }): IEvents {
	const events = noEvents();

	// The night waits while the player chooses.
	if (world.over || world.prompt !== null) {
		return events;
	}

	world.time += dt;
	world.numbers = stats(world.player);
	movePlayer(world, input, dt, events);
	runTimeline(world, dt, view, events);
	const grid = gridOf(world.enemies);
	useWeapons(world, input, grid, events);
	useSecondWave(world, grid, dt, events);
	moveAllies(world, grid, dt, events);
	moveEnemies(world, grid, dt, events);
	moveShots(world, grid, dt, events);
	moveHostileShots(world, events);
	landShells(world, grid, events);
	world.enemies = world.enemies.filter((enemy) => enemy.health > 0);
	byDepth(world.enemies);
	world.effects = world.effects.filter(
		(effect) =>
			world.time < effect.until || ((effect.kind === "shell" || effect.kind === "coal") && effect.data[3] !== 1),
	);
	movePickups(world, grid, dt, events);
	visitShrines(world, events);
	recover(world, dt, events);

	if (world.player.health <= 0) {
		world.player.health = 0;
		world.over = true;
	} else if (world.dawn && world.done.has("boss-krampus") && !world.enemies.some((enemy) => enemy.kind === "krampus")) {
		world.won = true;
		world.over = true;
		events.won = true;
	}

	nextLevelUp(world);

	return events;
}

function movePlayer(world: IWorld, input: IInput, dt: number, events: IEvents) {
	const { player, numbers } = world;
	const length = Math.hypot(input.move.x, input.move.y);
	const move = length > 1 ? { x: input.move.x / length, y: input.move.y / length } : input.move;
	const wasMoving = player.moving;
	player.moving = length > 0.1;
	player.aim = input.aim;

	if (player.moving) {
		player.heading = { x: input.move.x / length, y: input.move.y / length };
	} else if (wasMoving) {
		player.stillSince = world.time;
	}

	if (input.dash && world.time >= player.dashReadyAt) {
		player.dash = player.moving ? { ...player.heading } : { x: player.facing, y: 0 };
		player.dashUntil = world.time + DASH_SECONDS * numbers.dashLength;
		player.charged.clear();
		dropCoalBomb(world);
		player.dashReadyAt = world.time + DASH_COOLDOWN * numbers.dashCooldown;
		events.dashed = true;
	}

	const slowed = world.time < player.slowedUntil ? 0.65 : 1;

	if (dashing(world)) {
		player.x += player.dash.x * DASH_SPEED * dt;
		player.y += player.dash.y * DASH_SPEED * dt;
	} else {
		events.wailed ||= slowed < 1;
		player.x += move.x * PLAYER_SPEED * numbers.speed * slowed * dt;
		player.y += move.y * PLAYER_SPEED * numbers.speed * slowed * dt;
	}

	// Walking into a lit candle knocks it over too.
	knockCandles(world, player.x, player.y - 4, PLAYER_RADIUS);

	const facingX = input.aim ? input.aim.x : move.x;

	if (Math.abs(facingX) > 0.15) {
		player.facing = facingX > 0 ? 1 : -1;
	}
}

/**
 * The elf's shots in flight: each hits enemies in its way (piercing ones, several). A gun's shot
 * may also turn toward the nearest enemy as it flies, burn, slow or freeze what it hits, bounce on
 * to another enemy once it would have stopped, and burst (at every hit, or where it stops),
 * throwing sparks.
 */
function moveShots(world: IWorld, grid: ReturnType<typeof gridOf>, dt: number, events: IEvents) {
	const sparks: IShot[] = [];
	const pop = (shot: IShot, x: number, y: number) => {
		const { burst: blast, sparks: count } = shot.hit!;

		if (!blast) {
			return;
		}

		burst(world, grid, x, y, blast.radius, shot.damage * blast.share, shot.weapon, events);

		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
			sparks.push({
				x,
				y,
				vx: Math.cos(angle) * 150,
				vy: Math.sin(angle) * 150,
				until: world.time + 0.25,
				damage: shot.damage * 0.3,
				pierce: 0,
				radius: 1,
				weapon: shot.weapon,
				hostile: false,
				kind: "spark",
				struck: new Set(),
			});
		}
	};

	world.shots = world.shots.filter((shot) => {
		const { hit } = shot;

		// Turning toward the nearest enemy.
		if (hit && hit.homing > 0 && !shot.hostile) {
			let nearest: IEnemy | null = null;
			let best = 90;
			near(grid, shot.x, shot.y, best, (enemy) => {
				const distance = Math.hypot(enemy.x - shot.x, enemy.y - shot.y);

				if (!shot.struck.has(enemy.id) && distance < best) {
					best = distance;
					nearest = enemy;
				}
			});

			if (nearest) {
				const target = nearest as IEnemy;
				const speed = Math.hypot(shot.vx, shot.vy);
				const heading = Math.atan2(shot.vy, shot.vx);
				const wanted = Math.atan2(target.y - target.radius * 0.8 - shot.y, target.x - shot.x);
				const turn = Math.atan2(Math.sin(wanted - heading), Math.cos(wanted - heading));
				const angle = heading + Math.max(-hit.homing * dt, Math.min(hit.homing * dt, turn));
				shot.vx = Math.cos(angle) * speed;
				shot.vy = Math.sin(angle) * speed;
			}
		}

		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;

		if (world.time >= shot.until) {
			if (hit && !hit.burst?.everyHit) {
				pop(shot, shot.x, shot.y);
			}

			return false;
		}

		if (shot.hostile) {
			return true;
		}

		knockCandles(world, shot.x, shot.y, shot.radius);

		let spent = false;
		near(grid, shot.x, shot.y, shot.radius + 14, (enemy) => {
			if (
				shot.struck.has(enemy.id) ||
				Math.hypot(enemy.x - shot.x, enemy.y - enemy.radius * 0.8 - shot.y) > enemy.radius + shot.radius
			) {
				return;
			}

			shot.struck.add(enemy.id);
			const speed = Math.hypot(shot.vx, shot.vy) || 1;
			hurtEnemy(
				world,
				grid,
				enemy,
				shot.damage,
				{ x: shot.vx / speed, y: shot.vy / speed },
				shot.weapon,
				events,
				hit?.knockback ?? 2,
			);

			if (hit) {
				if (hit.burn > 0) {
					enemy.burnUntil = world.time + 3;
					enemy.burnDamage = Math.max(enemy.burnDamage, hit.burn);
					events.ignited = true;
				}

				if (hit.slow > 0) {
					enemy.slowUntil = world.time + 1.5;
					enemy.slow = Math.max(enemy.slow, hit.slow);
				}

				if (!enemy.boss && Math.random() < hit.freeze) {
					enemy.frozenUntil = world.time + 1.2;
					events.froze = true;
				}

				if (hit.burst?.everyHit) {
					pop(shot, enemy.x, enemy.y);
				}
			}

			if (shot.pierce > 0) {
				shot.pierce -= 1;

				return;
			}

			// Bouncing on to the nearest enemy it hasn't hit yet, rather than stopping.
			if (hit && hit.bounce > 0 && bounce(world, grid, shot)) {
				hit.bounce -= 1;
				events.bounced = true;

				return true;
			}

			if (hit && !hit.burst?.everyHit) {
				pop(shot, shot.x, shot.y);
			}

			spent = true;

			return true;
		});

		return !spent;
	});

	world.shots.push(...sparks);
}

/** Sends a shot off toward the nearest enemy it hasn't hit, if there's one near enough. */
function bounce(world: IWorld, grid: ReturnType<typeof gridOf>, shot: IShot): boolean {
	let nearest: IEnemy | null = null;
	let best = 70;
	near(grid, shot.x, shot.y, best, (enemy) => {
		const distance = Math.hypot(enemy.x - shot.x, enemy.y - shot.y);

		if (!shot.struck.has(enemy.id) && enemy.health > 0 && distance < best) {
			best = distance;
			nearest = enemy;
		}
	});

	if (!nearest) {
		return false;
	}

	const target = nearest as IEnemy;
	const speed = Math.hypot(shot.vx, shot.vy) || 1;
	const angle = Math.atan2(target.y - target.radius * 0.8 - shot.y, target.x - shot.x);
	shot.vx = Math.cos(angle) * speed;
	shot.vy = Math.sin(angle) * speed;
	shot.until = Math.max(shot.until, world.time + 0.4);

	return true;
}

/** Healing over time: Christkind's grace, and La Flor's rooted (standing still). */
function recover(world: IWorld, dt: number, events: IEvents) {
	const { player, numbers } = world;
	let regen = numbers.regen;

	if (!player.moving && world.time - player.stillSince > 1) {
		regen += byRank(player, "rooted", [1, 2, 3]);
	}

	if (regen > 0 && player.health < numbers.maxHealth) {
		heal(world, regen * dt, events);
		events.healed = false;
	}
}

/**
 * Puts the enemies in order back to front (by y), for drawing. They barely change order from one
 * step to the next, so an insertion sort does it in about one pass.
 */
function byDepth(enemies: IWorld["enemies"]) {
	for (let i = 1; i < enemies.length; i++) {
		const enemy = enemies[i];
		let j = i - 1;

		while (j >= 0 && enemies[j].y > enemy.y) {
			enemies[j + 1] = enemies[j];
			j--;
		}

		enemies[j + 1] = enemy;
	}
}
