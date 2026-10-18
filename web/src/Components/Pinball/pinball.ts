/**
 * Christmas pinball's rules, with no drawing or React: a snowball drops down a chimney onto a
 * table of ornament bumpers, candy-striped slingshots and a row of gift targets, kept in play
 * with two candy-cane flippers. Table units (the table is TABLE.width by TABLE.height, y down)
 * and seconds. Used on its own (the Games page) and as Elf Fling's secret level.
 */

export const TABLE = { width: 400, height: 720 };
export const BALL_RADIUS = 9;
const GRAVITY = 900;
const MAX_SPEED = 1800;
/** Each second runs in this many steps, so a fast ball can't pass through a wall. */
export const STEP = 1 / 480;

type IPoint = { x: number; y: number };
export type ISegment = { a: IPoint; b: IPoint };

/**
 * The walls. The outer rails, rounded at the top. Low on each side a post splits the way down:
 * outside it runs the outlane, which drains past the flippers however well they're played;
 * inside it the inlane, whose guide leads down to the flipper. Between the inlane and the
 * middle sits the slingshot, a solid triangle.
 */
export const WALLS: ISegment[] = [
	segment(20, 740, 20, 120),
	segment(20, 120, 60, 52),
	segment(60, 52, 140, 22),
	segment(140, 22, 260, 22),
	segment(260, 22, 340, 52),
	segment(340, 52, 380, 120),
	segment(380, 120, 380, 740),
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

/** Candy-striped slingshots above the flippers: they kick the ball back up and across. */
export const SLINGSHOTS: ISegment[] = mirrored([segment(86, 430, 112, 540)]);
const SLINGSHOT_KICK = 380;

/** Ornament bumpers: hit one and it kicks the ball away. */
export const BUMPERS = [
	{ x: 130, y: 235, radius: 24 },
	{ x: 270, y: 235, radius: 24 },
	{ x: 200, y: 320, radius: 26 },
];
const BUMPER_KICK = 520;

/** Gift targets in a row near the top: each lights up when hit; light them all for a bonus. */
export const GIFTS = [96, 148, 200, 252, 304].map((x) => ({ x, y: 150, width: 30, height: 18 }));
/** How far a gift's lid peaks above its sides. */
export const GIFT_PEAK = 8;

/** Candy-cane flippers: the pivot, length, and the angles at rest and raised (radians, y down). */
export const FLIPPER_LENGTH = 74;
export const FLIPPER_RADIUS = 7;
const FLIPPERS = {
	left: { pivot: { x: 118, y: 600 }, rest: 0.5, raised: -0.45 },
	right: { pivot: { x: 282, y: 600 }, rest: Math.PI - 0.5, raised: Math.PI + 0.45 },
};
const FLIPPER_SPEED = 20;

/** Points. */
export const POINTS = { bumper: 100, slingshot: 10, gift: 250, allGifts: 5000 };
/** An extra ball every this many points. */
export const EXTRA_BALL_EVERY = 30000;
const SERVE_DELAY = 1;
/** A ball barely moving for this long gets nudged, as a player would nudge a real table. */
const STILL_SPEED = 25;
const NUDGE_AFTER = 1.2;

export type IFlipperSide = "left" | "right";
export type IFlipper = { angle: number; omega: number };

export type IPinballState = {
	time: number;
	ball: { x: number; y: number; vx: number; vy: number } | null;
	/** Balls still to come, counting the one in play. */
	ballsLeft: number;
	score: number;
	flippers: Record<IFlipperSide, IFlipper>;
	held: Record<IFlipperSide, boolean>;
	/** When each bumper and slingshot was last hit (for the flash), or -Infinity. */
	bumperHitAt: number[];
	slingshotHitAt: number[];
	gifts: boolean[];
	/** When the next ball drops in, while one's on its way. */
	serveAt: number | null;
	nextExtraBallAt: number;
	/** A message over the table, until a time ("Extra ball!"). */
	message: { text: string; until: number } | null;
	/** How long the ball has been barely moving (for the nudge). */
	stillFor: number;
	/** Counts the sounds go by. */
	hits: number;
	drains: number;
	extraBalls: number;
	over: boolean;
};

export function newPinball(balls = 3): IPinballState {
	return {
		time: 0,
		ball: null,
		ballsLeft: balls,
		score: 0,
		flippers: {
			left: { angle: FLIPPERS.left.rest, omega: 0 },
			right: { angle: FLIPPERS.right.rest, omega: 0 },
		},
		held: { left: false, right: false },
		bumperHitAt: BUMPERS.map(() => -Infinity),
		slingshotHitAt: SLINGSHOTS.map(() => -Infinity),
		gifts: GIFTS.map(() => false),
		serveAt: 0.4,
		nextExtraBallAt: EXTRA_BALL_EVERY,
		message: null,
		stillFor: 0,
		hits: 0,
		drains: 0,
		extraBalls: 0,
		over: false,
	};
}

/** Press or let go of a flipper. */
export function hold(state: IPinballState, side: IFlipperSide, down: boolean): IPinballState {
	return state.held[side] === down ? state : { ...state, held: { ...state.held, [side]: down } };
}

/** The flipper's tip, from its pivot along its angle. */
export function flipperTip(side: IFlipperSide, angle: number): IPoint {
	const { pivot } = FLIPPERS[side];

	return { x: pivot.x + Math.cos(angle) * FLIPPER_LENGTH, y: pivot.y + Math.sin(angle) * FLIPPER_LENGTH };
}

export function flipperPivot(side: IFlipperSide): IPoint {
	return FLIPPERS[side].pivot;
}

/** Moves the game on by one STEP. */
export function step(state: IPinballState, random: () => number = Math.random): IPinballState {
	if (state.over) {
		return state;
	}

	const dt = STEP;
	let next: IPinballState = { ...state, time: state.time + dt, flippers: moveFlippers(state, dt) };

	if (next.serveAt !== null && next.time >= next.serveAt) {
		next = {
			...next,
			serveAt: null,
			// Down the chimney, with a little nudge either way.
			ball: { x: 200 + (random() - 0.5) * 20, y: 40, vx: (random() - 0.5) * 160, vy: 60 },
		};
	}

	if (!next.ball) {
		return next;
	}

	const ball = { ...next.ball };
	ball.vy += GRAVITY * dt;
	ball.x += ball.vx * dt;
	ball.y += ball.vy * dt;
	next = { ...next, ball };
	next = collide(next);

	const speed = Math.hypot(next.ball!.vx, next.ball!.vy);

	if (speed > MAX_SPEED) {
		next.ball!.vx *= MAX_SPEED / speed;
		next.ball!.vy *= MAX_SPEED / speed;
	}

	// Stuck somewhere? A nudge, up and to one side, gets it going again.
	next.stillFor = speed < STILL_SPEED ? next.stillFor + dt : 0;

	if (next.stillFor > NUDGE_AFTER) {
		next.ball!.vx += (random() < 0.5 ? -1 : 1) * 120;
		next.ball!.vy -= 140;
		next.stillFor = 0;
	}

	if (next.ball!.y > TABLE.height + BALL_RADIUS * 2) {
		return drain(next);
	}

	return awardExtraBall(next);
}

function moveFlippers(state: IPinballState, dt: number): Record<IFlipperSide, IFlipper> {
	const move = (side: IFlipperSide): IFlipper => {
		const { rest, raised } = FLIPPERS[side];
		const target = state.held[side] ? raised : rest;
		const { angle } = state.flippers[side];
		const room = target - angle;
		const turn = Math.sign(room) * Math.min(Math.abs(room), FLIPPER_SPEED * dt);

		return { angle: angle + turn, omega: turn / dt };
	};

	return { left: move("left"), right: move("right") };
}

/** Bounces the ball off everything it's touching, scoring as it goes. */
function collide(state: IPinballState): IPinballState {
	let next = state;
	const ball = next.ball!;

	for (const wall of WALLS) {
		bounceOffSegment(ball, wall, BALL_RADIUS, 0.45, 0);
	}

	SLINGSHOTS.forEach((sling, index) => {
		if (bounceOffSegment(ball, sling, BALL_RADIUS, 0.5, SLINGSHOT_KICK)) {
			next = scored(next, POINTS.slingshot, { slingshotHitAt: replace(next.slingshotHitAt, index, next.time) });
		}
	});

	BUMPERS.forEach((bumper, index) => {
		const dx = ball.x - bumper.x;
		const dy = ball.y - bumper.y;
		const distance = Math.hypot(dx, dy);
		const reach = bumper.radius + BALL_RADIUS;

		if (distance < reach && distance > 0) {
			const nx = dx / distance;
			const ny = dy / distance;
			ball.x = bumper.x + nx * reach;
			ball.y = bumper.y + ny * reach;
			// Kicked straight away from the bumper's centre, whatever came in.
			ball.vx = nx * BUMPER_KICK;
			ball.vy = ny * BUMPER_KICK;
			next = scored(next, POINTS.bumper, { bumperHitAt: replace(next.bumperHitAt, index, next.time) });
		}
	});

	GIFTS.forEach((gift, index) => {
		if (bounceOffBox(ball, gift) && !next.gifts[index]) {
			const gifts = replace(next.gifts, index, true);

			if (gifts.every(Boolean)) {
				next = scored(next, POINTS.gift + POINTS.allGifts, {
					gifts: gifts.map(() => false),
					message: { text: "All the gifts!", until: next.time + 1.5 },
				});
			} else {
				next = scored(next, POINTS.gift, { gifts });
			}
		}
	});

	for (const side of ["left", "right"] as const) {
		bounceOffFlipper(ball, side, next.flippers[side]);
	}

	return next;
}

function scored(state: IPinballState, points: number, changes: Partial<IPinballState>): IPinballState {
	return { ...state, ...changes, score: state.score + points, hits: state.hits + 1 };
}

function awardExtraBall(state: IPinballState): IPinballState {
	if (state.score < state.nextExtraBallAt) {
		return state;
	}

	return {
		...state,
		ballsLeft: state.ballsLeft + 1,
		nextExtraBallAt: state.nextExtraBallAt + EXTRA_BALL_EVERY,
		extraBalls: state.extraBalls + 1,
		message: { text: "Extra ball!", until: state.time + 1.5 },
	};
}

/** The ball's gone down between the flippers: the next drops in, or that was the last. */
function drain(state: IPinballState): IPinballState {
	const ballsLeft = state.ballsLeft - 1;

	return {
		...state,
		ball: null,
		ballsLeft,
		drains: state.drains + 1,
		serveAt: ballsLeft > 0 ? state.time + SERVE_DELAY : null,
		over: ballsLeft === 0,
	};
}

/**
 * Pushes the ball out of a segment it overlaps and bounces it off (restitution `bounce`),
 * adding `kick` straight out from the surface. Mutates the ball; returns whether it touched.
 */
function bounceOffSegment(
	ball: { x: number; y: number; vx: number; vy: number },
	{ a, b }: ISegment,
	radius: number,
	bounce: number,
	kick: number,
): boolean {
	const closest = closestPoint(ball, a, b);
	const dx = ball.x - closest.x;
	const dy = ball.y - closest.y;
	const distance = Math.hypot(dx, dy);

	if (distance >= radius || distance === 0) {
		return false;
	}

	const nx = dx / distance;
	const ny = dy / distance;
	ball.x = closest.x + nx * radius;
	ball.y = closest.y + ny * radius;
	const into = ball.vx * nx + ball.vy * ny;

	if (into < 0) {
		ball.vx -= (1 + bounce) * into * nx;
		ball.vy -= (1 + bounce) * into * ny;

		if (kick > 0) {
			ball.vx += nx * kick;
			ball.vy += ny * kick;
		}
	}

	return true;
}

/**
 * A gift target is a small box with a peaked lid, so a ball can't come to rest on top: it
 * bounces off whichever side it hit.
 */
function bounceOffBox(
	ball: { x: number; y: number; vx: number; vy: number },
	box: { x: number; y: number; width: number; height: number },
): boolean {
	const left = box.x - box.width / 2;
	const top = box.y - box.height / 2;
	const corners = [
		{ x: left, y: top },
		{ x: box.x, y: top - GIFT_PEAK },
		{ x: left + box.width, y: top },
		{ x: left + box.width, y: top + box.height },
		{ x: left, y: top + box.height },
	];
	let touched = false;

	for (let side = 0; side < corners.length; side++) {
		const edge = { a: corners[side], b: corners[(side + 1) % corners.length] };
		touched = bounceOffSegment(ball, edge, BALL_RADIUS, 0.6, 0) || touched;
	}

	return touched;
}

/**
 * The flipper is a rounded bar from its pivot to its tip. A moving flipper bats the ball with
 * the speed of the bar where it touches, so the tip hits hardest.
 */
function bounceOffFlipper(
	ball: { x: number; y: number; vx: number; vy: number },
	side: IFlipperSide,
	flipper: IFlipper,
) {
	const pivot = FLIPPERS[side].pivot;
	const tip = flipperTip(side, flipper.angle);
	const closest = closestPoint(ball, pivot, tip);
	const dx = ball.x - closest.x;
	const dy = ball.y - closest.y;
	const distance = Math.hypot(dx, dy);
	const reach = BALL_RADIUS + FLIPPER_RADIUS;

	if (distance >= reach || distance === 0) {
		return;
	}

	const nx = dx / distance;
	const ny = dy / distance;
	ball.x = closest.x + nx * reach;
	ball.y = closest.y + ny * reach;
	// The bar's own speed where the ball touches it (spinning about the pivot).
	const surfaceVx = -flipper.omega * (closest.y - pivot.y);
	const surfaceVy = flipper.omega * (closest.x - pivot.x);
	const relativeVx = ball.vx - surfaceVx;
	const relativeVy = ball.vy - surfaceVy;
	const into = relativeVx * nx + relativeVy * ny;

	if (into < 0) {
		ball.vx = surfaceVx + relativeVx - 1.3 * into * nx;
		ball.vy = surfaceVy + relativeVy - 1.3 * into * ny;
	}
}

function closestPoint(p: IPoint, a: IPoint, b: IPoint): IPoint {
	const abx = b.x - a.x;
	const aby = b.y - a.y;
	const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby)));

	return { x: a.x + abx * t, y: a.y + aby * t };
}

/** Left-hand segments, and the same mirrored to the right. */
function mirrored(segments: ISegment[]): ISegment[] {
	return [...segments, ...segments.map(({ a, b }) => ({ a: flipped(a), b: flipped(b) }))];
}

function flipped({ x, y }: IPoint): IPoint {
	return { x: TABLE.width - x, y };
}

function segment(ax: number, ay: number, bx: number, by: number): ISegment {
	return { a: { x: ax, y: ay }, b: { x: bx, y: by } };
}

function replace<T>(items: T[], index: number, value: T): T[] {
	return items.map((item, i) => (i === index ? value : item));
}
