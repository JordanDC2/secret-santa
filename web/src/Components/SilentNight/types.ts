import type { IStats } from "Components/SilentNight/stats";

/**
 * The shapes of everything in a night of Silent Night. The rules (world.ts and the files it
 * calls on) change these in place each step, for speed with hundreds of enemies about.
 */

export type IVector = { x: number; y: number };

/** The aimed guns (guns.ts), one chosen before the night: "gun" is the candy cane gun. */
export type IGunId = "gun" | "blunderbuss" | "crossbow" | "pistols" | "romanCandle" | "snowCannon";

export type IWeaponId =
	| IGunId
	| "blade"
	| "grenades"
	| "whip"
	| "globes"
	| "bells"
	| "mortar"
	| "cocoa"
	| "minions"
	| "soldiers";

export type IPassiveId =
	| "peppermint"
	| "sleighBells"
	| "tinsel"
	| "eggnog"
	| "woolSocks"
	| "fruitcake"
	| "stocking"
	| "mistletoe"
	| "candle"
	| "advent";

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

export type IPatronId =
	| "laFlor"
	| "lucia"
	| "moroz"
	| "christkind"
	| "yuleLads"
	// The second wave, unlocked in the Coal Cellar.
	| "befana"
	| "yuleGoat"
	| "mariLwyd";

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
	/** A gun's morphs taken (guns.ts), by id. */
	morphs: string[];
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
	/** Rerolls of which patron offers their blessings, at a shrine or asked for help (rerollPatron), from the Coal Cellar. */
	patronRerolls: number;
	/** Christkind's halo: when it's next ready to stop a hit, or null without it. */
	haloReadyAt: number | null;
	/** Christkind's guardian: when it can next save the elf. */
	guardianReadyAt: number;
	/** When the elf last moved, for La Flor's "rooted" healing. */
	stillSince: number;
	/** Slowed (by a caroller's song) until. */
	slowedUntil: number;
	/** Mari Lwyd's chant: when it next rings out. */
	chantAt: number;
	/** Enemies the Yule Goat's charge has already hit this dash. */
	charged: Set<number>;
	/** Christkind's guiding star: when the next certain critical hit is ready. */
	starReadyAt: number;
	/** La Befana's broom: faster until then. */
	hasteUntil: number;
	/** The Yule Goat's iron horns: when they can next butt an enemy back. */
	hornsReadyAt: number;
	/** Mari Lwyd's jaw: when it can next snap. */
	jawAt: number;
	/** La Flor and Ded Moroz's frost flower: when it next blooms. */
	frostFlowerAt: number;
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
	kind:
		| "peppermint"
		| "shard"
		| "ice"
		| "orb"
		| "chain"
		| "pellet"
		| "bolt"
		| "jingle"
		| "fireball"
		| "snowball"
		| "spark"
		| "petal"
		| "star";
	/** Enemies it's already hit (so piercing shots hit each once). */
	struck: Set<number>;
	/** What a gun's shot does to what it hits (guns.ts); other shots just hurt. */
	hit?: IShotHit;
};

/** What a gun's shot does to what it hits, beyond hurting it. */
export type IShotHit = {
	knockback: number;
	/** A burst, `share` of the shot's damage: at every hit, or only where the shot stops. */
	burst: { radius: number; share: number; everyHit: boolean } | null;
	/** Burning (damage a second), slowing (0 to 1), and the chance of freezing solid. */
	burn: number;
	slow: number;
	freeze: number;
	/** How many more enemies it bounces on to, once it would have stopped. */
	bounce: number;
	/** How fast it turns toward the nearest enemy (radians a second). */
	homing: number;
	/** Sparks thrown out all round by each burst. */
	sparks: number;
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
		| "levelUp"
		// La Befana's coal bomb on the snow (data: x, y, damage, gone off, straw-fire), and Mari Lwyd's chant.
		| "coal"
		| "chant"
		// Ded Moroz's frost tracks (data: from x, y to x, y), and La Befana's soot.
		| "tracks"
		| "soot";
	x: number;
	y: number;
	at: number;
	until: number;
	radius: number;
	angle: number;
	/** Extra numbers a kind needs (a sweep's arc, a shell's landing point...). */
	data: number[];
};

export type IPickupKind =
	| "crystal"
	| "bigCrystal"
	| "cocoa"
	| "star"
	| "chest"
	| "gear"
	// What candles leave (candles.ts): coal, by the lump or the sack; a stopped clock; a silver bell.
	| "coal"
	| "coalSack"
	| "clock"
	| "bell";

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

/**
 * A minion of gingerbread, a candle flame, an orbiting snow globe, a toy soldier standing guard,
 * and the patrons' helpers (La Flor's xolo and her poinsettias, Saint Lucia's star boys, Ded
 * Moroz's Snow Maiden, Mari Lwyd's mummers): the elf's allies.
 */
export type IAlly = {
	kind: "minion" | "globe" | "flame" | "soldier" | "xolo" | "poinsettia" | "starBoy" | "maiden" | "mummer";
	x: number;
	y: number;
	angle: number;
	targetId: number | null;
	until: number;
	readyAt: number;
	/** When it last hit each enemy (by id), so it hits each only so often. */
	hits: Map<number, number>;
	/** A toy soldier's last shot, for its flash. */
	shotAt?: number;
	/** La Flor's xolo charging, until then. */
	chargeUntil?: number;
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
	| { kind: "chest"; rewards: IReward[] }
	| { kind: "shrine"; patron: IPatronId; choices: string[] }
	| { kind: "altar"; choices: string[]; gear: IGear | null }
	| { kind: "gear"; gear: IGear };

/** One thing found in a chest: what it is (a weapon's id or a passive's), and what it did. */
export type IReward = { id: IWeaponId | IPassiveId; text: string; evolved: boolean };

/** One choice at a level-up. */
export type IChoice =
	| { kind: "weapon"; id: IWeaponId; level: number }
	| { kind: "morph"; gun: IGunId; id: string }
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
	/** The patrons whose shrines can appear (the second wave once unlocked). */
	patrons: IPatronId[];
	kills: number;
	/** Bosses beaten this night. */
	bosses: number;
	/** Coal picked up this night (banked with what the night earns). */
	coalFound: number;
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
	/** The gun that fired, for its own sound. */
	gun: IGunId | null;
	/** A reload begun. */
	reloading: boolean;
	/** A toy soldier firing. */
	volley: boolean;
	/** The kinds of enemy broken, as bits by their place in ENEMY_KINDS (constants.ts), each its own sound. */
	broken: number;
	froze: boolean;
	ignited: boolean;
	bounced: boolean;
	elite: boolean;
	hits: number;
	kills: number;
	hurt: boolean;
	/** The elf slowed by a caroller's wailing. */
	wailed: boolean;
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
		gun: null,
		reloading: false,
		volley: false,
		broken: 0,
		froze: false,
		ignited: false,
		bounced: false,
		elite: false,
		hits: 0,
		kills: 0,
		hurt: false,
		wailed: false,
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
