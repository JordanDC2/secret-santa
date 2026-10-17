import { CRACKER_LENGTH, type ICracker } from "Components/ElfFling/crackers";
import type { IPalette } from "Components/ElfFling/draw";

/**
 * The Christmas crackers in the snow, and their bang: the two halves fly apart, confetti
 * bursts out and a "Pop!" floats up. World units (metres, y up) unless a function says so.
 */

/** Zoomed far out, crackers are drawn bigger than life, like the elf, so they stay visible. */
const MIN_PIXELS = 24;
/** How long the confetti and "Pop!" last after the bang, in seconds. */
const BURST_SECONDS = 1.2;
const CONFETTI_PIECES = 24;
const RADIUS = 0.13;

export function drawCrackers(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	crackers: ICracker[],
	time: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const enlarge = Math.max(1, MIN_PIXELS / (CRACKER_LENGTH * pixelsPerMetre));

	crackers.forEach((cracker, index) => {
		if (cracker.x < visible.left - 5 || cracker.x > visible.right + 5) {
			return;
		}

		context.save();
		context.translate(cracker.x, RADIUS * enlarge);
		context.scale(enlarge, enlarge);

		if (cracker.poppedAt === null) {
			drawWhole(context, palette, index);
		} else {
			const since = time - cracker.poppedAt;
			drawHalves(context, palette, index, since);

			if (since < BURST_SECONDS) {
				drawConfetti(context, palette, index, since);
			}
		}

		context.restore();
	});
}

/** "Pop!" over each cracker that has just gone off. Screen units: call outside the world transform. */
export function drawPopLabels(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	crackers: ICracker[],
	time: number,
	toScreen: (x: number, y: number) => { x: number; y: number },
) {
	context.font = "800 20px Nunito, sans-serif";
	context.textAlign = "center";

	for (const cracker of crackers) {
		const since = cracker.poppedAt === null ? Infinity : time - cracker.poppedAt;

		if (since >= BURST_SECONDS) {
			continue;
		}

		const at = toScreen(cracker.x, 0);
		context.globalAlpha = 1 - since / BURST_SECONDS;
		context.fillStyle = palette.gold;
		context.fillText("Pop!", at.x, at.y - 40 - since * 40);
	}

	context.globalAlpha = 1;
}

/** Red or green, alternating, so a row of them reads as festive rather than identical. */
function wrapping(palette: IPalette, index: number) {
	return index % 2 === 0 ? { body: palette.red, band: palette.gold } : { body: palette.green, band: palette.white };
}

/** A tube with a band round the middle and a twisted, flared end each side. */
function drawWhole(context: CanvasRenderingContext2D, palette: IPalette, index: number) {
	const colors = wrapping(palette, index);
	const half = CRACKER_LENGTH / 2;

	context.fillStyle = colors.body;
	context.fillRect(-half * 0.55, -RADIUS, half * 1.1, RADIUS * 2);
	drawEnd(context, colors.body, -1);
	drawEnd(context, colors.body, 1);
	context.fillStyle = colors.band;
	context.fillRect(-0.06, -RADIUS, 0.12, RADIUS * 2);
	context.fillRect(-half * 0.55, -0.02, half * 1.1, 0.04);
}

/** One twisted end: pinched at the neck, flaring out to the tip. side is -1 (left) or 1. */
function drawEnd(context: CanvasRenderingContext2D, color: string, side: number) {
	const half = CRACKER_LENGTH / 2;
	const neck = half * 0.55;

	context.fillStyle = color;
	context.beginPath();
	context.moveTo(side * neck, -RADIUS);
	context.lineTo(side * (neck + 0.06), -RADIUS * 0.4);
	context.lineTo(side * half, -RADIUS * 1.05);
	context.lineTo(side * half, RADIUS * 1.05);
	context.lineTo(side * (neck + 0.06), RADIUS * 0.4);
	context.lineTo(side * neck, RADIUS);
	context.closePath();
	context.fill();
}

/** After the bang: the halves spring apart, their outer ends tipping up, and lie there. */
function drawHalves(context: CanvasRenderingContext2D, palette: IPalette, index: number, since: number) {
	const colors = wrapping(palette, index);
	const progress = Math.min(1, since / 0.25);
	const apart = progress * 0.3;

	for (const side of [-1, 1]) {
		context.save();
		// Pivot on the torn middle edge, resting on the snow, so the outer end lifts.
		context.translate(side * apart, -RADIUS);
		context.rotate(side * 0.3 * progress);
		context.translate(0, RADIUS);
		context.fillStyle = colors.body;
		context.fillRect(side === -1 ? -CRACKER_LENGTH * 0.275 : 0, -RADIUS, CRACKER_LENGTH * 0.275, RADIUS * 2);
		drawEnd(context, colors.body, side);
		context.restore();
	}
}

/** Bits of confetti thrown up and out, falling back under gravity and fading. */
function drawConfetti(context: CanvasRenderingContext2D, palette: IPalette, index: number, since: number) {
	const colors = [palette.red, palette.gold, palette.green, palette.white, palette.redBright];
	context.globalAlpha = 1 - since / BURST_SECONDS;

	for (let piece = 0; piece < CONFETTI_PIECES; piece++) {
		// Fixed per cracker and piece, so the burst doesn't flicker from frame to frame.
		const angle = Math.PI * (0.15 + 0.7 * fraction(index * 31 + piece * 7.3));
		const speed = 2.5 + 3 * fraction(index * 17 + piece * 3.1);
		const x = Math.cos(angle) * speed * since;
		const y = Math.sin(angle) * speed * since - 4.9 * since * since;

		context.fillStyle = colors[piece % colors.length];
		context.save();
		context.translate(x, y);
		context.rotate(since * 8 + piece);
		context.fillRect(-0.04, -0.025, 0.08, 0.05);
		context.restore();
	}

	context.globalAlpha = 1;
}

/** A repeatable "random" number in [0, 1) from a seed. */
function fraction(seed: number): number {
	const value = Math.sin(seed * 12.9898) * 43758.5453;

	return value - Math.floor(value);
}
