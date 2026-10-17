/**
 * This device's best throw, kept in the browser (no account needed yet). Storage can be
 * missing or blocked (private windows), so every read and write is allowed to fail quietly.
 */
const STORAGE_KEY = "secret-santa-elf-fling-best";

export function readBestThrow(): number | null {
	try {
		const stored = Number(window.localStorage.getItem(STORAGE_KEY));

		return Number.isFinite(stored) && stored > 0 ? stored : null;
	} catch {
		return null;
	}
}

export function saveBestThrow(metres: number) {
	try {
		window.localStorage.setItem(STORAGE_KEY, metres.toFixed(1));
	} catch {
		// Not saved this time; the page still shows it until it's closed.
	}
}
