import type { IStats } from "Components/SilentNight/stats";

/**
 * The shapes of everything in a night of Silent Night. The rules (world.ts and the files it
 * calls on) change these in place each step, for speed with hundreds of enemies about.
 */

export type IVector = { x: number; y: number };

export type IWeaponId = "gun" | "blade" | "grenades" | "whip" | "globes" | "bells" | "mortar" | "cocoa" | "minions";

export type IPassiveId =
	| "peppermint"
	| "sleighBells"
	| "tinsel"
	| "eggnog"
	| "woolSocks"
	| "fruitcake"
	| "stocking"
	| "mistletoe"
	| "candle";

export type IEnemyKind =
	| "gingerbread"
	| "windup"
	| "golem"
	| "caroller"
	| "angel"
	| "imp"
	| "rat"
	| "mouseKing"
	| "ghost"
	| "yuleCat"
	| "krampus";

export type IPatronId = "laFlor" | "lucia" | "moroz" | "christkind" | "yuleLads";

/** Who's playing: the cast of Elf Fling (cast.ts). */
export type ICastId = "elf" | "santa" | "mrsClaus" | "snowman" | "reindeer";

/** Gear (gear.ts): one piece in each slot, of a rarity, each adding to the elf's numbers. */
export type IGearSlot = "hat" | "scarf" | "mittens" | "boots" | "charm";
export type IRarity = "plain" | "festive" | "gilded" | "cursed";
export type IGearStat =
	| "maxHealth"
	| "damage"
	| "area"
	| "cooldown"
	| "speed"
	| "reach"
	| "luck"
	| "light"
	| "regen"
	| "armour"
	| "crit"
	| "experience"
	| "vulnerability"
	| "healing";
export type IGearSpecial = "twinStitched" | "mended" | "fleetFooted" | "warmHearted";

export type IGear = {
	slot: IGearSlot;
	rarity: IRarity;
	name: string;
	bonuses: Array<{ stat: IGearStat; amount: number }>;
	/** A gilded piece's special effect. */
	special: IGearSpecial | null;
	/** A cursed piece's price. */
	curse: { stat: IGearStat; amount: number } | null;
};

/** A weapon the elf carries: its level (1 to 8), whether it's evolved, and its own timers. */
export type IWeapon = {
	id: IWeaponId;
	level: number;
	evolved: boolean;
	/** When it next fires (or, for the gun, can fire). */
	readyAt: number;
	/** The gun's magazine and reload. */
	ammo: number;
	reloadUntil: number | null;
	/** Damage it's done this night, for the summary. */
	damage: number;
};

export type IPlayer = {
	character: ICastId;
	/** The Coal Cellar's upgrades bought, by id, at their level. */
	cellar: Record<string, number>;
	gear: Partial<Record<IGearSlot, IGear>>;
	x: number;
	y: number;
	health: number;
	facing: 1 | -1;
	aim: IVector | null;
	moving: boolean;
	/** The way it last moved (or faced), for the blade and the dash. */
	heading: IVector;
	dashUntil: number;
	dashReadyAt: number;
	dash: IVector;
	hurtUntil: number;
	/** When the gun last fired, for the muzzle flash. */
	lastShotAt: number;
	level: number;
	experience: number;
	weapons: IWeapon[];
	passives: Partial<Record<IPassiveId, number>>;
	/** The patrons' blessings, by id, at their rank. */
	blessings: Record<string, number>;
	/** Krampus's bargains taken. */
	bargains: string[];
	rerolls: number;
	banishes: number;
	banished: string[];
	/** Christkind's halo: when it's next ready to stop a hit, or null without it. */
	haloReadyAt: number | null;
	/** Christkind's guardian: when it can next save the elf. */
	guardianReadyAt: number;
	/** When the elf last moved, for La Flor's "rooted" healing. */
	stillSince: number;
	/** Slowed (by a caroller's song) until. */
	slowedUntil: number;
};

export type IEnemy = {
	id: number;
	kind: IEnemyKind;
	x: number;
	y: number;
	health: number;
	maxHealth: number;
	speed: number;
	damage: number;
	radius: number;
	facing: 1 | -1;
	hitAt: number;
	stride: number;
	/** An elite: bigger and tougher, and it drops treasure. */
	elite: boolean;
	boss: boolean;
	/** Knocked back, still moving that way. */
	push: IVector;
	/** Slowed until, and by how much (0 to 1). */
	slowUntil: number;
	slow: number;
	frozenUntil: number;
	burnUntil: number;
	burnDamage: number;
	/** When burning next hurts it. */
	burnTickAt: number;
	stunUntil: number;
	/** Its own clock for whatever it does (shooting, charging, teleporting). */
	actAt: number;
	/** What a boss is in the middle of, and where it's going. */
	action: string | null;
	target: IVector | null;
	/** How much experience it drops. */
	experience: number;
};

/** A shot in flight (the elf's, a firework shell, a porcelain shard thrown at the elf). */
export type IShot = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	until: number;
	damage: number;
	/** How many more enemies it can pass through. */
	pierce: number;
	radius: number;
	weapon: IWeaponId | null;
	/** Fired at the elf, by an enemy. */
	hostile: boolean;
	kind: "peppermint" | "shard" | "ice" | "orb" | "chain";
	/** Enemies it's already hit (so piercing shots hit each once). */
	struck: Set<number>;
};

/** Something happening for a moment: a sweep of the blade, a blast, a lash of tinsel... */
export type IEffect = {
	kind:
		| "sweep"
		| "blast"
		| "lash"
		| "ring"
		| "shell"
		| "steam"
		| "frost"
		| "crumbs"
		| "shards"
		| "slam"
		| "chains"
		| "pounce"
		| "heal"
		| "levelUp";
	x: number;
	y: number;
	at: number;
	until: number;
	radius: number;
	angle: number;
	/** Extra numbers a kind needs (a sweep's arc, a shell's landing point...). */
	data: number[];
};

export type IPickupKind = "crystal" | "bigCrystal" | "cocoa" | "star" | "chest" | "gear";

export type IPickup = {
	id: number;
	kind: IPickupKind;
	x: number;
	y: number;
	value: number;
	/** Being pulled in by the elf's reach. */
	pulled: boolean;
	at: number;
	/** The piece, if it's gear. */
	gear?: IGear;
};

/** A minion of gingerbread, or a candle flame, or an orbiting snow globe: things that move with the elf. */
export type IAlly = {
	kind: "minion" | "globe" | "flame";
	x: number;
	y: number;
	angle: number;
	targetId: number | null;
	until: number;
	readyAt: number;
	/** When it last hit each enemy (by id), so it hits each only so often. */
	hits: Map<number, number>;
};

/** A patron's shrine, or Krampus's altar, out in the dark. */
export type IShrine = {
	kind: "shrine" | "altar";
	patron: IPatronId | null;
	x: number;
	y: number;
	until: number;
};

/** What the night's waiting on the player for: a level-up choice, a chest, a shrine, an altar. */
export type IPrompt =
	| { kind: "levelUp"; choices: IChoice[] }
	| { kind: "chest"; rewards: string[] }
	| { kind: "shrine"; patron: IPatronId; choices: string[] }
	| { kind: "altar"; choices: string[]; gear: IGear | null }
	| { kind: "gear"; gear: IGear };

/** One choice at a level-up. */
export type IChoice =
	| { kind: "weapon"; id: IWeaponId; level: number }
	| { kind: "passive"; id: IPassiveId; level: number }
	| { kind: "fruitcake" };

export type IWorld = {
	time: number;
	/** The elf's numbers (stats.ts), worked out once a step. */
	numbers: IStats;
	player: IPlayer;
	enemies: IEnemy[];
	shots: IShot[];
	effects: IEffect[];
	pickups: IPickup[];
	allies: IAlly[];
	shrines: IShrine[];
	kills: number;
	/** Bosses beaten this night. */
	bosses: number;
	spawnOwed: number;
	nextId: number;
	/** Level-ups owed but not yet chosen (they queue if several come at once). */
	levelUpsOwed: number;
	prompt: IPrompt | null;
	/** The night's scheduled moments already done (bosses, shrines, altars, elites), by name. */
	done: Set<string>;
	/** Krampus has come: the clock stops at dawn and the night's won when he falls. */
	dawn: boolean;
	over: boolean;
	won: boolean;
};

/** What the player's doing this moment. */
export type IInput = {
	move: IVector;
	aim: IVector | null;
	firing: boolean;
	dash: boolean;
	reload: boolean;
};

/** What happened in a step, for the sounds. */
export type IEvents = {
	shots: number;
	hits: number;
	kills: number;
	hurt: boolean;
	dashed: boolean;
	reloaded: boolean;
	pickups: number;
	levelUp: boolean;
	blasts: number;
	boss: IEnemyKind | null;
	shrine: boolean;
	chest: boolean;
	healed: boolean;
	won: boolean;
};

export function noEvents(): IEvents {
	return {
		shots: 0,
		hits: 0,
		kills: 0,
		hurt: false,
		dashed: false,
		reloaded: false,
		pickups: 0,
		levelUp: false,
		blasts: 0,
		boss: null,
		shrine: false,
		chest: false,
		healed: false,
		won: false,
	};
}
