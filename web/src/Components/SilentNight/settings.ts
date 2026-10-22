/**
 * Silent Night's settings, remembered on each device: aiming and shooting for you (mainly for a
 * phone, where steering and aiming at once is hard), and how loud the music and the sound
 * effects are (the sound switch still turns both off).
 */

export type ISettings = {
	/** The gun always aims at the nearest enemy in reach (nothing overrides it); firing's still the
	 * mouse button, or on a touch screen a fire button in place of the aiming thumbstick. */
	autoAim: boolean;
	/** The gun fires whenever an enemy's in reach, without holding anything (no fire button). */
	autoShoot: boolean;
	/** Volumes, 0 to 1. */
	music: number;
	effects: number;
};

const STORAGE_KEY = "silent-night-settings";

export const DEFAULT_SETTINGS: ISettings = { autoAim: false, autoShoot: false, music: 0.8, effects: 0.8 };

export function readSettings(): ISettings {
	try {
		const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<ISettings>;

		return { ...DEFAULT_SETTINGS, ...saved };
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export function saveSettings(settings: ISettings) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Not remembered this time; they still apply until the page closes.
	}
}
