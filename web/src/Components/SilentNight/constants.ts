/** Numbers the whole of Silent Night shares. Units are the game's own pixels and seconds. */

import type { IEnemyKind } from "Components/SilentNight/types";

/** How many of the game's pixels tall the view is; its width follows the screen's shape. */
export const VIEW_HEIGHT = 200;
/** How long the night lasts, to dawn, in seconds. */
export const NIGHT_SECONDS = 20 * 60;
/** The neighbourhood grid, for finding what's near what quickly. */
export const CELL = 16;
export const PLAYER_RADIUS = 5;

/** Every kind of enemy, in a fixed order (effects carry a kind as its index here). */
export const ENEMY_KINDS: IEnemyKind[] = [
	"gingerbread",
	"windup",
	"golem",
	"caroller",
	"angel",
	"imp",
	"rat",
	"mouseKing",
	"ghost",
	"yuleCat",
	"krampus",
];

/** Experience to reach the next level: like Vampire Survivors, 5 for the first, then 10 more each level, 13 more past 20, 16 past 40. */
export function experienceFor(level: number): number {
	if (level < 20) {
		return 5 + (level - 1) * 10;
	}

	if (level < 40) {
		return 5 + 19 * 10 + (level - 20) * 13;
	}

	return 5 + 19 * 10 + 20 * 13 + (level - 40) * 16;
}

/** Up to this many weapons and this many passives at once. */
export const WEAPON_SLOTS = 6;
export const PASSIVE_SLOTS = 6;
export const MAX_WEAPON_LEVEL = 8;
