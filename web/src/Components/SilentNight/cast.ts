/**
 * Who can play Silent Night, and the Coal Cellar. The cast are Elf Fling's five: each carries
 * the gun chosen before the night (guns.ts), all but the elf start with a weapon of their own as
 * well, and each has a perk (worked into stats.ts, weapons.ts and enemies.ts).
 * The elf is free; the rest are unlocked with coal, which every night earns (the server works
 * out how much: api/config/silent_night.php, whose prices these must match). The Cellar's
 * upgrades last from night to night, and it unlocks the second wave of patrons.
 */

import type { ICastId, IPatronId, IWeaponId } from "Components/SilentNight/types";

export type ICastMember = {
	id: ICastId;
	name: string;
	/** The weapon they start with beside the gun, if any. */
	weapon: IWeaponId | null;
	perk: string;
	perkText: string;
	/** Coal to unlock (0: free). */
	price: number;
};

export const CAST: ICastMember[] = [
	{
		id: "elf",
		name: "The elf",
		weapon: null,
		perk: "Quick hands",
		perkText: "Reloads 30% faster",
		price: 0,
	},
	{ id: "santa", name: "Santa", weapon: "blade", perk: "Well fed", perkText: "+30 health", price: 150 },
	{
		id: "mrsClaus",
		name: "Mrs. Claus",
		weapon: "cocoa",
		perk: "Home cooking",
		perkText: "Cocoa heals 50% more",
		price: 150,
	},
	{
		id: "snowman",
		name: "The snowman",
		weapon: "globes",
		perk: "Cold to the touch",
		perkText: "Enemies that hit him are slowed",
		price: 250,
	},
	{
		id: "reindeer",
		name: "The reindeer",
		weapon: "bells",
		perk: "Fleet",
		perkText: "Moves 12% faster and dashes more often",
		price: 350,
	},
];

export function castMember(id: ICastId): ICastMember {
	return CAST.find((member) => member.id === id)!;
}

/** The second wave of patrons, and the coal to unlock each. */
export const SECOND_WAVE: Array<{ id: IPatronId; price: number }> = [
	{ id: "befana", price: 200 },
	{ id: "yuleGoat", price: 200 },
	{ id: "mariLwyd", price: 200 },
];

export type ICellarUpgrade = { id: string; name: string; effect: string; prices: number[] };

export const CELLAR: ICellarUpgrade[] = [
	{ id: "wool", name: "Thicker wool", effect: "+10 health a level", prices: [30, 60, 100, 150, 220] },
	{ id: "canes", name: "Sharper canes", effect: "+5% damage a level", prices: [40, 80, 130, 200, 300] },
	{ id: "boots", name: "Warmer boots", effect: "+4% speed a level", prices: [40, 90, 160] },
	{ id: "dice", name: "Second thoughts", effect: "+1 reroll at level-ups a level", prices: [50, 120, 220] },
	{ id: "fire", name: "Into the fire", effect: "+1 banish at level-ups a level", prices: [50, 120, 220] },
	{
		id: "prayers",
		name: "Louder prayers",
		effect: "+1 reroll a night of which patron offers blessings a level",
		prices: [50, 120],
	},
];
