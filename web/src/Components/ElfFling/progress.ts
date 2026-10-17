import { DEFAULT_SKIN, isSkinId, type ISkinId } from "Components/ElfFling/skins";
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
};

const STORAGE_KEY = "secret-santa-elf-fling-progress";

function freshStart(): IProgress {
	return { coins: 0, upgrades: { ...NO_UPGRADES }, skins: [DEFAULT_SKIN], skin: DEFAULT_SKIN };
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

		const skins = [DEFAULT_SKIN, ...(Array.isArray(saved?.skins) ? saved.skins : []).filter(isSkinId)];
		const owned = [...new Set(skins)];
		const skin = isSkinId(saved?.skin) && owned.includes(saved.skin) ? saved.skin : DEFAULT_SKIN;

		return { coins: Number.isInteger(coins) && coins > 0 ? coins : 0, upgrades, skins: owned, skin };
	} catch {
		return freshStart();
	}
}

export function saveProgress(progress: IProgress) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
	} catch {
		// Not saved this time; see above.
	}
}
