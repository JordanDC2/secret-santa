/**
 * The Elf Fling shop: what coins can buy, what each costs, and what owning it changes in a
 * throw. Levels start at 0 (not bought); an item's last price is its top level.
 */

export type IUpgradeId = "crackers" | "swingStrength" | "elfJump";

/** How many levels of each upgrade the player owns. */
export type IUpgrades = Record<IUpgradeId, number>;

export type IShopItem = {
	id: IUpgradeId;
	name: string;
	description: string;
	/** The price of each level in turn: one price means a single purchase. */
	prices: number[];
};

export const SHOP_ITEMS: IShopItem[] = [
	{
		id: "crackers",
		name: "Christmas crackers",
		description: "Crackers appear in the snow. Land on one and bang! The elf flies off again.",
		prices: [40],
	},
	{
		id: "swingStrength",
		name: "Swing strength",
		description: "The reindeer swings harder, so every hit sends the elf further.",
		prices: [25, 50, 80, 120, 175],
	},
	{
		id: "elfJump",
		name: "Elf jump",
		description: "Once per throw, tap while the elf is flying or sliding to give it a little hop upward.",
		prices: [60],
	},
];

export const NO_UPGRADES: IUpgrades = { crackers: 0, swingStrength: 0, elfJump: 0 };

/** Each level of swing strength adds this much to the launch speed. */
const SWING_BONUS_PER_LEVEL = 0.07;

export function swingMultiplier(upgrades: IUpgrades): number {
	return 1 + SWING_BONUS_PER_LEVEL * upgrades.swingStrength;
}

/** The price of the next level, or null once it's fully upgraded. */
export function nextPrice(item: IShopItem, level: number): number | null {
	return item.prices[level] ?? null;
}
