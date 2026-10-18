/**
 * Christmas pinball's table: where everything stands, with no rules or drawing. It follows the
 * layout of Space Cadet (3D Pinball for Windows) element for element, themed for Christmas;
 * each element's Space Cadet name is in its comment. Table units: TABLE.width across and
 * TABLE.height down, y down. The playfield runs from x 20 to 492, the plunger lane (Space
 * Cadet's deployment chute) down the right from 492 to 520.
 */

export const TABLE = { width: 540, height: 1000 };
/** The playfield's middle, which the flippers, slingshots and lanes at the bottom mirror about. */
const MIDDLE = 256;
export const BALL_RADIUS = 9;

export type IPoint = { x: number; y: number };
export type ISegment = { a: IPoint; b: IPoint };
type IBox = { left: number; right: number; top: number; bottom: number };
export type ICircle = { x: number; y: number; radius: number };

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

/** A run of `count` targets along a line, each a segment with a little gap between. */
function targetsAlong(from: IPoint, to: IPoint, count: number): ISegment[] {
	const at = (t: number) => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });

	return Array.from({ length: count }, (_, index) => ({
		a: at(index / count + 0.04),
		b: at((index + 1) / count - 0.04),
	}));
}

/** The arch over the top, from the left wall to the plunger lane's outer wall. */
const ARCH = { x: 270, y: 170, across: 250, up: 150 };
const ARCH_SEGMENTS = 48;
export const ARCH_POINTS: IPoint[] = Array.from({ length: ARCH_SEGMENTS + 1 }, (_, index) => {
	const angle = Math.PI + (index / ARCH_SEGMENTS) * Math.PI;

	return { x: ARCH.x + Math.cos(angle) * ARCH.across, y: ARCH.y + Math.sin(angle) * ARCH.up };
});

/** Where round the arch a point is: its angle from the arch's right end, 0 to pi. */
export function archAngle(point: IPoint): number {
	return Math.atan2((ARCH.y - point.y) / ARCH.up, (point.x - ARCH.x) / ARCH.across);
}

/** The point on the arch at an angle from its right end. */
export function archPoint(angle: number): IPoint {
	return { x: ARCH.x + Math.cos(angle) * ARCH.across, y: ARCH.y - Math.sin(angle) * ARCH.up };
}

/**
 * The plunger lane (deployment chute): where the ball waits, the lane's walls, and the six
 * cookie rollovers up it (fuel rollovers), each adding a cookie to the gauge as the ball goes up.
 */
export const PLUNGER = { x: 510.5, y: 966, top: 230, left: 492, right: 520, floor: 975 };
export const COOKIE_ROLLOVERS = [900, 820, 740, 660, 580, 500];

/**
 * The skill shot (skill shot gates): six lights the launched ball passes on its way up, the
 * first at the top of the lane, the rest round the arch (by angle from its right end; past the
 * top, a ball's fast enough to go all the way round). The launch scores for how many it lit,
 * and three, a medium pull, is best.
 */
export const SKILL_GATES = { laneTop: 236, archAngles: [0.25, 0.6, 0.95, 1.3, 1.5] };
export const SKILL_SHOT_POINTS = [15000, 30000, 75000, 30000, 15000, 7500];

/** The J-O-Y lanes under the arch (re-entry lanes): their posts, and the line across that lights each. */
export const JOY_POSTS = [222, 256, 290, 324];
const JOY_TOP = 64;
const JOY_BOTTOM = 108;
export const JOY_LANES = [239, 273, 307];
export const JOY_TRIGGER_Y = 86;
export const JOY_LETTERS = ["J", "O", "Y"];

/** The pop bumpers: three baubles and the star (attack bumpers, with the satellite bumper). */
export const BAUBLE_BUMPERS: ICircle[] = [
	{ x: 246, y: 226, radius: 21 },
	{ x: 322, y: 214, radius: 21 },
	{ x: 286, y: 292, radius: 21 },
];
export const STAR_BUMPER: ICircle = { x: 96, y: 152, radius: 18 };
/**
 * The workshop's three bumpers (launch bumpers), in their pocket on the left: close enough
 * together that the ball can't get between them, with room down either side.
 */
export const WORKSHOP_BUMPERS: ICircle[] = [
	{ x: 55, y: 566, radius: 13 },
	{ x: 95, y: 566, radius: 13 },
	{ x: 75, y: 600, radius: 13 },
];

/**
 * The chimneys (wormholes): sink one and the ball pops out of whichever is lit as the
 * destination, along its `out`. Green and red at the top either side of the lanes, gold on
 * the right.
 */
export type IChimneyId = "green" | "red" | "gold";
export const CHIMNEYS: Record<IChimneyId, ICircle & { out: IPoint }> = {
	green: { x: 174, y: 102, radius: 13, out: { x: 40, y: 180 } },
	red: { x: 362, y: 110, radius: 13, out: { x: -150, y: 130 } },
	gold: { x: 452, y: 590, radius: 13, out: { x: -80, y: 160 } },
};
export const CHIMNEY_IDS: IChimneyId[] = ["green", "red", "gold"];

/**
 * The kickout holes: each holds the ball a moment and kicks it out along `out`. The aurora
 * (hyperspace kickout) at the top of its chute; the snow globe (gravity well) in the middle of
 * the rank lights; the coal bin (black hole) low on the left.
 */
export type IKickoutId = "aurora" | "globe" | "coal";
export const KICKOUTS: Record<IKickoutId, ICircle & { out: IPoint }> = {
	aurora: { x: 470, y: 200, radius: 14, out: { x: -420, y: 40 } },
	globe: { x: 256, y: 640, radius: 16, out: { x: -260, y: -220 } },
	coal: { x: 176, y: 452, radius: 13, out: { x: 240, y: -160 } },
};
export const KICKOUT_IDS: IKickoutId[] = ["aurora", "globe", "coal"];
/** The rings of lights round the snow globe: ranks (the middle circle) and progress (the outer). */
export const RANK_RING = { radius: 50, count: 9 };
export const PROGRESS_RING = { radius: 84, count: 18 };

/**
 * The aurora chute (hyperspace chute): a lane up the right side to the aurora kickout at its
 * top. Its inner wall's left face carries the snowflake targets and the weathervane.
 */
const CHUTE = { left: 448, top: 184, wallTop: 222, bottom: 440 };
export const AURORA_CHUTE = { left: CHUTE.left, right: PLUNGER.left, triggerY: 400 };

/** The left orbit (fuel chute): a lane up the left side, round under the arch. */
const ORBIT = { wall: 80, top: 236, bottom: 430 };

/** Spinners (flags): the cocoa spinner in the left orbit, the aurora spinner in its chute. */
export type ISpinnerId = "cocoa" | "aurora";
export const SPINNERS: Record<ISpinnerId, ISegment> = {
	cocoa: segment(20, 380, ORBIT.wall, 380),
	aurora: segment(CHUTE.left, 360, PLUNGER.left, 360),
};
export const SPINNER_IDS: ISpinnerId[] = ["cocoa", "aurora"];

/** The sleigh bell rollover (space warp rollover), up the left orbit. */
export const SLEIGH_BELL_ROLLOVER = { left: 20, right: ORBIT.wall, y: 300 };

/**
 * The workshop: a pocket on the left the sleigh ramp drops into, through three toy lanes
 * (launch lanes) onto its bumpers, then out of its open bottom over the stocking lane.
 */
const WORKSHOP = { roofLeft: 470, roofRight: 500, wall: 130, bottom: 640 };
export const TOY_POSTS = [54, 92];
const TOY_TOP = 514;
const TOY_BOTTOM = 538;
export const TOY_LANES = [37, 73, 111];
export const TOY_TRIGGER_Y = 526;
/** The stocking lane (bonus lane): crossed on the way out of the workshop. */
export const STOCKING_LANE = { left: 20, right: WORKSHOP.wall, y: 672 };

/** The targets, each a bank of segments. Drop targets fall flat when hit; standups stay up. */
export const TARGETS = {
	// Reindeer drop targets (booster targets), on a block on the right, facing left.
	reindeer: targetsAlong({ x: 404, y: 470 }, { x: 404, y: 546 }, 3),
	// Gold star drop targets (medal targets), on the orbit's inner wall, facing the playfield.
	goldStars: targetsAlong({ x: ORBIT.wall + 4, y: 252 }, { x: ORBIT.wall + 4, y: 336 }, 3),
	// Gift drop targets (multiplier targets), on the left wall inside the orbit.
	gifts: targetsAlong({ x: 27, y: 232 }, { x: 27, y: 316 }, 3),
	// Cookie standups (fuel spot targets), on a block left of the bumpers, facing right.
	cookies: targetsAlong({ x: 196, y: 152 }, { x: 196, y: 218 }, 3),
	// Letter standups (mission spot targets), on the workshop's outer wall, facing right.
	letters: targetsAlong({ x: WORKSHOP.wall + 4, y: 536 }, { x: WORKSHOP.wall + 4, y: 616 }, 3),
	// Icicle standups (left hazard targets), on a block under the star, facing down and right.
	icicles: targetsAlong({ x: 118, y: 250 }, { x: 156, y: 212 }, 3),
	// Snowflake standups (right hazard targets), on the aurora chute's wall, facing left.
	snowflakes: targetsAlong({ x: CHUTE.left - 4, y: 248 }, { x: CHUTE.left - 4, y: 326 }, 3),
	// The weathervane (wormhole destination target), below them: it turns to the next chimney.
	weathervane: targetsAlong({ x: CHUTE.left - 4, y: 346 }, { x: CHUTE.left - 4, y: 376 }, 1),
};
export type ITargetBank = keyof typeof TARGETS;
export const TARGET_BANKS = Object.keys(TARGETS) as ITargetBank[];
export const DROP_BANKS: ITargetBank[] = ["reindeer", "goldStars", "gifts"];

/** A block behind a front face, `depth` deep away from the way it faces (`facing`, a unit vector). */
function block(front: ISegment, facing: IPoint, depth: number): ISegment[] {
	const back = (point: IPoint) => ({ x: point.x - facing.x * depth, y: point.y - facing.y * depth });

	return [
		{ a: back(front.a), b: back(front.b) },
		{ a: front.a, b: back(front.a) },
		{ a: front.b, b: back(front.b) },
	];
}

/** The blocks the cookie, icicle and reindeer targets stand on (the others are on walls), with their fronts. */
const BLOCK_DEPTH = 12;
export const BLOCK_FRONTS: Array<{ front: ISegment; facing: IPoint }> = [
	{ front: segment(196, 152, 196, 218), facing: { x: 1, y: 0 } },
	{ front: segment(118, 250, 156, 212), facing: { x: Math.SQRT1_2, y: Math.SQRT1_2 } },
	{ front: segment(404, 470, 404, 546), facing: { x: -1, y: 0 } },
];
export const BLOCKS: ISegment[][] = BLOCK_FRONTS.map(({ front, facing }) => block(front, facing, BLOCK_DEPTH));

/** The slingshots above the flippers (lower rebounds), and the two upper rebounds. */
export const SLINGSHOTS: ISegment[] = mirrored([segment(98, 690, 134, 843)]);
export const REBOUNDS: ISegment[] = [
	segment(ORBIT.wall, ORBIT.bottom, 104, 458),
	segment(CHUTE.left, CHUTE.bottom, 428, 468),
];

/** The top of the post between the left outlane and return lane, and its slanted cap. */
const OUTLANE_POST = { x: 52, y: 745 };
const OUTLANE_CAP = { x: 42, y: 731 };
const OUTLANE_PEG = { x: (OUTLANE_POST.x + OUTLANE_CAP.x) / 2, y: (OUTLANE_POST.y + OUTLANE_CAP.y) / 2 };
/** The middle of each post's cap: a rubber-ringed peg. */
export const OUTLANE_PEGS = [OUTLANE_PEG, flip(OUTLANE_PEG)];
/** The line across the outlanes and return lanes that counts a ball going down them. */
export const LOWER_LANES = { y: 790, outlane: OUTLANE_POST.x, returnLane: 98, middle: MIDDLE };
/** The kickbacks at the bottom of the outlanes (out lane kickers): lit, they fire the ball back up. */
export const KICKBACK_Y = 900;

/** The center post (drain ball blocker): it rises between the flippers while it's lit. */
export const CENTER_POST: ICircle = { x: MIDDLE, y: 972, radius: 8 };

export const WALLS: ISegment[] = [
	// The left wall, the arch and the plunger lane's outer wall.
	segment(20, 1020, 20, ARCH.y),
	...ARCH_POINTS.slice(1).map((point, index) => ({ a: ARCH_POINTS[index], b: point })),
	segment(PLUNGER.right, ARCH.y, PLUNGER.right, 1020),
	// The plunger lane's inner wall (the playfield's right wall) and its floor.
	segment(PLUNGER.left, PLUNGER.top, PLUNGER.left, 1020),
	segment(PLUNGER.left, PLUNGER.floor, PLUNGER.right, PLUNGER.floor),
	// The J-O-Y lane posts and the toy lane posts.
	...JOY_POSTS.map((x) => segment(x, JOY_TOP, x, JOY_BOTTOM)),
	...TOY_POSTS.map((x) => segment(x, TOY_TOP, x, TOY_BOTTOM)),
	// The aurora chute: the cap over its kickout (sloping, so a ball can't rest on it), and its
	// inner wall (open between the two, so the kickout can kick the ball out over the bumpers).
	segment(CHUTE.left, CHUTE.top, PLUNGER.left, CHUTE.top - 16),
	segment(CHUTE.left, CHUTE.wallTop, CHUTE.left, CHUTE.bottom),
	// The left orbit's inner wall.
	segment(ORBIT.wall, ORBIT.top, ORBIT.wall, ORBIT.bottom),
	// The workshop: its roof, sloping down to the right so a ball coming back down the orbit
	// rolls out into play, and its outer wall.
	segment(20, WORKSHOP.roofLeft, WORKSHOP.wall, WORKSHOP.roofRight),
	segment(WORKSHOP.wall, WORKSHOP.roofRight, WORKSHOP.wall, WORKSHOP.bottom),
	// The target blocks.
	...BLOCKS.flat(),
	...mirrored([
		// The post between outlane and return lane, capped with a slant towards the wall so about
		// half the balls coming down the side are turned into the return lane, and the return
		// lane's guide down to the flipper.
		segment(OUTLANE_POST.x, OUTLANE_POST.y, OUTLANE_POST.x, 1020),
		segment(OUTLANE_POST.x, OUTLANE_POST.y, OUTLANE_CAP.x, OUTLANE_CAP.y),
		segment(OUTLANE_POST.x, 815, 142, 926),
		// The slingshot's back and underside (its kicking face is in SLINGSHOTS).
		segment(98, 690, 81, 815),
		segment(81, 815, 134, 843),
	]),
];

/**
 * The gate at the top of the plunger lane: a launched ball goes up through it, but a ball
 * coming round the arch bounces off it, into the aurora kickout. Solid only from above.
 */
export const GATE = segment(PLUNGER.left, PLUNGER.top, PLUNGER.right, PLUNGER.top - 30);

export type IFlipperSide = "left" | "right";
export const FLIPPERS: Record<
	IFlipperSide,
	{ pivot: IPoint; length: number; radius: number; rest: number; raised: number }
> = {
	left: { pivot: { x: 142, y: 926 }, length: 103, radius: 10, rest: 0.5, raised: -0.45 },
	right: { pivot: { x: 370, y: 926 }, length: 103, radius: 10, rest: Math.PI - 0.5, raised: Math.PI + 0.45 },
};
export const FLIPPER_SIDES: IFlipperSide[] = ["left", "right"];

/**
 * The sleigh ramp (launch ramp): its mouth faces the flippers from the middle left; a ball going
 * up into it faster than the rules' entry speed rides it up and over the left orbit, and drops
 * off the end into the workshop. It rides without touching anything below.
 */
type IRail = {
	path: IPoint[];
	/** Where along the ramp each point is, from its start. */
	along: number[];
	length: number;
	mouth: IBox;
	/** How high it's raised (it slopes up from its mouth and back down at its end), for the drawing. */
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

export const RAMP = rail(
	[
		{ x: 216, y: 370 },
		{ x: 210, y: 316 },
		{ x: 190, y: 270 },
		{ x: 150, y: 238 },
		{ x: 100, y: 222 },
		{ x: 56, y: 252 },
		{ x: 48, y: 330 },
		{ x: 52, y: 420 },
		{ x: 66, y: 470 },
		{ x: 73, y: 500 },
	],
	{ left: 196, right: 236, top: 360, bottom: 382 },
	46,
);

/** The point `along` the ramp from its start. */
export function rampPoint(along: number): IPoint {
	const { path, along: distances } = RAMP;
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
export function flipperTip(side: IFlipperSide, angle: number): IPoint {
	const { pivot, length } = FLIPPERS[side];

	return { x: pivot.x + Math.cos(angle) * length, y: pivot.y + Math.sin(angle) * length };
}

export function inBox(point: IPoint, box: IBox): boolean {
	return point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
}
