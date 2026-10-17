import {
	DEFAULT_BATTER,
	DEFAULT_SKIN,
	isBatterId,
	isSkinId,
	type IBatterId,
	type ISkinId,
} from "Components/ElfFling/skins";
import { NO_UPGRADES, type IUpgradeId, type IUpgrades } from "Components/ElfFling/upgrades";

/**
 * The player's coins and shop purchases (upgrades and skins), kept in this browser like the
 * best throw. Storage can be missing or blocked (private windows), so reads fall back to a
 * fresh start and failed writes are ignored: the page still has the values until it's closed.
 */

export type IProgress = {
	coins: number;
	upgrades: IUpgrades;
	/** Skins bought; the little elf is always owned. */
	skins: ISkinId[];
	/** The skin being worn. */
	skin: ISkinId;
	/** Batters bought; the reindeer is always owned. */
	batters: IBatterId[];
	/** Who's swinging. */
	batter: IBatterId;
};

const STORAGE_KEY = "secret-santa-elf-fling-progress";

function freshStart(): IProgress {
	return {
		coins: 0,
		upgrades: { ...NO_UPGRADES },
		skins: [DEFAULT_SKIN],
		skin: DEFAULT_SKIN,
		batters: [DEFAULT_BATTER],
		batter: DEFAULT_BATTER,
	};
}

export function readProgress(): IProgress {
	try {
		const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<IProgress> | null;
		const coins = Number(saved?.coins);
		const upgrades = { ...NO_UPGRADES };

		for (const id of Object.keys(NO_UPGRADES) as IUpgradeId[]) {
			const level = Number(saved?.upgrades?.[id]);
			upgrades[id] = Number.isInteger(level) && level > 0 ? level : 0;
		}

		const skins = owned(DEFAULT_SKIN, saved?.skins, isSkinId);
		const skin = isSkinId(saved?.skin) && skins.includes(saved.skin) ? saved.skin : DEFAULT_SKIN;
		const batters = owned(DEFAULT_BATTER, saved?.batters, isBatterId);
		const batter = isBatterId(saved?.batter) && batters.includes(saved.batter) ? saved.batter : DEFAULT_BATTER;

		return { coins: Number.isInteger(coins) && coins > 0 ? coins : 0, upgrades, skins, skin, batters, batter };
	} catch {
		return freshStart();
	}
}

/** The saved list of owned looks, kept to known ones, always including the free default. */
function owned<T>(free: T, saved: unknown, isKnown: (value: unknown) => value is T): T[] {
	return [...new Set([free, ...(Array.isArray(saved) ? saved : []).filter(isKnown)])];
}

export function saveProgress(progress: IProgress) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
	} catch {
		// Not saved this time; see above.
	}
}
