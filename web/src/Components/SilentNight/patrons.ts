/**
 * The patrons of Silent Night, from Christmases around the world, and their blessings (the
 * first wave of the design doc's eight). Every couple of minutes a shrine appears out in the
 * dark; reach it and its patron offers three of their blessings. Blessings rank up to three
 * times, and two from different patrons can combine into a duo blessing. Krampus's altars appear
 * too, offering his bargains (bargains.ts). The blessings' effects are worked into stats.ts,
 * combat.ts and weapons.ts by id.
 */

import { BARGAINS } from "Components/SilentNight/bargains";
import { lowestWeapon } from "Components/SilentNight/combat";
import { newGear, wear } from "Components/SilentNight/gear";
import { MAX_WEAPON_LEVEL } from "Components/SilentNight/constants";
import { nextLevelUp } from "Components/SilentNight/levelUp";
import { rank, stats } from "Components/SilentNight/stats";
import type { IEvents, IPatronId, IWorld } from "Components/SilentNight/types";

export type IPatron = { id: IPatronId; name: string; from: string; line: string; colour: string };

export const PATRONS: Record<IPatronId, IPatron> = {
	laFlor: {
		id: "laFlor",
		name: "La Flor de Nochebuena",
		from: "Mexico",
		line: "Even the humblest gift can bloom.",
		colour: "#e4505a",
	},
	lucia: {
		id: "lucia",
		name: "Saint Lucia",
		from: "Sweden",
		line: "I carry the light through the longest night.",
		colour: "#f0b44c",
	},
	moroz: { id: "moroz", name: "Ded Moroz", from: "Russia", line: "The cold keeps what it catches.", colour: "#8fc3d9" },
	christkind: {
		id: "christkind",
		name: "Christkind",
		from: "Germany and Austria",
		line: "No harm shall find you that I can turn aside.",
		colour: "#c9b2f2",
	},
	yuleLads: {
		id: "yuleLads",
		name: "The Yule Lads",
		from: "Iceland",
		line: "Thirteen of us, and every one a thief. Fancy a trick?",
		colour: "#9ad07a",
	},
};

export type IBlessing = {
	id: string;
	/** Whose it is, or both patrons' for a duo blessing. */
	patron: IPatronId | [IPatronId, IPatronId];
	name: string;
	/** What each rank does (one entry for a blessing taken once). */
	ranks: string[];
	/** For a duo: one blessing needed from each patron first. */
	needs?: [IPatronId, IPatronId];
};

export const BLESSINGS: IBlessing[] = [
	// La Flor: small things grow great.
	{
		id: "humbleBeginnings",
		patron: "laFlor",
		name: "Humble Beginnings",
		ranks: ["Your lowest-level weapon hits 30% harder", "60% harder", "90% harder"],
	},
	{
		id: "petalFall",
		patron: "laFlor",
		name: "Petal Fall",
		ranks: ["10% chance an enemy drops a second crystal", "20% chance", "30% chance"],
	},
	{
		id: "smallThings",
		patron: "laFlor",
		name: "Small Things",
		ranks: ["Crystals are worth 25% more", "50% more", "75% more"],
	},
	{
		id: "rooted",
		patron: "laFlor",
		name: "Rooted",
		ranks: ["+10 health; heal 1 a second standing still", "+20 health; heal 2", "+30 health; heal 3"],
	},
	{
		id: "bloom",
		patron: "laFlor",
		name: "Nochebuena Bloom",
		ranks: ["Your lowest-level weapon grows two levels, now"],
	},
	{
		id: "fullBloom",
		patron: "laFlor",
		name: "In Full Bloom",
		ranks: ["A weapon at its last level can evolve without its passive"],
	},
	// Saint Lucia: light and fire.
	{
		id: "crownOfCandles",
		patron: "lucia",
		name: "Crown of Candles",
		ranks: ["20% more light", "40% more light", "60% more light"],
	},
	{
		id: "kindling",
		patron: "lucia",
		name: "Kindling",
		ranks: ["Hits have a 10% chance to set enemies burning", "20% chance", "30% chance"],
	},
	{
		id: "spreadingFlame",
		patron: "lucia",
		name: "Spreading Flame",
		ranks: ["Burning enemies set those near them alight as they fall", "Further", "Further still"],
	},
	{
		id: "wickAndWax",
		patron: "lucia",
		name: "Wick and Wax",
		ranks: ["15% more damage to burning enemies", "30% more", "45% more"],
	},
	{
		id: "procession",
		patron: "lucia",
		name: "Lucia's Procession",
		ranks: ["Two candle flames circle you, setting enemies alight", "Three flames", "Four flames"],
	},
	// Ded Moroz: frost.
	{ id: "bitterCold", patron: "moroz", name: "Bitter Cold", ranks: ["Hits slow enemies by 20%", "30%", "40%"] },
	{
		id: "hoarfrost",
		patron: "moroz",
		name: "Hoarfrost",
		ranks: ["Hits have a 6% chance to freeze an enemy solid", "10% chance", "14% chance"],
	},
	{
		id: "shatter",
		patron: "moroz",
		name: "Shatter",
		ranks: ["Frozen enemies take 50% more damage and shatter into shards of ice", "100% more", "150% more"],
	},
	{ id: "frostArmour", patron: "moroz", name: "Frost Armour", ranks: ["Take 8% less damage", "14% less", "20% less"] },
	// Christkind: grace.
	{
		id: "halo",
		patron: "christkind",
		name: "Halo",
		ranks: ["A halo stops one hit, then returns after 20 seconds", "After 15 seconds", "After 10 seconds"],
	},
	{ id: "grace", patron: "christkind", name: "Grace", ranks: ["Heal 0.6 a second", "1.2 a second", "1.8 a second"] },
	{
		id: "gentleHands",
		patron: "christkind",
		name: "Gentle Hands",
		ranks: ["Healing heals 50% more", "100% more", "150% more"],
	},
	{
		id: "guardian",
		patron: "christkind",
		name: "Guardian",
		ranks: ["Fall below 30% health and nothing can hurt you for 3 seconds (once a minute)", "4 seconds", "5 seconds"],
	},
	{ id: "gloria", patron: "christkind", name: "Gloria", ranks: ["Each level heals 10", "Heals 20", "Heals 30"] },
	// The Yule Lads: tricks.
	{
		id: "spoonLicker",
		patron: "yuleLads",
		name: "Spoon-Licker",
		ranks: ["10% chance a crystal counts twice", "20% chance", "30% chance"],
	},
	{
		id: "doorSlammer",
		patron: "yuleLads",
		name: "Door-Slammer",
		ranks: ["Hits have an 8% chance to slam an enemy back and stun it", "12% chance", "16% chance"],
	},
	{
		id: "windowPeeper",
		patron: "yuleLads",
		name: "Window-Peeper",
		ranks: ["+8% chance of critical hits", "+14%", "+20%"],
	},
	{
		id: "sausageSwiper",
		patron: "yuleLads",
		name: "Sausage-Swiper",
		ranks: ["Enemies sometimes drop cocoa", "More often", "More often still"],
	},
	{
		id: "candleBeggar",
		patron: "yuleLads",
		name: "Candle-Beggar",
		ranks: ["Throws and shots have a 10% chance to go twice", "15% chance", "20% chance"],
	},
	{ id: "stubby", patron: "yuleLads", name: "Stubby", ranks: ["+1 reroll at level-ups", "+1 more", "+1 more"] },
	// Duos.
	{
		id: "steamBurst",
		patron: ["lucia", "moroz"],
		needs: ["lucia", "moroz"],
		name: "Steam Burst",
		ranks: ["A frozen enemy set burning bursts in scalding steam"],
	},
	{
		id: "bloomOfLight",
		patron: ["laFlor", "lucia"],
		needs: ["laFlor", "lucia"],
		name: "Bloom of Light",
		ranks: ["Crystals fly to you from anywhere in your light"],
	},
];

export function blessingInfo(id: string): IBlessing {
	return BLESSINGS.find((blessing) => blessing.id === id)!;
}

/** Whether the elf has any blessing from a patron. */
function blessedBy(world: IWorld, patron: IPatronId): boolean {
	return BLESSINGS.some((blessing) => blessing.patron === patron && rank(world.player, blessing.id) > 0);
}

/** A shrine (or Krampus's altar) out in the dark, a little way off, for a minute (an altar, 45 seconds). */
export function placeShrine(world: IWorld, kind: "shrine" | "altar") {
	const angle = Math.random() * Math.PI * 2;
	const distance = 120 + Math.random() * 40;
	let lastPatron = "";

	for (const name of world.done) {
		if (name.startsWith("patron-")) {
			lastPatron = name.slice("patron-".length);
		}
	}

	const patrons = (Object.keys(PATRONS) as IPatronId[]).filter((id) => id !== lastPatron);
	const patron = kind === "shrine" ? patrons[Math.floor(Math.random() * patrons.length)] : null;

	if (patron) {
		// Last in the set is the last patron met (taken out first, in case they've been met before).
		world.done.delete(`patron-${patron}`);
		world.done.add(`patron-${patron}`);
	}

	world.shrines.push({
		kind,
		patron,
		x: world.player.x + Math.cos(angle) * distance,
		y: world.player.y + Math.sin(angle) * distance,
		until: world.time + (kind === "altar" ? 45 : 60),
	});
}

/** The elf reaching a shrine or altar: its patron's offer (or Krampus's). Shrines left too long fade. */
export function visitShrines(world: IWorld, events: IEvents) {
	world.shrines = world.shrines.filter((shrine) => world.time < shrine.until);

	if (world.prompt !== null) {
		return;
	}

	const reached = world.shrines.find((shrine) => Math.hypot(shrine.x - world.player.x, shrine.y - world.player.y) < 12);

	if (!reached) {
		return;
	}

	world.shrines = world.shrines.filter((shrine) => shrine !== reached);
	events.shrine = true;

	if (reached.kind === "altar") {
		const open = BARGAINS.filter((bargain) => !world.player.bargains.includes(bargain.id));
		// Two bargains, and a cursed piece of gear: strong, with a price of its own.
		world.prompt = {
			kind: "altar",
			choices: shuffle(open.map((bargain) => bargain.id)).slice(0, 2),
			gear: newGear(world.numbers.luck, true, true),
		};

		return;
	}

	const patron = reached.patron!;
	const available = BLESSINGS.filter((blessing) => {
		const own = blessing.patron === patron || (Array.isArray(blessing.patron) && blessing.patron.includes(patron));
		const room = rank(world.player, blessing.id) < blessing.ranks.length;
		const ready = !blessing.needs || blessing.needs.every((needed) => blessedBy(world, needed));

		return own && room && ready;
	});

	// A ready duo blessing always shows.
	const duos = available.filter((blessing) => blessing.needs);
	const rest = shuffle(available.filter((blessing) => !blessing.needs));
	world.prompt = { kind: "shrine", patron, choices: [...duos, ...rest].slice(0, 3).map((blessing) => blessing.id) };
}

export function takeBlessing(world: IWorld, id: string) {
	const { player } = world;
	player.blessings[id] = rank(player, id) + 1;
	const now = player.blessings[id];

	switch (id) {
		case "bloom": {
			const lowest = lowestWeapon(world);
			const weapon = player.weapons.find((carried) => carried.id === lowest);

			if (weapon) {
				weapon.level = Math.min(MAX_WEAPON_LEVEL, weapon.level + 2);
			}

			break;
		}
		case "stubby":
			player.rerolls += 1;
			break;
		case "halo":
			player.haloReadyAt = world.time;
			break;
		case "procession": {
			world.allies = world.allies.filter((ally) => ally.kind !== "flame");
			const flames = now + 1;

			for (let i = 0; i < flames; i++) {
				world.allies.push({
					kind: "flame",
					x: player.x,
					y: player.y,
					angle: (i / flames) * Math.PI * 2,
					targetId: null,
					until: Infinity,
					readyAt: 0,
					hits: new Map(),
				});
			}

			break;
		}
		default:
			break;
	}

	closeShrine(world);
}

/** Krampus's cursed gear, put on. */
export function takeCursedGear(world: IWorld) {
	if (world.prompt?.kind === "altar" && world.prompt.gear) {
		wear(world.player, world.prompt.gear);
	}

	closeShrine(world);
}

export function takeBargain(world: IWorld, id: string) {
	world.player.bargains.push(id);
	closeShrine(world);
}

/** Walking away from a shrine's offer or Krampus's. */
export function closeShrine(world: IWorld) {
	world.prompt = null;
	world.numbers = stats(world.player);
	world.player.health = Math.min(world.player.health, world.numbers.maxHealth);
	nextLevelUp(world);
}

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];

	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	return copy;
}
