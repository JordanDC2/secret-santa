import type { IPalette } from "Components/ElfFling/draw";
import { hash } from "Components/ElfFling/drawForeground";

/**
 * The mountain stream, after the first sunset. Behind the course, a range of snow-capped peaks
 * (the odd frozen waterfall down one), a pine-covered ridge and snowy boulders. In front, under
 * the narrow snowy bank the course runs along, the stream itself (like Kingdom Two Crowns'
 * river): the scene above mirrored in the water, rippling, with glints of light and ice floes
 * drifting by. Screen pixels, `amount` of the way in (0 to 1); `day` 0 at night to 1 in full day.
 */

type IMix = (from: string, to: string, t: number) => string;

/** How much snowy bank shows between the course and the water, in pixels (the distance labels sit on it). */
const BANK = 24;
/** How tall each rippling row of the reflection is, in pixels. */
const ROW = 2;

/** A snowy pine, its base at (x, base). */
function pine(context: CanvasRenderingContext2D, x: number, base: number, tall: number, green: string, snow: string) {
	const half = tall * 0.3;
	context.fillStyle = green;
	context.beginPath();
	context.moveTo(x - half, base);
	context.lineTo(x, base - tall);
	context.lineTo(x + half, base);
	context.closePath();
	context.fill();
	context.fillStyle = snow;
	context.beginPath();
	context.moveTo(x - half * 0.3, base - tall * 0.7);
	context.lineTo(x, base - tall);
	context.lineTo(x + half * 0.3, base - tall * 0.7);
	context.closePath();
	context.fill();
}

/** Behind the course: the peaks, the pine ridge and the boulders. */
export function drawMountains(
	context: CanvasRenderingContext2D,
	width: number,
	horizon: number,
	pan: number,
	day: number,
	amount: number,
	mix: IMix,
) {
	context.save();
	context.globalAlpha = amount;

	// The peaks: jagged, snow-capped, each shaded down its right face.
	const peakDrift = pan * 0.06;
	const peakSpacing = 130;
	const peakFirst = Math.floor(peakDrift / peakSpacing) - 2;
	const rock = mix("#1f2c3a", "#8fa4bb", day);
	const rockShade = mix("#172230", "#7389a2", day);
	const cap = mix("#7d93a8", "#f3f7fb", day);
	const ice = mix("#4f7690", "#cfe9f6", day);

	for (let index = peakFirst; index * peakSpacing - peakDrift < width + peakSpacing * 2; index++) {
		const x = index * peakSpacing - peakDrift + hash(index * 3) * 60;
		const tall = 70 + hash(index * 5) * 80;
		const half = tall * (0.8 + hash(index * 7) * 0.4);
		const top = horizon - tall;
		const notch = hash(index * 11);

		context.fillStyle = rock;
		context.beginPath();
		context.moveTo(x - half, horizon);
		context.lineTo(x - half * 0.45, top + tall * (0.45 + notch * 0.1));
		context.lineTo(x - half * 0.3, top + tall * 0.4);
		context.lineTo(x, top);
		context.lineTo(x + half * 0.35, top + tall * (0.35 + notch * 0.1));
		context.lineTo(x + half, horizon);
		context.closePath();
		context.fill();

		context.fillStyle = rockShade;
		context.beginPath();
		context.moveTo(x, top);
		context.lineTo(x + half * 0.35, top + tall * (0.35 + notch * 0.1));
		context.lineTo(x + half, horizon);
		context.lineTo(x + half * 0.15, horizon);
		context.closePath();
		context.fill();

		// The snowcap, its lower edge ragged.
		context.fillStyle = cap;
		context.beginPath();
		context.moveTo(x, top);
		context.lineTo(x - half * 0.32, top + tall * 0.38);
		context.lineTo(x - half * 0.18, top + tall * 0.3);
		context.lineTo(x - half * 0.06, top + tall * 0.4);
		context.lineTo(x + half * 0.08, top + tall * 0.28);
		context.lineTo(x + half * 0.22, top + tall * 0.34);
		context.closePath();
		context.fill();

		// Now and then, a frozen waterfall down its face.
		if (hash(index * 13 + 1) < 0.2) {
			context.fillStyle = ice;
			context.beginPath();
			context.moveTo(x - half * 0.12, top + tall * 0.45);
			context.quadraticCurveTo(x - half * 0.2, horizon - tall * 0.25, x - half * 0.16, horizon);
			context.lineTo(x - half * 0.02, horizon);
			context.quadraticCurveTo(x - half * 0.04, horizon - tall * 0.25, x - half * 0.06, top + tall * 0.45);
			context.closePath();
			context.fill();
		}
	}

	// A pine-covered ridge in front of them.
	const ridgeDrift = pan * 0.18;
	const ridgeTop = (x: number) =>
		horizon - 34 - Math.sin((x + ridgeDrift) / 90) * 10 - Math.sin((x + ridgeDrift) / 37) * 4;
	const ridge = mix("#13221f", "#62827a", day);
	const green = mix("#0c1a16", "#3d6250", day);
	const snow = mix("#9fb0b8", "#f4f8fa", day);
	context.fillStyle = ridge;
	context.beginPath();
	context.moveTo(0, horizon);

	for (let x = 0; x <= width + 8; x += 8) {
		context.lineTo(x, ridgeTop(x));
	}

	context.lineTo(width, horizon);
	context.closePath();
	context.fill();

	const pineSpacing = 22;
	const pineFirst = Math.floor(ridgeDrift / pineSpacing) - 1;

	for (let index = pineFirst; index * pineSpacing - ridgeDrift < width + pineSpacing; index++) {
		if (hash(index * 17 + 2) > 0.55) {
			continue;
		}

		const x = index * pineSpacing - ridgeDrift + hash(index * 19) * 10;
		pine(context, x, ridgeTop(x) + 4, 14 + hash(index * 23) * 12, green, snow);
	}

	// Snowy boulders along the far side of the course.
	const boulderDrift = pan * 0.32;
	const boulderSpacing = 80;
	const boulderFirst = Math.floor(boulderDrift / boulderSpacing) - 1;
	const stone = mix("#1c2328", "#6b767d", day);

	for (let index = boulderFirst; index * boulderSpacing - boulderDrift < width + boulderSpacing; index++) {
		if (hash(index * 29 + 6) > 0.45) {
			continue;
		}

		const x = index * boulderSpacing - boulderDrift + hash(index * 31) * 40;
		const wide = 9 + hash(index * 37) * 12;
		const tall = 5 + hash(index * 41) * 6;
		context.fillStyle = stone;
		context.beginPath();
		context.ellipse(x, horizon, wide, tall, 0, Math.PI, 0);
		context.fill();
		context.fillStyle = snow;
		context.beginPath();
		context.ellipse(x - 1, horizon - tall * 0.55, wide * 0.75, tall * 0.5, 0, Math.PI, 0);
		context.fill();
	}

	context.restore();
}

/** The scene just above the snow, copied each frame to be mirrored in the water. */
let mirror: HTMLCanvasElement | null = null;

/**
 * In front: the stream, under the bank the course runs along (floorY). Drawn over everything
 * already on the canvas, which it mirrors. The glints, floes and icicles drift with the parallax
 * `pan`, a little quicker than the course, as the other biomes' foregrounds do.
 */
export function drawStreamWater(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	height: number,
	floorY: number,
	pan: number,
	clock: number,
	day: number,
	amount: number,
	mix: IMix,
) {
	const surface = floorY + BANK;
	const drift = pan * 1.3;

	if (surface >= height || amount <= 0) {
		return;
	}

	const deep = height - surface;
	const ratio = context.getTransform().a || 1;
	const sourceTop = Math.max(0, floorY - deep);
	const sourceHeight = floorY - sourceTop;

	context.save();
	context.globalAlpha = amount;

	// The water's own colour underneath (showing where a ripple pulls the reflection aside).
	const water = mix("#081622", "#2d6a86", day);
	context.fillStyle = water;
	context.fillRect(0, surface, width, deep);

	if (sourceHeight > 0) {
		mirror ??= document.createElement("canvas");
		const mirrorWidth = Math.ceil(width * ratio);
		const mirrorHeight = Math.ceil(sourceHeight * ratio);

		if (mirror.width !== mirrorWidth || mirror.height !== mirrorHeight) {
			mirror.width = mirrorWidth;
			mirror.height = mirrorHeight;
		}

		const copy = mirror.getContext("2d")!;
		copy.clearRect(0, 0, mirrorWidth, mirrorHeight);
		copy.drawImage(context.canvas, 0, sourceTop * ratio, mirrorWidth, mirrorHeight, 0, 0, mirrorWidth, mirrorHeight);

		// Upside down, row by row, each row pulled aside by the ripples, more so further down.
		for (let y = 0; y < deep && y < sourceHeight; y += ROW) {
			const ripple = Math.sin(y * 0.45 + clock * 1.1) * (0.3 + y * 0.015) + Math.sin(y * 0.13 - clock * 0.6) * 0.4;
			context.drawImage(
				mirror,
				0,
				(sourceHeight - y - ROW) * ratio,
				mirrorWidth,
				ROW * ratio,
				ripple,
				surface + y,
				width,
				ROW,
			);
		}
	}

	// Tinted with the water's colour, darker with depth.
	context.globalAlpha = amount * 0.5;
	context.fillStyle = water;
	context.fillRect(0, surface, width, deep);
	context.globalAlpha = amount;
	const darker = context.createLinearGradient(0, surface, 0, height);
	darker.addColorStop(0, "rgba(0, 0, 0, 0)");
	darker.addColorStop(1, "rgba(0, 0, 0, 0.45)");
	context.fillStyle = darker;
	context.fillRect(0, surface, width, deep);

	// Glints: short streaks of light on the ripples, drifting by with the current.
	context.fillStyle = mix("#9fc4dc", "#ffffff", day);

	for (let index = 0; index < 28; index++) {
		const span = width + 80;
		const x = ((((hash(index * 3) * span * 4 - drift - clock * 10) % span) + span) % span) - 40;
		const y = surface + 3 + hash(index * 7) * (deep - 6);
		const twinkle = 0.5 + 0.5 * Math.sin(clock * 3 + index * 1.7);
		context.globalAlpha = amount * twinkle * (0.25 + day * 0.25);
		context.fillRect(x, y, 6 + hash(index * 11) * 22, 1);
	}

	context.globalAlpha = amount;

	// Ice floes, now and then, drifting with the current, half under the water.
	context.globalAlpha = amount * 0.75;
	const floeSpacing = 260;
	const floeDrift = drift + clock * 10;
	const floeFirst = Math.floor(floeDrift / floeSpacing) - 1;
	const floe = mix("#7f97a6", "#eef6fa", day);
	const floeUnder = mix("#33505f", "#9cc0d2", day);

	for (let index = floeFirst; index * floeSpacing - floeDrift < width + floeSpacing; index++) {
		if (hash(index * 43 + 7) > 0.25) {
			continue;
		}

		const x = index * floeSpacing - floeDrift + hash(index * 47) * 120;
		const y = surface + deep * (0.3 + hash(index * 53) * 0.4) + Math.sin(clock * 1.5 + index) * 1.2;
		const wide = 8 + hash(index * 59) * 12;
		context.fillStyle = floeUnder;
		context.beginPath();
		context.ellipse(x, y + 1.5, wide, 3, 0, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = floe;
		context.beginPath();
		context.ellipse(x, y, wide, 2.5, 0, 0, Math.PI * 2);
		context.fill();
	}

	context.globalAlpha = amount;

	// The bank's edge: a lip of snow over the water, icicles hanging from it.
	context.fillStyle = palette.snowShade;
	context.fillRect(0, surface - 2, width, 3);
	context.fillStyle = mix("#7f97a6", "#e3f1f8", day);
	const icicleSpacing = 18;
	const icicleFirst = Math.floor(drift / icicleSpacing) - 1;

	for (let index = icicleFirst; index * icicleSpacing - drift < width + icicleSpacing; index++) {
		if (hash(index * 61 + 3) > 0.5) {
			continue;
		}

		const x = index * icicleSpacing - drift + hash(index * 67) * 8;
		const long = 3 + hash(index * 71) * 7;
		context.beginPath();
		context.moveTo(x - 2, surface);
		context.lineTo(x, surface + long);
		context.lineTo(x + 2, surface);
		context.closePath();
		context.fill();
	}

	context.restore();
}
