/**
 * The aimed guns, as in 20 Minutes Till Dawn: one is chosen before the night (with whoever
 * plays), carried from the start, and only ever levelled, never offered. Each has its own numbers
 * at each of its eight levels, its own evolution beside a passive (from a chest), and two morphs
 * to choose between at levels 3 and 6, offered at level-ups, that change how it fires. Everything
 * here is numbers: firing them is fireGun (below), and what a shot does when it hits is
 * moveShots (world.ts).
 */

import type { IStats } from "Components/SilentNight/stats";
import type {
	IEvents,
	IGunId,
	IInput,
	IPassiveId,
	IPlayer,
	IShot,
	IShotHit,
	IWeapon,
	IWorld,
} from "Components/SilentNight/types";

/** How many of the levels up to `level` are at or past each of `marks` (each counting once). */
export const past = (level: number, ...marks: number[]) => marks.filter((mark) => level >= mark).length;

/** Everything about how a gun fires. */
export type IGunNumbers = {
	damage: number;
	/** Shots before reloading, the time between them and the reload (seconds). */
	magazine: number;
	interval: number;
	reload: number;
	/** Never reloads. */
	endless: boolean;
	/** Shots in each trigger pull, spread across `spread` radians, each off by up to `jitter`. */
	pellets: number;
	spread: number;
	jitter: number;
	speed: number;
	/** How long a shot flies (seconds), and how big it is. */
	life: number;
	radius: number;
	/** How many more enemies a shot passes through. */
	pierce: number;
	kind: IShot["kind"];
	/** What a shot does to what it hits. */
	hit: IShotHit;
};

export type IMorph = { id: string; name: string; text: string; morph: (numbers: IGunNumbers) => void };

export type IGunInfo = {
	id: IGunId;
	name: string;
	description: string;
	/** What each level after the first adds. */
	levels: string[];
	numbers: (level: number) => IGunNumbers;
	evolution: { passive: IPassiveId; name: string; description: string; morph: (numbers: IGunNumbers) => void };
	/** The two morphs to choose between at level 3, and at level 6. */
	morphs: [[IMorph, IMorph], [IMorph, IMorph]];
};

/** The gun levels at which each tier of morphs is offered. */
export const MORPH_LEVELS = [3, 6];

const noHit = (): IShotHit => ({
	knockback: 2,
	burst: null,
	burn: 0,
	slow: 0,
	freeze: 0,
	bounce: 0,
	homing: 0,
	sparks: 0,
});

export const GUNS: IGunInfo[] = [
	{
		id: "gun",
		name: "Candy cane gun",
		description: "Aimed shots of peppermint. Reloads when it's empty.",
		levels: [
			"+4 damage",
			"+6 shots in the magazine",
			"Shots pass through 1 more",
			"Fires faster",
			"+4 damage",
			"Reloads faster",
			"Shots pass through 1 more, +4 damage",
		],
		numbers: (level) => ({
			damage: 10 + 4 * past(level, 2, 6, 8),
			magazine: 14 + 6 * past(level, 3),
			interval: level >= 5 ? 0.11 : 0.14,
			reload: level >= 7 ? 0.7 : 1,
			endless: false,
			pellets: 1,
			spread: 0,
			jitter: 0.05,
			speed: 240,
			life: 0.8,
			radius: 1.5,
			pierce: past(level, 4, 8),
			kind: "peppermint",
			hit: noHit(),
		}),
		evolution: {
			passive: "sleighBells",
			name: "Peppermint Gatling",
			description: "Never reloads, fires twice as fast, and pierces.",
			morph: (numbers) => {
				numbers.endless = true;
				numbers.interval *= 0.5;
				numbers.damage += 4;
				numbers.pierce += 1;
			},
		},
		morphs: [
			[
				{
					id: "splitCane",
					name: "Split cane",
					text: "Fires three canes in a fan, each two-thirds as strong.",
					morph: (numbers) => {
						numbers.pellets = 3;
						numbers.spread = 0.35;
						numbers.damage *= 0.67;
					},
				},
				{
					id: "hardCandy",
					name: "Hard candy",
					text: "Half as hard again, knocking them further back; fires a little slower.",
					morph: (numbers) => {
						numbers.damage *= 1.5;
						numbers.hit.knockback = 5;
						numbers.interval *= 1.15;
					},
				},
			],
			[
				{
					id: "ricochet",
					name: "Ricochet",
					text: "Each cane bounces on to two more enemies.",
					morph: (numbers) => {
						numbers.hit.bounce = 2;
					},
				},
				{
					id: "peppermintPop",
					name: "Peppermint pop",
					text: "Each cane bursts where it stops.",
					morph: (numbers) => {
						numbers.hit.burst = { radius: 14, share: 0.6, everyHit: false };
					},
				},
			],
		],
	},
	{
		id: "blunderbuss",
		name: "Nutcracker's blunderbuss",
		description: "A blast of walnut shells at close range, knocking them flying. Two shots, then a reload.",
		levels: [
			"+2 damage",
			"+1 shell in each blast",
			"+1 shot before reloading",
			"+2 damage",
			"A tighter blast",
			"+1 shell in each blast, reloads faster",
			"+2 damage",
		],
		numbers: (level) => ({
			damage: 7 + 2 * past(level, 2, 5, 8),
			magazine: 2 + past(level, 4),
			interval: 0.28,
			reload: level >= 7 ? 1 : 1.3,
			endless: false,
			pellets: 6 + past(level, 3, 7),
			spread: level >= 6 ? 0.45 : 0.6,
			jitter: 0.08,
			speed: 220,
			life: 0.3,
			radius: 1.5,
			pierce: 0,
			kind: "pellet",
			hit: { ...noHit(), knockback: 6 },
		}),
		evolution: {
			passive: "woolSocks",
			name: "The Nutcracker's Salute",
			description: "Never reloads, and every shell passes through one more.",
			morph: (numbers) => {
				numbers.endless = true;
				numbers.pierce += 1;
			},
		},
		morphs: [
			[
				{
					id: "buckshot",
					name: "Buckshot",
					text: "Four more shells in each blast, spread wider.",
					morph: (numbers) => {
						numbers.pellets += 4;
						numbers.spread *= 1.3;
					},
				},
				{
					id: "slug",
					name: "Slug",
					text: "One heavy slug in place of the shells, reaching far and passing through three.",
					morph: (numbers) => {
						numbers.damage *= 4;
						numbers.pellets = 1;
						numbers.spread = 0;
						numbers.pierce += 3;
						numbers.speed = 300;
						numbers.life = 0.7;
						numbers.radius = 2.5;
					},
				},
			],
			[
				{
					id: "crackedShells",
					name: "Cracked shells",
					text: "Every shell bursts where it stops.",
					morph: (numbers) => {
						numbers.hit.burst = { radius: 9, share: 0.5, everyHit: false };
					},
				},
				{
					id: "doubleBarrel",
					name: "Double barrel",
					text: "Two more shots before reloading, fired twice as fast.",
					morph: (numbers) => {
						numbers.magazine += 2;
						numbers.interval *= 0.5;
					},
				},
			],
		],
	},
	{
		id: "crossbow",
		name: "Icicle crossbow",
		description: "A heavy icicle bolt, passing through a line of them and chilling them. One bolt, then a reload.",
		levels: [
			"+10 damage",
			"Bolts pass through 2 more",
			"Draws faster",
			"+1 bolt before drawing again",
			"+10 damage",
			"Bolts pass through 2 more",
			"+12 damage",
		],
		numbers: (level) => ({
			damage: 30 + 10 * past(level, 2, 6) + 12 * past(level, 8),
			magazine: 1 + past(level, 5),
			interval: 0.2,
			reload: level >= 4 ? 0.68 : 0.9,
			endless: false,
			pellets: 1,
			spread: 0,
			jitter: 0.02,
			speed: 330,
			life: 0.9,
			radius: 1.5,
			pierce: 3 + 2 * past(level, 3, 7),
			kind: "bolt",
			hit: { ...noHit(), slow: 0.35 },
		}),
		evolution: {
			passive: "eggnog",
			name: "Winter's Arbalest",
			description: "Three bolts at once, and half of what they hit freezes solid.",
			morph: (numbers) => {
				numbers.pellets = Math.max(3, numbers.pellets);
				numbers.spread = Math.max(0.25, numbers.spread);
				numbers.hit.freeze = Math.max(0.5, numbers.hit.freeze);
			},
		},
		morphs: [
			[
				{
					id: "tripleDraw",
					name: "Triple draw",
					text: "Three bolts at once, in a fan, each a little weaker.",
					morph: (numbers) => {
						numbers.pellets = 3;
						numbers.spread = 0.3;
						numbers.damage *= 0.8;
					},
				},
				{
					id: "longDraw",
					name: "Long draw",
					text: "Hits twice as hard and passes through 4 more, but draws slower.",
					morph: (numbers) => {
						numbers.damage *= 2;
						numbers.pierce += 4;
						numbers.reload *= 1.3;
					},
				},
			],
			[
				{
					id: "frostbite",
					name: "Frostbite",
					text: "A third of what it hits freezes solid.",
					morph: (numbers) => {
						numbers.hit.freeze = 0.33;
					},
				},
				{
					id: "shatterbolt",
					name: "Shatterbolt",
					text: "Bursts into ice at every hit.",
					morph: (numbers) => {
						numbers.hit.burst = { radius: 10, share: 0.4, everyHit: true };
					},
				},
			],
		],
	},
	{
		id: "pistols",
		name: "Jingle pistols",
		description: "A pair of little pistols, rattling off shots as fast as you like, if not so straight.",
		levels: [
			"+2 damage",
			"+10 shots in the magazine",
			"Fires faster",
			"Shots pass through 1 more",
			"+2 damage",
			"+10 shots in the magazine, reloads faster",
			"+3 damage",
		],
		numbers: (level) => ({
			damage: 5 + 2 * past(level, 2, 6) + 3 * past(level, 8),
			magazine: 30 + 10 * past(level, 3, 7),
			interval: level >= 4 ? 0.06 : 0.075,
			reload: level >= 7 ? 0.85 : 1.2,
			endless: false,
			pellets: 1,
			spread: 0,
			jitter: 0.2,
			speed: 260,
			life: 0.55,
			radius: 1,
			pierce: past(level, 5),
			kind: "jingle",
			hit: { ...noHit(), knockback: 1 },
		}),
		evolution: {
			passive: "peppermint",
			name: "Silver Bells",
			description: "Never reloads, and every shot rings on into another enemy.",
			morph: (numbers) => {
				numbers.endless = true;
				numbers.hit.bounce += 1;
			},
		},
		morphs: [
			[
				{
					id: "spray",
					name: "Spray",
					text: "Two shots at a time, a little wilder.",
					morph: (numbers) => {
						numbers.pellets = 2;
						numbers.spread = 0.2;
						numbers.jitter *= 1.3;
					},
				},
				{
					id: "steadyHands",
					name: "Steady hands",
					text: "Dead straight, a third harder, and through 1 more.",
					morph: (numbers) => {
						numbers.jitter = 0;
						numbers.damage *= 1.33;
						numbers.pierce += 1;
					},
				},
			],
			[
				{
					id: "bouncingBells",
					name: "Bouncing bells",
					text: "Every shot bounces on to one more enemy.",
					morph: (numbers) => {
						numbers.hit.bounce = 1;
					},
				},
				{
					id: "tracers",
					name: "Tracers",
					text: "Every shot sets what it hits burning.",
					morph: (numbers) => {
						numbers.hit.burn = 4;
					},
				},
			],
		],
	},
	{
		id: "romanCandle",
		name: "Roman candle",
		description: "Balls of fire, bursting on whatever they hit and setting it burning.",
		levels: [
			"+5 damage",
			"Bigger bursts",
			"+2 balls before reloading",
			"Reloads faster",
			"+5 damage",
			"Bigger bursts",
			"+6 damage",
		],
		numbers: (level) => ({
			damage: 14 + 5 * past(level, 2, 6) + 6 * past(level, 8),
			magazine: 5 + 2 * past(level, 4),
			interval: 0.3,
			reload: level >= 5 ? 1 : 1.3,
			endless: false,
			pellets: 1,
			spread: 0,
			jitter: 0.04,
			speed: 170,
			life: 0.9,
			radius: 2,
			pierce: 0,
			kind: "fireball",
			hit: {
				...noHit(),
				burst: { radius: 14 * (1 + 0.2 * past(level, 3, 7)), share: 0.7, everyHit: false },
				burn: 3,
			},
		}),
		evolution: {
			passive: "candle",
			name: "Bonfire Night",
			description: "Bursts half as wide again, leaving them burning twice as hot.",
			morph: (numbers) => {
				numbers.hit.burst = numbers.hit.burst && { ...numbers.hit.burst, radius: numbers.hit.burst.radius * 1.5 };
				numbers.hit.burn *= 2;
			},
		},
		morphs: [
			[
				{
					id: "starburst",
					name: "Starburst",
					text: "Every burst throws sparks out all round.",
					morph: (numbers) => {
						numbers.hit.sparks = 5;
					},
				},
				{
					id: "seeker",
					name: "Seeker",
					text: "Balls of fire curve toward the nearest enemy.",
					morph: (numbers) => {
						numbers.hit.homing = 4;
					},
				},
			],
			[
				{
					id: "whiteHot",
					name: "White hot",
					text: "Burning hurts twice as much, and bursts are a quarter wider.",
					morph: (numbers) => {
						numbers.hit.burn *= 2;
						numbers.hit.burst = numbers.hit.burst && {
							...numbers.hit.burst,
							radius: numbers.hit.burst.radius * 1.25,
						};
					},
				},
				{
					id: "rapidFire",
					name: "Rapid fire",
					text: "Five more balls before reloading, fired faster, each a little weaker.",
					morph: (numbers) => {
						numbers.magazine += 5;
						numbers.interval *= 0.6;
						numbers.damage *= 0.8;
					},
				},
			],
		],
	},
	{
		id: "snowCannon",
		name: "Snowball cannon",
		description: "Great snowballs rolling through them, knocking them back and slowing them.",
		levels: [
			"+6 damage",
			"Rolls through 2 more",
			"Bigger snowballs",
			"+1 snowball before reloading",
			"+6 damage",
			"Bigger snowballs, reloads faster",
			"+8 damage",
		],
		numbers: (level) => ({
			damage: 18 + 6 * past(level, 2, 6) + 8 * past(level, 8),
			magazine: 3 + past(level, 5),
			interval: 0.45,
			reload: level >= 7 ? 1.1 : 1.5,
			endless: false,
			pellets: 1,
			spread: 0,
			jitter: 0.03,
			speed: 120,
			life: 1.5,
			radius: 3.5 * (1 + 0.25 * past(level, 4, 7)),
			pierce: 5 + 2 * past(level, 3),
			kind: "snowball",
			hit: { ...noHit(), knockback: 6, slow: 0.5 },
		}),
		evolution: {
			passive: "mistletoe",
			name: "Avalanche",
			description: "Twice the size, and half of what it rolls through freezes solid.",
			morph: (numbers) => {
				numbers.radius *= 2;
				numbers.hit.freeze = Math.max(0.5, numbers.hit.freeze);
			},
		},
		morphs: [
			[
				{
					id: "snowmansHead",
					name: "Snowman's head",
					text: "Half as big again, rolling through 4 more; fires slower.",
					morph: (numbers) => {
						numbers.radius *= 1.5;
						numbers.pierce += 4;
						numbers.interval *= 1.3;
					},
				},
				{
					id: "flurry",
					name: "Flurry",
					text: "Three smaller snowballs at once.",
					morph: (numbers) => {
						numbers.pellets = 3;
						numbers.spread = 0.4;
						numbers.radius *= 0.7;
						numbers.damage *= 0.6;
					},
				},
			],
			[
				{
					id: "packedIce",
					name: "Packed ice",
					text: "A third of what it hits freezes solid.",
					morph: (numbers) => {
						numbers.hit.freeze = 0.33;
					},
				},
				{
					id: "snowburst",
					name: "Snowburst",
					text: "Every snowball bursts when it stops rolling.",
					morph: (numbers) => {
						numbers.hit.burst = { radius: 18, share: 0.6, everyHit: false };
					},
				},
			],
		],
	},
];

export const GUN_IDS = GUNS.map((gun) => gun.id);

export function isGun(id: string): id is IGunId {
	return (GUN_IDS as string[]).includes(id);
}

/** The gun the elf carries (there's always one). */
export function gunOf(player: IPlayer): IGunId {
	return player.weapons.find((weapon) => isGun(weapon.id))!.id as IGunId;
}

export function gunInfo(id: IGunId): IGunInfo {
	return GUNS.find((gun) => gun.id === id)!;
}

/** A morph of a gun, by id. */
export function morphInfo(gun: IGunId, id: string): IMorph {
	return gunInfo(gun)
		.morphs.flat()
		.find((morph) => morph.id === id)!;
}

/** The morphs a gun could be offered now: one pair for each tier it's reached without one from it. */
export function morphsOffered(weapon: IWeapon): IMorph[] {
	if (!isGun(weapon.id)) {
		return [];
	}

	return gunInfo(weapon.id).morphs.flatMap((pair, tier) =>
		weapon.level >= MORPH_LEVELS[tier] && !pair.some((morph) => weapon.morphs.includes(morph.id)) ? pair : [],
	);
}

/** A gun's numbers: at its level, morphed by what's been taken, evolved. */
export function gunNumbers(weapon: IWeapon): IGunNumbers {
	const info = gunInfo(weapon.id as IGunId);
	const numbers = info.numbers(weapon.level);

	for (const id of weapon.morphs) {
		morphInfo(info.id, id).morph(numbers);
	}

	if (weapon.evolved) {
		info.evolution.morph(numbers);
	}

	return numbers;
}

/** The gun's turn: reloading when it's empty (or asked to), firing where it's aimed while the trigger's held. */
export function fireGun(
	world: IWorld,
	weapon: IWeapon,
	input: IInput,
	numbers: IStats,
	events: IEvents,
	twice: boolean,
) {
	const { player } = world;
	const gun = gunNumbers(weapon);

	if (weapon.reloadUntil !== null && world.time >= weapon.reloadUntil) {
		weapon.reloadUntil = null;
		weapon.ammo = gun.magazine;
		events.reloaded = true;
	}

	if (
		!gun.endless &&
		weapon.reloadUntil === null &&
		(weapon.ammo <= 0 || (input.reload && weapon.ammo < gun.magazine))
	) {
		weapon.reloadUntil = world.time + gun.reload * numbers.reload;
		events.reloading = true;
	}

	if (!input.firing || !input.aim || weapon.reloadUntil !== null || world.time < weapon.readyAt) {
		return;
	}

	// More of everything fired: an extra pellet in a blast, or an extra stream beside a single shot.
	const pellets = gun.pellets + numbers.projectiles;
	const spread = gun.pellets > 1 ? gun.spread : 0.12 * (pellets - 1);
	const aim = Math.atan2(input.aim.y, input.aim.x);

	for (let volley = 0; volley < (twice ? 2 : 1); volley++) {
		for (let pellet = 0; pellet < pellets; pellet++) {
			const fan = pellets > 1 ? (pellet / (pellets - 1) - 0.5) * spread : 0;
			const angle = aim + fan + (Math.random() - 0.5) * 2 * gun.jitter;
			// A blast's shells fly a little unevenly.
			const speed = gun.speed * (gun.pellets > 1 ? 0.85 + Math.random() * 0.3 : 1);
			world.shots.push({
				x: player.x + Math.cos(angle) * 8,
				y: player.y - 8 + Math.sin(angle) * 8,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				until: world.time + gun.life,
				damage: gun.damage,
				pierce: gun.pierce,
				radius: gun.radius * (gun.kind === "snowball" ? numbers.area : 1),
				weapon: weapon.id,
				hostile: false,
				kind: gun.kind,
				struck: new Set(),
				hit: { ...gun.hit, burst: gun.hit.burst && { ...gun.hit.burst, radius: gun.hit.burst.radius * numbers.area } },
			});
		}
	}

	if (!gun.endless) {
		weapon.ammo -= 1;
	}

	weapon.readyAt = world.time + gun.interval * numbers.cooldown;
	player.lastShotAt = world.time;
	events.shots += 1;
	events.gun = weapon.id as IGunId;
}
