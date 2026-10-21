/**
 * Krampus's bargains: a real gift with a real price. Taken at his altars, kept all night, and
 * at dawn he comes for the elf himself, stronger for every one taken (enemies.ts). The gifts and
 * prices themselves are worked into stats.ts and combat.ts.
 */

export type IBargain = { id: string; name: string; gift: string; price: string };

export const BARGAINS: IBargain[] = [
	{
		id: "chains",
		name: "Chains of the Collector",
		gift: "Your hits leap on to two more enemies",
		price: "Nothing heals you",
	},
	{ id: "birchRod", name: "The Birch Rod", gift: "Double damage", price: "You take double damage" },
	{ id: "sack", name: "The Sack", gift: "50% more experience", price: "Twice as many enemies" },
	{ id: "naughtyList", name: "The Naughty List", gift: "+25% chance of critical hits", price: "30% less health" },
	{ id: "krampusBell", name: "Krampus's Bell", gift: "Dash twice as often", price: "Your light shrinks by a third" },
];

export function bargainInfo(id: string): IBargain {
	return BARGAINS.find((bargain) => bargain.id === id)!;
}

/** What Krampus says at his altar. */
export const KRAMPUS_LINE = "Every gift has its price, little one. I'll collect at dawn.";
