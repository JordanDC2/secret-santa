/**
 * Silent Night's weapons: what each does, how it grows over its eight levels, and what it
 * evolves into beside its passive (opened from a chest, as in Vampire Survivors). Only the gun
 * chosen before the night (guns.ts) is aimed; everything else fires on its own. Damage goes through combat.ts, so the
 * patrons' blessings and Krampus's bargains apply to all of them.
 */

import { knockCandles } from "Components/SilentNight/candles";
import { hurtEnemy, near, touches, heal, type IGrid } from "Components/SilentNight/combat";
import { fireGun, GUNS, gunNumbers, isGun, past } from "Components/SilentNight/guns";
import { byRank } from "Components/SilentNight/stats";
import type { IStats } from "Components/SilentNight/stats";
import type {
	IAlly,
	IEnemy,
	IEvents,
	IInput,
	IPassiveId,
	IVector,
	IWeapon,
	IWeaponId,
	IWorld,
} from "Components/SilentNight/types";

export type IWeaponInfo = {
	id: IWeaponId;
	name: string;
	description: string;
	/** What each level after the first adds. */
	levels: string[];
	evolution: { passive: IPassiveId; name: string; description: string };
};

export const WEAPONS: IWeaponInfo[] = [
	// The aimed guns, one chosen before the night.
	...GUNS,
	{
		id: "blade",
		name: "Candy cane blade",
		description: "A wide sweep in front of you.",
		levels: [
			"+6 damage",
			"Reaches 15% further",
			"Sweeps behind you too",
			"Sweeps sooner",
			"+8 damage",
			"Reaches 15% further",
			"Sweeps sooner, +8 damage",
		],
		evolution: { passive: "tinsel", name: "Sugar Scythe", description: "A full circle, harder and sooner." },
	},
	{
		id: "grenades",
		name: "Ornament grenades",
		description: "Glass baubles lobbed into the crowd, bursting where they land.",
		levels: [
			"+1 grenade",
			"+8 damage",
			"Bigger bursts",
			"Burst into shrapnel",
			"+1 grenade",
			"Thrown sooner",
			"+10 damage, bigger bursts",
		],
		evolution: { passive: "peppermint", name: "Shatterstorm", description: "Every shard of shrapnel bursts again." },
	},
	{
		id: "whip",
		name: "Tinsel whip",
		description: "Lashes out to the side you face.",
		levels: [
			"Lashes both sides",
			"+6 damage",
			"Longer lash",
			"Lashes sooner",
			"+6 damage",
			"Longer lash",
			"Lashes sooner, +8 damage",
		],
		evolution: { passive: "woolSocks", name: "Garland Lash", description: "Longer, and every hit heals you a little." },
	},
	{
		id: "globes",
		name: "Snow globes",
		description: "Globes circling you for a while, knocking enemies back.",
		levels: ["+1 globe", "+6 damage", "Wider circle", "+1 globe", "Circle for longer", "+1 globe", "+8 damage, faster"],
		evolution: {
			passive: "eggnog",
			name: "Blizzard in a Bottle",
			description: "Never stop circling, and freeze what they hit.",
		},
	},
	{
		id: "bells",
		name: "Sleigh-bell shockwave",
		description: "A ring of sound bursting out from you, throwing enemies back.",
		levels: [
			"+6 damage",
			"Wider ring",
			"Rings sooner",
			"+8 damage",
			"Wider ring",
			"Rings sooner",
			"+10 damage, throws further",
		],
		evolution: {
			passive: "fruitcake",
			name: "Carol of the Bells",
			description: "A far wider ring that heals you for each enemy it hits.",
		},
	},
	{
		id: "mortar",
		name: "Firework mortar",
		description: "Shells whistle up and land on enemies across the screen.",
		levels: [
			"+1 shell",
			"+8 damage",
			"Bigger bursts",
			"+1 shell",
			"Fires sooner",
			"+1 shell",
			"+10 damage, bigger bursts",
		],
		evolution: {
			passive: "stocking",
			name: "New Year's Eve",
			description: "Three more shells, each bursting in a cluster.",
		},
	},
	{
		id: "cocoa",
		name: "Hot cocoa aura",
		description: "Scalds everything close to you, over and over.",
		levels: ["+2 damage", "Wider", "Scalds more often", "+2 damage", "Wider", "Scalds more often", "+3 damage, wider"],
		evolution: {
			passive: "mistletoe",
			name: "Marshmallow Meltdown",
			description: "Wider and hotter, and everything in it slows.",
		},
	},
	{
		id: "minions",
		name: "Gingerbread minions",
		description: "Friendly gingerbread that run at enemies and bite.",
		levels: ["+1 minion", "+4 damage", "Bite sooner", "+1 minion", "+4 damage", "Run faster", "+1 minion, +6 damage"],
		evolution: { passive: "candle", name: "The Gingerbread Army", description: "Twice as many, biting harder." },
	},
	{
		id: "soldiers",
		name: "Toy soldiers",
		description: "Every so often a nutcracker soldier marches out and stands guard, firing at the nearest enemy.",
		levels: [
			"+3 damage",
			"+1 soldier",
			"Stand guard longer",
			"+3 damage",
			"March out sooner",
			"+1 soldier, stand guard longer",
			"+3 damage",
		],
		evolution: {
			passive: "advent",
			name: "The Night Watch",
			description: "Soldiers stand guard twice as long, and fire in volleys.",
		},
	},
];

export function weaponInfo(id: IWeaponId): IWeaponInfo {
	return WEAPONS.find((weapon) => weapon.id === id)!;
}

export function newWeapon(id: IWeaponId, level = 1): IWeapon {
	const weapon: IWeapon = { id, level, evolved: false, readyAt: 0, ammo: 0, reloadUntil: null, damage: 0, morphs: [] };
	weapon.ammo = isGun(id) ? gunNumbers(weapon).magazine : 0;

	return weapon;
}

/** Each weapon's turn, each step. */
export function useWeapons(world: IWorld, input: IInput, grid: IGrid, events: IEvents) {
	const { numbers } = world;

	for (const weapon of world.player.weapons) {
		switch (weapon.id) {
			case "gun":
			case "blunderbuss":
			case "crossbow":
			case "pistols":
			case "romanCandle":
			case "snowCannon":
				fireGun(world, weapon, input, numbers, events, twice(world));
				break;
			case "blade":
				blade(world, weapon, input, grid, numbers, events);
				break;
			case "grenades":
				grenades(world, weapon, grid, numbers, events);
				break;
			case "whip":
				whip(world, weapon, grid, numbers, events);
				break;
			case "globes":
				globes(world, weapon, numbers);
				break;
			case "bells":
				bells(world, weapon, grid, numbers, events);
				break;
			case "mortar":
				mortar(world, weapon, numbers);
				break;
			case "cocoa":
				cocoa(world, weapon, grid, numbers, events);
				break;
			case "minions":
				minions(world, weapon, numbers);
				break;
			case "soldiers":
				soldiers(world, weapon, numbers);
				break;
		}
	}
}

/** The Yule Lads' Candle-Beggar: a chance to throw or fire twice. */
function twice(world: IWorld): boolean {
	return Math.random() < byRank(world.player, "candleBeggar", [0.1, 0.15, 0.2]);
}

/** Hits every enemy for whom `inside` is true, once. */
function hitWhere(
	world: IWorld,
	grid: IGrid,
	x: number,
	y: number,
	reach: number,
	inside: (enemy: IEnemy) => boolean,
	damage: number,
	weapon: IWeaponId | null,
	events: IEvents,
	knockback = 3,
) {
	near(grid, x, y, reach, (enemy) => {
		if (inside(enemy)) {
			const dx = enemy.x - x;
			const dy = enemy.y - y;
			const length = Math.hypot(dx, dy) || 1;
			hurtEnemy(world, grid, enemy, damage, { x: dx / length, y: dy / length }, weapon, events, knockback);
		}
	});
}

function blade(world: IWorld, weapon: IWeapon, input: IInput, grid: IGrid, numbers: IStats, events: IEvents) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { player } = world;
	const { level, evolved } = weapon;
	const reach = 26 * (1 + 0.15 * past(level, 3, 7)) * numbers.area * (evolved ? 1.2 : 1);
	const damage = (18 + 6 * past(level, 2) + 8 * past(level, 6, 8)) * (evolved ? 1.5 : 1);
	const heading = input.aim ?? player.heading;
	const facing = Math.atan2(heading.y, heading.x);
	const arc = evolved ? Math.PI * 2 : Math.PI * 0.7;
	const sweeps = evolved ? [facing] : [facing, ...(level >= 4 ? [facing + Math.PI] : [])];
	const cx = player.x;
	const cy = player.y - 6;

	for (const angle of sweeps) {
		world.effects.push({
			kind: "sweep",
			x: cx,
			y: cy,
			at: world.time,
			until: world.time + 0.2,
			radius: reach,
			angle,
			data: [arc],
		});
		hitWhere(
			world,
			grid,
			cx,
			cy,
			reach + 8,
			(enemy) => {
				const dx = enemy.x - cx;
				const dy = enemy.y - enemy.radius * 0.8 - cy;
				const distance = Math.hypot(dx, dy);
				let off = Math.atan2(dy, dx) - angle;
				off = Math.atan2(Math.sin(off), Math.cos(off));

				return distance < reach + enemy.radius && Math.abs(off) <= arc / 2;
			},
			damage,
			"blade",
			events,
			5,
		);
	}

	weapon.readyAt = world.time + (1.4 - 0.15 * past(level, 5, 8)) * (evolved ? 0.7 : 1) * numbers.cooldown;
}

function grenades(world: IWorld, weapon: IWeapon, grid: IGrid, numbers: IStats, events: IEvents) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { player } = world;
	const { level } = weapon;
	const count = 1 + past(level, 2, 6) + numbers.projectiles;
	// At enemies within reach; none about, then nowhere.
	const targets: IEnemy[] = [];
	near(grid, player.x, player.y, 110, (enemy) => {
		if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 110) {
			targets.push(enemy);
		}
	});

	if (targets.length === 0) {
		weapon.readyAt = world.time + 0.3;

		return;
	}

	const volleys = twice(world) ? 2 : 1;

	for (let i = 0; i < count * volleys; i++) {
		const target = targets[Math.floor(Math.random() * targets.length)];
		world.effects.push({
			kind: "shell",
			x: player.x,
			y: player.y - 10,
			at: world.time,
			until: world.time + 0.55,
			radius: 22 * (1 + 0.25 * past(level, 4, 8)) * numbers.area,
			angle: 0,
			// Where it lands, its damage, whether it's landed, and which weapon threw it (0 grenade, 1 mortar).
			data: [
				target.x + (Math.random() - 0.5) * 8,
				target.y + (Math.random() - 0.5) * 8,
				20 + 8 * past(level, 3) + 10 * past(level, 8),
				0,
				0,
			],
		});
	}

	weapon.readyAt = world.time + (level >= 7 ? 1.8 : 2.2) * numbers.cooldown;
	events.shots += 1;
}

function whip(world: IWorld, weapon: IWeapon, grid: IGrid, numbers: IStats, events: IEvents) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { player } = world;
	const { level, evolved } = weapon;
	const length = 44 * (1 + 0.15 * past(level, 4, 7)) * numbers.area * (evolved ? 1.3 : 1);
	const damage = 14 + 6 * past(level, 3, 6) + 8 * past(level, 8);
	const sides = level >= 2 ? [player.facing, -player.facing] : [player.facing];
	const cy = player.y - 7;
	const before = events.hits;

	sides.forEach((side, index) => {
		world.effects.push({
			kind: "lash",
			x: player.x,
			y: cy,
			at: world.time + index * 0.1,
			until: world.time + index * 0.1 + 0.2,
			radius: length,
			angle: side,
			data: [],
		});
		hitWhere(
			world,
			grid,
			player.x + (side * length) / 2,
			cy,
			length,
			(enemy) => {
				const dx = (enemy.x - player.x) * side;

				return dx > -4 && dx < length + enemy.radius && Math.abs(enemy.y - enemy.radius * 0.8 - cy) < 8 + enemy.radius;
			},
			damage,
			"whip",
			events,
			4,
		);
	});

	// Garland Lash: a little health for every hit.
	if (evolved && events.hits > before) {
		heal(world, Math.min(4, (events.hits - before) * 0.5), events);
	}

	weapon.readyAt = world.time + (1.3 - 0.15 * past(level, 5, 8)) * numbers.cooldown;
}

/** Snow globes circle for a while, then rest (unless evolved: they never stop). */
function globes(world: IWorld, weapon: IWeapon, numbers: IStats) {
	const { level, evolved } = weapon;
	const count = 1 + past(level, 2, 5, 7) + numbers.projectiles;
	const existing = world.allies.filter((ally) => ally.kind === "globe");

	if (existing.length > 0 || world.time < weapon.readyAt) {
		return;
	}

	const lasts = (4 + (level >= 6 ? 1.5 : 0)) * (evolved ? 1000 : 1);

	for (let i = 0; i < count; i++) {
		world.allies.push({
			kind: "globe",
			x: world.player.x,
			y: world.player.y,
			angle: (i / count) * Math.PI * 2,
			targetId: null,
			until: world.time + lasts,
			readyAt: 0,
			hits: new Map(),
		});
	}

	weapon.readyAt = world.time + lasts + 2 * numbers.cooldown;
}

function bells(world: IWorld, weapon: IWeapon, grid: IGrid, numbers: IStats, events: IEvents) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { player } = world;
	const { level, evolved } = weapon;
	const reach = 40 * (1 + 0.15 * past(level, 3, 6)) * numbers.area * (evolved ? 1.5 : 1);
	const damage = 12 + 6 * past(level, 2) + 8 * past(level, 5) + 10 * past(level, 8);
	const before = events.hits;
	world.effects.push({
		kind: "ring",
		x: player.x,
		y: player.y - 6,
		at: world.time,
		until: world.time + 0.35,
		radius: reach,
		angle: 0,
		data: [],
	});
	hitWhere(
		world,
		grid,
		player.x,
		player.y - 6,
		reach,
		(enemy) => touches(enemy, player.x, player.y - 6, reach),
		damage,
		"bells",
		events,
		level >= 8 ? 9 : 6,
	);

	// Carol of the Bells: a little health for each enemy rung.
	if (evolved) {
		heal(world, Math.min(10, (events.hits - before) * 1), events);
	}

	weapon.readyAt = world.time + (3 - 0.4 * past(level, 4, 7)) * numbers.cooldown;
	events.blasts += 1;
}

function mortar(world: IWorld, weapon: IWeapon, numbers: IStats) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { player } = world;
	const { level, evolved } = weapon;
	const count = 1 + past(level, 2, 5, 7) + numbers.projectiles + (evolved ? 3 : 0);
	const inView = world.enemies.filter(
		(enemy) => Math.abs(enemy.x - player.x) < 170 && Math.abs(enemy.y - player.y) < 100,
	);

	if (inView.length === 0) {
		weapon.readyAt = world.time + 0.4;

		return;
	}

	const volleys = twice(world) ? 2 : 1;

	for (let i = 0; i < count * volleys; i++) {
		const target = inView[Math.floor(Math.random() * inView.length)];
		world.effects.push({
			kind: "shell",
			x: player.x,
			y: player.y - 12,
			at: world.time + i * 0.08,
			until: world.time + 0.8 + i * 0.08,
			radius: 18 * (1 + 0.25 * past(level, 4, 8)) * numbers.area,
			angle: 1,
			data: [target.x, target.y, 26 + 8 * past(level, 3) + 10 * past(level, 8), 0, evolved ? 1 : 0],
		});
	}

	weapon.readyAt = world.time + (level >= 6 ? 2 : 2.6) * numbers.cooldown;
}

/** Shells (grenades and mortar) landing: a burst, maybe shrapnel or a cluster. */
export function landShells(world: IWorld, grid: IGrid, events: IEvents) {
	for (const effect of world.effects) {
		if (effect.kind !== "shell" || effect.data[3] === 1 || world.time < effect.until) {
			continue;
		}

		effect.data[3] = 1;
		const [x, y, damage, , cluster] = effect.data;
		const fromMortar = effect.angle === 1;
		burst(world, grid, x, y, effect.radius, damage, fromMortar ? "mortar" : "grenades", events);

		const grenadeWeapon = world.player.weapons.find((weapon) => weapon.id === "grenades");

		// Grenades from level 5 burst into shrapnel; Shatterstorm's shrapnel bursts again.
		if (!fromMortar && grenadeWeapon && grenadeWeapon.level >= 5) {
			const shards = grenadeWeapon.evolved ? 8 : 4;

			for (let i = 0; i < shards; i++) {
				const angle = (i / shards) * Math.PI * 2 + Math.random();
				world.shots.push({
					x,
					y: y - 4,
					vx: Math.cos(angle) * 150,
					vy: Math.sin(angle) * 150,
					until: world.time + 0.3,
					damage: damage * 0.4,
					pierce: grenadeWeapon.evolved ? 2 : 0,
					radius: 2,
					weapon: "grenades",
					hostile: false,
					kind: "shard",
					struck: new Set(),
				});
			}
		}

		// New Year's Eve: each shell bursts again in a ring of small ones.
		if (fromMortar && cluster === 1) {
			for (let i = 0; i < 3; i++) {
				const angle = (i / 3) * Math.PI * 2;
				burst(
					world,
					grid,
					x + Math.cos(angle) * 16,
					y + Math.sin(angle) * 16,
					effect.radius * 0.6,
					damage * 0.5,
					"mortar",
					events,
				);
			}
		}
	}
}

/** A burst at (x, y) (from `weapon`, or a blessing's): its flash, knocking candles over, hurting everything in it. */
export function burst(
	world: IWorld,
	grid: IGrid,
	x: number,
	y: number,
	radius: number,
	damage: number,
	weapon: IWeaponId | null,
	events: IEvents,
) {
	world.effects.push({
		kind: "blast",
		x,
		y: y - 4,
		at: world.time,
		until: world.time + 0.35,
		radius,
		angle: 0,
		data: [],
	});
	knockCandles(world, x, y - 4, radius);
	hitWhere(world, grid, x, y - 4, radius, (enemy) => touches(enemy, x, y - 4, radius), damage, weapon, events, 4);
	events.blasts += 1;
}

/** How far the cocoa aura reaches from the elf. */
export function cocoaReach(weapon: IWeapon, numbers: IStats): number {
	return 24 * (1 + 0.15 * past(weapon.level, 3, 6, 8)) * numbers.area * (weapon.evolved ? 1.4 : 1);
}

function cocoa(world: IWorld, weapon: IWeapon, grid: IGrid, numbers: IStats, events: IEvents) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { player } = world;
	const { level, evolved } = weapon;
	const reach = cocoaReach(weapon, numbers);
	const damage = (4 + 2 * past(level, 2, 5) + 3 * past(level, 8)) * (evolved ? 1.5 : 1);
	hitWhere(
		world,
		grid,
		player.x,
		player.y - 6,
		reach,
		(enemy) => {
			const inside = touches(enemy, player.x, player.y - 6, reach);

			// Marshmallow Meltdown: everything in it slows.
			if (inside && evolved) {
				enemy.slowUntil = world.time + 0.6;
				enemy.slow = Math.max(enemy.slow, 0.4);
			}

			return inside;
		},
		damage,
		"cocoa",
		events,
		0.5,
	);
	weapon.readyAt = world.time + (0.6 - 0.08 * past(level, 4, 7)) * numbers.cooldown;
}

/** Gingerbread minions: kept at their number, running at enemies. */
function minions(world: IWorld, weapon: IWeapon, numbers: IStats) {
	const { level, evolved } = weapon;
	const count = (1 + past(level, 2, 5, 8) + numbers.projectiles) * (evolved ? 2 : 1);
	const existing = world.allies.filter((ally) => ally.kind === "minion").length;

	for (let i = existing; i < count; i++) {
		world.allies.push({
			kind: "minion",
			x: world.player.x + (Math.random() - 0.5) * 12,
			y: world.player.y + (Math.random() - 0.5) * 12,
			angle: 0,
			targetId: null,
			until: Infinity,
			readyAt: 0,
			hits: new Map(),
		});
	}
}

/** Toy soldiers marching out, every so often, to stand guard round where the elf is. */
function soldiers(world: IWorld, weapon: IWeapon, numbers: IStats) {
	if (world.time < weapon.readyAt) {
		return;
	}

	const { level, evolved } = weapon;
	const count = 1 + past(level, 3, 7) + numbers.projectiles;
	const guard = (8 + 2 * past(level, 4, 7)) * (evolved ? 2 : 1);

	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2 + Math.random() * Math.PI;
		world.allies.push({
			kind: "soldier",
			x: world.player.x + Math.cos(angle) * 16,
			y: world.player.y + Math.sin(angle) * 10,
			angle: 0,
			targetId: null,
			until: world.time + guard,
			readyAt: world.time + 0.4,
			hits: new Map(),
		});
	}

	weapon.readyAt = world.time + (level >= 6 ? 4.5 : 6) * numbers.cooldown;
}

/** A toy soldier on guard: turning to the nearest enemy in range, firing walnut shot at it (in volleys, evolved). */
function standGuard(world: IWorld, grid: IGrid, ally: IAlly, weapon: IWeapon, events: IEvents) {
	let target: IEnemy | null = null;
	let best = 110 * world.numbers.area;
	near(grid, ally.x, ally.y, best, (enemy) => {
		const distance = Math.hypot(enemy.x - ally.x, enemy.y - ally.y);

		if (distance < best) {
			best = distance;
			target = enemy;
		}
	});

	if (!target) {
		return;
	}

	const { x, y, radius } = target as IEnemy;
	const aim = Math.atan2(y - radius * 0.8 - (ally.y - 8), x - ally.x);
	ally.angle = aim;

	if (world.time < ally.readyAt) {
		return;
	}

	const damage = 9 + 3 * past(weapon.level, 2, 5, 8) + (weapon.evolved ? 4 : 0);

	for (const fan of weapon.evolved ? [-0.15, 0, 0.15] : [0]) {
		world.shots.push({
			x: ally.x + Math.cos(aim) * 5,
			y: ally.y - 8 + Math.sin(aim) * 5,
			vx: Math.cos(aim + fan) * 220,
			vy: Math.sin(aim + fan) * 220,
			until: world.time + 0.7,
			damage,
			pierce: 0,
			radius: 1.5,
			weapon: "soldiers",
			hostile: false,
			kind: "pellet",
			struck: new Set(),
		});
	}

	ally.shotAt = world.time;
	ally.readyAt = world.time + 0.8 * world.numbers.cooldown;
	events.volley = true;
}

/** The things that move with the elf: snow globes circling, minions running, Saint Lucia's flames; and toy soldiers on guard. */
export function moveAllies(world: IWorld, grid: IGrid, dt: number, events: IEvents) {
	const { player, numbers } = world;
	const globeWeapon = player.weapons.find((weapon) => weapon.id === "globes");
	const minionWeapon = player.weapons.find((weapon) => weapon.id === "minions");
	const soldierWeapon = player.weapons.find((weapon) => weapon.id === "soldiers");

	world.allies = world.allies.filter((ally) => {
		if (world.time >= ally.until) {
			return false;
		}

		if (ally.kind === "globe" && globeWeapon) {
			const radius = 24 * (1 + 0.25 * past(globeWeapon.level, 4)) * numbers.area;
			ally.angle += (globeWeapon.level >= 8 ? 4 : 3) * dt;
			ally.x = player.x + Math.cos(ally.angle) * radius;
			ally.y = player.y - 6 + Math.sin(ally.angle) * radius;
			strike(
				world,
				grid,
				ally,
				6,
				10 + 6 * past(globeWeapon.level, 3) + 8 * past(globeWeapon.level, 8),
				0.5,
				"globes",
				events,
				(enemy) => {
					if (globeWeapon.evolved) {
						enemy.frozenUntil = Math.max(enemy.frozenUntil, world.time + 0.8);
					}
				},
			);
		}

		if (ally.kind === "flame") {
			ally.angle += 2.2 * dt;
			ally.x = player.x + Math.cos(ally.angle) * 22;
			ally.y = player.y - 6 + Math.sin(ally.angle) * 22;
			strike(world, grid, ally, 5, 8, 0.6, null, events, (enemy) => {
				enemy.burnUntil = world.time + 3;
				enemy.burnDamage = 6;
			});
		}

		if (ally.kind === "minion" && minionWeapon) {
			moveMinion(world, grid, ally, minionWeapon, dt, events);
		}

		if (ally.kind === "soldier" && soldierWeapon) {
			standGuard(world, grid, ally, soldierWeapon, events);
		}

		return true;
	});
}

/** An ally touching enemies hurts each at most every `every` seconds. */
function strike(
	world: IWorld,
	grid: IGrid,
	ally: { x: number; y: number; hits: Map<number, number> },
	radius: number,
	damage: number,
	every: number,
	weapon: IWeaponId | null,
	events: IEvents,
	also?: (enemy: IEnemy) => void,
) {
	near(grid, ally.x, ally.y, radius + 10, (enemy) => {
		if (touches(enemy, ally.x, ally.y, radius) && world.time - (ally.hits.get(enemy.id) ?? -10) >= every) {
			ally.hits.set(enemy.id, world.time);
			const dx = enemy.x - ally.x;
			const dy = enemy.y - ally.y;
			const length = Math.hypot(dx, dy) || 1;
			also?.(enemy);
			hurtEnemy(world, grid, enemy, damage, { x: dx / length, y: dy / length }, weapon, events, 3);
		}
	});
}

function moveMinion(world: IWorld, grid: IGrid, ally: IAllyLike, weapon: IWeapon, dt: number, events: IEvents) {
	const { player } = world;
	let target =
		ally.targetId === null
			? null
			: (world.enemies.find((enemy) => enemy.id === ally.targetId && enemy.health > 0) ?? null);

	// Find the nearest enemy to the elf within reach, if it's lost its own.
	if (!target) {
		let best = 90;
		near(grid, player.x, player.y, 90, (enemy) => {
			const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);

			if (distance < best) {
				best = distance;
				target = enemy;
			}
		});
		ally.targetId = target ? (target as IEnemy).id : null;
	}

	const goal: IVector = target
		? { x: (target as IEnemy).x, y: (target as IEnemy).y }
		: { x: player.x + Math.cos(ally.angle) * 14, y: player.y + Math.sin(ally.angle) * 10 };
	const dx = goal.x - ally.x;
	const dy = goal.y - ally.y;
	const distance = Math.hypot(dx, dy);
	const speed = weapon.level >= 7 ? 90 : 70;

	if (distance > 2) {
		ally.x += (dx / distance) * Math.min(distance, speed * dt);
		ally.y += (dy / distance) * Math.min(distance, speed * dt);
	}

	ally.angle += dt * 0.7;
	const damage = (8 + 4 * past(weapon.level, 3, 6) + 6 * past(weapon.level, 8)) * (weapon.evolved ? 1.5 : 1);
	strike(world, grid, ally, 4, damage, weapon.level >= 4 ? 0.45 : 0.6, "minions", events);
}

type IAllyLike = { x: number; y: number; angle: number; targetId: number | null; hits: Map<number, number> };
