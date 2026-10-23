/**
 * Where harm happens in Silent Night: the elf hurting enemies (crits, burning, freezing,
 * shattering, chains, knockback, and what each drops when it breaks) and enemies hurting the elf
 * (armour, the halo, the guardian, a dash's safety). Every weapon and blessing goes through here,
 * so they all combine.
 */

import { CELL, ENEMY_KINDS, PLAYER_RADIUS } from "Components/SilentNight/constants";
import { newGear } from "Components/SilentNight/gear";
import { bargain, byRank, rank } from "Components/SilentNight/stats";
import type { IEnemy, IEvents, IVector, IWeaponId, IWorld } from "Components/SilentNight/types";

export type IGrid = Map<number, IEnemy[]>;

const cellKey = (cx: number, cy: number) => cx * 73856093 + cy * 19349663;

export function gridOf(enemies: IEnemy[]): IGrid {
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

/** Every enemy within `radius` of (x, y) (plus a little), until `each` returns true. */
export function near(grid: IGrid, x: number, y: number, radius: number, each: (enemy: IEnemy) => boolean | void) {
	const reach = Math.ceil(radius / CELL);
	const cx = Math.floor(x / CELL);
	const cy = Math.floor(y / CELL);

	for (let ox = -reach; ox <= reach; ox++) {
		for (let oy = -reach; oy <= reach; oy++) {
			const cell = grid.get(cellKey(cx + ox, cy + oy));

			if (cell) {
				for (const enemy of cell) {
					if (enemy.health > 0 && each(enemy) === true) {
						return;
					}
				}
			}
		}
	}
}

/** Within reach: from its middle (enemies stand on their feet; their middles are a little up). */
export function touches(enemy: IEnemy, x: number, y: number, radius: number): boolean {
	return Math.hypot(enemy.x - x, enemy.y - enemy.radius * 0.8 - y) < enemy.radius + radius;
}

export function frozen(world: IWorld, enemy: IEnemy): boolean {
	return world.time < enemy.frozenUntil;
}

/** Damage a patron's blessing (or Krampus's chains) has done, by its id, tallied for the night's end. */
export function tally(world: IWorld, id: string, damage: number) {
	const { damageBy } = world.player;
	damageBy[id] = (damageBy[id] ?? 0) + damage;
}

/** Frozen solid for `seconds` (longer with Ded Moroz's long winter). */
export function freeze(world: IWorld, enemy: IEnemy, seconds: number) {
	const longer = 1 + 0.5 * rank(world.player, "longWinter");
	enemy.frozenUntil = Math.max(enemy.frozenUntil, world.time + seconds * longer);
}

export function burning(world: IWorld, enemy: IEnemy): boolean {
	return world.time < enemy.burnUntil;
}

/**
 * The elf's weapon (or blessing) hits an enemy for `amount`: crits, the patrons' and Krampus's
 * effects, knockback along `direction`. Returns the damage done.
 */
export function hurtEnemy(
	world: IWorld,
	grid: IGrid,
	enemy: IEnemy,
	amount: number,
	direction: IVector | null,
	weapon: IWeaponId | null,
	events: IEvents,
	knockback = 3,
	chained = false,
): number {
	if (enemy.health <= 0) {
		return 0;
	}

	const { player, numbers } = world;
	let damage = amount * numbers.damage;
	// Christkind's guiding star: every few seconds, a certain critical hit.
	const starred = rank(player, "guidingStar") > 0 && world.time >= player.starReadyAt;
	const critical = starred || Math.random() < numbers.crit;

	if (starred) {
		player.starReadyAt = world.time + byRank(player, "guidingStar", [5, 4, 3]);
	}

	if (critical) {
		damage *= 2;
	}

	// Saint Lucia: harder on the burning. Ded Moroz: far harder on the frozen.
	if (burning(world, enemy)) {
		damage *= 1 + byRank(player, "wickAndWax", [0.15, 0.3, 0.45]);
	}

	if (frozen(world, enemy)) {
		damage *= 1 + byRank(player, "shatter", [0.5, 1, 1.5]);
	}

	// Mari Lwyd's wassail: harder on those close round the elf, in her song.
	if (rank(player, "wassail") > 0 && Math.hypot(enemy.x - player.x, enemy.y - player.y) < numbers.song) {
		damage *= 1 + byRank(player, "wassail", [0.1, 0.2, 0.3]);
	}

	// La Flor: the lowest-level weapon hits harder; everything does as the night goes on.
	if (weapon && rank(player, "humbleBeginnings") > 0 && lowestWeapon(world) === weapon) {
		damage *= 1 + byRank(player, "humbleBeginnings", [0.3, 0.6, 0.9]);
	}

	damage *= 1 + byRank(player, "lateBloomer", [0.03, 0.04, 0.05]) * Math.floor(world.time / 60);

	// The Yule Goat: butting heads with elites and bosses.
	if (enemy.elite || enemy.boss) {
		damage *= 1 + byRank(player, "buttingHeads", [0.2, 0.3, 0.4]);
	}

	enemy.health -= damage;
	enemy.hitAt = world.time;
	events.hits += 1;

	// Ded Moroz's deep frost: frozen and nearly gone, it shatters.
	if (
		frozen(world, enemy) &&
		!enemy.boss &&
		enemy.health < enemy.maxHealth * byRank(player, "deepFrost", [0.1, 0.15, 0.2])
	) {
		tally(world, "deepFrost", enemy.health);
		enemy.health = 0;
	}

	// Mari Lwyd's wassail bowl: now and then a hit heals the elf a little.
	if (Math.random() < byRank(player, "wassailBowl", [0.02, 0.04, 0.06])) {
		heal(world, 1, events);
		events.healed = false;
	}

	// The weapon's own hits (a leap of Krampus's chains is tallied to the chains).
	if (weapon && !chained) {
		const carried = player.weapons.find((candidate) => candidate.id === weapon);

		if (carried) {
			carried.damage += damage;
		}
	}

	// Knocked back (bosses and golems barely), or slammed and stunned by a Yule Lad, or (a critical
	// hit, with the Yule Lads and the Yule Goat) thrown and stunned.
	const heavy = enemy.boss ? 0.1 : enemy.kind === "golem" ? 0.3 : 1;

	if (direction && knockback > 0) {
		const slam = Math.random() < byRank(player, "doorSlammer", [0.08, 0.12, 0.16]) && !enemy.boss;
		const thrown = critical && rank(player, "hornswoggle") > 0 && !enemy.boss;
		const push =
			knockback * heavy * (slam ? 4 : thrown ? 3 : 1) * 30 * (1 + byRank(player, "horns", [0.25, 0.5, 0.75]));
		enemy.push.x += direction.x * push;
		enemy.push.y += direction.y * push;

		if (slam || thrown) {
			enemy.stunUntil = world.time + 0.5;
		}
	}

	// Saint Lucia's kindling; Ded Moroz's cold and frost.
	if (Math.random() < byRank(player, "kindling", [0.1, 0.2, 0.3])) {
		enemy.burnUntil = world.time + 3;
		enemy.burnDamage = 6;
		enemy.burnSource = "kindling";
		events.ignited = true;
	}

	if (rank(player, "bitterCold") > 0) {
		enemy.slowUntil = world.time + 2;
		enemy.slow = Math.max(enemy.slow, byRank(player, "bitterCold", [0.2, 0.3, 0.4]));
	}

	if (!enemy.boss && Math.random() < byRank(player, "hoarfrost", [0.06, 0.1, 0.14])) {
		freeze(world, enemy, 1.5);
		events.froze = true;
	}

	// Steam: a frozen enemy set burning bursts, scalding everything round it.
	if (rank(player, "steamBurst") > 0 && frozen(world, enemy) && burning(world, enemy) && !chained) {
		enemy.frozenUntil = 0;
		world.effects.push({
			kind: "steam",
			x: enemy.x,
			y: enemy.y - 4,
			at: world.time,
			until: world.time + 0.5,
			radius: 28,
			angle: 0,
			data: [],
		});
		near(grid, enemy.x, enemy.y, 28, (other) => {
			if (other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 28) {
				tally(world, "steamBurst", hurtEnemy(world, grid, other, 25, null, null, events, 0, true));
			}
		});
	}

	// Krampus's chains: the hit leaps on to two more, at half strength.
	if (bargain(player, "chains") && !chained) {
		let leaps = 0;
		near(grid, enemy.x, enemy.y, 40, (other) => {
			if (other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 40) {
				world.effects.push({
					kind: "chains",
					x: enemy.x,
					y: enemy.y - 4,
					at: world.time,
					until: world.time + 0.15,
					radius: 0,
					angle: 0,
					data: [other.x, other.y - 4],
				});
				tally(world, "chains", hurtEnemy(world, grid, other, amount * 0.5, null, weapon, events, 0, true));
				leaps += 1;
			}

			return leaps >= 2;
		});
	}

	if (enemy.health <= 0) {
		kill(world, grid, enemy, events);
	}

	return damage;
}

/** The elf's lowest-level weapon (for La Flor's blessings). */
export function lowestWeapon(world: IWorld): IWeaponId | null {
	let lowest: { id: IWeaponId; level: number } | null = null;

	for (const weapon of world.player.weapons) {
		if (!lowest || weapon.level < lowest.level) {
			lowest = weapon;
		}
	}

	return lowest?.id ?? null;
}

/** An enemy breaks: its crumbs, its experience, maybe something more. */
function kill(world: IWorld, grid: IGrid, enemy: IEnemy, events: IEvents) {
	const { player } = world;
	world.kills += 1;
	events.kills += 1;
	events.broken |= 1 << ENEMY_KINDS.indexOf(enemy.kind);
	world.effects.push({
		kind: "crumbs",
		x: enemy.x,
		y: enemy.y - enemy.radius,
		at: world.time,
		until: world.time + 0.7,
		radius: enemy.radius,
		angle: Math.random() * Math.PI * 2,
		data: [ENEMY_KINDS.indexOf(enemy.kind)],
	});

	// Its experience, maybe more (La Flor's falling petals, the Yule Lads' spoon-licking).
	const extra = Math.random() < byRank(player, "petalFall", [0.1, 0.2, 0.3]) ? 1 : 0;

	for (let i = 0; i <= extra; i++) {
		dropCrystal(world, enemy.x + (i ? 4 : 0), enemy.y, enemy.experience);
	}

	// A bit of cocoa now and then, more with a Yule Lad's swiping.
	if (Math.random() < 0.004 + byRank(player, "sausageSwiper", [0.01, 0.02, 0.03])) {
		world.pickups.push({
			id: world.nextId++,
			kind: "cocoa",
			x: enemy.x,
			y: enemy.y,
			value: 25,
			pulled: false,
			at: world.time,
		});
	}

	// La Befana's gifts for the good: cocoa or a big crystal.
	if (Math.random() < byRank(player, "giftsForGood", [0.02, 0.04, 0.06])) {
		const cocoa = Math.random() < 0.5;
		world.pickups.push({
			id: world.nextId++,
			kind: cocoa ? "cocoa" : "bigCrystal",
			x: enemy.x - 4,
			y: enemy.y,
			value: cocoa ? 20 : 10 * world.numbers.experience,
			pulled: false,
			at: world.time,
		});
	}

	// The Yule Lads and La Befana: a gift left in the shoe, cocoa and a big crystal both.
	if (rank(player, "shoeInTheWindow") > 0 && Math.random() < 0.04) {
		for (const [kind, value, dx] of [
			["cocoa", 20, -4],
			["bigCrystal", 10 * world.numbers.experience, 4],
		] as const) {
			world.pickups.push({
				id: world.nextId++,
				kind,
				x: enemy.x + dx,
				y: enemy.y,
				value,
				pulled: false,
				at: world.time,
			});
		}
	}

	// Mari Lwyd's mummers: one that falls in the song may rise to fight for the elf a while.
	if (
		Math.random() < byRank(player, "mummers", [0.05, 0.1, 0.15]) &&
		Math.hypot(enemy.x - player.x, enemy.y - player.y) < world.numbers.song &&
		world.allies.filter((ally) => ally.kind === "mummer").length < 6
	) {
		world.allies.push({
			kind: "mummer",
			x: enemy.x,
			y: enemy.y,
			angle: 0,
			targetId: null,
			until: world.time + 10,
			readyAt: 0,
			hits: new Map(),
		});
	}

	// Mari Lwyd and the Christkind: each that falls in the song heals the elf a little.
	if (rank(player, "carolAtTheDoor") > 0 && Math.hypot(enemy.x - player.x, enemy.y - player.y) < world.numbers.song) {
		heal(world, 0.5, events);
		events.healed = false;
	}

	// Rarely, the Christmas star: pulls in every crystal there is.
	if (Math.random() < 0.0012 * world.numbers.luck) {
		world.pickups.push({
			id: world.nextId++,
			kind: "star",
			x: enemy.x,
			y: enemy.y,
			value: 0,
			pulled: false,
			at: world.time,
		});
	}

	// Elites and bosses leave a chest; bosses a piece of gear beside it, and elites half the time.
	if (enemy.elite || enemy.boss) {
		world.pickups.push({
			id: world.nextId++,
			kind: "chest",
			x: enemy.x,
			y: enemy.y,
			value: enemy.boss ? 3 : 1,
			pulled: false,
			at: world.time,
		});
	}

	if (enemy.boss || (enemy.elite && Math.random() < 0.5)) {
		world.pickups.push({
			id: world.nextId++,
			kind: "gear",
			x: enemy.x + 14,
			y: enemy.y,
			value: 0,
			pulled: false,
			at: world.time,
			// More often festive or gilded for a Yule Lad's pot-scraping.
			gear: newGear(world.numbers.luck * (1 + byRank(player, "potScraper", [0.5, 1, 1.5])), enemy.boss),
		});
	}

	if (enemy.boss) {
		world.bosses += 1;
	}

	// Saint Lucia's spreading flame.
	if (burning(world, enemy) && rank(player, "spreadingFlame") > 0) {
		const reach = byRank(player, "spreadingFlame", [24, 32, 40]);
		near(grid, enemy.x, enemy.y, reach, (other) => {
			if (Math.hypot(other.x - enemy.x, other.y - enemy.y) < reach) {
				other.burnUntil = world.time + 3;
				other.burnDamage = 6;
				other.burnSource = "spreadingFlame";
			}
		});
	}

	// Ded Moroz: a frozen enemy shatters into shards of ice.
	if (frozen(world, enemy) && rank(player, "shatter") > 0) {
		const shards = 2 + rank(player, "shatter");

		for (let i = 0; i < shards; i++) {
			const angle = (i / shards) * Math.PI * 2;
			world.shots.push({
				x: enemy.x,
				y: enemy.y - 4,
				vx: Math.cos(angle) * 160,
				vy: Math.sin(angle) * 160,
				until: world.time + 0.35,
				damage: 12,
				pierce: 1,
				radius: 2,
				weapon: null,
				blessing: "shatter",
				hostile: false,
				kind: "ice",
				struck: new Set([enemy.id]),
			});
		}
	}

	// La Flor's seed pod: now and then it bursts into a poinsettia's five petals, flying out as far
	// as the shards of ice do but slower, so they're seen.
	if (Math.random() < byRank(player, "seedPod", [0.1, 0.2, 0.3])) {
		const turn = Math.random() * Math.PI * 2;

		for (let i = 0; i < 5; i++) {
			const angle = turn + (i / 5) * Math.PI * 2;
			world.shots.push({
				x: enemy.x,
				y: enemy.y - 4,
				vx: Math.cos(angle) * 110,
				vy: Math.sin(angle) * 110,
				until: world.time + 0.5,
				damage: 12,
				pierce: 1,
				radius: 2,
				weapon: null,
				blessing: "seedPod",
				hostile: false,
				kind: "petal",
				struck: new Set([enemy.id]),
			});
		}
	}
}

/** Experience, as a crystal of frost in the snow: worth more with La Flor and the Sack. */
export function dropCrystal(world: IWorld, x: number, y: number, value: number) {
	const worth = value * world.numbers.experience;
	// Yule Lads: a crystal licked off the spoon counts twice.
	const doubled = Math.random() < byRank(world.player, "spoonLicker", [0.1, 0.2, 0.3]) ? 2 : 1;
	world.pickups.push({
		id: world.nextId++,
		kind: worth * doubled >= 10 ? "bigCrystal" : "crystal",
		x: x + (Math.random() - 0.5) * 4,
		y: y + (Math.random() - 0.5) * 4,
		value: worth * doubled,
		pulled: false,
		at: world.time,
	});
}

/** An enemy (or its shot, or a boss's attack) hurts the elf, unless it's safe. `from`: the enemy that touched it. */
export function hurtPlayer(world: IWorld, amount: number, events: IEvents, from?: IEnemy) {
	const { player } = world;

	// The snowman's cold to the touch.
	if (from && player.character === "snowman") {
		from.slowUntil = world.time + 2;
		from.slow = Math.max(from.slow, 0.5);
	}

	// The Yule Goat's iron horns: what touches the elf butted back (as hard as his charge throws) and
	// stunned, every so often.
	if (from && rank(player, "ironHorns") > 0 && world.time >= player.hornsReadyAt) {
		player.hornsReadyAt = world.time + byRank(player, "ironHorns", [3, 2, 1]);
		const dx = from.x - player.x;
		const dy = from.y - player.y;
		const length = Math.hypot(dx, dy) || 1;
		const heavy = from.boss ? 0.1 : from.kind === "golem" ? 0.3 : 1;
		from.push.x += (dx / length) * 150 * heavy;
		from.push.y += (dy / length) * 150 * heavy;

		if (!from.boss) {
			from.stunUntil = world.time + 1;
		}
	}

	if (world.time < player.dashUntil || world.time < player.hurtUntil) {
		return;
	}

	// Christkind's halo takes the hit.
	if (player.haloReadyAt !== null && world.time >= player.haloReadyAt) {
		player.haloReadyAt = world.time + byRank(player, "halo", [20, 15, 10]);
		player.hurtUntil = world.time + 0.6;
		world.effects.push({
			kind: "heal",
			x: player.x,
			y: player.y - 8,
			at: world.time,
			until: world.time + 0.4,
			radius: 14,
			angle: 0,
			data: [],
		});

		return;
	}

	const { numbers } = world;
	// The Yule Goat and Mari Lwyd: safety in the wassailing crowd, close round the elf in the song.
	const crowd =
		rank(player, "wassailers") > 0
			? world.enemies.filter((enemy) => Math.hypot(enemy.x - player.x, enemy.y - player.y) < numbers.song).length
			: 0;
	const armour = Math.min(0.6, numbers.armour + Math.min(0.2, crowd * 0.02));
	player.health -= amount * numbers.vulnerability * (1 - armour);
	player.hurtUntil = world.time + 0.6;
	events.hurt = true;

	// Christkind's angel's hair: tinsel lashing back at what touched the elf.
	if (from && rank(player, "angelsHair") > 0) {
		const dx = from.x - player.x;
		const dy = from.y - player.y;
		const length = Math.hypot(dx, dy) || 1;
		world.effects.push({
			kind: "lash",
			x: player.x,
			y: player.y - 6,
			at: world.time,
			until: world.time + 0.2,
			radius: Math.max(8, Math.abs(dx)),
			angle: dx < 0 ? -1 : 1,
			data: [],
		});
		tally(
			world,
			"angelsHair",
			hurtEnemy(
				world,
				gridOf(world.enemies),
				from,
				byRank(player, "angelsHair", [30, 45, 60]),
				{ x: dx / length, y: dy / length },
				null,
				events,
				3,
			),
		);
	}

	// The Yule Goat's straw catches: a burst of burning straw round the elf (secondWave.ts sets it off).
	if (rank(player, "strawBurns") > 0) {
		world.effects.push({
			kind: "coal",
			x: player.x,
			y: player.y,
			at: world.time,
			until: world.time,
			radius: 30 * numbers.area,
			angle: 0,
			data: [player.x, player.y, byRank(player, "strawBurns", [20, 30, 40]), 0, 1],
		});
	}

	// Christkind's guardian: brought back from the brink.
	if (
		rank(player, "guardian") > 0 &&
		player.health < numbers.maxHealth * 0.3 &&
		player.health > 0 &&
		world.time >= player.guardianReadyAt
	) {
		player.hurtUntil = world.time + byRank(player, "guardian", [3, 4, 5]);
		player.guardianReadyAt = world.time + 60;
	}
}

/** Heals the elf by `amount` (more with Christkind's gentle hands, none with Krampus's chains). */
export function heal(world: IWorld, amount: number, events: IEvents) {
	const { numbers } = world;
	const before = world.player.health;
	world.player.health = Math.min(numbers.maxHealth, world.player.health + amount * numbers.healing);

	if (world.player.health > before) {
		events.healed = true;
	}
}

/** Whether something at (x, y) reaches the elf. */
export function reachesPlayer(world: IWorld, x: number, y: number, radius: number): boolean {
	return Math.hypot(world.player.x - x, world.player.y - 4 - y) < PLAYER_RADIUS + radius;
}
