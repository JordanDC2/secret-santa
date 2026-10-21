/**
 * Gear, as in Death Must Die: elites and bosses drop a piece for one of five slots (hat, scarf,
 * mittens, boots and a charm), kept for the night. Plain pieces add one bonus, festive two,
 * gilded three and a special effect; cursed pieces, only ever on Krampus's altars, add two strong
 * bonuses with a price. The bonuses are worked into stats.ts.
 */

import type { IGear, IGearSlot, IGearSpecial, IGearStat, IPlayer, IRarity } from "Components/SilentNight/types";

export const GEAR_SLOTS: IGearSlot[] = ["hat", "scarf", "mittens", "boots", "charm"];

/** Which bonuses each slot can have. */
const SLOT_STATS: Record<IGearSlot, IGearStat[]> = {
	hat: ["light", "maxHealth", "experience", "luck"],
	scarf: ["armour", "regen", "maxHealth", "cooldown"],
	mittens: ["damage", "crit", "area", "cooldown"],
	boots: ["speed", "reach", "armour", "regen"],
	charm: ["luck", "crit", "experience", "light", "reach"],
};

const ITEM_NAMES: Record<IGearSlot, string[]> = {
	hat: ["bobble hat", "knitted hood", "fur cap"],
	scarf: ["striped scarf", "woollen scarf", "muffler"],
	mittens: ["mittens", "wool gloves", "fingerless gloves"],
	boots: ["snow boots", "felt boots", "sealskin boots"],
	charm: ["silver bell", "glass bauble", "holly sprig", "tin star"],
};

/** Each bonus at plain, festive and gilded strength (cursed pieces get half as much again as gilded). */
const AMOUNTS: Record<IGearStat, [number, number, number]> = {
	maxHealth: [8, 10, 15],
	damage: [0.03, 0.05, 0.08],
	area: [0.03, 0.05, 0.08],
	cooldown: [-0.02, -0.03, -0.05],
	speed: [0.03, 0.04, 0.06],
	reach: [0.1, 0.15, 0.25],
	luck: [0.05, 0.08, 0.1],
	light: [0.05, 0.08, 0.1],
	regen: [0.1, 0.2, 0.3],
	armour: [0.02, 0.03, 0.05],
	crit: [0.02, 0.03, 0.05],
	experience: [0.03, 0.05, 0.08],
	vulnerability: [0, 0, 0],
	healing: [0, 0, 0],
};

/** The prices a cursed piece can carry. */
const CURSES: Array<{ stat: IGearStat; amount: number }> = [
	{ stat: "maxHealth", amount: -20 },
	{ stat: "speed", amount: -0.08 },
	{ stat: "light", amount: -0.15 },
	{ stat: "vulnerability", amount: 0.25 },
	{ stat: "healing", amount: -0.5 },
];

/** What each curse undoes, so a cursed piece never has both (two bonuses rule out at most two of the five). */
const CONTRADICTS: Partial<Record<IGearStat, IGearStat>> = {
	maxHealth: "maxHealth",
	speed: "speed",
	light: "light",
	vulnerability: "armour",
	healing: "regen",
};

const SPECIALS: IGearSpecial[] = ["twinStitched", "mended", "fleetFooted", "warmHearted"];

export const SPECIAL_TEXT: Record<IGearSpecial, string> = {
	twinStitched: "One more of everything you throw or fire",
	mended: "Heal half a point a second",
	fleetFooted: "Dash a quarter more often",
	warmHearted: "Healing heals 50% more",
};

export const RARITY_COLOURS: Record<IRarity, string> = {
	plain: "#c4bab6",
	festive: "#6fbf73",
	gilded: "#ffd060",
	cursed: "#e04050",
};

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** A new piece: a random slot (or `slot`), of a rarity rolled by luck (a boss's are finer). */
export function newGear(luck: number, boss: boolean, cursed = false, slot: IGearSlot = pick(GEAR_SLOTS)): IGear {
	const roll = Math.random() / luck;
	const rarity: IRarity = cursed
		? "cursed"
		: roll < (boss ? 0.4 : 0.08)
			? "gilded"
			: roll < (boss ? 1 : 0.4)
				? "festive"
				: "plain";
	const count = { plain: 1, festive: 2, gilded: 3, cursed: 2 }[rarity];
	const strength = { plain: 0, festive: 1, gilded: 2, cursed: 2 }[rarity];
	const stats = [...SLOT_STATS[slot]];
	const bonuses: IGear["bonuses"] = [];

	for (let i = 0; i < count; i++) {
		const stat = stats.splice(Math.floor(Math.random() * stats.length), 1)[0];
		bonuses.push({ stat, amount: AMOUNTS[stat][strength] * (rarity === "cursed" ? 1.5 : 1) });
	}

	const adjective = { plain: "", festive: "Festive ", gilded: "Gilded ", cursed: "Cursed " }[rarity];
	const item = pick(ITEM_NAMES[slot]);

	return {
		slot,
		rarity,
		name: adjective ? `${adjective}${item}` : item.charAt(0).toUpperCase() + item.slice(1),
		bonuses,
		special: rarity === "gilded" ? pick(SPECIALS) : null,
		// A curse on nothing the piece also helps with (never "+15 health" and "−20 health").
		curse:
			rarity === "cursed"
				? pick(CURSES.filter((curse) => !bonuses.some((bonus) => CONTRADICTS[curse.stat] === bonus.stat)))
				: null,
	};
}

/** The sum of a stat's bonuses (and curses) over everything the elf wears. */
export function gearTotal(player: IPlayer, stat: IGearStat): number {
	let total = 0;

	for (const piece of Object.values(player.gear)) {
		for (const bonus of piece.bonuses) {
			total += bonus.stat === stat ? bonus.amount : 0;
		}

		total += piece.curse?.stat === stat ? piece.curse.amount : 0;
	}

	return total;
}

export function wearing(player: IPlayer, special: IGearSpecial): boolean {
	return Object.values(player.gear).some((piece) => piece.special === special);
}

/** A bonus as words: "+15 health", "+8% damage", "Everything 5% sooner". */
export function bonusText({ stat, amount }: { stat: IGearStat; amount: number }): string {
	const percent = `${amount > 0 ? "+" : "−"}${Math.round(Math.abs(amount) * 100)}%`;

	switch (stat) {
		case "maxHealth":
			return `${amount > 0 ? "+" : "−"}${Math.abs(amount)} health`;
		case "regen":
			return `Heal ${amount.toFixed(2).replace(/0$/, "")} a second`;
		case "cooldown":
			return `Everything ${Math.round(-amount * 100)}% sooner`;
		case "armour":
			return `Take ${Math.round(amount * 100)}% less damage`;
		case "vulnerability":
			return `Take ${Math.round(amount * 100)}% more damage`;
		case "crit":
			return `${percent} chance of critical hits`;
		case "reach":
			return `${percent} pickup reach`;
		case "experience":
			return `${percent} experience`;
		case "healing":
			return `${percent} healing`;
		default:
			return `${percent} ${stat}`;
	}
}

/** Everything a piece does, as lines of words. */
export function gearLines(gear: IGear): Array<{ text: string; bad: boolean }> {
	return [
		...gear.bonuses.map((bonus) => ({ text: bonusText(bonus), bad: false })),
		...(gear.special ? [{ text: SPECIAL_TEXT[gear.special], bad: false }] : []),
		...(gear.curse ? [{ text: bonusText(gear.curse), bad: true }] : []),
	];
}

/** Puts a piece on, in place of whatever was in its slot. */
export function wear(player: IPlayer, gear: IGear) {
	player.gear[gear.slot] = gear;
}
