import type { IPalette } from "Components/ElfFling/draw";
import { MISSIONS, RANKS, type IBall, type IPinballState } from "Components/Pinball/pinball";
import {
	ARCH_POINTS,
	BALL_RADIUS,
	BELLS,
	BUMPERS,
	DROP_BANK,
	DROP_TARGETS,
	FLIPPER_IDS,
	FLIPPERS,
	flipperTip,
	GATE,
	KICKBACK,
	LANE_BOTTOM,
	LANE_TRIGGER_Y,
	LANE_LETTERS,
	LANE_POSTS,
	LANES,
	PLUNGER,
	RAIL_IDS,
	RAILS,
	railPoint,
	SAUCER,
	SLINGSHOTS,
	TABLE,
	WALLS,
	type IFlipperId,
	type IPoint,
	type IRailId,
	type ISegment,
} from "Components/Pinball/table";

/**
 * The pinball machine in 2.5D, like the old Windows "3D Pinball": a dot-matrix display across
 * the top, and under it the flat table the rules play on, tilted away from the player in
 * perspective (narrower at the far end), with walls, bumpers, targets and flippers standing up
 * off it and casting shadows, and the two ramps raised on posts above it. Lit inserts on the
 * playfield show what's lit. Elf Fling's colours. The view is VIEW across and down; the caller
 * scales the context to fit.
 */

export const VIEW = { width: 420, height: 724 };
const DISPLAY_HEIGHT = 58;
/** Where the table's far edge is drawn, and how much it's squashed into the distance. */
const TABLE_TOP = 70;
const DEPTH_SQUASH = 0.9;
/** The far end of the table is drawn this much smaller than the near end. */
const FAR_SCALE = 0.76;
/** How tall things stand off the table, in table units. */
const WALL_HEIGHT = 12;
const SLING_HEIGHT = 16;
const TARGET_HEIGHT = 14;
const FLIPPER_HEIGHT = 9;
const FLASH_SECONDS = 0.18;
const SHADOW = "rgba(5, 12, 15, 0.45)";
const WALL_SIDE = "#8a6420";
const BRICK = "#a8452f";
const CABINET = "#2b1a10";
/** The display's dot-matrix amber, and its unlit dots. */
const DOT_LIT = "#ffb43c";
const DOT_DIM = "#3a2408";
const INSERT_DIM = "rgba(243, 217, 164, 0.16)";

type IProjected = { x: number; y: number; scale: number };

const onRail = (ball: IBall) => ball.at === "rail";

/** Where a point on (or `z` above) the table appears: shrunk towards the middle with distance, and lifted by height. */
function project(x: number, y: number, z = 0): IProjected {
	const scale = FAR_SCALE + (1 - FAR_SCALE) * (y / TABLE.height);

	return {
		x: VIEW.width / 2 + (x - VIEW.width / 2) * scale,
		y: TABLE_TOP + y * DEPTH_SQUASH - z * scale * 0.85,
		scale,
	};
}

export function drawPinball(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	const blink = Math.floor(state.time * 4) % 2 === 0;
	context.fillStyle = CABINET;
	context.fillRect(0, 0, VIEW.width, VIEW.height);
	drawPlayfield(context, palette);
	drawInserts(context, palette, state, blink);
	drawSaucer(context, palette, state, blink);
	drawPlunger(context, palette, state.pull);
	drawLanes(context, palette, state, blink);
	drawDropTargets(context, palette, state.drops);
	drawWalls(context, palette);
	drawBells(context, palette, state);
	drawSlingshots(context, palette, state);
	drawBumpers(context, palette, state);
	FLIPPER_IDS.forEach((id) => drawFlipper(context, palette, id, state.flippers[id].angle));

	// Balls on the table go under the ramps; ones riding them go on top.
	state.balls.filter((ball) => !onRail(ball)).forEach((ball) => drawBall(context, palette, ball, BALL_RADIUS));
	RAIL_IDS.forEach((id) => drawRail(context, palette, id));
	state.balls
		.filter(onRail)
		.forEach((ball) => drawBall(context, palette, ball, RAILS[ball.rail!.id].height + BALL_RADIUS));

	drawDisplay(context, state, blink);

	if (state.message?.big && state.time < state.message.until) {
		drawBigMessage(context, palette, state.message.text);
	}
}

function polygon(context: CanvasRenderingContext2D, points: IProjected[]) {
	context.beginPath();
	points.forEach((point, index) => (index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
	context.closePath();
}

function circleAt(context: CanvasRenderingContext2D, point: IPoint, radius: number, fill: string) {
	const at = project(point.x, point.y);
	context.fillStyle = fill;
	context.beginPath();
	context.ellipse(at.x, at.y, radius * at.scale, radius * at.scale * DEPTH_SQUASH, 0, 0, Math.PI * 2);
	context.fill();
}

/** The playfield inside the walls and under the arch, with a Christmas tree painted on it. */
function drawPlayfield(context: CanvasRenderingContext2D, palette: IPalette) {
	const outline = [
		project(20, TABLE.height),
		...ARCH_POINTS.map((point) => project(point.x, point.y)),
		project(PLUNGER.right, TABLE.height),
	];
	const field = context.createLinearGradient(0, TABLE_TOP, 0, VIEW.height);
	field.addColorStop(0, palette.skyTop);
	field.addColorStop(0.45, palette.greenDark);
	field.addColorStop(1, palette.green);
	context.fillStyle = field;
	polygon(context, outline);
	context.fill();

	context.fillStyle = palette.skyTop;
	context.globalAlpha = 0.35;
	polygon(context, [project(200, 340), project(268, 470), project(132, 470)]);
	context.fill();
	polygon(context, [project(200, 390), project(290, 560), project(110, 560)]);
	context.fill();
	context.globalAlpha = 1;

	// A starburst around the chimney.
	context.strokeStyle = INSERT_DIM;
	context.lineWidth = 2;

	for (let ray = 0; ray < 16; ray++) {
		const angle = (ray / 16) * Math.PI * 2;
		const from = project(SAUCER.x + Math.cos(angle) * 22, SAUCER.y + Math.sin(angle) * 22);
		const to = project(SAUCER.x + Math.cos(angle) * 40, SAUCER.y + Math.sin(angle) * 40);
		context.beginPath();
		context.moveTo(from.x, from.y);
		context.lineTo(to.x, to.y);
		context.stroke();
	}
}

/** A lit (or unlit) arrow on the table, pointing along `angle`. */
function drawArrow(context: CanvasRenderingContext2D, at: IPoint, angle: number, lit: boolean, colour: string) {
	const point = (forward: number, across: number) =>
		project(
			at.x + Math.cos(angle) * forward - Math.sin(angle) * across,
			at.y + Math.sin(angle) * forward + Math.cos(angle) * across,
		);
	context.fillStyle = lit ? colour : INSERT_DIM;
	polygon(context, [point(14, 0), point(-8, 10), point(-4, 0), point(-8, -10)]);
	context.fill();
}

/** Labelled lights painted on the table: what's lit, and what's been done. */
function drawInserts(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState, blink: boolean) {
	const mission = state.mission && MISSIONS[state.mission.index];
	const comboLit = state.time - state.lastRampAt < 4;
	// The ramps' arrows flash when a ramp is worth more: a jackpot, a combo, or the mission.
	const arrowLit = (event: "sleigh" | "ramp") => (state.multiball || comboLit || mission?.event === event) && blink;
	drawArrow(context, { x: 60, y: 344 }, -Math.PI * 0.62, arrowLit("sleigh"), palette.gold);
	drawArrow(context, { x: 281, y: 352 }, -Math.PI / 2, arrowLit("ramp"), palette.gold);
	// Under the reindeer and the bells, the same for their missions.
	drawArrow(context, { x: 140, y: 318 }, -Math.PI * 0.75, mission?.event === "reindeer" && blink, palette.redBright);
	drawArrow(context, { x: 345, y: 328 }, 0, mission?.event === "bell" && blink, palette.redBright);

	context.font = "800 9px Nunito, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";
	const label = (text: string, at: IPoint, lit: boolean) => {
		const p = project(at.x, at.y);
		context.fillStyle = lit ? palette.gold : INSERT_DIM;
		context.fillText(text, p.x, p.y);
	};

	// The bonus multiplier, 2x to 5x, between the slingshots.
	[2, 3, 4, 5].forEach((times, index) => {
		const at = { x: 152 + index * 32, y: 470 };
		circleAt(context, at, 11, state.multiplier >= times ? palette.goldDeep : INSERT_DIM);
		label(`${times}x`, at, state.multiplier < times);
	});

	// Lock lights under the chimney, and the lock itself flashing when it's lit.
	[0, 1].forEach((index) =>
		circleAt(context, { x: 188 + index * 24, y: 312 }, 6, state.locks > index ? palette.redBright : INSERT_DIM),
	);
	label("LOCK", { x: 200, y: 328 }, state.lockLit && blink);

	// The kickback at the bottom of the left outlane, and the ball save between the flippers.
	circleAt(
		context,
		{ x: (KICKBACK.left + KICKBACK.right) / 2, y: KICKBACK.y - 30 },
		7,
		state.kickback ? palette.gold : INSERT_DIM,
	);
	label("SAVE", { x: 200, y: 690 }, state.time < state.ballSaveUntil && blink);
}

/** The chimney: a brick ring round a dark hole, glowing when it'll lock the ball. */
function drawSaucer(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState, blink: boolean) {
	circleAt(context, SAUCER, SAUCER.radius + 7, BRICK);
	circleAt(context, SAUCER, SAUCER.radius, "#0a0604");

	if (state.lockLit && blink) {
		context.globalAlpha = 0.5;
		circleAt(context, SAUCER, SAUCER.radius + 7, palette.gold);
		context.globalAlpha = 1;
	}
}

/** The plunger lane's groove and the plunger, pulled back as far as it's held. */
function drawPlunger(context: CanvasRenderingContext2D, palette: IPalette, pull: number) {
	context.fillStyle = "rgba(0, 0, 0, 0.3)";
	polygon(context, [
		project(PLUNGER.left, PLUNGER.top),
		project(PLUNGER.right, PLUNGER.top),
		project(PLUNGER.right, TABLE.height),
		project(PLUNGER.left, TABLE.height),
	]);
	context.fill();

	const top = PLUNGER.floor + pull * 14;
	context.fillStyle = palette.redBright;
	polygon(context, [
		project(PLUNGER.left + 5, top),
		project(PLUNGER.right - 5, top),
		project(PLUNGER.right - 5, top + 6),
		project(PLUNGER.left + 5, top + 6),
	]);
	context.fill();
	// The spring, squashed as it's pulled.
	const from = project(PLUNGER.x, top + 6);
	const to = project(PLUNGER.x, TABLE.height);
	const coils = 6;
	context.strokeStyle = palette.snowShade;
	context.lineWidth = 2;
	context.beginPath();

	for (let coil = 0; coil <= coils * 2; coil++) {
		const y = from.y + ((to.y - from.y) * coil) / (coils * 2);
		const x = from.x + (coil % 2 === 0 ? -5 : 5);

		if (coil === 0) {
			context.moveTo(x, y);
		} else {
			context.lineTo(x, y);
		}
	}

	context.stroke();
}

/** The N-O-E-L lanes' letters, lit as they're rolled over; the skill shot lane flashes. */
function drawLanes(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState, blink: boolean) {
	context.font = "800 12px Nunito, sans-serif";
	context.textAlign = "center";
	context.textBaseline = "middle";

	LANES.forEach((x, index) => {
		const lit = state.lanes[index] || (state.skillLane === index && blink);
		circleAt(context, { x, y: LANE_TRIGGER_Y }, 10, lit ? palette.goldDeep : INSERT_DIM);
		const at = project(x, LANE_TRIGGER_Y);
		context.fillStyle = lit ? palette.skyTop : palette.gold;
		context.fillText(LANE_LETTERS[index], at.x, at.y + 1);
	});

	for (const x of LANE_POSTS) {
		circleAt(context, { x, y: LANE_BOTTOM }, 4, palette.goldDeep);
	}
}

/** A wall as a raised strip: its side face, then its top edge. */
function drawRaisedSegment(
	context: CanvasRenderingContext2D,
	{ a, b }: ISegment,
	height: number,
	side: string,
	top: string,
	width: number,
) {
	polygon(context, [project(a.x, a.y), project(b.x, b.y), project(b.x, b.y, height), project(a.x, a.y, height)]);
	context.fillStyle = side;
	context.fill();
	const from = project(a.x, a.y, height);
	const to = project(b.x, b.y, height);
	context.strokeStyle = top;
	context.lineWidth = width * ((from.scale + to.scale) / 2);
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(from.x, from.y);
	context.lineTo(to.x, to.y);
	context.stroke();
}

function drawWalls(context: CanvasRenderingContext2D, palette: IPalette) {
	for (const wall of WALLS) {
		drawRaisedSegment(context, wall, WALL_HEIGHT, WALL_SIDE, palette.goldDeep, 4);
	}

	drawRaisedSegment(context, GATE, WALL_HEIGHT * 0.6, WALL_SIDE, palette.snowShade, 2);
}

/** The reindeer bank: the block, and each target standing up from it, red, or down flat. */
function drawDropTargets(context: CanvasRenderingContext2D, palette: IPalette, down: boolean[]) {
	const { front, back } = DROP_BANK;
	context.fillStyle = WALL_SIDE;
	polygon(context, [
		project(front.a.x, front.a.y, 6),
		project(front.b.x, front.b.y, 6),
		project(back.b.x, back.b.y, 6),
		project(back.a.x, back.a.y, 6),
	]);
	context.fill();

	DROP_TARGETS.forEach((target, index) => {
		if (down[index]) {
			drawRaisedSegment(context, target, 2, "rgba(0, 0, 0, 0.4)", palette.snowShade, 2);
		} else {
			drawRaisedSegment(context, target, TARGET_HEIGHT, palette.red, palette.white, 4);
		}
	});
}

/** The bells against the right wall: gold, flashing when hit, bright once rung. */
function drawBells(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	BELLS.forEach((bell, index) => {
		const lit = state.bells[index] || state.time - state.bellHitAt[index] < FLASH_SECONDS;
		drawRaisedSegment(context, bell, TARGET_HEIGHT, WALL_SIDE, lit ? palette.gold : palette.goldDeep, 5);
		// A little bell on its face.
		const at = project(bell.a.x - 6, (bell.a.y + bell.b.y) / 2, TARGET_HEIGHT * 0.5);
		context.fillStyle = lit ? palette.gold : palette.goldDeep;
		context.globalAlpha = lit ? 1 : 0.6;
		context.beginPath();
		context.moveTo(at.x - 8, at.y + 6);
		context.quadraticCurveTo(at.x - 7, at.y - 9, at.x, at.y - 9);
		context.quadraticCurveTo(at.x + 7, at.y - 9, at.x + 8, at.y + 6);
		context.closePath();
		context.fill();
		context.beginPath();
		context.arc(at.x, at.y + 7, 2.5, 0, Math.PI * 2);
		context.fill();
		context.globalAlpha = 1;
	});
}

function drawSlingshots(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	SLINGSHOTS.forEach(({ a, b }, index) => {
		const lit = state.time - state.slingshotHitAt[index] < FLASH_SECONDS;
		const stripes = 8;

		for (let stripe = 0; stripe < stripes; stripe++) {
			const from = {
				x: a.x + ((b.x - a.x) * stripe) / stripes,
				y: a.y + ((b.y - a.y) * stripe) / stripes,
			};
			const to = {
				x: a.x + ((b.x - a.x) * (stripe + 1)) / stripes,
				y: a.y + ((b.y - a.y) * (stripe + 1)) / stripes,
			};
			const colour = stripe % 2 === 0 ? palette.redBright : palette.white;
			drawRaisedSegment(
				context,
				{ a: from, b: to },
				SLING_HEIGHT,
				lit ? palette.gold : palette.red,
				colour,
				lit ? 9 : 7,
			);
		}
	});
}

/** Each bumper is a glass bauble on a short gold post, its shadow on the table beneath. */
function drawBumpers(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	const colours = [palette.red, palette.green, palette.goldDeep];

	BUMPERS.forEach((bumper, index) => {
		const lit = state.time - state.bumperHitAt[index] < FLASH_SECONDS;
		const base = project(bumper.x, bumper.y);
		const radius = bumper.radius * base.scale;
		const centre = project(bumper.x, bumper.y, bumper.radius + 6);

		context.fillStyle = SHADOW;
		context.beginPath();
		context.ellipse(base.x + 4, base.y + 3, radius, radius * 0.45, 0, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = palette.goldDeep;
		context.fillRect(base.x - 4 * base.scale, centre.y, 8 * base.scale, base.y - centre.y);

		if (lit) {
			context.fillStyle = palette.gold;
			context.globalAlpha = 0.45;
			context.beginPath();
			context.arc(centre.x, centre.y, radius + 10, 0, Math.PI * 2);
			context.fill();
			context.globalAlpha = 1;
		}

		const shine = context.createRadialGradient(
			centre.x - radius * 0.35,
			centre.y - radius * 0.35,
			radius * 0.1,
			centre.x,
			centre.y,
			radius,
		);
		shine.addColorStop(0, palette.white);
		shine.addColorStop(0.25, lit ? palette.redBright : colours[index % colours.length]);
		shine.addColorStop(1, "rgba(15, 32, 39, 0.9)");
		context.fillStyle = shine;
		context.beginPath();
		context.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = palette.gold;
		context.fillRect(centre.x - 5 * base.scale, centre.y - radius - 6 * base.scale, 10 * base.scale, 7 * base.scale);
	});
}

/** A candy cane standing off the table: its shadow, its side, and its striped top. */
function drawFlipper(context: CanvasRenderingContext2D, palette: IPalette, id: IFlipperId, angle: number) {
	const { pivot, radius } = FLIPPERS[id];
	const tip = flipperTip(id, angle);
	const base = [project(pivot.x, pivot.y), project(tip.x, tip.y)];
	const top = [project(pivot.x, pivot.y, FLIPPER_HEIGHT), project(tip.x, tip.y, FLIPPER_HEIGHT)];
	const width = radius * 2 * base[1].scale;

	context.lineCap = "round";
	context.strokeStyle = SHADOW;
	context.lineWidth = width;
	context.beginPath();
	context.moveTo(base[0].x + 4, base[0].y + 3);
	context.lineTo(base[1].x + 4, base[1].y + 3);
	context.stroke();
	context.strokeStyle = palette.snowShade;
	context.beginPath();
	context.moveTo(base[0].x, base[0].y);
	context.lineTo(base[1].x, base[1].y);
	context.stroke();
	context.strokeStyle = palette.white;
	context.beginPath();
	context.moveTo(top[0].x, top[0].y);
	context.lineTo(top[1].x, top[1].y);
	context.stroke();
	context.strokeStyle = palette.redBright;
	context.lineWidth = 4 * base[1].scale;
	context.lineCap = "butt";

	for (let stripe = 1; stripe < 6; stripe += 2) {
		const from = stripe / 6;
		const to = (stripe + 0.6) / 6;
		context.beginPath();
		context.moveTo(top[0].x + (top[1].x - top[0].x) * from, top[0].y + (top[1].y - top[0].y) * from);
		context.lineTo(top[0].x + (top[1].x - top[0].x) * to, top[0].y + (top[1].y - top[0].y) * to);
		context.stroke();
	}
}

/**
 * A ramp on posts, its shadow on the table below and an arch over its mouth. The sleigh track
 * is a pair of gold wires; the reindeer ramp clear red plastic with white edges.
 */
function drawRail(context: CanvasRenderingContext2D, palette: IPalette, id: IRailId) {
	const { path, length, mouth, height } = RAILS[id];
	const sleigh = id === "sleigh";
	const trace = (z: number, offset: number) => {
		context.beginPath();
		path.forEach((point, index) => {
			const p = project(point.x + offset, point.y, z);

			if (index === 0) {
				context.moveTo(p.x, p.y);
			} else {
				context.lineTo(p.x, p.y);
			}
		});
		context.stroke();
	};

	context.lineJoin = "round";
	context.lineCap = "round";
	context.strokeStyle = SHADOW;
	context.lineWidth = sleigh ? 6 : 12;
	trace(0, 4);

	// The mouth's arch.
	const left = project(mouth.left, mouth.bottom);
	const right = project(mouth.right, mouth.bottom);
	const top = project((mouth.left + mouth.right) / 2, mouth.bottom, height * 0.6);
	context.strokeStyle = palette.gold;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(left.x, left.y);
	context.quadraticCurveTo(left.x, top.y, top.x, top.y);
	context.quadraticCurveTo(right.x, top.y, right.x, right.y);
	context.stroke();

	// Posts every so often, down to the table.
	context.strokeStyle = WALL_SIDE;
	context.lineWidth = 2;

	for (let post = 1; post <= 8; post++) {
		const point = railPoint(id, (post / 8) * length);
		const foot = project(point.x, point.y);
		const head = project(point.x, point.y, height);
		context.beginPath();
		context.moveTo(foot.x, foot.y);
		context.lineTo(head.x, head.y);
		context.stroke();
	}

	if (sleigh) {
		context.strokeStyle = palette.gold;
		context.lineWidth = 2.5;
		trace(height, -6);
		trace(height, 6);
	} else {
		// Clear red plastic, so what's under it shows through, with white edges.
		context.globalAlpha = 0.45;
		context.strokeStyle = palette.red;
		context.lineWidth = 14;
		trace(height, 0);
		context.globalAlpha = 1;
		context.strokeStyle = palette.white;
		context.lineWidth = 1.5;
		trace(height, -7);
		trace(height, 7);
	}
}

/** A snowball: a soft shadow on the table under it, and a shaded sphere `z` above. */
function drawBall(context: CanvasRenderingContext2D, palette: IPalette, ball: IBall, z: number) {
	const ground = project(ball.x, ball.y);
	const centre = project(ball.x, ball.y, z);
	const radius = BALL_RADIUS * ground.scale;
	context.fillStyle = SHADOW;
	context.beginPath();
	context.ellipse(ground.x + 3, ground.y + 2, radius, radius * 0.5, 0, 0, Math.PI * 2);
	context.fill();
	const shine = context.createRadialGradient(
		centre.x - radius * 0.4,
		centre.y - radius * 0.4,
		radius * 0.1,
		centre.x,
		centre.y,
		radius,
	);
	shine.addColorStop(0, palette.white);
	shine.addColorStop(1, palette.snowShade);
	context.fillStyle = shine;
	context.beginPath();
	context.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
	context.fill();
}

/** What the display's second line says: the latest message, or the mission, or how things stand. */
function displayLine(state: IPinballState): string {
	if (state.message && state.time < state.message.until) {
		return state.message.text;
	}

	if (state.mission) {
		const mission = MISSIONS[state.mission.index];
		const seconds = Math.max(0, Math.ceil(state.mission.until - state.time));

		return `${mission.name} ${state.mission.progress}/${mission.goal}  ${seconds}`;
	}

	if (state.multiball) {
		return `Multiball: ramps for ${state.jackpot.toLocaleString()}`;
	}

	if (state.balls.some((ball) => ball.at === "plunger")) {
		return "Pull the plunger";
	}

	return RANKS[state.rank];
}

/** The dot-matrix display across the top: score and ball, and a line of news. */
function drawDisplay(context: CanvasRenderingContext2D, state: IPinballState, blink: boolean) {
	const margin = 8;
	context.fillStyle = "#0c0703";
	context.fillRect(margin, margin, VIEW.width - margin * 2, DISPLAY_HEIGHT - margin);

	// The unlit dots behind everything.
	context.fillStyle = DOT_DIM;

	for (let y = margin + 3; y < DISPLAY_HEIGHT - 2; y += 4) {
		for (let x = margin + 3; x < VIEW.width - margin - 2; x += 4) {
			context.fillRect(x, y, 2, 2);
		}
	}

	context.fillStyle = DOT_LIT;
	context.shadowColor = DOT_LIT;
	context.shadowBlur = 6;
	context.textBaseline = "middle";
	context.font = '700 22px "Courier New", monospace';
	context.textAlign = "right";
	context.fillText(state.score.toLocaleString(), VIEW.width - margin - 10, margin + 15);
	context.textAlign = "left";
	context.font = '700 13px "Courier New", monospace';
	const ball = state.over || state.endsAt !== null ? "GAME OVER" : `BALL ${Math.max(1, state.ballNumber)}`;
	const extra = state.ballsLeft > 1 && state.endsAt === null ? `  +${state.ballsLeft - 1}` : "";
	context.fillText(ball + extra, margin + 10, margin + 15);
	const flashing = state.message && state.time < state.message.until && state.message.big;

	if (!flashing || blink) {
		context.textAlign = "center";
		context.fillText(displayLine(state).toUpperCase(), VIEW.width / 2, margin + 37);
	}

	context.shadowBlur = 0;
	context.textBaseline = "alphabetic";
}

function drawBigMessage(context: CanvasRenderingContext2D, palette: IPalette, text: string) {
	context.font = '700 34px "Mountains of Christmas", Nunito, serif';
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.lineWidth = 6;
	context.strokeStyle = "rgba(15, 32, 39, 0.85)";
	context.strokeText(text, VIEW.width / 2, 400);
	context.fillStyle = palette.gold;
	context.fillText(text, VIEW.width / 2, 400);
	context.textBaseline = "alphabetic";
}
