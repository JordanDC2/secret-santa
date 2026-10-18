import {
	DEFAULT_BATTER,
	DEFAULT_SKIN,
	isBatterId,
	isSkinId,
	type IBatterId,
	type ISkinId,
} from "Components/ElfFling/skins";
import { NO_UPGRADES, type IGemUpgrades, type IUpgradeId, type IUpgrades } from "Components/ElfFling/upgrades";

/**
 * A player's Elf Fling progress, kept with their account (the API is the source of truth):
 * coins and gems, coin and gem upgrades, how many times they've prestiged, the looks owned and
 * in use, and their best throw.
 *
 * Before accounts kept it, each browser saved progress itself; readDeviceProgress() finds
 * that so it can be brought over once (useImportMutation), then forgetDeviceProgress() clears it.
 */
export type IProgress = {
	coins: number;
	gems: number;
	prestiges: number;
	upgrades: IUpgrades;
	gemUpgrades: IGemUpgrades;
	skins: ISkinId[];
	skin: ISkinId;
	batters: IBatterId[];
	batter: IBatterId;
	bestDistance: number | null;
	/** Whether a browser's own saved progress has already been brought over (it happens once). */
	imported: boolean;
};

const DEVICE_PROGRESS_KEY = "secret-santa-elf-fling-progress";
const DEVICE_BEST_KEY = "secret-santa-elf-fling-best";

export type IDeviceProgress = {
	coins: number;
	upgrades: Partial<IUpgrades>;
	skins: ISkinId[];
	batters: IBatterId[];
	bestDistance: number | null;
};

/**
 * What this browser saved on its own, if anything worth bringing over. Storage can be missing
 * or blocked (private windows), so this quietly finds nothing then.
 */
export function readDeviceProgress(): IDeviceProgress | null {
	try {
		const saved = JSON.parse(window.localStorage.getItem(DEVICE_PROGRESS_KEY) ?? "null") as Record<
			string,
			unknown
		> | null;
		const best = Number(window.localStorage.getItem(DEVICE_BEST_KEY));
		const bestDistance = Number.isFinite(best) && best > 0 ? best : null;

		if (!saved && bestDistance === null) {
			return null;
		}

		const savedUpgrades = (saved?.upgrades ?? {}) as Record<string, unknown>;
		const upgrades: Partial<IUpgrades> = {};

		for (const id of Object.keys(NO_UPGRADES) as IUpgradeId[]) {
			const level = Number(savedUpgrades[id]);

			if (Number.isInteger(level) && level > 0) {
				upgrades[id] = level;
			}
		}

		const coins = Number(saved?.coins);

		return {
			coins: Number.isInteger(coins) && coins > 0 ? coins : 0,
			upgrades,
			skins: listOf(saved?.skins, isSkinId, DEFAULT_SKIN),
			batters: listOf(saved?.batters, isBatterId, DEFAULT_BATTER),
			bestDistance,
		};
	} catch {
		return null;
	}
}

/** Once it's on the account, the browser's own copy goes, so it's never brought over twice. */
export function forgetDeviceProgress() {
	try {
		window.localStorage.removeItem(DEVICE_PROGRESS_KEY);
		window.localStorage.removeItem(DEVICE_BEST_KEY);
	} catch {
		// Nothing to clear, or storage is blocked; the account copy is what counts now.
	}
}

function listOf<T>(saved: unknown, isKnown: (value: unknown) => value is T, free: T): T[] {
	return [...new Set([free, ...(Array.isArray(saved) ? saved : []).filter(isKnown)])];
}
