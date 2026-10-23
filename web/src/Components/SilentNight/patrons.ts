/**
 * The patrons of Silent Night, from Christmases around the world, and their blessings: five
 * from the start, and a second wave of three unlocked in the Coal Cellar. Every couple of
 * minutes a shrine appears out in the dark; reach it and its patron offers three of their
 * blessings. Blessings rank up to three times, and two from different patrons can combine into a
 * duo blessing. Krampus's altars appear too, offering his bargains (bargains.ts). The blessings'
 * effects are worked into stats.ts, combat.ts, weapons.ts and secondWave.ts by id.
 */

import { BARGAINS } from "Components/SilentNight/bargains";
import { newGear, wear } from "Components/SilentNight/gear";
import { levelTaken, nextLevelUp } from "Components/SilentNight/levelUp";
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
		name: "The Christkind",
		from: "Germany and Austria",
		line: "Whatever harm comes for you, I'll turn it aside.",
		colour: "#c9b2f2",
	},
	yuleLads: {
		id: "yuleLads",
		name: "The Yule Lads",
		from: "Iceland",
		line: "Thirteen of us, and every one a thief. Fancy a trick?",
		colour: "#9ad07a",
	},
	befana: {
		id: "befana",
		name: "La Befana",
		from: "Italy",
		line: "Good children get sweets, and the rest get coal. You'll have both.",
		colour: "#5fb8a8",
	},
	yuleGoat: {
		id: "yuleGoat",
		name: "The Yule Goat",
		from: "Scandinavia",
		line: "Straw and stubbornness. Lower your head, and charge.",
		colour: "#e0883a",
	},
	mariLwyd: {
		id: "mariLwyd",
		name: "Mari Lwyd",
		from: "Wales",
		line: "Let us in, or answer our song.",
		colour: "#e8e4dc",
	},
};

/** The first wave, whose shrines always appear; the rest are unlocked in the Coal Cellar. */
export const FIRST_WAVE: IPatronId[] = ["laFlor", "lucia", "moroz", "christkind", "yuleLads"];

export type IBlessing = {
	id: string;
	/** Whose it is, or both patrons' for a duo blessing. */
	patron: IPatronId | [IPatronId, IPatronId];
	name: string;
	/** What each rank does (one entry for a blessing taken once). */
	ranks: string[];
	/** For a duo: one blessing needed from each patron first. */
	needs?: [IPatronId, IPatronId];
	/** Offered only once one of these blessings is taken (it does nothing without them). */
	requires?: string[];
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
		id: "lateBloomer",
		patron: "laFlor",
		name: "Late Bloomer",
		ranks: ["3% more damage for each minute of the night so far", "4% more", "5% more"],
	},
	{
		id: "seedPod",
		patron: "laFlor",
		name: "Seed Pod",
		ranks: [
			"10% chance an enemy bursts into poinsettia petals as it falls, each cutting what it hits for 12",
			"20% chance",
			"30% chance",
		],
	},
	{
		id: "fullBloom",
		patron: "laFlor",
		name: "In Full Bloom",
		ranks: ["A weapon at its last level can evolve without its passive"],
	},
	{
		id: "xolo",
		patron: "laFlor",
		name: "Xolo",
		ranks: [
			"A painted xolo dog runs with you, charging through enemies every 4 seconds, hurting each for 20",
			"Charging every 3 seconds",
			"Its charge stuns what it hits",
		],
	},
	{
		id: "poinsettias",
		patron: "laFlor",
		name: "Poinsettia Chakram",
		ranks: [
			"A poinsettia flies at enemies, cutting each for 8 and slowing it by 30%, then back to you",
			"Two poinsettias",
			"Three poinsettias",
		],
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
	{
		id: "starBoy",
		patron: "lucia",
		name: "Star Boy",
		ranks: [
			"A star boy walks with you, throwing a star at the nearest enemy every second for 9, setting it burning",
			"Two star boys",
			"Three star boys",
		],
	},
	{
		id: "saffronBuns",
		patron: "lucia",
		name: "Saffron Buns",
		ranks: ["Cocoa heals 25% more and sets everything close round you burning", "Heals 50% more", "Heals 75% more"],
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
	{
		id: "snegurochka",
		patron: "moroz",
		name: "Snegurochka",
		ranks: [
			"The Snow Maiden walks with you; every 4 seconds, everything close round her freezes solid",
			"Every 3 seconds",
			"Every 2 seconds",
		],
	},
	{
		id: "frostTracks",
		patron: "moroz",
		name: "Frost Tracks",
		ranks: ["Dashing leaves a trail of ice for 3 seconds, slowing enemies on it by 30%", "By 40%", "By 50%"],
	},
	{
		id: "longWinter",
		patron: "moroz",
		name: "Long Winter",
		ranks: ["Frozen enemies stay frozen 50% longer", "100% longer"],
		requires: ["hoarfrost", "snegurochka"],
	},
	{
		id: "deepFrost",
		patron: "moroz",
		name: "Deep Frost",
		ranks: ["Frozen enemies below 10% health shatter outright", "Below 15%", "Below 20%"],
		requires: ["hoarfrost", "snegurochka"],
	},
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
	{
		id: "angelsHair",
		patron: "christkind",
		name: "Angel's Hair",
		ranks: ["When an enemy's touch hurts you, tinsel lashes back at it for 30", "For 45", "For 60"],
	},
	{
		id: "guidingStar",
		patron: "christkind",
		name: "Guiding Star",
		ranks: ["Every 5 seconds, your next hit is a certain critical hit", "Every 4 seconds", "Every 3 seconds"],
	},
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
	{
		id: "potScraper",
		patron: "yuleLads",
		name: "Pot-Scraper",
		ranks: [
			"Gear that enemies drop is 50% more likely to be festive or gilded",
			"100% more likely",
			"150% more likely",
		],
	},
	{
		id: "meatHook",
		patron: "yuleLads",
		name: "Meat-Hook",
		ranks: ["While you dash, you pull things in from 50% further", "100% further", "150% further"],
	},
	// La Befana: her broom and her coal.
	{
		id: "broomstick",
		patron: "befana",
		name: "Broomstick",
		ranks: ["Dash 30% further and 10% more often", "60% further, 20% more often", "90% further, 30% more often"],
	},
	{
		id: "coalBombs",
		patron: "befana",
		name: "Coal in the Stocking",
		ranks: ["Dashing leaves a coal bomb that bursts for 30", "Bursts for 45", "Bursts for 60"],
	},
	{
		id: "giftsForGood",
		patron: "befana",
		name: "Gifts for the Good",
		ranks: ["2% chance an enemy leaves a gift: cocoa or a big crystal", "4% chance", "6% chance"],
	},
	{
		id: "goodWitch",
		patron: "befana",
		name: "Good Witch",
		ranks: ["Pick things up 20% further away", "40% further", "60% further"],
	},
	{
		id: "sootAndAsh",
		patron: "befana",
		name: "Soot and Ash",
		ranks: ["Your coal bombs leave soot for 3 seconds, slowing enemies in it by 30%", "By 40%", "By 50%"],
		requires: ["coalBombs"],
	},
	{
		id: "epiphanyEve",
		patron: "befana",
		name: "Epiphany Eve",
		ranks: ["10% chance a level-up you take also raises one of your passives a level", "20% chance", "30% chance"],
	},
	{
		id: "ridingTheBroom",
		patron: "befana",
		name: "Riding the Broom",
		ranks: ["Dashing through an enemy makes you 20% faster for 2 seconds", "30% faster", "40% faster"],
	},
	// The Yule Goat: horns.
	{
		id: "horns",
		patron: "yuleGoat",
		name: "Horns",
		ranks: ["Knock enemies back 25% further", "50% further", "75% further"],
	},
	{
		id: "thickFleece",
		patron: "yuleGoat",
		name: "Thick Fleece",
		ranks: ["Take 6% less damage", "10% less", "14% less"],
	},
	{
		id: "goatCharge",
		patron: "yuleGoat",
		name: "Charge",
		ranks: ["Dashing through enemies hurts them for 20 and throws them aside", "For 35", "For 50"],
	},
	{
		id: "strawBurns",
		patron: "yuleGoat",
		name: "Straw Goat",
		ranks: ["When you're hit, burning straw bursts round you for 20, setting enemies alight", "For 30", "For 40"],
	},
	{ id: "stubborn", patron: "yuleGoat", name: "Stubborn", ranks: ["+15 health", "+30 health", "+45 health"] },
	{
		id: "gavleGoat",
		patron: "yuleGoat",
		name: "Gävle Goat",
		ranks: ["Once a night, when you fall, you rise again in flames with a third of your health"],
	},
	{
		id: "ironHorns",
		patron: "yuleGoat",
		name: "Iron Horns",
		ranks: [
			"An enemy that touches you is butted back and stunned for a second, every 3 seconds at most",
			"Every 2 seconds",
			"Every second",
		],
	},
	{
		id: "buttingHeads",
		patron: "yuleGoat",
		name: "Butting Heads",
		ranks: ["20% more damage to elites and bosses", "30% more", "40% more"],
	},
	// Mari Lwyd: the horse skull's song.
	{
		id: "fright",
		patron: "mariLwyd",
		name: "Frightful Song",
		ranks: ["A song round you drives enemies back", "A wider song", "Wider still"],
	},
	{
		id: "wassail",
		patron: "mariLwyd",
		name: "Wassail",
		ranks: ["Enemies close round you take 10% more damage", "20% more", "30% more"],
	},
	{
		id: "pwnco",
		patron: "mariLwyd",
		name: "Pwnco",
		ranks: [
			"Every 6 seconds a chant rings out, hurting everything near for 20 and stunning it",
			"Every 5 seconds",
			"Every 4 seconds",
		],
	},
	{
		id: "ribbons",
		patron: "mariLwyd",
		name: "Ribbons and Bells",
		ranks: ["+5% chance of critical hits", "+10%", "+15%"],
	},
	{
		id: "snappingJaw",
		patron: "mariLwyd",
		name: "Snapping Jaw",
		ranks: ["Every 2 seconds, Mari Lwyd's jaw snaps at everything right beside you for 15", "For 25", "For 35"],
	},
	{
		id: "wassailBowl",
		patron: "mariLwyd",
		name: "Wassail Bowl",
		ranks: ["Hits have a 2% chance to heal you 1", "4% chance", "6% chance"],
	},
	{
		id: "mummers",
		patron: "mariLwyd",
		name: "The Mummers",
		ranks: [
			"5% chance an enemy that falls close round you rises as a mummer and fights for you for 10 seconds",
			"10% chance",
			"15% chance",
		],
	},
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
	{
		id: "burningCoal",
		patron: ["befana", "lucia"],
		needs: ["befana", "lucia"],
		name: "Burning Coal",
		ranks: ["Your coal bombs set everything they hit burning"],
	},
	{
		id: "frozenCharge",
		patron: ["yuleGoat", "moroz"],
		needs: ["yuleGoat", "moroz"],
		name: "Frozen Charge",
		ranks: ["Your charge freezes what it hits"],
	},
	{
		id: "carolAtTheDoor",
		patron: ["mariLwyd", "christkind"],
		needs: ["mariLwyd", "christkind"],
		name: "Carol at the Door",
		ranks: ["Each enemy that falls close round you heals you a little"],
	},
	{
		id: "shoeInTheWindow",
		patron: ["yuleLads", "befana"],
		needs: ["yuleLads", "befana"],
		name: "Shoe in the Window",
		ranks: ["4% chance an enemy leaves a gift as it falls: cocoa and a big crystal both"],
	},
	{
		id: "knockAndRun",
		patron: ["yuleLads", "mariLwyd"],
		needs: ["yuleLads", "mariLwyd"],
		name: "Knock and Run",
		ranks: ["Dashing slams back everything close round you for 10, stunning it"],
	},
	{
		id: "hornswoggle",
		patron: ["yuleLads", "yuleGoat"],
		needs: ["yuleLads", "yuleGoat"],
		name: "Hornswoggle",
		ranks: ["Critical hits throw enemies back and stun them"],
	},
	{
		id: "nightFlight",
		patron: ["befana", "christkind"],
		needs: ["befana", "christkind"],
		name: "Night Flight",
		ranks: ["Nothing can hurt you for half a second after each dash"],
	},
	{
		id: "humblestGift",
		patron: ["laFlor", "christkind"],
		needs: ["laFlor", "christkind"],
		name: "The Humblest Gift",
		ranks: ["Each crystal you pick up heals you 0.5"],
	},
	{
		id: "frostFlower",
		patron: ["laFlor", "moroz"],
		needs: ["laFlor", "moroz"],
		name: "Frost Flower",
		ranks: ["Every 6 seconds, frost blooms on the nearest enemy, freezing everything close round it"],
	},
	{
		id: "wassailers",
		patron: ["yuleGoat", "mariLwyd"],
		needs: ["yuleGoat", "mariLwyd"],
		name: "Wassailers",
		ranks: ["Each enemy close round you makes you take 2% less damage, up to 20%"],
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

	const patrons = patronPool(world).filter((id) => id !== lastPatron);
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
	world.prompt = { kind: "shrine", patron, choices: offerOf(world, patron) };
}

/** The blessings `patron` still has to give: theirs (and duos with them, once ready) not yet at their top rank. */
function blessingsLeft(world: IWorld, patron: IPatronId): IBlessing[] {
	return BLESSINGS.filter((blessing) => {
		const own = blessing.patron === patron || (Array.isArray(blessing.patron) && blessing.patron.includes(patron));
		const room = rank(world.player, blessing.id) < blessing.ranks.length;
		const ready = !blessing.needs || blessing.needs.every((needed) => blessedBy(world, needed));
		const able = !blessing.requires || blessing.requires.some((id) => rank(world.player, id) > 0);

		return own && room && ready && able;
	});
}

/** What `patron` offers when met: three of their blessings, any ready duo always among them. */
function offerOf(world: IWorld, patron: IPatronId): string[] {
	const available = blessingsLeft(world, patron);
	const duos = available.filter((blessing) => blessing.needs);
	const rest = shuffle(available.filter((blessing) => !blessing.needs));

	return [...duos, ...rest].slice(0, 3).map((blessing) => blessing.id);
}

/** At most this many patrons a night (Krampus besides): once as many are chosen, only their shrines appear. */
export const MAX_PATRONS = 3;

/** The patrons who could be met: any of the night's, until they're chosen, and then only those chosen. */
function patronPool(world: IWorld): IPatronId[] {
	const chosen = chosenPatrons(world);
	return chosen.length >= MAX_PATRONS ? chosen : world.patrons;
}

/** The patrons chosen this night: those a blessing's been taken from at their shrine. */
export function chosenPatrons(world: IWorld): IPatronId[] {
	return world.patrons.filter((patron) => blessedBy(world, patron));
}

/** The chosen patrons who could still help, asked instead of a level-up's upgrades (askPatron). */
export function patronsToAsk(world: IWorld): IPatronId[] {
	return chosenPatrons(world).filter((patron) => blessingsLeft(world, patron).length > 0);
}

/**
 * Asking a patron for help instead of taking a level-up's upgrades: one of those chosen this night
 * who still has blessings to give, at random, offering them as at their shrine. The level's taken
 * either way (leaving without a blessing gives it up, as skipping does).
 */
export function askPatron(world: IWorld) {
	const patrons = patronsToAsk(world);
	const patron = patrons[Math.floor(Math.random() * patrons.length)];
	levelTaken(world);
	world.prompt = { kind: "shrine", patron, choices: offerOf(world, patron) };
}

/**
 * The patrons who could answer instead of the one offering their blessings (rerollPatron): as for a
 * shrine, any of the night's while there's room for another to be chosen, and then only those chosen;
 * those with blessings left to give.
 */
export function otherPatrons(world: IWorld): IPatronId[] {
	const { prompt } = world;
	return patronPool(world).filter(
		(patron) => prompt?.kind === "shrine" && patron !== prompt.patron && blessingsLeft(world, patron).length > 0,
	);
}

/** Praying again, at a shrine or when asking for help: another patron, at random, answering instead with their own offer. */
export function rerollPatron(world: IWorld) {
	const patrons = otherPatrons(world);
	const patron = patrons[Math.floor(Math.random() * patrons.length)];
	world.player.patronRerolls -= 1;
	world.prompt = { kind: "shrine", patron, choices: offerOf(world, patron) };
}

export function takeBlessing(world: IWorld, id: string) {
	const { player } = world;
	player.blessings[id] = rank(player, id) + 1;
	const now = player.blessings[id];

	switch (id) {
		case "stubby":
			player.rerolls += 1;
			break;
		case "xolo":
			if (now === 1) {
				world.allies.push({
					kind: "xolo",
					x: player.x - 12,
					y: player.y + 2,
					angle: 0,
					targetId: null,
					until: Infinity,
					readyAt: world.time + 1,
					hits: new Map(),
				});
			}

			break;
		case "starBoy":
		case "snegurochka":
			// A star boy more with each rank; the Snow Maiden once.
			if (id === "starBoy" || now === 1) {
				world.allies.push({
					kind: id === "starBoy" ? "starBoy" : "maiden",
					x: player.x,
					y: player.y + 2,
					angle: 0,
					targetId: null,
					until: Infinity,
					readyAt: world.time + 1,
					hits: new Map(),
				});
			}

			break;
		case "poinsettias":
			// One more with each rank.
			world.allies.push({
				kind: "poinsettia",
				x: player.x,
				y: player.y - 6,
				angle: Math.random() * Math.PI * 2,
				targetId: null,
				until: Infinity,
				readyAt: 0,
				hits: new Map(),
			});
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
