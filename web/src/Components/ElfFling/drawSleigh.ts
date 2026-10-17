import type { IPalette } from "Components/ElfFling/draw";
import type { ISleigh } from "Components/ElfFling/sleigh";

/**
 * The sleigh crossing the sky: a red sleigh with gold runners and a sack of presents, pulled
 * by a reindeer. World units (metres, y up).
 */

/** Zoomed far out, the sleigh is drawn bigger than life so it's easy to spot. */
const MIN_PIXELS = 60;
const LENGTH = 3;

export function drawSleigh(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	sleigh: ISleigh | null,
	time: number,
	pixelsPerMetre: number,
) {
	if (!sleigh) {
		return;
	}

	const enlarge = Math.max(1, MIN_PIXELS / (LENGTH * pixelsPerMetre));
	// A gentle up-and-down as it flies.
	const bob = Math.sin(time * 3) * 0.1;

	context.save();
	context.translate(sleigh.x, sleigh.y + bob);
	context.scale(enlarge, enlarge);
	drawReindeer(context, palette, time);
	drawBody(context, palette);
	context.restore();
}

function drawBody(context: CanvasRenderingContext2D, palette: IPalette) {
	// Runners, curling up at the front.
	context.strokeStyle = palette.goldDeep;
	context.lineWidth = 0.08;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(-1.2, -0.45);
	context.lineTo(0.6, -0.45);
	context.quadraticCurveTo(0.95, -0.45, 0.9, -0.15);
	context.stroke();

	// The sleigh: a deep red tub with a gold trim and a high curled back.
	context.fillStyle = palette.red;
	context.beginPath();
	context.moveTo(-1.25, -0.3);
	context.lineTo(0.7, -0.3);
	context.quadraticCurveTo(0.9, 0.05, 0.6, 0.1);
	context.lineTo(-0.9, 0.1);
	context.quadraticCurveTo(-1.35, 0.6, -1.15, 0.75);
	context.quadraticCurveTo(-1.5, 0.5, -1.25, -0.3);
	context.closePath();
	context.fill();
	context.fillStyle = palette.gold;
	context.fillRect(-1.1, -0.12, 1.75, 0.07);

	// A sack of presents sticking out the top.
	context.fillStyle = palette.bark;
	context.beginPath();
	context.ellipse(-0.45, 0.32, 0.38, 0.3, 0, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.green;
	context.fillRect(-0.62, 0.45, 0.22, 0.2);
	context.fillStyle = palette.goldDeep;
	context.fillRect(-0.36, 0.5, 0.2, 0.18);
}

/** The reindeer out front, legs galloping. */
function drawReindeer(context: CanvasRenderingContext2D, palette: IPalette, time: number) {
	const stride = Math.sin(time * 12) * 0.12;

	// Harness line.
	context.strokeStyle = palette.gold;
	context.lineWidth = 0.04;
	context.beginPath();
	context.moveTo(0.8, -0.05);
	context.lineTo(1.35, 0.15);
	context.stroke();

	context.fillStyle = palette.fur;
	context.beginPath();
	context.ellipse(1.75, 0.15, 0.45, 0.2, 0, 0, Math.PI * 2);
	context.fill();
	context.beginPath();
	context.ellipse(2.25, 0.42, 0.16, 0.12, 0.4, 0, Math.PI * 2);
	context.fill();
	context.fillRect(2.05, 0.15, 0.12, 0.28);

	context.strokeStyle = palette.bark;
	context.lineWidth = 0.07;
	context.beginPath();
	// Legs.
	context.moveTo(1.45, 0);
	context.lineTo(1.45 - stride, -0.32);
	context.moveTo(2, 0);
	context.lineTo(2 + stride, -0.32);
	// Antlers.
	context.moveTo(2.2, 0.52);
	context.lineTo(2.12, 0.78);
	context.moveTo(2.15, 0.66);
	context.lineTo(2.02, 0.74);
	context.stroke();
}
