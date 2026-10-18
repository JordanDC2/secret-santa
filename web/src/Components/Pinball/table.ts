/**
 * Christmas pinball's table: where everything stands, with no rules or drawing. Table units
 * (TABLE.width across, TABLE.height down, y down). The playfield runs from x 20 to 380, the
 * plunger lane down the right from 380 to 404.
 *
 * Top to bottom: four N-O-E-L rollover lanes under the arch; three bauble pop bumpers below
 * them; the chimney (a saucer that holds the ball) in the middle; the sleigh track's mouth on
 * the left wall and the reindeer ramp's in the middle right; a bank of three reindeer drop
 * targets on the left and three bell targets on the right wall, under a small upper flipper;
 * then the slingshots, inlanes, outlanes (a kickback in the left one) and the flippers.
 */

export const TABLE = { width: 420, height: 720 };
/** The playfield's middle, which its left and right halves mirror about. */
const MIDDLE = 200;
export const BALL_RADIUS = 9;

export type IPoint = { x: number; y: number };
export type ISegment = { a: IPoint; b: IPoint };
export type IBox = { left: number; right: number; top: number; bottom: number };

export function segment(ax: number, ay: number, bx: number, by: number): ISegment {
	return { a: { x: ax, y: ay }, b: { x: bx, y: by } };
}

function flip({ x, y }: IPoint): IPoint {
	return { x: 2 * MIDDLE - x, y };
}

/** Left-hand segments, and the same mirrored to the right. */
function mirrored(segments: ISegment[]): ISegment[] {
	return [...segments, ...segments.map(({ a, b }) => ({ a: flip(a), b: flip(b) }))];
}

/** The arch over the top of the table, from the left wall to the plunger lane's outer wall. */
const ARCH = { x: 212, y: 130, across: 192, up: 112 };
export const ARCH_POINTS: IPoint[] = Array.from({ length: 17 }, (_, index) => {
	const angle = Math.PI + (index / 16) * Math.PI;

	return {
		x: ARCH.x + Math.cos(angle) * ARCH.across,
		y: ARCH.y + Math.sin(angle) * ARCH.up,
	};
});

/** The plunger lane: where the ball waits on the plunger, and the lane's walls. */
export const PLUNGER = {
	x: 392,
	y: 691,
	top: 172,
	left: 380,
	right: 404,
	floor: 700,
};

/** The rollover lanes' posts: four lanes, N, O, E, L, between five posts. */
export const LANE_POSTS = [120, 160, 200, 240, 280];
export const LANE_TOP = 58;
export const LANE_BOTTOM = 94;
/** Each lane's middle, and the line across them that lights it. */
export const LANES = [140, 180, 220, 260];
export const LANE_TRIGGER_Y = 78;
export const LANE_LETTERS = ["N", "O", "E", "L"];

/**
 * The reindeer: a bank of three drop targets on a block, low on the left, facing down and
 * right (towards the right flipper). Knock one and it drops into the block; the ball can then
 * reach its back wall, a little behind.
 */
const BANK_FRONT = segment(88, 316, 142, 262);
const BANK_DEPTH = 12;
const BANK_NORMAL = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
const bankBack = (point: IPoint) => ({
	x: point.x - BANK_NORMAL.x * BANK_DEPTH,
	y: point.y - BANK_NORMAL.y * BANK_DEPTH,
});
/** The point a fraction `t` along the bank's front. */
const alongBank = (t: number) => ({
	x: BANK_FRONT.a.x + (BANK_FRONT.b.x - BANK_FRONT.a.x) * t,
	y: BANK_FRONT.a.y + (BANK_FRONT.b.y - BANK_FRONT.a.y) * t,
});
export const DROP_TARGETS: ISegment[] = [0, 1, 2].map((index) => ({
	a: alongBank(index / 3 + 0.02),
	b: alongBank((index + 1) / 3 - 0.02),
}));
export const DROP_BANK = {
	front: BANK_FRONT,
	back: { a: bankBack(BANK_FRONT.a), b: bankBack(BANK_FRONT.b) },
};

/** Three bell targets standing against the right wall, facing left. */
export const BELLS: ISegment[] = [300, 328, 356].map((y) => segment(373, y - 10, 373, y + 10));

/** The chimney: a hole in the middle that holds the ball for a moment, and locks it when lit. */
export const SAUCER = { x: 200, y: 274, radius: 13 };
/** It catches a ball passing over it slower than this. */
export const SAUCER_CATCH_SPEED = 520;

/** Bauble pop bumpers under the lanes. */
export const BUMPERS = [
	{ x: 150, y: 142, radius: 22 },
	{ x: 250, y: 142, radius: 22 },
	{ x: 200, y: 196, radius: 22 },
];

/** Candy-striped slingshots above the flippers: they kick the ball back up and across. */
export const SLINGSHOTS: ISegment[] = mirrored([segment(86, 430, 112, 540)]);

/** The kickback, at the bottom of the left outlane: when lit, it fires the ball back up. */
export const KICKBACK = { left: 20, right: 48, y: 650 };

export const WALLS: ISegment[] = [
	// The left wall, the arch and the plunger lane's outer wall.
	segment(20, 740, 20, ARCH.y),
	...ARCH_POINTS.slice(1).map((point, index) => ({
		a: ARCH_POINTS[index],
		b: point,
	})),
	segment(PLUNGER.right, ARCH.y, PLUNGER.right, 740),
	// The plunger lane's inner wall (the playfield's right wall) and its floor.
	segment(PLUNGER.left, PLUNGER.top, PLUNGER.left, 740),
	segment(PLUNGER.left, PLUNGER.floor, PLUNGER.right, PLUNGER.floor),
	// The lane posts.
	...LANE_POSTS.map((x) => segment(x, LANE_TOP, x, LANE_BOTTOM)),
	// The reindeer bank's back and ends (its front is the drop targets).
	DROP_BANK.back,
	{ a: DROP_BANK.front.a, b: DROP_BANK.back.a },
	{ a: DROP_BANK.front.b, b: DROP_BANK.back.b },
	...mirrored([
		// The post between outlane and inlane, capped with a slant towards the wall so about half
		// the balls coming down the side are turned into the inlane, and the inlane's guide.
		segment(48, 470, 48, 740),
		segment(48, 470, 40, 460),
		segment(48, 520, 118, 600),
		// The slingshot's back and underside (its kicking face is in SLINGSHOTS).
		segment(86, 430, 74, 520),
		segment(74, 520, 112, 540),
	]),
];

/**
 * The gate at the top of the plunger lane: a launched ball goes up through it, but a ball
 * coming around the arch bounces off it, back into play. Solid only from above.
 */
export const GATE = segment(PLUNGER.left, PLUNGER.top, PLUNGER.right, PLUNGER.top - 22);

/** The flippers: the main two and a small one on the right wall, worked with the right. */
export type IFlipperId = "left" | "right" | "upper";
export type IFlipperSide = "left" | "right";
export const FLIPPERS: Record<
	IFlipperId,
	{
		side: IFlipperSide;
		pivot: IPoint;
		length: number;
		radius: number;
		rest: number;
		raised: number;
	}
> = {
	left: {
		side: "left",
		pivot: { x: 118, y: 600 },
		length: 74,
		radius: 7,
		rest: 0.5,
		raised: -0.45,
	},
	right: {
		side: "right",
		pivot: { x: 282, y: 600 },
		length: 74,
		radius: 7,
		rest: Math.PI - 0.5,
		raised: Math.PI + 0.45,
	},
	upper: {
		side: "right",
		pivot: { x: 372, y: 238 },
		length: 46,
		radius: 6,
		rest: Math.PI - 0.9,
		raised: Math.PI + 0.3,
	},
};
export const FLIPPER_IDS = Object.keys(FLIPPERS) as IFlipperId[];

/**
 * The raised tracks. A ball going up into a mouth (faster than RAIL_ENTRY_SPEED) climbs aboard,
 * rides it without touching anything below, and drops off the end into an inlane. The sleigh
 * track opens on the left wall, climbs it, crosses the top and comes down the right; the
 * reindeer ramp opens in the middle right, loops over the bumpers and comes down the left.
 */
export type IRailId = "sleigh" | "reindeer";
export type IRail = {
	path: IPoint[];
	/** Where along the rail each point is, from its start. */
	along: number[];
	length: number;
	mouth: IBox;
	/** How high it's raised, for the drawing. */
	height: number;
};

function rail(path: IPoint[], mouth: IBox, height: number): IRail {
	const along = path.reduce<number[]>(
		(distances, point, index) =>
			index === 0
				? [0]
				: [...distances, distances[index - 1] + Math.hypot(point.x - path[index - 1].x, point.y - path[index - 1].y)],
		[],
	);

	return { path, along, length: along[along.length - 1], mouth, height };
}

export const RAILS: Record<IRailId, IRail> = {
	sleigh: rail(
		[
			{ x: 43, y: 296 },
			{ x: 43, y: 180 },
			{ x: 52, y: 120 },
			{ x: 80, y: 78 },
			{ x: 130, y: 50 },
			{ x: 200, y: 40 },
			{ x: 270, y: 48 },
			{ x: 320, y: 74 },
			{ x: 350, y: 120 },
			{ x: 358, y: 180 },
			{ x: 358, y: 330 },
			{ x: 346, y: 400 },
			{ x: 336, y: 445 },
		],
		{ left: 24, right: 62, top: 286, bottom: 306 },
		48,
	),
	reindeer: rail(
		[
			{ x: 281, y: 318 },
			{ x: 300, y: 250 },
			{ x: 298, y: 180 },
			{ x: 272, y: 122 },
			{ x: 220, y: 96 },
			{ x: 160, y: 100 },
			{ x: 112, y: 132 },
			{ x: 86, y: 190 },
			{ x: 74, y: 280 },
			{ x: 68, y: 380 },
			{ x: 64, y: 445 },
		],
		{ left: 262, right: 300, top: 308, bottom: 328 },
		32,
	),
};
export const RAIL_IDS = Object.keys(RAILS) as IRailId[];

/** The point `along` a rail from its start. */
export function railPoint(id: IRailId, along: number): IPoint {
	const { path, along: distances } = RAILS[id];
	const index = Math.min(
		path.length - 1,
		Math.max(
			1,
			distances.findIndex((distance) => distance >= along),
		),
	);
	const from = path[index - 1];
	const to = path[index];
	const t = Math.min(1, (along - distances[index - 1]) / (distances[index] - distances[index - 1]));

	return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** A flipper's tip, from its pivot along its angle. */
export function flipperTip(id: IFlipperId, angle: number): IPoint {
	const { pivot, length } = FLIPPERS[id];

	return {
		x: pivot.x + Math.cos(angle) * length,
		y: pivot.y + Math.sin(angle) * length,
	};
}

export function inBox(point: IPoint, box: IBox): boolean {
	return point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
}
