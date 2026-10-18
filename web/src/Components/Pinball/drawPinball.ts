import type { IPalette } from "Components/ElfFling/draw";
import { drawGlows, drawLights, LIGHT_COLOURS } from "Components/Pinball/drawLights";
import { RANKS } from "Components/Pinball/missions";
import {
	centerPostUp,
	COOKIE_GAUGE,
	waitingToLaunch,
	type IBall,
	type IPinballState,
} from "Components/Pinball/pinball";
import {
	ARCH_POINTS,
	BALL_RADIUS,
	BAUBLE_BUMPERS,
	BLOCK_FRONTS,
	BLOCKS,
	CENTER_POST,
	CHIMNEY_IDS,
	CHIMNEYS,
	DROP_BANKS,
	FLIPPER_SIDES,
	FLIPPERS,
	flipperTip,
	GATE,
	KICKOUTS,
	OUTLANE_PEGS,
	PLUNGER,
	RAMP,
	rampPoint,
	REBOUNDS,
	SLINGSHOTS,
	SPINNER_IDS,
	SPINNERS,
	STAR_BUMPER,
	TABLE,
	TARGET_BANKS,
	TARGETS,
	WALLS,
	WORKSHOP_BUMPERS,
	type ICircle,
	type IFlipperSide,
	type IPoint,
	type ISegment,
	type ITargetBank,
} from "Components/Pinball/table";
import {
	DISPLAY_HEIGHT,
	flatCircle,
	polygon,
	polyline,
	project,
	shadowOf,
	VIEW,
	type IProjected,
} from "Components/Pinball/view";

export { VIEW } from "Components/Pinball/view";

/**
 * The pinball machine, drawn: a night-sky playfield laid out like Space Cadet's, its lights
 * (drawLights.ts), and everything standing on it, in 2.5D (view.ts), with shadows. Elf
 * Fling's colours for the Christmas things; the playfield's lights in their own bright ones.
 */

/** How tall things stand off the table, in table units. */
const WALL_HEIGHT = 14;
const SLING_HEIGHT = 18;
const TARGET_HEIGHT = 18;
const FLIPPER_HEIGHT = 11;
const FLASH_SECONDS = 0.18;
const SHADOW = "rgba(2, 4, 12, 0.5)";
const WALL_SIDE = "#7a5a1e";
const BRICK = "#a8452f";
const CABINET = "#1d120a";
/** The night sky the playfield's painted with. */
const SKY = ["#070d24", "#12204a", "#0d2a3a"];
/** The display's dot-matrix amber, and its unlit dots. */
const DOT_LIT = "#ffb43c";
const DOT_DIM = "#3a2408";
/** Each bank of targets' colour. */
const TARGET_COLOURS: Record<ITargetBank, string> = {
	reindeer: "#b5562b",
	goldStars: "#e8b53a",
	gifts: "#2f9e5a",
	cookies: "#c98b4a",
	letters: "#f4ecd8",
	icicles: "#bdefff",
	snowflakes: "#e8f6ff",
	weathervane: "#e8b53a",
};
const CHIMNEY_COLOURS = { green: LIGHT_COLOURS.green, red: LIGHT_COLOURS.red, gold: LIGHT_COLOURS.gold };
/** Ramps slope up from the table over this much of their start, and back down over their end. */
const RAMP_SLOPE = 70;

/** Stars painted on the playfield: fixed, scattered (by a simple hash, so they don't move). */
const STARS = Array.from({ length: 90 }, (_, index) => {
	const hash = (seed: number) => (Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453) % 1;

	return { x: 30 + Math.abs(hash(1)) * 470, y: 30 + Math.abs(hash(2)) * 900, size: 0.6 + Math.abs(hash(3)) * 1.4 };
});

export function drawPinball(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	const waiting = waitingToLaunch(state);
	context.fillStyle = CABINET;
	context.fillRect(0, 0, VIEW.width, VIEW.height);

	// A nudge shakes the table for a moment.
	context.save();
	const shakeAge = state.nudge ? state.time - state.nudge.at : Infinity;

	if (shakeAge < 0.15) {
		const by = 4 * (1 - shakeAge / 0.15);
		const shove = { left: [by, 0], right: [-by, 0], up: [0, -by] }[state.nudge!.direction];
		context.translate(shove[0], shove[1]);
	}

	drawPlayfield(context, palette);
	drawLights(context, state, waiting);
	drawHoles(context, palette, state);
	drawPlunger(context, palette, state.pull);
	drawSpinners(context, palette, state);
	drawWalls(context, palette);
	drawTargets(context, palette, state);
	drawSlingshots(context, palette, state);
	drawBumpers(context, palette, state);

	if (centerPostUp(state).up) {
		drawPeg(
			context,
			palette,
			CENTER_POST,
			CENTER_POST.radius,
			centerPostUp(state).ending && Math.floor(state.time * 8) % 2 === 0 ? palette.gold : palette.redBright,
		);
	}

	FLIPPER_SIDES.forEach((side) => drawFlipper(context, palette, side, state.flippers[side].angle));

	// Balls on the table go under the ramp; ones riding it go on top.
	for (const ball of state.balls) {
		if (ball.at === "table" || ball.at === "plunger") {
			drawBall(context, palette, ball, BALL_RADIUS);
		} else if (ball.at === "kickout") {
			drawBall(context, palette, ball, BALL_RADIUS * 0.4);
		}
	}

	drawRamp(context, palette);

	for (const ball of state.balls) {
		if (ball.at === "ramp") {
			drawBall(context, palette, ball, rampHeight(ball.ramp!.along) + BALL_RADIUS);
		}
	}

	drawGlobe(context, palette, state);
	drawGlows(context, state, waiting);
	context.restore();
	drawDisplay(context, state);

	if (state.message?.big && state.time < state.message.until) {
		drawBigMessage(context, palette, state.message.text);
	}
}

/** The playfield inside the walls and under the arch: a night sky with stars, the northern lights and a tree. */
function drawPlayfield(context: CanvasRenderingContext2D, palette: IPalette) {
	const outline = [
		project(20, TABLE.height),
		...ARCH_POINTS.map((point) => project(point.x, point.y)),
		project(PLUNGER.right, TABLE.height),
	];
	const sky = context.createLinearGradient(0, project(0, 0).y, 0, project(0, TABLE.height).y);
	SKY.forEach((colour, index) => sky.addColorStop(index / (SKY.length - 1), colour));
	context.fillStyle = sky;
	polygon(context, outline);
	context.fill();
	context.save();
	polygon(context, outline);
	context.clip();

	context.fillStyle = palette.white;

	for (const star of STARS) {
		const at = project(star.x, star.y);
		context.globalAlpha = 0.35;
		context.beginPath();
		context.arc(at.x, at.y, star.size * at.scale, 0, Math.PI * 2);
		context.fill();
	}

	// The northern lights across the top right, behind the aurora chute.
	context.globalAlpha = 0.22;
	context.lineCap = "round";

	[LIGHT_COLOURS.green, LIGHT_COLOURS.violet, LIGHT_COLOURS.ice].forEach((colour, band) => {
		context.strokeStyle = colour;
		context.lineWidth = 14 - band * 3;
		const from = project(300, 60 + band * 30);
		const through = project(420, 140 + band * 40);
		const to = project(480, 400 + band * 20);
		context.beginPath();
		context.moveTo(from.x, from.y);
		context.quadraticCurveTo(through.x, through.y - 40, to.x, to.y);
		context.stroke();
	});

	// Painted rings round the snow globe, and a tree below it.
	context.globalAlpha = 0.35;
	context.strokeStyle = palette.goldDeep;
	context.lineWidth = 1.5;

	for (const radius of [66, 102]) {
		flatCircle(context, KICKOUTS.globe, radius);
		context.stroke();
	}

	context.fillStyle = "#0a3b2a";
	context.globalAlpha = 0.8;

	for (const [top, bottom, half] of [
		[748, 806, 40],
		[780, 856, 58],
		[820, 910, 76],
	]) {
		polygon(context, [project(256, top), project(256 + half, bottom), project(256 - half, bottom)]);
		context.fill();
	}

	context.globalAlpha = 1;
	context.restore();

	// Painted labels.
	context.fillStyle = palette.goldDeep;
	context.textAlign = "center";
	context.textBaseline = "middle";

	for (const [text, x, y] of [
		["Sleigh ramp", 216, 392],
		["Aurora", 470, 456],
		["Workshop", 75, 656],
		["Coal bin", 176, 476],
		["Snow globe", 256, 734],
		["Bumpers", 280, 352],
	] as const) {
		const at = project(x, y);
		context.font = `800 ${(11 * at.scale).toFixed(1)}px Nunito, sans-serif`;
		context.fillText(text, at.x, at.y);
	}
}

/** The chimneys (brick, with a coloured rim) and the kickouts (the aurora's and the coal bin's holes). */
function drawHoles(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	for (const id of CHIMNEY_IDS) {
		const chimney = CHIMNEYS[id];
		context.fillStyle = BRICK;
		flatCircle(context, chimney, chimney.radius + 6, 4);
		context.fill();
		context.fillStyle = palette.white;
		flatCircle(context, { x: chimney.x, y: chimney.y - 2 }, chimney.radius + 3, 5);
		context.fill();
		context.fillStyle = CHIMNEY_COLOURS[id];
		flatCircle(context, chimney, chimney.radius + 1, 5);
		context.fill();
		context.fillStyle = "#050302";
		flatCircle(context, chimney, chimney.radius - 3, 5);
		context.fill();
	}

	const hole = (kickout: ICircle, rim: string) => {
		context.fillStyle = rim;
		flatCircle(context, kickout, kickout.radius + 4);
		context.fill();
		context.fillStyle = "#020208";
		flatCircle(context, kickout, kickout.radius - 1);
		context.fill();
	};
	hole(KICKOUTS.aurora, LIGHT_COLOURS.violet);
	hole(KICKOUTS.coal, "#2a2a30");
	hole(KICKOUTS.globe, "#7fb8d6");

	// The coal bin swirls when it's just swallowed a ball.
	if (state.balls.some((ball) => ball.hole === "coal")) {
		context.strokeStyle = palette.redBright;
		context.lineWidth = 1.5;
		flatCircle(context, KICKOUTS.coal, KICKOUTS.coal.radius + 1 + Math.sin(state.time * 20) * 2);
		context.stroke();
	}
}

/** The snow globe: a glass dome over its kickout, with snow inside, brighter when it's lit. */
function drawGlobe(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	const { x, y, radius } = KICKOUTS.globe;
	const centre = project(x, y, radius * 0.8);
	const size = (radius + 4) * centre.scale;
	const glass = context.createRadialGradient(
		centre.x - size * 0.4,
		centre.y - size * 0.4,
		size * 0.1,
		centre.x,
		centre.y,
		size,
	);
	glass.addColorStop(0, "rgba(255, 255, 255, 0.6)");
	glass.addColorStop(0.5, state.globeLit ? "rgba(155, 231, 255, 0.35)" : "rgba(155, 231, 255, 0.15)");
	glass.addColorStop(1, "rgba(155, 231, 255, 0.4)");
	context.fillStyle = glass;
	context.beginPath();
	context.arc(centre.x, centre.y, size, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.white;

	for (let flake = 0; flake < 7; flake++) {
		const angle = flake * 2.4 + state.time * (state.globeLit ? 2 : 0.3);
		context.globalAlpha = 0.8;
		context.beginPath();
		context.arc(
			centre.x + Math.cos(angle) * size * 0.55,
			centre.y + Math.sin(angle * 1.3) * size * 0.5,
			1.2,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.globalAlpha = 1;
}

/** The plunger lane's groove and the plunger, pulled back as far as it's held. */
function drawPlunger(context: CanvasRenderingContext2D, palette: IPalette, pull: number) {
	context.fillStyle = "rgba(0, 0, 0, 0.35)";
	polygon(context, [
		project(PLUNGER.left, PLUNGER.top),
		project(PLUNGER.right, PLUNGER.top),
		project(PLUNGER.right, TABLE.height),
		project(PLUNGER.left, TABLE.height),
	]);
	context.fill();

	const top = PLUNGER.floor + pull * 18;
	context.fillStyle = palette.redBright;
	polygon(context, [
		project(PLUNGER.left + 4, top),
		project(PLUNGER.right - 4, top),
		project(PLUNGER.right - 4, top + 7),
		project(PLUNGER.left + 4, top + 7),
	]);
	context.fill();
	const from = project(PLUNGER.x, top + 7);
	const to = project(PLUNGER.x, TABLE.height + 10);
	const coils = 6;
	context.strokeStyle = palette.snowShade;
	context.lineWidth = 2;
	context.beginPath();

	for (let coil = 0; coil <= coils * 2; coil++) {
		const y = from.y + ((to.y - from.y) * coil) / (coils * 2);
		const x = from.x + (coil % 2 === 0 ? -4 : 4);

		if (coil === 0) {
			context.moveTo(x, y);
		} else {
			context.lineTo(x, y);
		}
	}

	context.stroke();
}

/** The spinners: a plate across the lane, turning over for a while after the ball goes through. */
function drawSpinners(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	for (const id of SPINNER_IDS) {
		const { a, b } = SPINNERS[id];
		const since = state.time - (state.hitAt[`spinner-${id}`] ?? -Infinity);
		const turns = state.hitAt[`spinner-${id}-turns`] ?? 0;
		const turnSeconds = 0.09;
		const angle = since < turns * turnSeconds ? (since / turnSeconds) * Math.PI * 2 : 0;
		const tall = 4 + 14 * Math.abs(Math.cos(angle));
		context.fillStyle = state.time < state.spinnersLitUntil ? palette.gold : palette.snowShade;
		polygon(context, [
			project(a.x + 3, a.y, 6),
			project(b.x - 3, b.y, 6),
			project(b.x - 3, b.y, 6 + tall),
			project(a.x + 3, a.y, 6 + tall),
		]);
		context.fill();
		context.strokeStyle = palette.redBright;
		context.lineWidth = 1.5;
		context.stroke();
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
	OUTLANE_PEGS.forEach((peg) => drawPeg(context, palette, peg, 8, palette.redBright));
}

/** A post with a rubber ring round it, standing a little above the walls. */
function drawPeg(context: CanvasRenderingContext2D, palette: IPalette, at: IPoint, radius: number, middle: string) {
	const foot = project(at.x, at.y);
	const head = project(at.x, at.y, WALL_HEIGHT + 5);
	const across = radius * foot.scale;
	context.fillStyle = WALL_SIDE;
	context.fillRect(foot.x - across, head.y, across * 2, foot.y - head.y);
	context.fillStyle = palette.white;
	context.beginPath();
	context.ellipse(head.x, head.y, across, across * 0.6, 0, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = middle;
	context.beginPath();
	context.ellipse(head.x, head.y, across * 0.45, across * 0.27, 0, 0, Math.PI * 2);
	context.fill();
}

/**
 * The target blocks (level with the walls), and the targets: drop targets standing up from
 * them, or down flat in their slots; standups always up, bright when lit, flashing when hit.
 */
function drawTargets(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	BLOCK_FRONTS.forEach(({ front }, index) => {
		const back = BLOCKS[index][0];
		context.fillStyle = WALL_SIDE;
		polygon(context, [
			project(front.a.x, front.a.y, WALL_HEIGHT),
			project(front.b.x, front.b.y, WALL_HEIGHT),
			project(back.b.x, back.b.y, WALL_HEIGHT),
			project(back.a.x, back.a.y, WALL_HEIGHT),
		]);
		context.fill();
		context.strokeStyle = palette.goldDeep;
		context.lineWidth = 1.5;
		context.stroke();
	});

	for (const bank of TARGET_BANKS) {
		TARGETS[bank].forEach((target, index) => {
			const down = DROP_BANKS.includes(bank) && state.targets[bank][index];
			const flash = state.time - (state.hitAt[`${bank}${index}`] ?? -Infinity) < FLASH_SECONDS;

			if (down) {
				drawRaisedSegment(context, target, 2, "rgba(0, 0, 0, 0.6)", palette.goldDeep, 2);
			} else {
				const lit = !DROP_BANKS.includes(bank) && state.targets[bank][index];
				drawRaisedSegment(
					context,
					target,
					TARGET_HEIGHT,
					TARGET_COLOURS[bank],
					flash || lit ? palette.white : palette.snowShade,
					4,
				);
			}
		});
	}
}

/** Candy-striped slingshots and rebounds. */
function drawSlingshots(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	const striped = (segment: ISegment, lit: boolean, height: number) => {
		const { a, b } = segment;
		const stripes = 8;

		for (let stripe = 0; stripe < stripes; stripe++) {
			const from = { x: a.x + ((b.x - a.x) * stripe) / stripes, y: a.y + ((b.y - a.y) * stripe) / stripes };
			const to = { x: a.x + ((b.x - a.x) * (stripe + 1)) / stripes, y: a.y + ((b.y - a.y) * (stripe + 1)) / stripes };
			const colour = stripe % 2 === 0 ? palette.redBright : palette.white;
			drawRaisedSegment(context, { a: from, b: to }, height, lit ? palette.gold : palette.red, colour, lit ? 9 : 7);
		}
	};
	const flashed = (name: string) => state.time - (state.hitAt[name] ?? -Infinity) < FLASH_SECONDS;
	SLINGSHOTS.forEach((sling, index) => striped(sling, flashed(`sling${index}`), SLING_HEIGHT));
	REBOUNDS.forEach((rebound, index) => striped(rebound, flashed(`rebound${index}`), SLING_HEIGHT * 0.8));
}

/** A glass bauble on a short gold post (or the star, or a workshop drum), its shadow on the table beneath. */
function drawBumper(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	bumper: ICircle,
	colour: string,
	lit: boolean,
	kind: "bauble" | "star" | "drum",
) {
	const base = project(bumper.x, bumper.y);
	const radius = bumper.radius * base.scale;
	const centre = project(bumper.x, bumper.y, bumper.radius + 6);
	const shadow = shadowOf(bumper.x, bumper.y, bumper.radius);
	context.fillStyle = SHADOW;
	context.beginPath();
	context.ellipse(shadow.x, shadow.y, radius, radius * 0.45, 0, 0, Math.PI * 2);
	context.fill();

	if (lit) {
		context.fillStyle = palette.gold;
		context.globalAlpha = 0.5;
		context.beginPath();
		context.arc(centre.x, centre.y, radius + 8 * base.scale, 0, Math.PI * 2);
		context.fill();
		context.globalAlpha = 1;
	}

	if (kind === "drum") {
		// A toy drum: a red side, a white skin, gold rims.
		const top = project(bumper.x, bumper.y, 16);
		context.fillStyle = lit ? palette.redBright : palette.red;
		context.fillRect(base.x - radius, top.y, radius * 2, base.y - top.y);
		context.fillStyle = palette.white;
		context.beginPath();
		context.ellipse(top.x, top.y, radius, radius * 0.5, 0, 0, Math.PI * 2);
		context.fill();
		context.strokeStyle = palette.gold;
		context.lineWidth = 2;
		context.stroke();

		return;
	}

	context.fillStyle = palette.goldDeep;
	context.fillRect(base.x - 4 * base.scale, centre.y, 8 * base.scale, base.y - centre.y);
	const shine = context.createRadialGradient(
		centre.x - radius * 0.35,
		centre.y - radius * 0.35,
		radius * 0.1,
		centre.x,
		centre.y,
		radius,
	);
	shine.addColorStop(0, palette.white);
	shine.addColorStop(0.25, lit ? palette.redBright : colour);
	shine.addColorStop(1, "rgba(15, 32, 39, 0.9)");
	context.fillStyle = shine;
	context.beginPath();
	context.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
	context.fill();

	if (kind === "star") {
		// A five-pointed gold star on top.
		context.fillStyle = palette.gold;
		context.beginPath();

		for (let point = 0; point < 10; point++) {
			const angle = -Math.PI / 2 + (point * Math.PI) / 5;
			const reach = (point % 2 === 0 ? 0.75 : 0.32) * radius;
			context.lineTo(centre.x + Math.cos(angle) * reach, centre.y + Math.sin(angle) * reach);
		}

		context.closePath();
		context.fill();
	} else {
		context.fillStyle = palette.gold;
		context.fillRect(centre.x - 5 * base.scale, centre.y - radius - 6 * base.scale, 10 * base.scale, 7 * base.scale);
	}
}

function drawBumpers(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	const lit = (name: string) => state.time - (state.hitAt[name] ?? -Infinity) < FLASH_SECONDS;
	const colours = [palette.red, palette.green, palette.goldDeep];
	BAUBLE_BUMPERS.forEach((bumper, index) =>
		drawBumper(context, palette, bumper, colours[index], lit(`attack${index}`), "bauble"),
	);
	drawBumper(context, palette, STAR_BUMPER, palette.goldDeep, lit(`attack${BAUBLE_BUMPERS.length}`), "star");
	WORKSHOP_BUMPERS.forEach((bumper, index) =>
		drawBumper(context, palette, bumper, palette.red, lit(`workshop${index}`), "drum"),
	);
}

/** A candy cane standing off the table: its shadow, its side, and its striped top. */
function drawFlipper(context: CanvasRenderingContext2D, palette: IPalette, side: IFlipperSide, angle: number) {
	const { pivot, radius } = FLIPPERS[side];
	const tip = flipperTip(side, angle);
	const base = [project(pivot.x, pivot.y), project(tip.x, tip.y)];
	const top = [project(pivot.x, pivot.y, FLIPPER_HEIGHT), project(tip.x, tip.y, FLIPPER_HEIGHT)];
	const shadow = [shadowOf(pivot.x, pivot.y, FLIPPER_HEIGHT), shadowOf(tip.x, tip.y, FLIPPER_HEIGHT)];
	const width = radius * 2 * base[1].scale;

	context.lineCap = "round";
	context.strokeStyle = SHADOW;
	context.lineWidth = width;
	polyline(context, shadow);
	context.strokeStyle = palette.snowShade;
	polyline(context, base);
	context.strokeStyle = palette.white;
	polyline(context, top);
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

/** How high the ramp is `along` it: rising from the table at its mouth, and back down at its end. */
function rampHeight(along: number): number {
	const t = Math.max(0, Math.min(1, along / RAMP_SLOPE, (RAMP.length - along) / RAMP_SLOPE));

	return RAMP.height * t * t * (3 - 2 * t);
}

/** Points every few units along the ramp, with its height there and the way across it. */
const RAMP_SAMPLE_COUNT = Math.ceil(RAMP.length / 6);
const RAMP_SAMPLES = Array.from({ length: RAMP_SAMPLE_COUNT + 1 }, (_, index) => {
	const along = (index / RAMP_SAMPLE_COUNT) * RAMP.length;
	const ahead = rampPoint(Math.min(RAMP.length, along + 6));
	const behind = rampPoint(Math.max(0, along - 6));
	const distance = Math.hypot(ahead.x - behind.x, ahead.y - behind.y);

	return {
		...rampPoint(along),
		z: rampHeight(along),
		acrossX: -(ahead.y - behind.y) / distance,
		acrossY: (ahead.x - behind.x) / distance,
	};
});

function besideRamp(sample: (typeof RAMP_SAMPLES)[number], offset: number): IProjected {
	return project(sample.x + sample.acrossX * offset, sample.y + sample.acrossY * offset, sample.z);
}

/**
 * The sleigh ramp: clear red plastic with white edges, rising from the table at its mouth (a
 * gold lip across the way in), up on posts, and down into the workshop; its shadow below.
 */
function drawRamp(context: CanvasRenderingContext2D, palette: IPalette) {
	const samples = RAMP_SAMPLES;
	context.lineJoin = "round";
	context.lineCap = "round";
	context.strokeStyle = SHADOW;
	context.lineWidth = 14 * project(100, 300).scale;
	polyline(
		context,
		samples.map((sample) => shadowOf(sample.x, sample.y, sample.z)),
	);

	// Posts where it's up off the table, dark so they don't show through it as stray lines.
	context.strokeStyle = SHADOW;

	for (let index = 8; index < samples.length - 4; index += 9) {
		const sample = samples[index];

		if (sample.z > 12) {
			const foot = project(sample.x, sample.y);
			context.lineWidth = 3 * foot.scale;
			polyline(context, [foot, project(sample.x, sample.y, sample.z)]);
		}
	}

	const left = samples.map((sample) => besideRamp(sample, -10));
	const right = samples.map((sample) => besideRamp(sample, 10));
	context.globalAlpha = 0.45;
	context.fillStyle = palette.red;
	// Along one edge and back along the other.
	polygon(context, [...left, ...right.map((_, index) => right[right.length - 1 - index])]);
	context.fill();
	context.globalAlpha = 1;
	context.strokeStyle = palette.white;
	context.lineWidth = 1.5;
	polyline(context, left);
	polyline(context, right);
	context.strokeStyle = palette.gold;
	context.lineWidth = 3;
	polyline(context, [besideRamp(samples[0], -13), besideRamp(samples[0], 13)]);
}

/** A snowball: a soft shadow on the table under it, and a shaded sphere `z` above. */
function drawBall(context: CanvasRenderingContext2D, palette: IPalette, ball: IBall, z: number) {
	const ground = shadowOf(ball.x, ball.y, z - BALL_RADIUS);
	const centre = project(ball.x, ball.y, z);
	const radius = BALL_RADIUS * centre.scale;
	context.fillStyle = SHADOW;
	context.beginPath();
	context.ellipse(ground.x, ground.y, radius, radius * 0.5, 0, 0, Math.PI * 2);
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

/** What the display's second line says: the latest message, the mission, or how things stand. */
function displayLine(state: IPinballState): string {
	if (state.message && state.time < state.message.until) {
		return state.message.text;
	}

	if (state.mission) {
		const step = state.mission.mission.steps[state.mission.step];

		return `${step.hint}: ${state.mission.toGo} to go`;
	}

	if (state.selected) {
		return `${state.selected.name}: shoot the ramp`;
	}

	if (state.multiball) {
		return `Multiball: lit chimney for ${state.jackpot.toLocaleString()}`;
	}

	if (state.balls.some((ball) => ball.at === "plunger")) {
		return "Pull the plunger";
	}

	return "Hit a letter to choose a mission";
}

/** The dot-matrix display across the top: ball and score, a line of news, the cookie gauge and the rank. */
function drawDisplay(context: CanvasRenderingContext2D, state: IPinballState) {
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
	context.fillText(state.score.toLocaleString(), VIEW.width - margin - 10, margin + 14);
	context.textAlign = "left";
	context.font = '700 12px "Courier New", monospace';
	const ball = state.over || state.endsAt !== null ? "GAME OVER" : `BALL ${Math.max(1, state.ballNumber)}`;
	const extra = state.ballsLeft > 1 && state.endsAt === null ? ` +${state.ballsLeft - 1}` : "";
	context.fillText(ball + extra, margin + 10, margin + 10);
	context.fillText(
		state.tilted ? "TILT" : state.mission ? state.mission.mission.name.toUpperCase() : RANKS[state.rank].toUpperCase(),
		margin + 10,
		margin + 24,
	);
	const flashing = state.message && state.time < state.message.until && state.message.big;

	if (!flashing || Math.floor(state.time * 4) % 2 === 0) {
		context.textAlign = "center";
		context.font = '700 13px "Courier New", monospace';
		context.fillText(displayLine(state).toUpperCase(), VIEW.width / 2, margin + 40);
	}

	// The cookie gauge, bottom right: one pip a cookie.
	for (let cookie = 0; cookie < COOKIE_GAUGE; cookie++) {
		context.globalAlpha = cookie < state.cookies ? 1 : 0.2;
		context.fillRect(VIEW.width - margin - 12 - (COOKIE_GAUGE - 1 - cookie) * 9, margin + 34, 6, 10);
	}

	context.globalAlpha = 1;
	context.shadowBlur = 0;
	context.textBaseline = "alphabetic";
}

function drawBigMessage(context: CanvasRenderingContext2D, palette: IPalette, text: string) {
	context.font = '700 34px "Mountains of Christmas", Nunito, serif';
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.lineWidth = 6;
	context.strokeStyle = "rgba(10, 14, 30, 0.85)";
	context.strokeText(text, VIEW.width / 2, 420);
	context.fillStyle = palette.gold;
	context.fillText(text, VIEW.width / 2, 420);
	context.textBaseline = "alphabetic";
}
