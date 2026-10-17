/**
 * Coins hanging in the air along the course, in little patterns (a row, an arc, a column, a
 * slope) of random sizes at random heights. The elf collects any it flies or slides through;
 * now and then a pattern has a big coin worth five. A fresh layout each round.
 */

export type ICoin = {
	x: number;
	y: number;
	value: number;
	/** Game time it was collected, or null while it's still there. */
	collectedAt: number | null;
};

/** Generous on purpose: the elf and coins are drawn bigger than life when zoomed out. */
export const COLLECT_RADIUS = 1;
export const BIG_COIN_VALUE = 5;

const FIRST_AT = { min: 4, max: 9 };
const GAP = { min: 4, max: 12 };
const COURSE_LENGTH = 800;
const SPACING = 1.3;
const BIG_COIN_CHANCE = 0.15;

type IPattern = (count: number, height: number) => Array<{ dx: number; dy: number }>;

const PATTERNS: Array<{ shape: IPattern; count: { min: number; max: number } }> = [
	// A row.
	{
		shape: (count) => Array.from({ length: count }, (_, i) => ({ dx: i * SPACING, dy: 0 })),
		count: { min: 3, max: 7 },
	},
	// An arc, like a little rainbow.
	{
		shape: (count) =>
			Array.from({ length: count }, (_, i) => {
				const t = count === 1 ? 0.5 : i / (count - 1);
				return { dx: i * SPACING, dy: 4 * t * (1 - t) * 2.5 };
			}),
		count: { min: 5, max: 9 },
	},
	// A column.
	{
		shape: (count) => Array.from({ length: count }, (_, i) => ({ dx: 0, dy: i * SPACING })),
		count: { min: 3, max: 5 },
	},
	// A slope, rising.
	{
		shape: (count) => Array.from({ length: count }, (_, i) => ({ dx: i * SPACING, dy: i * SPACING * 0.7 })),
		count: { min: 4, max: 6 },
	},
];

export function layCoins(random: () => number = Math.random): ICoin[] {
	const between = (range: { min: number; max: number }) => range.min + random() * (range.max - range.min);
	const coins: ICoin[] = [];

	for (let x = between(FIRST_AT); x < COURSE_LENGTH; x += between(GAP)) {
		const pattern = PATTERNS[Math.floor(random() * PATTERNS.length)];
		const count = Math.round(between(pattern.count));
		// Low patterns are easy pickings on a slide; high ones need a good flight.
		const height = 0.5 + random() ** 2 * 13;
		const big = random() < BIG_COIN_CHANCE ? Math.floor(random() * count) : -1;

		pattern.shape(count, height).forEach(({ dx, dy }, i) => {
			coins.push({ x: x + dx, y: height + dy, value: i === big ? BIG_COIN_VALUE : 1, collectedAt: null });
		});
	}

	return coins;
}

/** Collects every coin within reach of (x, y) at this time; returns the coins and what they were worth. */
export function collectCoins(coins: ICoin[], x: number, y: number, time: number): { coins: ICoin[]; gained: number } {
	let gained = 0;
	const updated = coins.map((coin) => {
		if (coin.collectedAt !== null || Math.abs(coin.x - x) > COLLECT_RADIUS) {
			return coin;
		}

		if (Math.hypot(coin.x - x, coin.y - y) > COLLECT_RADIUS) {
			return coin;
		}

		gained += coin.value;

		return { ...coin, collectedAt: time };
	});

	return gained === 0 ? { coins, gained } : { coins: updated, gained };
}
