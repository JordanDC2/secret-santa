import type { IPowerUpItemId, IThrowUpgrades, IUpgradeId } from "Components/ElfFling/upgrades";

/**
 * What a player has bought that puts something on the course can be switched off and on again
 * (say, to skip the chimneys and just play pinball from the Games page): the gem shop's
 * power-ups and course features, and the coin shop's crackers, sky ornaments and sleigh. Kept on
 * this device, like the sound; a switched-off item is left out of the next throw.
 */
export type ISwitchableId = IPowerUpItemId | Extract<IUpgradeId, "crackers" | "skyOrnaments" | "sleigh">;

const STORAGE_KEY = "secret-santa-elf-fling-switched-off";

export function readSwitchedOff(): ISwitchableId[] {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

		return Array.isArray(stored) ? (stored.filter((id) => typeof id === "string") as ISwitchableId[]) : [];
	} catch {
		return [];
	}
}

export function saveSwitchedOff(ids: ISwitchableId[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// Storage blocked (private browsing): it holds until the page closes.
	}
}

/** The throw's upgrades with the switched-off items as if they weren't owned. */
export function withoutSwitchedOff(upgrades: IThrowUpgrades, off: ISwitchableId[]): IThrowUpgrades {
	const next = { ...upgrades };

	for (const id of off) {
		next[id] = 0;
	}

	return next;
}
