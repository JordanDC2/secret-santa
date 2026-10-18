/**
 * Coins hanging in the air along the course, in little patterns (a row, an arc, a column, a
 * slope) of random sizes at random heights. The elf collects any it flies or slides through.
 * Two layers: plenty of low coins worth 1 (now and then a big one worth 5), and fewer sky
 * coins high up worth 3 (now and then 10), which only well-upgraded throws can reach.
 * A fresh layout each round.
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

type IRange = { min: number; max: number };

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

const COURSE_LENGTH = 6000;

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

export function layCoins(random: () => number = Math.random): ICoin[] {
	const between = (range: IRange) => range.min + random() * (range.max - range.min);
	const coins: ICoin[] = [];

	for (const layer of LAYERS) {
		for (let x = between(layer.firstAt); x < COURSE_LENGTH; x += between(layer.gap)) {
			const pattern = PATTERNS[Math.floor(random() * PATTERNS.length)];
			const count = Math.round(between(pattern.count));
			const height = layer.height(random());
			const big = random() < layer.bigChance ? Math.floor(random() * count) : -1;

			pattern.shape(count, layer.spacing).forEach(({ dx, dy }, i) => {
				coins.push({ x: x + dx, y: height + dy, value: i === big ? layer.bigValue : layer.value, collectedAt: null });
			});
		}
	}

	return coins;
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
	// Copied only once a coin is collected or pulled: most steps change nothing, and the course is long.
	let updated: ICoin[] | null = null;

	coins.forEach((coin, index) => {
		if (coin.collectedAt !== null || Math.abs(coin.x - x) > magnet) {
			return;
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
	});

	return { coins: updated ?? coins, gained };
}
