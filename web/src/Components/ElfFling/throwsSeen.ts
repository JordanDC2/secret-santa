/**
 * How many throws this device has finished, so the tips over the game can stop once the
 * player knows how it goes (TIPS_FOR throws).
 */
const STORAGE_KEY = "secret-santa-elf-fling-throws-seen";
export const TIPS_FOR = 5;

export function readThrowsSeen(): number {
	try {
		return Number(localStorage.getItem(STORAGE_KEY)) || 0;
	} catch {
		return 0;
	}
}

export function saveThrowsSeen(count: number): void {
	try {
		localStorage.setItem(STORAGE_KEY, String(count));
	} catch {
		// Storage blocked (private browsing): the tips just keep showing.
	}
}
