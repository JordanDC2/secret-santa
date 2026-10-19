/**
 * Power-ups (gem shop): pickups floating along the course, some low over the snow and
 * some mid-air. Grabbing one sets it going for a few seconds (longer with more levels):
 *
 * - Christmas star: nothing slows the elf: snowmen go flying, and bounces keep all its speed.
 * - Gingerbread man: as fast as he can: a burst of forward speed, and no air drag.
 * - Snow angel wings: a fall turns into a gentle glide.
 * - Giant snowball: the elf rolls up inside one, reaching further for everything it can grab.
 *   It rolls instead of bouncing, barely slowing, and pops the elf back up when it wears off.
 * - North wind: a tailwind pushing the elf forward and a little up.
 *
 * And two that act at once rather than for a while:
 *
 * - Hot cocoa: extra jumps, there and then.
 * - Spare firework: the rocket, ready to fire again (even without the rocket upgrade).
 *
 * Only the ones the player has unlocked appear. Laid out as the elf goes (course.ts).
 */

import { between, HIGH_SKY, type ILayout } from "Components/ElfFling/course";

/** The power-ups that last a while (and show a countdown). */
export type ITimedPowerUpKind = "christmasStar" | "gingerbreadMan" | "snowAngelWings" | "giantSnowball" | "northWind";

export type IPowerUpKind = ITimedPowerUpKind | "hotCocoa" | "spareFirework";

export const TIMED_POWER_UP_KINDS: ITimedPowerUpKind[] = [
	"christmasStar",
	"gingerbreadMan",
	"snowAngelWings",
	"giantSnowball",
	"northWind",
];

export const POWER_UP_KINDS: IPowerUpKind[] = [...TIMED_POWER_UP_KINDS, "hotCocoa", "spareFirework"];

export function isTimed(kind: IPowerUpKind): kind is ITimedPowerUpKind {
	return (TIMED_POWER_UP_KINDS as IPowerUpKind[]).includes(kind);
}

export type IPowerUp = {
	x: number;
	y: number;
	kind: IPowerUpKind;
	/** Game time it was grabbed, or null while it's still there. */
	collectedAt: number | null;
};

/** Game time each power-up runs until, while it's going; null when it isn't. */
export type IActivePowerUps = Record<ITimedPowerUpKind, number | null>;

export const NO_ACTIVE_POWER_UPS: IActivePowerUps = {
	christmasStar: null,
	gingerbreadMan: null,
	snowAngelWings: null,
	giantSnowball: null,
	northWind: null,
};

/** How long each lasts, in seconds, at levels 1, 2 and 3. */
export const POWER_UP_SECONDS: Record<ITimedPowerUpKind, number[]> = {
	christmasStar: [5, 7.5, 10],
	gingerbreadMan: [5, 7.5, 10],
	snowAngelWings: [5, 7.5, 10],
	giantSnowball: [5, 7.5, 10],
	northWind: [5, 7.5, 10],
};

/** Hot cocoa: extra jumps at levels 1, 2 and 3. */
export const COCOA_JUMPS = [1, 2, 3];
/** The north wind's push while it lasts, in m/s per second: mostly forward, a little up. */
export const TAILWIND = { forward: 3, up: 1 };

/** Generous, like coins: they're drawn bigger than life when zoomed out. */
const GRAB_RADIUS = 1.8;
/** The gingerbread man's burst of forward speed when grabbed, in m/s (and no air drag while he lasts). */
export const GINGERBREAD_BURST = 8;
/** Gliding with wings: the elf falls no faster than this, in m/s. */
export const GLIDE_SINK = 2.2;
/** Rolling as a snowball: this share of the usual snow friction, and this much further reach
    for coins, power-ups, ornaments and crackers (not snowmen). */
export const SNOWBALL_FRICTION = 0.15;
export const SNOWBALL_REACH = 1.2;
/** When the snowball wears off mid-roll, it pops the elf up this fast (m/s) to bounce on. */
export const SNOWBALL_POP_UP = 8;

const HIGH_POWER_UP_CHANCE = 1 / 6;

/** One every 70–150 m, a third low over the snow and the rest up to 12 m; now and then one more far up in the high sky. */
export function powerUpLayout(kinds: IPowerUpKind[]): ILayout<IPowerUp> | null {
	if (kinds.length === 0) {
		return null;
	}

	return {
		// The first close enough that even a short throw can reach it.
		firstAt: { min: 25, max: 50 },
		gap: { min: 70, max: 150 },
		scarcerByDay: true,
		place: (x, random) => [
			{
				x,
				y: random() < 0.35 ? between({ min: 0.8, max: 2.5 }, random) : between({ min: 4, max: 12 }, random),
				kind: kinds[Math.floor(random() * kinds.length)],
				collectedAt: null,
			},
			...(random() < HIGH_POWER_UP_CHANCE
				? [
						{
							x: x + 5,
							y: between(HIGH_SKY, random),
							kind: kinds[Math.floor(random() * kinds.length)],
							collectedAt: null,
						},
					]
				: []),
		],
	};
}

/** The power-up an elf at (x, y) is grabbing (extraReach further, as a giant snowball), as its index, or -1. */
export function powerUpGrabbed(powerUps: IPowerUp[], x: number, y: number, extraReach = 0): number {
	const radius = GRAB_RADIUS + extraReach;

	return powerUps.findIndex(
		(powerUp) =>
			powerUp.collectedAt === null &&
			Math.abs(powerUp.x - x) <= radius &&
			Math.hypot(powerUp.x - x, powerUp.y - y) <= radius,
	);
}

export function isActive(active: IActivePowerUps, kind: ITimedPowerUpKind, time: number): boolean {
	const until = active[kind];

	return until !== null && time < until;
}
