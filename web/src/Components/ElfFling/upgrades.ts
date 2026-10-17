/**
 * The Elf Fling shop: what coins can buy, what each costs, and what owning it changes in a
 * throw. Levels start at 0 (not bought); an item's last price is its top level. The helpers
 * at the bottom turn levels into the numbers the physics uses.
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
	/** The price of each level in turn: one price means a single purchase. */
	prices: number[];
};

export const SHOP_ITEMS: IShopItem[] = [
	{
		id: "swingStrength",
		group: "The swing",
		name: "Swing strength",
		description: "The reindeer swings harder, so every hit sends the elf further.",
		prices: [25, 50, 80, 120, 175],
	},
	{
		id: "goldenCane",
		group: "The swing",
		name: "Golden candy cane",
		description: "A bigger sweet spot: easier to connect, and near misses still fly well.",
		prices: [50, 110],
	},
	{
		id: "sledRunners",
		group: "Landings",
		name: "Sled runners",
		description: "Slicker snow under the elf, so slides go much further.",
		prices: [40, 80, 130],
	},
	{
		id: "springyBoots",
		group: "Landings",
		name: "Springy boots",
		description: "Bouncier landings that keep more of the elf's speed.",
		prices: [45, 90, 140],
	},
	{
		id: "crackers",
		group: "Landings",
		name: "Christmas crackers",
		description: "Crackers appear in the snow. Land on one and bang! The elf flies off again.",
		prices: [40],
	},
	{
		id: "paddedSuit",
		group: "Landings",
		name: "Padded snowsuit",
		description:
			"Snowmen stop the elf dead. Padded, it keeps half its speed and ploughs on; extra padded, three quarters.",
		prices: [90, 260],
	},
	{
		id: "elfJump",
		group: "In the air",
		name: "Elf jump",
		description: "Tap while the elf is flying or sliding to give it a hop upward. One jump per level, each throw.",
		prices: [60, 120, 200],
	},
	{
		id: "rocket",
		group: "In the air",
		name: "Firework rocket",
		description: "Once per throw, press the rocket button (or R) for a fizzing blast forward.",
		prices: [120],
	},
	{
		id: "skyOrnaments",
		group: "In the air",
		name: "Sky ornaments",
		description:
			"Glass ornaments hang in the sky. Fly into one and it shatters, kicking the elf higher, toward the sky coins.",
		prices: [150],
	},
	{
		id: "sleigh",
		group: "In the air",
		name: "Sleigh sighting",
		description: "Now and then a sleigh crosses the sky. Catch it and the elf gets a long ride.",
		prices: [250],
	},
	{
		id: "candyMagnet",
		group: "Coins",
		name: "Candy magnet",
		description: "Coins drift toward the elf from further away.",
		prices: [35, 75, 130],
	},
	{
		id: "luckyStocking",
		group: "Coins",
		name: "Lucky stocking",
		description: "Every coin you bank is worth more: a quarter extra per level.",
		prices: [100, 220],
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

/** The price of the next level, or null once it's fully upgraded. */
export function nextPrice(item: IShopItem, level: number): number | null {
	return item.prices[level] ?? null;
}

/** Launch speed: +7% per level of swing strength. */
export function swingMultiplier(upgrades: IUpgrades): number {
	return 1 + 0.07 * upgrades.swingStrength;
}

/** How far either side of the sweet spot the bat still connects, in metres. */
export function swingReach(upgrades: IUpgrades): number {
	return 0.85 + 0.2 * upgrades.goldenCane;
}

/** How quickly a slide slows, in m/s per second. */
export function snowFriction(upgrades: IUpgrades): number {
	return 4 * (1 - 0.12 * upgrades.sledRunners);
}

/** How much speed a bounce keeps, up and forward. */
export function bounceKeep(upgrades: IUpgrades): { vertical: number; forward: number } {
	return { vertical: 0.42 + 0.08 * upgrades.springyBoots, forward: 0.8 + 0.04 * upgrades.springyBoots };
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
