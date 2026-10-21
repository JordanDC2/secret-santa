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
import { visitShrines } from "Components/SilentNight/patrons";
import { movePickups } from "Components/SilentNight/pickups";
import { byRank, stats } from "Components/SilentNight/stats";
import { runTimeline } from "Components/SilentNight/timeline";
import { noEvents, type ICastId, type IEvents, type IInput, type IWorld } from "Components/SilentNight/types";
import { landShells, moveAllies, newWeapon, useWeapons } from "Components/SilentNight/weapons";

export { NIGHT_SECONDS, VIEW_HEIGHT } from "Components/SilentNight/constants";

const PLAYER_SPEED = 52;
/** The dash: a short burst, safe from harm, then a moment before the next. */
const DASH_SPEED = 185;
const DASH_SECONDS = 0.16;
const DASH_COOLDOWN = 1.1;

/** A new night, for `character` with the Coal Cellar's upgrades bought so far. */
export function newWorld(character: ICastId = "elf", cellar: Record<string, number> = {}): IWorld {
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
			weapons: [newWeapon(castMember(character).weapon, castMember(character).weaponLevel)],
			passives: {},
			blessings: {},
			bargains: [],
			rerolls: 2 + (cellar.dice ?? 0),
			banishes: 2 + (cellar.fire ?? 0),
			banished: [],
			haloReadyAt: null,
			guardianReadyAt: 0,
			stillSince: 0,
			slowedUntil: 0,
		},
		enemies: [],
		shots: [],
		effects: [],
		pickups: [],
		allies: [],
		shrines: [],
		kills: 0,
		bosses: 0,
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
	moveAllies(world, grid, dt, events);
	moveEnemies(world, grid, dt, events);
	moveShots(world, grid, dt, events);
	moveHostileShots(world, events);
	landShells(world, grid, events);
	world.enemies = world.enemies.filter((enemy) => enemy.health > 0);
	byDepth(world.enemies);
	world.effects = world.effects.filter(
		(effect) => world.time < effect.until || (effect.kind === "shell" && effect.data[3] !== 1),
	);
	movePickups(world, dt, events);
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
		player.dashUntil = world.time + DASH_SECONDS;
		player.dashReadyAt = world.time + DASH_COOLDOWN * numbers.dashCooldown;
		events.dashed = true;
	}

	const slowed = world.time < player.slowedUntil ? 0.65 : 1;

	if (dashing(world)) {
		player.x += player.dash.x * DASH_SPEED * dt;
		player.y += player.dash.y * DASH_SPEED * dt;
	} else {
		player.x += move.x * PLAYER_SPEED * numbers.speed * slowed * dt;
		player.y += move.y * PLAYER_SPEED * numbers.speed * slowed * dt;
	}

	const facingX = input.aim ? input.aim.x : move.x;

	if (Math.abs(facingX) > 0.15) {
		player.facing = facingX > 0 ? 1 : -1;
	}
}

/** The elf's shots in flight: each hits enemies in its way (piercing ones, several). */
function moveShots(world: IWorld, grid: ReturnType<typeof gridOf>, dt: number, events: IEvents) {
	world.shots = world.shots.filter((shot) => {
		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;

		if (world.time >= shot.until) {
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
			hurtEnemy(world, grid, enemy, shot.damage, { x: shot.vx / speed, y: shot.vy / speed }, shot.weapon, events, 2);

			if (shot.pierce <= 0) {
				spent = true;

				return true;
			}

			shot.pierce -= 1;
		});

		return !spent;
	});
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
