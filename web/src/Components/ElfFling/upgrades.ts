/**
 * The Elf Fling shops: what each upgrade costs and what owning it changes in a throw. Levels
 * start at 0 (not bought). Coin levels go when you wrap up Christmas (prestige); gem levels
 * stay. In the gem shop, a few upgrades sell extra levels on top of the coin shop's, the rest
 * sell keeping the coin shop's levels through prestige, and a couple are sold only for gems. The helpers at the bottom turn levels
 * into the numbers the physics uses. The server charges the same prices
 * (api/config/elf_fling.php).
 */

export type IUpgradeId =
	| "swingStrength"
	| "goldenCane"
	| "sledRunners"
	| "springyBoots"
	| "crackers"
	| "paddedSuit"
	| "elfJump"
	| "rocket"
	| "skyOrnaments"
	| "sleigh"
	| "candyMagnet"
	| "luckyStocking";

/** How many levels of each upgrade the player owns. */
export type IUpgrades = Record<IUpgradeId, number>;

export type IShopGroup = "The swing" | "Landings" | "In the air" | "Coins";

export type IShopItem = {
	id: IUpgradeId;
	group: IShopGroup;
	name: string;
	description: string;
	/** The price of each level in turn, in coins: one price means a single purchase. */
	prices: number[];
	/** How the gem shop sells it. */
	gem: IGemOffer;
	/** Shown after the description where there's a keyboard (not on phones). */
	keyboardHint?: string;
};

/**
 * "extra": levels on top of the coin shop's. "keep": the coin shop's own levels, kept when you
 * wrap up Christmas, so there's no buying them again. Either way, gem levels never reset.
 */
export type IGemOffer = {
	kind: "extra" | "keep";
	name: string;
	description: string;
	/** In gems, one per level. */
	prices: number[];
};

/** Keeping needs no description: the gem shop says once what keeping means. */
const keep = (name: string, prices: number[]): IGemOffer => ({
	kind: "keep",
	name: `Keep ${name}`,
	description: "",
	prices,
});

export const SHOP_ITEMS: IShopItem[] = [
	{
		id: "swingStrength",
		group: "The swing",
		name: "Swing strength",
		description: "The reindeer swings harder, so every hit sends the elf further.",
		prices: [25, 50, 80, 120, 175],
		gem: keep("swing strength", [2, 3, 5, 7, 10]),
	},
	{
		id: "goldenCane",
		group: "The swing",
		name: "Golden candy cane",
		description: "A bigger sweet spot: easier to connect, and near misses still fly well.",
		prices: [50, 110],
		gem: keep("the golden candy cane", [2, 5]),
	},
	{
		id: "sledRunners",
		group: "Landings",
		name: "Sled runners",
		description: "Slicker snow under the elf, so slides go much further.",
		prices: [40, 80, 130],
		gem: keep("the sled runners", [2, 4, 7]),
	},
	{
		id: "springyBoots",
		group: "Landings",
		name: "Springy boots",
		description: "Bouncier landings that keep more of the elf's speed.",
		prices: [45, 90, 140],
		gem: {
			kind: "extra",
			name: "Extra springy boots",
			description: "Bouncier landings still.",
			prices: [8],
		},
	},
	{
		id: "crackers",
		group: "Landings",
		name: "Christmas crackers",
		description: "Crackers appear in the snow. Land on one and bang! The elf flies off again.",
		prices: [40],
		gem: keep("Christmas crackers", [3]),
	},
	{
		id: "paddedSuit",
		group: "Landings",
		name: "Padded snowsuit",
		description: "Snowmen stop the elf dead, unless it's padded: then it ploughs on.",
		prices: [90, 260],
		gem: keep("the padded snowsuit", [3, 6]),
	},
	{
		id: "elfJump",
		group: "In the air",
		name: "Elf jump",
		description: "Tap while the elf is flying or sliding to give it a hop upward.",
		prices: [60, 120, 200],
		gem: keep("elf jumps", [2, 4, 7]),
	},
	{
		id: "rocket",
		group: "In the air",
		name: "Firework rocket",
		description: "A rocket button appears while the elf is out on the course: tap it for a fizzing blast forward.",
		keyboardHint: "On a keyboard, R fires it too.",
		prices: [120],
		gem: keep("the firework rocket", [4]),
	},
	{
		id: "skyOrnaments",
		group: "In the air",
		name: "Sky ornaments",
		description:
			"Glass ornaments hang in the sky. Fly into one and it shatters, kicking the elf higher, toward the sky coins.",
		prices: [150],
		gem: keep("sky ornaments", [4]),
	},
	{
		id: "sleigh",
		group: "In the air",
		name: "Sleigh sighting",
		description: "Now and then a sleigh crosses the sky. Catch it and the elf gets a long ride.",
		prices: [250],
		gem: keep("sleigh sightings", [6]),
	},
	{
		id: "candyMagnet",
		group: "Coins",
		name: "Candy magnet",
		description: "Coins drift toward the elf from further away.",
		prices: [35, 75, 130],
		gem: {
			kind: "extra",
			name: "Extra candy magnet",
			description: "Coins drift in from further away still.",
			prices: [6],
		},
	},
	{
		id: "luckyStocking",
		group: "Coins",
		name: "Lucky stocking",
		description: "Every coin you bank is worth more.",
		prices: [100, 220],
		gem: {
			kind: "extra",
			name: "Extra lucky stocking",
			description: "More for every coin you bank.",
			prices: [10],
		},
	},
];

export const SHOP_GROUPS: IShopGroup[] = ["The swing", "Landings", "In the air", "Coins"];

export const NO_UPGRADES: IUpgrades = {
	swingStrength: 0,
	goldenCane: 0,
	sledRunners: 0,
	springyBoots: 0,
	crackers: 0,
	paddedSuit: 0,
	elfJump: 0,
	rocket: 0,
	skyOrnaments: 0,
	sleigh: 0,
	candyMagnet: 0,
	luckyStocking: 0,
};

import type { IPowerUpKind } from "Components/ElfFling/powerUps";

export type IGemOnlyId = "christmasBonus" | "offSeasonTraining" | "polarJetStream" | IPowerUpKind;

/** Gem levels bought, per upgrade (and the gem-only ones): they never reset. */
export type IGemUpgrades = IUpgrades & Record<IGemOnlyId, number>;

/** What a throw uses: the coin and gem levels together, plus the gem-only boosts and power-ups. */
export type IThrowUpgrades = IUpgrades &
	Record<IPowerUpKind, number> & { offSeasonTraining: number; polarJetStream: number };

export const NO_THROW_UPGRADES: IThrowUpgrades = {
	...NO_UPGRADES,
	offSeasonTraining: 0,
	polarJetStream: 0,
	christmasStar: 0,
	gingerbreadMan: 0,
	snowAngelWings: 0,
	giantSnowball: 0,
};

/** Power-ups, sold only for gems: level 1 puts them on the course, levels 2 and 3 make them last longer. */
export const POWER_UP_ITEMS: Array<{ id: IPowerUpKind; name: string; description: string; prices: number[] }> = [
	{
		id: "christmasStar",
		name: "Christmas star",
		description: "Grab a star on the course and nothing slows you down: snowmen go flying and bounces lose no speed.",
		prices: [6, 12, 20],
	},
	{
		id: "gingerbreadMan",
		name: "Gingerbread man",
		description:
			"Catch a gingerbread man on the course and run, run, as fast as you can: a burst of speed, and the air doesn't slow you.",
		prices: [6, 12, 20],
	},
	{
		id: "snowAngelWings",
		name: "Snow angel wings",
		description: "Grab wings on the course and a fall becomes a long, gentle glide.",
		prices: [6, 12, 20],
	},
	{
		id: "giantSnowball",
		name: "Giant snowball",
		description:
			"Grab a snowball on the course and roll up inside it: you grab things from further away, and roll along the snow instead of bouncing. When it wears off, it pops you back up.",
		prices: [6, 12, 20],
	},
];

/** Sold only for gems. */
export const GEM_ONLY_ITEMS: Array<{ id: IGemOnlyId; name: string; description: string; prices: number[] }> = [
	{
		id: "christmasBonus",
		name: "Christmas bonus",
		description: "Santa adds to every coin you bank, more with each level.",
		prices: [10, 25, 50],
	},
	{
		id: "offSeasonTraining",
		name: "Off-season training",
		description: "The reindeer trained hard between Christmases: every hit launches harder.",
		prices: [20],
	},
	{
		id: "polarJetStream",
		name: "Polar jet stream",
		description: "Sweeping along the course: less air drag, so fast flights carry much further.",
		prices: [35],
	},
];

/** An upgrade's top level, counting coin and gem levels together. */
export function maxLevel(item: IShopItem): number {
	return item.prices.length + (item.gem.kind === "extra" ? item.gem.prices.length : 0);
}

/** The coin and gem levels together, as the throw uses them. */
export function combinedUpgrades(upgrades: IUpgrades, gemUpgrades: IGemUpgrades): IThrowUpgrades {
	const combined = {
		...upgrades,
		offSeasonTraining: gemUpgrades.offSeasonTraining,
		polarJetStream: gemUpgrades.polarJetStream,
		christmasStar: gemUpgrades.christmasStar,
		gingerbreadMan: gemUpgrades.gingerbreadMan,
		snowAngelWings: gemUpgrades.snowAngelWings,
		giantSnowball: gemUpgrades.giantSnowball,
	};

	for (const item of SHOP_ITEMS) {
		combined[item.id] = Math.min(maxLevel(item), upgrades[item.id] + gemUpgrades[item.id]);
	}

	return combined;
}

/**
 * The coin price of the next level, or null if there's none to buy (all bought, or kept with
 * gems). Kept levels count as bought, so the next one is priced as the level after them.
 */
export function nextCoinPrice(item: IShopItem, coinLevel: number, gemLevel: number): number | null {
	const level = item.gem.kind === "keep" ? coinLevel + gemLevel : coinLevel;

	return coinLevel + gemLevel >= maxLevel(item) ? null : (item.prices[level] ?? null);
}

/** The gem price of the next gem level, or null once they're all bought. */
export function nextGemPrice(item: IShopItem, gemLevel: number): number | null {
	return item.gem.prices[gemLevel] ?? null;
}

/** The gems prestiging would give for these spare coins: √(coins ÷ 10), rounded down. */
export function prestigeGems(coins: number): number {
	return Math.floor(Math.sqrt(coins / 10));
}

/** Levels up to the coin shop's top level, and those past it (from gem levels on top). */
function split(level: number, ownLevels: number): { own: number; extra: number } {
	return { own: Math.min(level, ownLevels), extra: Math.max(0, level - ownLevels) };
}

/** Launch speed: +7% per level of swing strength, then 30% harder with off-season training. */
export function swingMultiplier(upgrades: IThrowUpgrades): number {
	return (1 + 0.07 * upgrades.swingStrength) * (1 + 0.3 * upgrades.offSeasonTraining);
}

/** How much of the usual air drag the elf feels: half with the polar jet stream. */
export function airDragShare(upgrades: IThrowUpgrades): number {
	return upgrades.polarJetStream > 0 ? 0.5 : 1;
}

/** How far either side of the sweet spot the bat still connects, in metres. */
export function swingReach(upgrades: IUpgrades): number {
	const { own, extra } = split(upgrades.goldenCane, 2);

	return 0.85 + 0.2 * own + 0.1 * extra;
}

/** How quickly a slide slows, in m/s per second. Each level past the third takes a share off. */
export function snowFriction(upgrades: IUpgrades): number {
	const { own, extra } = split(upgrades.sledRunners, 3);

	return 4 * (1 - 0.12 * own) * 0.85 ** extra;
}

/** How much speed a bounce keeps, up and forward (never all of it, so bounces die down). */
export function bounceKeep(upgrades: IUpgrades): { vertical: number; forward: number } {
	const { own, extra } = split(upgrades.springyBoots, 3);

	return { vertical: 0.42 + 0.08 * own + 0.04 * extra, forward: 0.8 + 0.04 * own + 0.015 * extra };
}

/** How much speed the elf keeps after running into a snowman: none, a half, three quarters. */
export function snowmanKeep(upgrades: IUpgrades): number {
	return [0, 0.5, 0.75][upgrades.paddedSuit] ?? 0.75;
}

/** How far away coins start drifting toward the elf, in metres. */
export function magnetRadius(upgrades: IUpgrades): number {
	return 1 + 0.5 * upgrades.candyMagnet;
}

/** What each banked coin is worth. */
export function coinMultiplier(upgrades: IUpgrades): number {
	return 1 + 0.25 * upgrades.luckyStocking;
}
