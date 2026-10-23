/**
 * Levelling up and treasure. Each level offers three choices (four with luck) from new weapons,
 * new passives and the next level of those carried, up to six of each; rerolls and banishes
 * reshape the offer. Chests from elites and bosses evolve a weapon at its last level beside its
 * passive (La Flor's "In full bloom" lets one evolve without), or else level things up at random.
 */

import { heal } from "Components/SilentNight/combat";
import { MAX_WEAPON_LEVEL, PASSIVE_SLOTS, WEAPON_SLOTS } from "Components/SilentNight/constants";
import { wear } from "Components/SilentNight/gear";
import { isGun, morphsOffered } from "Components/SilentNight/guns";
import { byRank, level, PASSIVES, rank, stats } from "Components/SilentNight/stats";
import {
	noEvents,
	type IChoice,
	type IEvents,
	type IGunId,
	type IPassiveId,
	type IReward,
	type IWeaponId,
	type IWorld,
} from "Components/SilentNight/types";
import { newWeapon, weaponInfo, WEAPONS } from "Components/SilentNight/weapons";

/** What a choice is called, for banishing (a weapon's id or a passive's). */
export function choiceKey(choice: IChoice): string {
	return choice.kind === "fruitcake" ? "fruitcake" : choice.id;
}

/** Everything the elf could take at this level-up. */
function candidates(world: IWorld): Array<{ choice: IChoice; weight: number }> {
	const { player } = world;
	const found: Array<{ choice: IChoice; weight: number }> = [];

	for (const info of WEAPONS) {
		const carried = player.weapons.find((weapon) => weapon.id === info.id);

		if (player.banished.includes(info.id)) {
			continue;
		}

		// A gun's morphs, once it's reached their level: chosen between, so weighted well up.
		if (carried) {
			for (const morph of morphsOffered(carried)) {
				if (!player.banished.includes(morph.id)) {
					found.push({ choice: { kind: "morph", gun: carried.id as IGunId, id: morph.id }, weight: 2 });
				}
			}
		}

		if (carried && carried.level < MAX_WEAPON_LEVEL) {
			found.push({ choice: { kind: "weapon", id: info.id, level: carried.level + 1 }, weight: 1.5 });
		} else if (!carried && !isGun(info.id) && player.weapons.length < WEAPON_SLOTS) {
			found.push({ choice: { kind: "weapon", id: info.id, level: 1 }, weight: 1 });
		}
	}

	const passivesCarried = Object.keys(player.passives).length;

	for (const passive of PASSIVES) {
		const current = level(player, passive.id);

		if (player.banished.includes(passive.id)) {
			continue;
		}

		if (current > 0 && current < passive.maxLevel) {
			found.push({ choice: { kind: "passive", id: passive.id, level: current + 1 }, weight: 1.3 });
		} else if (current === 0 && passivesCarried < PASSIVE_SLOTS) {
			found.push({ choice: { kind: "passive", id: passive.id, level: 1 }, weight: 0.9 });
		}
	}

	return found;
}

/** Three choices (four with luck), weighted toward what's carried. */
export function offerChoices(world: IWorld): IChoice[] {
	const pool = candidates(world);
	const count = stats(world.player).luck >= 1.3 ? 4 : 3;
	const chosen: IChoice[] = [];

	while (chosen.length < count && pool.length > 0) {
		const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
		let roll = Math.random() * total;
		const index = pool.findIndex((entry) => (roll -= entry.weight) <= 0);
		chosen.push(pool[index === -1 ? 0 : index].choice);
		pool.splice(index === -1 ? 0 : index, 1);
	}

	return chosen.length > 0 ? chosen : [{ kind: "fruitcake" }];
}

/** Starts the next level-up, if one's owed and nothing else is waiting. */
export function nextLevelUp(world: IWorld) {
	if (world.prompt === null && world.levelUpsOwed > 0) {
		world.prompt = { kind: "levelUp", choices: offerChoices(world) };
	}
}

export function take(world: IWorld, choice: IChoice) {
	const { player } = world;

	if (choice.kind === "morph") {
		player.weapons.find((weapon) => weapon.id === choice.gun)!.morphs.push(choice.id);
	} else if (choice.kind === "weapon") {
		const carried = player.weapons.find((weapon) => weapon.id === choice.id);

		if (carried) {
			carried.level = choice.level;
		} else {
			player.weapons.push(newWeapon(choice.id));
		}
	} else if (choice.kind === "passive") {
		player.passives[choice.id] = choice.level;
	} else {
		heal(world, 30, noEvents());
	}

	// La Befana's Epiphany Eve: now and then, a passive raised a level too.
	const raisable = PASSIVES.filter(
		(passive) => level(player, passive.id) > 0 && level(player, passive.id) < passive.maxLevel,
	);

	if (raisable.length > 0 && Math.random() < byRank(player, "epiphanyEve", [0.1, 0.2, 0.3])) {
		const passive = raisable[Math.floor(Math.random() * raisable.length)];
		player.passives[passive.id] = level(player, passive.id) + 1;
	}

	finishLevelUp(world);
}

/** Skipping a level-up: nothing taken. */
export function skip(world: IWorld) {
	finishLevelUp(world);
}

export function reroll(world: IWorld) {
	if (world.player.rerolls > 0 && world.prompt?.kind === "levelUp") {
		world.player.rerolls -= 1;
		world.prompt = { kind: "levelUp", choices: offerChoices(world) };
	}
}

/** Never offered again this night. */
export function banish(world: IWorld, choice: IChoice) {
	if (world.player.banishes > 0 && world.prompt?.kind === "levelUp" && choice.kind !== "fruitcake") {
		world.player.banishes -= 1;
		world.player.banished.push(choice.id);
		world.prompt = { kind: "levelUp", choices: offerChoices(world) };
	}
}

function finishLevelUp(world: IWorld) {
	levelTaken(world);
	nextLevelUp(world);
}

/** A level-up taken (or skipped, or traded for a patron's help): Gloria's healing, and the numbers. */
export function levelTaken(world: IWorld) {
	world.levelUpsOwed -= 1;
	world.prompt = null;
	// Christkind's Gloria: a little health with each level.
	const gloria = rank(world.player, "gloria");

	if (gloria > 0) {
		heal(world, gloria * 10, noEvents());
	}

	world.numbers = stats(world.player);
}

/** A chest: evolve what can be evolved, otherwise level things up (more from bosses). */
export function openChest(world: IWorld, value: number, events: IEvents) {
	const { player } = world;
	const rewards: IReward[] = [];
	events.chest = true;

	const evolving = player.weapons.find((weapon) => {
		const info = weaponInfo(weapon.id);

		return (
			!weapon.evolved &&
			weapon.level >= MAX_WEAPON_LEVEL &&
			(level(player, info.evolution.passive) > 0 || rank(player, "fullBloom") > 0)
		);
	});

	if (evolving) {
		evolving.evolved = true;
		rewards.push({
			id: evolving.id,
			text: `${weaponInfo(evolving.id).name} evolved into ${weaponInfo(evolving.id).evolution.name}!`,
			evolved: true,
		});
	}

	const levels = evolving ? value - 1 : value + (Math.random() < 0.15 * (stats(player).luck - 1) ? 1 : 0);

	for (let i = 0; i < levels; i++) {
		const upgradable = [
			...player.weapons
				.filter((weapon) => weapon.level < MAX_WEAPON_LEVEL)
				.map((weapon) => ({ kind: "weapon" as const, id: weapon.id })),
			...PASSIVES.filter(
				(passive) => level(player, passive.id) > 0 && level(player, passive.id) < passive.maxLevel,
			).map((passive) => ({
				kind: "passive" as const,
				id: passive.id,
			})),
		];

		// Nothing left to level: fruitcake for the rest, as one reward.
		if (upgradable.length === 0) {
			const slices = levels - i;
			heal(world, 30 * slices, events);
			rewards.push({
				id: "fruitcake",
				text: slices === 1 ? "A slice of fruitcake: 30 health" : `${slices} slices of fruitcake: ${30 * slices} health`,
				evolved: false,
			});
			break;
		}

		const pick = upgradable[Math.floor(Math.random() * upgradable.length)];

		if (pick.kind === "weapon") {
			const weapon = player.weapons.find((carried) => carried.id === pick.id)!;
			weapon.level += 1;
			rewards.push({
				id: weapon.id,
				text: `${weaponInfo(weapon.id as IWeaponId).name}: level ${weapon.level}`,
				evolved: false,
			});
		} else {
			const id = pick.id as IPassiveId;
			player.passives[id] = level(player, id) + 1;
			rewards.push({
				id,
				text: `${PASSIVES.find((passive) => passive.id === id)!.name}: level ${player.passives[id]}`,
				evolved: false,
			});
		}
	}

	world.numbers = stats(player);
	world.prompt = { kind: "chest", rewards };
}

/** Wearing the gear just found (in place of whatever was in its slot), or leaving it. */
export function takeGear(world: IWorld) {
	if (world.prompt?.kind === "gear") {
		wear(world.player, world.prompt.gear);
		world.numbers = stats(world.player);
		world.player.health = Math.min(world.player.health, world.numbers.maxHealth);
	}

	closeChest(world);
}

/** Closing the chest (or leaving the gear). */
export function closeChest(world: IWorld) {
	world.prompt = null;
	nextLevelUp(world);
}
