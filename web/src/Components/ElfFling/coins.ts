/**
 * Coins hanging in the air along the course, in little patterns (a row, an arc, a column, a
 * slope) of random sizes at random heights. The elf collects any it flies or slides through.
 * Two layers: plenty of low coins worth 1 (now and then a big one worth 5), and fewer sky
 * coins high up worth 3 (now and then 10), which only well-upgraded throws can reach.
 * Laid out as the elf goes (course.ts), and kept in order along the course.
 */

import { between, type ILayout, type IRange } from "Components/ElfFling/course";

export type ICoin = {
	x: number;
	y: number;
	value: number;
	/** Game time it was collected, or null while it's still there. */
	collectedAt: number | null;
};

/** Generous on purpose: the elf and coins are drawn bigger than life when zoomed out. */
export const COLLECT_RADIUS = 1;

type ILayer = {
	firstAt: IRange;
	gap: IRange;
	/** Height of a pattern's first coin, from a 0–1 random number. */
	height: (random: number) => number;
	/** How far apart a pattern's coins are. */
	spacing: number;
	value: number;
	bigValue: number;
	bigChance: number;
};

const LAYERS: ILayer[] = [
	// Near the snow: easy pickings, most of them low enough to scoop up on a slide.
	{
		firstAt: { min: 4, max: 9 },
		gap: { min: 4, max: 12 },
		height: (r) => 0.5 + r ** 2 * 13,
		spacing: 1.3,
		value: 1,
		bigValue: 5,
		bigChance: 0.15,
	},
	// The sky: spread out and worth more, for throws strong enough to get up there.
	{
		firstAt: { min: 20, max: 30 },
		gap: { min: 6, max: 14 },
		height: (r) => 15 + r ** 1.4 * 35,
		spacing: 2,
		value: 3,
		bigValue: 10,
		bigChance: 0.25,
	},
];

type IPattern = (count: number, spacing: number) => Array<{ dx: number; dy: number }>;

const PATTERNS: Array<{ shape: IPattern; count: { min: number; max: number } }> = [
	// A row.
	{
		shape: (count, spacing) => Array.from({ length: count }, (_, i) => ({ dx: i * spacing, dy: 0 })),
		count: { min: 3, max: 7 },
	},
	// An arc, like a little rainbow.
	{
		shape: (count, spacing) =>
			Array.from({ length: count }, (_, i) => {
				const t = count === 1 ? 0.5 : i / (count - 1);
				return { dx: i * spacing, dy: 4 * t * (1 - t) * 2 * spacing };
			}),
		count: { min: 5, max: 9 },
	},
	// A column.
	{
		shape: (count, spacing) => Array.from({ length: count }, (_, i) => ({ dx: 0, dy: i * spacing })),
		count: { min: 3, max: 5 },
	},
	// A slope, rising.
	{
		shape: (count, spacing) => Array.from({ length: count }, (_, i) => ({ dx: i * spacing, dy: i * spacing * 0.7 })),
		count: { min: 4, max: 6 },
	},
];

/** Each layer as a course layout: a random pattern of coins at each spot. */
export const COIN_LAYOUTS: ILayout<ICoin>[] = LAYERS.map((layer) => ({
	firstAt: layer.firstAt,
	gap: layer.gap,
	place: (x, random) => {
		const pattern = PATTERNS[Math.floor(random() * PATTERNS.length)];
		const count = Math.round(between(pattern.count, random));
		const height = layer.height(random());
		const big = random() < layer.bigChance ? Math.floor(random() * count) : -1;

		return pattern.shape(count, layer.spacing).map(({ dx, dy }, i) => ({
			x: x + dx,
			y: height + dy,
			value: i === big ? layer.bigValue : layer.value,
			collectedAt: null,
		}));
	},
}));

/** The first coin at or past x, by binary search (coins are kept in order along the course). */
function firstFrom(coins: ICoin[], x: number): number {
	let low = 0;
	let high = coins.length;

	while (low < high) {
		const middle = (low + high) >> 1;

		if (coins[middle].x < x) {
			low = middle + 1;
		} else {
			high = middle;
		}
	}

	return low;
}

/**
 * The coins with more added, each slotted into place: coins are kept in order along the
 * course, so collecting can look only near the elf.
 */
export function addCoins(coins: ICoin[], more: ICoin[]): ICoin[] {
	const merged = [...coins];

	for (const coin of more) {
		merged.splice(firstFrom(merged, coin.x), 0, coin);
	}

	return merged;
}

/** How fast a magnet pulls coins toward the elf, in m/s. */
const PULL_SPEED = 22;

/**
 * Collects every coin within reach of the elf at (x, y), and with the candy magnet, draws
 * nearby coins toward it first. Returns the coins and what was collected this step.
 */
export function collectCoins(
	coins: ICoin[],
	x: number,
	y: number,
	time: number,
	magnet: number,
	dt: number,
): { coins: ICoin[]; gained: number } {
	let gained = 0;
	// Copied only once a coin is collected or pulled: most steps change nothing.
	let updated: ICoin[] | null = null;
	// Only coins near the elf can change. A pulled coin drifts a little out of order, toward the
	// elf, so look a metre wider than the magnet's reach either side.
	const reach = magnet + 1;

	for (let index = firstFrom(coins, x - reach); index < coins.length && coins[index].x <= x + reach; index++) {
		const coin = coins[index];

		if (coin.collectedAt !== null || Math.abs(coin.x - x) > magnet) {
			continue;
		}

		const distance = Math.hypot(coin.x - x, coin.y - y);
		let next: ICoin | null = null;

		if (distance <= COLLECT_RADIUS) {
			gained += coin.value;
			next = { ...coin, collectedAt: time };
		} else if (distance <= magnet) {
			// Inside the magnet's reach: drift toward the elf.
			const pull = Math.min(distance, PULL_SPEED * dt) / distance;
			next = { ...coin, x: coin.x + (x - coin.x) * pull, y: coin.y + (y - coin.y) * pull };
		}

		if (next) {
			updated ??= [...coins];
			updated[index] = next;
		}
	}

	return { coins: updated ?? coins, gained };
}
