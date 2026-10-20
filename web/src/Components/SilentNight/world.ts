/**
 * Silent Night's rules, with no drawing or React. The elf moves, dashes and fires the candy cane
 * gun; feral gingerbread men come out of the dark from every side, more and more as the night goes
 * on, and chase it. Units are the game's own pixels (the view is VIEW_HEIGHT of them tall) and
 * seconds. The world is changed in place each step, for speed with hundreds of enemies.
 */

/** How many of the game's pixels tall the view is; its width follows the screen's shape. */
export const VIEW_HEIGHT = 200;
/** How long a night lasts, to dawn, in seconds. */
export const NIGHT_SECONDS = 20 * 60;

const PLAYER_SPEED = 52;
const PLAYER_RADIUS = 5;
const PLAYER_HEALTH = 100;
/** The dash: a short burst, safe from harm, then a moment before the next. */
const DASH_SPEED = 185;
const DASH_SECONDS = 0.16;
const DASH_COOLDOWN = 1.1;
/** After a hit, a moment of safety. */
const HURT_SECONDS = 0.6;

/** The candy cane gun. */
export const MAGAZINE = 14;
const FIRE_INTERVAL = 0.14;
const RELOAD_SECONDS = 1;
const BULLET_SPEED = 240;
const BULLET_SECONDS = 0.8;
const BULLET_DAMAGE = 10;
const BULLET_SPREAD = 0.05;
const KNOCKBACK = 3;

/** Feral gingerbread men. */
const GINGERBREAD_HEALTH = 22;
const GINGERBREAD_SPEED = { min: 22, max: 32 };
const GINGERBREAD_RADIUS = 5;
const GINGERBREAD_DAMAGE = 6;
/** They come this often at the start, a little more often every second, up to a limit. */
const SPAWN_RATE = { start: 0.9, perSecond: 0.11, max: 14 };
const MAX_ENEMIES = 350;
/** How closely they crowd before pushing each other apart. */
const CROWDING = 8;

/** The neighbourhood grid, for finding what's near what quickly. */
const CELL = 12;

export type IPlayer = {
	x: number;
	y: number;
	health: number;
	/** Which way it faces: toward its aim, or where it's going. */
	facing: 1 | -1;
	/** Where it's aiming (a unit vector), or nowhere. */
	aim: { x: number; y: number } | null;
	moving: boolean;
	dashUntil: number;
	dashReadyAt: number;
	dash: { x: number; y: number };
	hurtUntil: number;
	ammo: number;
	reloadUntil: number | null;
	fireReadyAt: number;
	/** When the gun last fired, for the muzzle flash. */
	lastShotAt: number;
};

export type IEnemy = {
	x: number;
	y: number;
	health: number;
	speed: number;
	facing: 1 | -1;
	/** When it was last hit, for the flash. */
	hitAt: number;
	/** Its own offset into the walk, so they don't all step together. */
	stride: number;
};

export type IBullet = { x: number; y: number; vx: number; vy: number; until: number };

/** A crumb flying off a gingerbread man as it breaks apart. */
export type ICrumb = { x: number; y: number; vx: number; vy: number; until: number; shade: number };

export type IWorld = {
	time: number;
	player: IPlayer;
	enemies: IEnemy[];
	bullets: IBullet[];
	crumbs: ICrumb[];
	kills: number;
	/** Gingerbread men owed by the spawn rate but not yet sent (a fraction). */
	spawnOwed: number;
	over: boolean;
};

/** What the player's doing this moment. Move and aim are directions (aim null when not aiming). */
export type IInput = {
	move: { x: number; y: number };
	aim: { x: number; y: number } | null;
	firing: boolean;
	dash: boolean;
	reload: boolean;
};

/** What happened in a step, for the sounds. */
export type IEvents = { shots: number; hits: number; kills: number; hurt: boolean; dashed: boolean; reloaded: boolean };

export function newWorld(): IWorld {
	return {
		time: 0,
		player: {
			x: 0,
			y: 0,
			health: PLAYER_HEALTH,
			facing: 1,
			aim: null,
			moving: false,
			dashUntil: 0,
			dashReadyAt: 0,
			dash: { x: 1, y: 0 },
			hurtUntil: 0,
			ammo: MAGAZINE,
			reloadUntil: null,
			fireReadyAt: 0,
			lastShotAt: -1,
		},
		enemies: [],
		bullets: [],
		crumbs: [],
		kills: 0,
		spawnOwed: 0,
		over: false,
	};
}

export const MAX_HEALTH = PLAYER_HEALTH;

export function dashing(world: IWorld): boolean {
	return world.time < world.player.dashUntil;
}

export function reloading(world: IWorld): boolean {
	return world.player.reloadUntil !== null;
}

/** Moves the night on by dt seconds, for a view `view` wide and tall (in the game's pixels). */
export function step(world: IWorld, input: IInput, dt: number, view: { width: number; height: number }): IEvents {
	const events: IEvents = { shots: 0, hits: 0, kills: 0, hurt: false, dashed: false, reloaded: false };

	if (world.over) {
		return events;
	}

	world.time += dt;
	movePlayer(world, input, dt, events);
	useGun(world, input, events);
	spawn(world, dt, view);
	const grid = gridOf(world.enemies);
	moveEnemies(world, dt, grid);
	byDepth(world.enemies);
	moveBullets(world, dt, grid, events);
	moveCrumbs(world, dt);
	touchPlayer(world, grid, events);

	if (world.player.health <= 0) {
		world.player.health = 0;
		world.over = true;
	}

	return events;
}

function movePlayer(world: IWorld, input: IInput, dt: number, events: IEvents) {
	const { player } = world;
	const length = Math.hypot(input.move.x, input.move.y);
	const move = length > 1 ? { x: input.move.x / length, y: input.move.y / length } : input.move;
	player.moving = length > 0.1;
	player.aim = input.aim;

	// The dash goes the way it's moving (or facing, standing still).
	if (input.dash && world.time >= player.dashReadyAt) {
		player.dash = player.moving ? { x: input.move.x / length, y: input.move.y / length } : { x: player.facing, y: 0 };
		player.dashUntil = world.time + DASH_SECONDS;
		player.dashReadyAt = world.time + DASH_COOLDOWN;
		events.dashed = true;
	}

	if (dashing(world)) {
		player.x += player.dash.x * DASH_SPEED * dt;
		player.y += player.dash.y * DASH_SPEED * dt;
	} else {
		player.x += move.x * PLAYER_SPEED * dt;
		player.y += move.y * PLAYER_SPEED * dt;
	}

	const facingX = input.aim ? input.aim.x : move.x;

	if (Math.abs(facingX) > 0.15) {
		player.facing = facingX > 0 ? 1 : -1;
	}
}

function useGun(world: IWorld, input: IInput, events: IEvents) {
	const { player } = world;

	if (player.reloadUntil !== null && world.time >= player.reloadUntil) {
		player.reloadUntil = null;
		player.ammo = MAGAZINE;
		events.reloaded = true;
	}

	if (player.reloadUntil === null && (player.ammo === 0 || (input.reload && player.ammo < MAGAZINE))) {
		player.reloadUntil = world.time + RELOAD_SECONDS;
	}

	if (!input.firing || !input.aim || player.reloadUntil !== null || world.time < player.fireReadyAt) {
		return;
	}

	const angle = Math.atan2(input.aim.y, input.aim.x) + (Math.random() - 0.5) * 2 * BULLET_SPREAD;
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
	world.bullets.push({
		x: player.x + dx * 8,
		y: player.y - 4 + dy * 8,
		vx: dx * BULLET_SPEED,
		vy: dy * BULLET_SPEED,
		until: world.time + BULLET_SECONDS,
	});
	player.ammo -= 1;
	player.fireReadyAt = world.time + FIRE_INTERVAL;
	player.lastShotAt = world.time;
	events.shots += 1;
}

/** Gingerbread men come in from just beyond the edge of the view, from any side. */
function spawn(world: IWorld, dt: number, view: { width: number; height: number }) {
	const rate = Math.min(SPAWN_RATE.max, SPAWN_RATE.start + SPAWN_RATE.perSecond * world.time);
	world.spawnOwed += rate * dt;
	const distance = Math.hypot(view.width, view.height) / 2 + 12;

	while (world.spawnOwed >= 1) {
		world.spawnOwed -= 1;

		if (world.enemies.length >= MAX_ENEMIES) {
			continue;
		}

		const angle = Math.random() * Math.PI * 2;
		// A little faster as the night goes on.
		const speedUp = 1 + Math.min(0.5, world.time / 900);
		world.enemies.push({
			x: world.player.x + Math.cos(angle) * distance,
			y: world.player.y + Math.sin(angle) * distance,
			health: GINGERBREAD_HEALTH,
			speed: (GINGERBREAD_SPEED.min + Math.random() * (GINGERBREAD_SPEED.max - GINGERBREAD_SPEED.min)) * speedUp,
			facing: 1,
			hitAt: -1,
			stride: Math.random(),
		});
	}
}

type IGrid = Map<number, IEnemy[]>;

const cellKey = (cx: number, cy: number) => cx * 73856093 + cy * 19349663;

function gridOf(enemies: IEnemy[]): IGrid {
	const grid: IGrid = new Map();

	for (const enemy of enemies) {
		const key = cellKey(Math.floor(enemy.x / CELL), Math.floor(enemy.y / CELL));
		const cell = grid.get(key);

		if (cell) {
			cell.push(enemy);
		} else {
			grid.set(key, [enemy]);
		}
	}

	return grid;
}

/** Every enemy in the cells round (x, y). */
function near(grid: IGrid, x: number, y: number, each: (enemy: IEnemy) => boolean | void) {
	const cx = Math.floor(x / CELL);
	const cy = Math.floor(y / CELL);

	for (let ox = -1; ox <= 1; ox++) {
		for (let oy = -1; oy <= 1; oy++) {
			const cell = grid.get(cellKey(cx + ox, cy + oy));

			if (cell) {
				for (const enemy of cell) {
					if (each(enemy) === true) {
						return;
					}
				}
			}
		}
	}
}

/** Each gingerbread man runs at the elf, nudging aside the ones crowding it. */
function moveEnemies(world: IWorld, dt: number, grid: IGrid) {
	const { player } = world;

	for (const enemy of world.enemies) {
		const dx = player.x - enemy.x;
		const dy = player.y - enemy.y;
		const distance = Math.hypot(dx, dy) || 1;
		let mx = (dx / distance) * enemy.speed;
		let my = (dy / distance) * enemy.speed;

		near(grid, enemy.x, enemy.y, (other) => {
			if (other === enemy) {
				return;
			}

			const ox = enemy.x - other.x;
			const oy = enemy.y - other.y;
			const apart = Math.hypot(ox, oy);

			if (apart > 0 && apart < CROWDING) {
				const push = ((CROWDING - apart) / CROWDING) * 40;
				mx += (ox / apart) * push;
				my += (oy / apart) * push;
			}
		});

		enemy.x += mx * dt;
		enemy.y += my * dt;
		enemy.facing = dx >= 0 ? 1 : -1;
	}
}

/**
 * Puts the gingerbread men in order back to front (by y), for drawing. They barely change order
 * from one step to the next, so an insertion sort does it in about one pass.
 */
function byDepth(enemies: IEnemy[]) {
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

function moveBullets(world: IWorld, dt: number, grid: IGrid, events: IEvents) {
	const dead = new Set<IEnemy>();

	world.bullets = world.bullets.filter((bullet) => {
		bullet.x += bullet.vx * dt;
		bullet.y += bullet.vy * dt;

		if (world.time >= bullet.until) {
			return false;
		}

		let struck: IEnemy | null = null;
		near(grid, bullet.x, bullet.y, (enemy) => {
			if (!dead.has(enemy) && Math.hypot(enemy.x - bullet.x, enemy.y - 4 - bullet.y) < GINGERBREAD_RADIUS + 1.5) {
				struck = enemy;

				return true;
			}
		});

		if (!struck) {
			return true;
		}

		const enemy: IEnemy = struck;
		const speed = Math.hypot(bullet.vx, bullet.vy);
		enemy.health -= BULLET_DAMAGE;
		enemy.hitAt = world.time;
		enemy.x += (bullet.vx / speed) * KNOCKBACK;
		enemy.y += (bullet.vy / speed) * KNOCKBACK;
		events.hits += 1;

		if (enemy.health <= 0) {
			dead.add(enemy);
			crumble(world, enemy);
		}

		return false;
	});

	if (dead.size > 0) {
		world.enemies = world.enemies.filter((enemy) => !dead.has(enemy));
		world.kills += dead.size;
		events.kills += dead.size;
	}
}

/** A gingerbread man breaking apart into crumbs. */
function crumble(world: IWorld, enemy: IEnemy) {
	for (let i = 0; i < 7; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = 20 + Math.random() * 45;
		world.crumbs.push({
			x: enemy.x,
			y: enemy.y - 5,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 20,
			until: world.time + 0.4 + Math.random() * 0.4,
			shade: Math.random(),
		});
	}
}

function moveCrumbs(world: IWorld, dt: number) {
	world.crumbs = world.crumbs.filter((crumb) => {
		crumb.x += crumb.vx * dt;
		crumb.y += crumb.vy * dt;
		crumb.vx *= 0.9;
		crumb.vy = crumb.vy * 0.9 + 60 * dt;

		return world.time < crumb.until;
	});
}

/** A gingerbread man reaching the elf hurts it, unless it's dashing or just been hurt. */
function touchPlayer(world: IWorld, grid: IGrid, events: IEvents) {
	const { player } = world;

	if (dashing(world) || world.time < player.hurtUntil) {
		return;
	}

	near(grid, player.x, player.y, (enemy) => {
		if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < PLAYER_RADIUS + GINGERBREAD_RADIUS) {
			player.health -= GINGERBREAD_DAMAGE;
			player.hurtUntil = world.time + HURT_SECONDS;
			events.hurt = true;

			return true;
		}
	});
}
