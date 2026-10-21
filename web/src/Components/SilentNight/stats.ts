/**
 * The elf's numbers, worked out from everything it's picked up: passives from level-ups, the
 * patrons' blessings (patrons.ts), Krampus's bargains (bargains.ts) and gear (gear.ts); and
 * from who's playing (cast.ts) and the Coal Cellar. Everything that asks
 * "how fast", "how hard" or "how far" asks here.
 */

import { gearTotal, wearing } from "Components/SilentNight/gear";
import type { IGearStat, IPassiveId, IPlayer } from "Components/SilentNight/types";

export type IPassive = { id: IPassiveId; name: string; description: string; maxLevel: number; effect: string };

/** The passives, in the order they're shown. Each pairs with a weapon for its evolution (weapons.ts). */
export const PASSIVES: IPassive[] = [
	{
		id: "peppermint",
		name: "Peppermint",
		description: "Everything hits harder.",
		maxLevel: 5,
		effect: "+10% damage a level",
	},
	{
		id: "sleighBells",
		name: "Sleigh bells",
		description: "One more of everything you throw or fire.",
		maxLevel: 2,
		effect: "+1 projectile a level",
	},
	{
		id: "tinsel",
		name: "Tinsel",
		description: "Everything reaches further.",
		maxLevel: 5,
		effect: "+10% area a level",
	},
	{
		id: "eggnog",
		name: "Eggnog",
		description: "Everything comes round sooner.",
		maxLevel: 5,
		effect: "−8% cooldown a level",
	},
	{
		id: "woolSocks",
		name: "Wool socks",
		description: "Quicker on your feet.",
		maxLevel: 5,
		effect: "+10% speed a level",
	},
	{
		id: "fruitcake",
		name: "Fruitcake",
		description: "Dense enough to keep you going.",
		maxLevel: 5,
		effect: "+20 health a level",
	},
	{
		id: "stocking",
		name: "Stocking",
		description: "Pick things up from further away.",
		maxLevel: 5,
		effect: "+25% reach a level",
	},
	{
		id: "mistletoe",
		name: "Mistletoe",
		description: "Luck: more critical hits, better treasure.",
		maxLevel: 5,
		effect: "+10% luck a level",
	},
	{
		id: "candle",
		name: "Candle",
		description: "A wider ring of light in the dark.",
		maxLevel: 5,
		effect: "+12% light a level",
	},
];

export type IStats = {
	maxHealth: number;
	speed: number;
	damage: number;
	area: number;
	cooldown: number;
	projectiles: number;
	/** How close pickups have to be to be drawn in, in pixels. */
	reach: number;
	luck: number;
	light: number;
	regen: number;
	/** Damage taken is cut by this share. */
	armour: number;
	/** Damage taken is multiplied by this. */
	vulnerability: number;
	crit: number;
	experience: number;
	healing: number;
	dashCooldown: number;
	/** How long the gun takes to reload (the elf's quick hands). */
	reload: number;
	/** How much cocoa heals (Mrs. Claus's home cooking). */
	cocoa: number;
};

const BASE_HEALTH = 100;
const BASE_REACH = 28;

/** A passive's level, a blessing's rank or (1 or 0) a bargain, on the elf. */
export function level(player: IPlayer, id: IPassiveId): number {
	return player.passives[id] ?? 0;
}

export function rank(player: IPlayer, id: string): number {
	return player.blessings[id] ?? 0;
}

export function bargain(player: IPlayer, id: string): boolean {
	return player.bargains.includes(id);
}

/** Three ranks of a blessing's number. */
export const byRank = (player: IPlayer, id: string, values: [number, number, number]) =>
	rank(player, id) === 0 ? 0 : values[rank(player, id) - 1];

export function stats(player: IPlayer): IStats {
	const { character } = player;
	const cellar = (id: string) => player.cellar[id] ?? 0;
	const gear = (stat: IGearStat) => gearTotal(player, stat);
	const maxHealth =
		(BASE_HEALTH +
			20 * level(player, "fruitcake") +
			byRank(player, "rooted", [10, 20, 30]) +
			10 * cellar("wool") +
			(character === "santa" ? 30 : 0) +
			gear("maxHealth")) *
		(bargain(player, "naughtyList") ? 0.7 : 1);
	const luck = 1 + 0.1 * level(player, "mistletoe") + gear("luck");

	return {
		maxHealth: Math.max(10, maxHealth),
		speed:
			(1 + 0.1 * level(player, "woolSocks") + 0.04 * cellar("boots") + gear("speed")) *
			(character === "reindeer" ? 1.12 : 1),
		damage:
			(1 + 0.1 * level(player, "peppermint") + 0.05 * cellar("canes") + gear("damage")) *
			(bargain(player, "birchRod") ? 2 : 1),
		area: 1 + 0.1 * level(player, "tinsel") + gear("area"),
		cooldown: Math.max(0.4, 1 - 0.08 * level(player, "eggnog") + gear("cooldown")),
		projectiles: level(player, "sleighBells") + (wearing(player, "twinStitched") ? 1 : 0),
		reach: BASE_REACH * (1 + 0.25 * level(player, "stocking") + gear("reach")),
		luck,
		light: Math.max(
			0.5,
			1 +
				0.12 * level(player, "candle") +
				0.2 * rank(player, "crownOfCandles") -
				(bargain(player, "krampusBell") ? 0.3 : 0) +
				gear("light"),
		),
		regen: byRank(player, "grace", [0.6, 1.2, 1.8]) + gear("regen") + (wearing(player, "mended") ? 0.5 : 0),
		armour: Math.min(0.6, byRank(player, "frostArmour", [0.08, 0.14, 0.2]) + gear("armour")),
		vulnerability: (bargain(player, "birchRod") ? 2 : 1) * (1 + gear("vulnerability")),
		crit:
			0.05 * luck +
			byRank(player, "windowPeeper", [0.08, 0.14, 0.2]) +
			(bargain(player, "naughtyList") ? 0.25 : 0) +
			gear("crit"),
		experience: (1 + 0.25 * rank(player, "smallThings") + gear("experience")) * (bargain(player, "sack") ? 1.5 : 1),
		healing: bargain(player, "chains")
			? 0
			: (1 + 0.5 * rank(player, "gentleHands") + (wearing(player, "warmHearted") ? 0.5 : 0)) * (1 + gear("healing")),
		dashCooldown:
			(bargain(player, "krampusBell") ? 0.5 : 1) *
			(wearing(player, "fleetFooted") ? 0.75 : 1) *
			(character === "reindeer" ? 0.8 : 1),
		reload: character === "elf" ? 0.7 : 1,
		cocoa: character === "mrsClaus" ? 1.5 : 1,
	};
}
