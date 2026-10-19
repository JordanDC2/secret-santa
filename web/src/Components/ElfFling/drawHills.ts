import type { IPalette } from "Components/ElfFling/draw";
import { drawOutOfFocus, hash } from "Components/ElfFling/drawForeground";

/**
 * The snowy hills, where every run starts: cosy Christmas countryside. Behind the course, three
 * layers of rolling hills (pale and slow far off, darker and quicker up close); on the middle
 * ridge, cottages whose windows glow at night with smoke curling from their chimneys, the odd
 * church spire and snowy pines; on the near hills, lit Christmas trees and strings of lights. In
 * front, out of focus, only the rare big snowman. Screen pixels,
 * `amount` of the way in (0 to 1); `day` 0 at night to 1 in full day.
 */

type IMix = (from: string, to: string, t: number) => string;

/** A layer of hills: how far it drifts for the pan, how high it rises, and how wide its swells are. */
type ILayer = { drift: number; base: number; swell: number; period: number; night: string; day: string };

const FAR: ILayer = { drift: 0.1, base: 52, swell: 14, period: 160, night: "#2c4c55", day: "#a7c3b4" };
const MIDDLE: ILayer = { drift: 0.2, base: 38, swell: 14, period: 110, night: "#1f3b33", day: "#7fa58c" };
const NEAR: ILayer = { drift: 0.32, base: 24, swell: 12, period: 90, night: "#132820", day: "#5f8a6a" };

/** How high a layer's ridge is at screen x (above the horizon), for the pan. */
function ridge(layer: ILayer, x: number, pan: number): number {
	const world = (x + pan * layer.drift) / layer.period;

	return layer.base + Math.sin(world) * layer.swell + Math.sin(world * 2.7) * layer.swell * 0.45;
}

function drawLayer(
	context: CanvasRenderingContext2D,
	layer: ILayer,
	width: number,
	horizon: number,
	pan: number,
	day: number,
	mix: IMix,
) {
	context.fillStyle = mix(layer.night, layer.day, day);
	context.beginPath();
	context.moveTo(0, horizon);

	for (let x = 0; x <= width + 8; x += 8) {
		context.lineTo(x, horizon - ridge(layer, x, pan));
	}

	context.lineTo(width, horizon);
	context.closePath();
	context.fill();
}

/**
 * Each of a layer's things along it, `spacing` apart in its own pixels (only where `chance`
 * lets one stand): its screen x, where the ridge is there, and a seed of its own.
 */
function along(
	layer: ILayer,
	width: number,
	horizon: number,
	pan: number,
	spacing: number,
	chance: number,
	seed: number,
	each: (x: number, ground: number, index: number) => void,
) {
	const drift = pan * layer.drift;
	const first = Math.floor(drift / spacing) - 1;

	for (let index = first; index * spacing - drift < width + spacing; index++) {
		if (hash(index * 7 + seed) > chance) {
			continue;
		}

		const x = index * spacing - drift + (hash(index * 13 + seed) - 0.5) * spacing * 0.5;
		each(x, horizon - ridge(layer, x, pan) + 2, index);
	}
}

const WINDOW_GLOW = "#ffd27a";
const LIGHT_COLOURS = ["#ff5a5a", "#ffd25a", "#5adc8c", "#6ab8ff"];

/** A cottage on a hill: walls, a snowy roof, a chimney with smoke, and windows lit at night. */
function cottage(
	context: CanvasRenderingContext2D,
	x: number,
	ground: number,
	seed: number,
	day: number,
	clock: number,
	walls: string,
	roof: string,
	snow: string,
) {
	const wide = 22 + hash(seed * 3) * 10;
	const tall = 12 + hash(seed * 5) * 5;
	const peak = 10 + hash(seed * 7) * 4;
	const left = x - wide / 2;

	context.fillStyle = walls;
	context.fillRect(left, ground - tall, wide, tall + 2);
	// The chimney, then the roof over it, then the snow on the roof.
	context.fillRect(left + wide * 0.7, ground - tall - peak * 0.9, 4, peak * 0.7);
	context.fillStyle = roof;
	context.beginPath();
	context.moveTo(left - 3, ground - tall);
	context.lineTo(x, ground - tall - peak);
	context.lineTo(left + wide + 3, ground - tall);
	context.closePath();
	context.fill();
	context.fillStyle = snow;
	context.beginPath();
	context.moveTo(left - 3, ground - tall);
	context.lineTo(x, ground - tall - peak);
	context.lineTo(left + wide + 3, ground - tall);
	context.lineTo(left + wide - 2, ground - tall - 2);
	context.lineTo(x, ground - tall - peak + 3);
	context.lineTo(left + 2, ground - tall - 2);
	context.closePath();
	context.fill();

	// Windows: warm and glowing at night, dark by day.
	const lit = 1 - day;
	const windows = wide > 27 ? 2 : 1;

	for (let pane = 0; pane < windows; pane++) {
		const wx = left + (wide * (pane + 1)) / (windows + 1) - 2.5;
		const wy = ground - tall * 0.65;

		if (lit > 0.05) {
			const glow = context.createRadialGradient(wx + 2.5, wy + 2.5, 0, wx + 2.5, wy + 2.5, 12);
			glow.addColorStop(0, `rgba(255, 210, 122, ${(0.45 * lit).toFixed(3)})`);
			glow.addColorStop(1, "rgba(255, 210, 122, 0)");
			context.fillStyle = glow;
			context.fillRect(wx - 10, wy - 10, 25, 25);
		}

		context.fillStyle = lit > 0.3 ? WINDOW_GLOW : "rgba(20, 30, 35, 0.6)";
		context.fillRect(wx, wy, 5, 5);
	}

	// Smoke curling up from the chimney.
	context.fillStyle = "rgba(220, 225, 228, 0.35)";

	for (let puff = 0; puff < 4; puff++) {
		const rise = (clock * 0.25 + puff / 4 + hash(seed)) % 1;
		context.globalAlpha = 1 - rise;
		context.beginPath();
		context.arc(
			left + wide * 0.7 + 2 + Math.sin(rise * 5 + seed) * 4 + rise * 8,
			ground - tall - peak * 0.9 - rise * 30,
			2 + rise * 4,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.globalAlpha = 1;
}

/** A pine on a hill, small and snowy. */
function pine(
	context: CanvasRenderingContext2D,
	x: number,
	ground: number,
	tall: number,
	colour: string,
	snow: string,
) {
	context.fillStyle = colour;
	context.beginPath();
	context.moveTo(x - tall * 0.3, ground);
	context.lineTo(x, ground - tall);
	context.lineTo(x + tall * 0.3, ground);
	context.closePath();
	context.fill();
	context.fillStyle = snow;
	context.beginPath();
	context.moveTo(x - tall * 0.09, ground - tall * 0.7);
	context.lineTo(x, ground - tall);
	context.lineTo(x + tall * 0.09, ground - tall * 0.7);
	context.closePath();
	context.fill();
}

/** A church with a spire. */
function church(
	context: CanvasRenderingContext2D,
	x: number,
	ground: number,
	walls: string,
	snow: string,
	lit: number,
) {
	context.fillStyle = walls;
	context.fillRect(x - 12, ground - 14, 24, 16);
	context.fillRect(x - 4, ground - 26, 8, 14);
	context.beginPath();
	context.moveTo(x - 5, ground - 26);
	context.lineTo(x, ground - 44);
	context.lineTo(x + 5, ground - 26);
	context.closePath();
	context.fill();
	context.fillStyle = snow;
	context.fillRect(x - 13, ground - 15, 26, 2);

	if (lit > 0.3) {
		context.fillStyle = WINDOW_GLOW;
		context.beginPath();
		context.arc(x, ground - 20, 2, 0, Math.PI * 2);
		context.fill();
	}
}

/** A Christmas tree on a near hill, its baubles twinkling at night. */
function christmasTree(
	context: CanvasRenderingContext2D,
	x: number,
	ground: number,
	seed: number,
	colour: string,
	lit: number,
	clock: number,
) {
	const tall = 30 + hash(seed * 11) * 10;
	context.fillStyle = colour;
	context.beginPath();
	context.moveTo(x - tall * 0.34, ground);
	context.lineTo(x, ground - tall);
	context.lineTo(x + tall * 0.34, ground);
	context.closePath();
	context.fill();
	// A star on top.
	context.fillStyle = `rgba(255, 220, 120, ${(0.4 + 0.6 * lit).toFixed(3)})`;
	context.beginPath();
	context.arc(x, ground - tall, 2.5, 0, Math.PI * 2);
	context.fill();

	if (lit <= 0.05) {
		return;
	}

	for (let bulb = 0; bulb < 9; bulb++) {
		const t = (bulb + 1) / 10;
		const bx = x + (hash(seed * 3 + bulb) - 0.5) * tall * 0.6 * t;
		const by = ground - tall + tall * t;
		const twinkle = 0.5 + 0.5 * Math.sin(clock * 3 + bulb * 1.7 + seed);
		context.fillStyle = LIGHT_COLOURS[bulb % LIGHT_COLOURS.length];
		context.globalAlpha = lit * (0.4 + 0.6 * twinkle);
		context.beginPath();
		context.arc(bx, by, 1.6, 0, Math.PI * 2);
		context.fill();
	}

	context.globalAlpha = 1;
}

/** A string of lights sagging between two posts. */
function stringOfLights(
	context: CanvasRenderingContext2D,
	from: { x: number; y: number },
	to: { x: number; y: number },
	post: string,
	lit: number,
	clock: number,
	seed: number,
) {
	context.strokeStyle = post;
	context.lineWidth = 2;

	for (const end of [from, to]) {
		context.beginPath();
		context.moveTo(end.x, end.y);
		context.lineTo(end.x, end.y - 16);
		context.stroke();
	}

	const sag = 7;
	const point = (t: number) => ({
		x: from.x + (to.x - from.x) * t,
		y: from.y - 16 + (to.y - from.y) * t + Math.sin(t * Math.PI) * sag,
	});
	context.lineWidth = 1;
	context.beginPath();

	for (let step = 0; step <= 12; step++) {
		const p = point(step / 12);

		if (step === 0) {
			context.moveTo(p.x, p.y);
		} else {
			context.lineTo(p.x, p.y);
		}
	}

	context.stroke();

	if (lit <= 0.05) {
		return;
	}

	for (let bulb = 1; bulb < 9; bulb++) {
		const p = point(bulb / 9);
		context.fillStyle = LIGHT_COLOURS[bulb % LIGHT_COLOURS.length];
		context.globalAlpha = lit * (0.55 + 0.45 * Math.sin(clock * 2.5 + bulb + seed));
		context.beginPath();
		context.arc(p.x, p.y + 2, 1.8, 0, Math.PI * 2);
		context.fill();
	}

	context.globalAlpha = 1;
}

/** Behind the course: the three layers of hills and everything on them. */
export function drawHills(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	horizon: number,
	pan: number,
	day: number,
	amount: number,
	clock: number,
	mix: IMix,
) {
	const lit = 1 - day;
	const snow = mix("#c7d3d6", palette.white, day);
	context.save();
	context.globalAlpha = amount;
	drawLayer(context, FAR, width, horizon, pan, day, mix);

	// The middle ridge: cottages, the odd church, and pines among them.
	drawLayer(context, MIDDLE, width, horizon, pan, day, mix);
	const walls = mix("#2a2a30", "#b88b6a", day);
	const roof = mix("#3a1f22", "#8c3a34", day);
	along(MIDDLE, width, horizon, pan, 22, 0.55, 3, (x, ground, index) =>
		pine(context, x, ground, 14 + hash(index * 17) * 10, mix("#10251d", "#3f6b4a", day), snow),
	);
	along(MIDDLE, width, horizon, pan, 170, 0.6, 5, (x, ground, index) =>
		cottage(context, x, ground, index, day, clock, walls, roof, snow),
	);
	along(MIDDLE, width, horizon, pan, 900, 0.5, 9, (x, ground) => church(context, x, ground, walls, snow, lit));

	// The near hills: Christmas trees, and strings of lights between posts.
	drawLayer(context, NEAR, width, horizon, pan, day, mix);
	along(NEAR, width, horizon, pan, 340, 0.45, 11, (x, ground, index) =>
		christmasTree(context, x, ground, index, mix("#0e2219", "#2f5a3a", day), lit, clock),
	);
	along(NEAR, width, horizon, pan, 420, 0.35, 13, (x, ground, index) => {
		const to = x + 50;
		stringOfLights(
			context,
			{ x, y: ground },
			{ x: to, y: horizon - ridge(NEAR, to, pan) + 2 },
			mix("#2a2622", "#6b5a48", day),
			lit,
			clock,
			index,
		);
	});
	context.restore();
}

/** A big snowman: three balls of snow, a top hat, a scarf blowing, stick arms, coal buttons and a carrot. */
function snowman(
	context: CanvasRenderingContext2D,
	x: number,
	base: number,
	tall: number,
	snow: string,
	shade: string,
	dark: string,
	scarf: string,
	carrot: string,
	flap: number,
) {
	const bottom = tall * 0.2;
	const middle = tall * 0.15;
	const head = tall * 0.11;
	const bottomY = base - bottom;
	const middleY = bottomY - bottom - middle * 0.75;
	const headY = middleY - middle - head * 0.8;

	// Stick arms, behind the body: one raised in a wave.
	context.strokeStyle = dark;
	context.lineWidth = 3;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(x - middle * 0.8, middleY - middle * 0.2);
	context.lineTo(x - middle * 2.1, middleY - middle * 1.1);
	context.moveTo(x - middle * 1.7, middleY - middle * 0.85);
	context.lineTo(x - middle * 1.9, middleY - middle * 1.4);
	context.moveTo(x + middle * 0.8, middleY - middle * 0.2);
	context.lineTo(x + middle * 2, middleY + middle * 0.3);
	context.stroke();

	// The three balls, each lit from the upper left.
	for (const [cy, r] of [
		[bottomY, bottom],
		[middleY, middle],
		[headY, head],
	]) {
		const ball = context.createRadialGradient(x - r * 0.35, cy - r * 0.35, r * 0.2, x, cy, r);
		ball.addColorStop(0, snow);
		ball.addColorStop(0.6, snow);
		ball.addColorStop(1, shade);
		context.fillStyle = ball;
		context.beginPath();
		context.arc(x, cy, r, 0, Math.PI * 2);
		context.fill();
	}

	// Coal buttons and eyes.
	context.fillStyle = dark;

	for (const [by, bx, r] of [
		[middleY - middle * 0.4, 0, 2.4],
		[middleY, 0, 2.4],
		[middleY + middle * 0.4, 0, 2.4],
		[headY - head * 0.2, -head * 0.35, 2],
		[headY - head * 0.2, head * 0.35, 2],
	]) {
		context.beginPath();
		context.arc(x + bx, by, r, 0, Math.PI * 2);
		context.fill();
	}

	// A carrot nose.
	context.fillStyle = carrot;
	context.beginPath();
	context.moveTo(x, headY - 2);
	context.lineTo(x + head * 0.9, headY + 1);
	context.lineTo(x, headY + 3);
	context.closePath();
	context.fill();

	// A scarf, one end blowing.
	context.fillStyle = scarf;
	context.fillRect(x - head * 0.95, headY + head * 0.75, head * 1.9, head * 0.4);
	context.beginPath();
	context.moveTo(x + head * 0.5, headY + head * 0.9);
	context.lineTo(x + head * 1.6, headY + head * 1.4 + flap);
	context.lineTo(x + head * 1.5, headY + head * 1.9 + flap);
	context.lineTo(x + head * 0.4, headY + head * 1.3);
	context.closePath();
	context.fill();

	// A top hat, with a band.
	context.fillStyle = dark;
	context.fillRect(x - head * 1.05, headY - head * 0.85, head * 2.1, head * 0.22);
	context.fillRect(x - head * 0.7, headY - head * 1.9, head * 1.4, head * 1.1);
	context.fillStyle = scarf;
	context.fillRect(x - head * 0.7, headY - head * 1.05, head * 1.4, head * 0.18);
}

/** In front: nothing but, rarely, a big snowman, out of focus. */
export function drawHillsForeground(
	target: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	base: number,
	skyHeight: number,
	pan: number,
	clock: number,
	day: number,
	amount: number,
	mix: IMix,
) {
	const snow = mix("#b9c6ca", palette.white, day);
	const red = mix("#5a1418", palette.red, day);

	drawOutOfFocus(target, amount, (context) => {
		// Half a dozen across the hills.
		const snowmanDrift = pan * 1.6;
		const snowmanSpacing = 520;
		const snowmanFirst = Math.floor(snowmanDrift / snowmanSpacing) - 1;

		for (let index = snowmanFirst; index * snowmanSpacing - snowmanDrift < width + snowmanSpacing; index++) {
			if (hash(index * 31 + 9) > 0.03) {
				continue;
			}

			snowman(
				context,
				index * snowmanSpacing - snowmanDrift + hash(index * 37) * snowmanSpacing * 0.4,
				base + 6,
				skyHeight * (0.42 + hash(index * 41) * 0.12),
				snow,
				mix("#6a7c84", "#9fb3c0", day),
				mix("#0b0b0d", "#2a2a2e", day),
				red,
				mix("#6b3a14", "#e8823a", day),
				Math.sin(clock * 3 + index) * 4,
			);
		}
	});
}
