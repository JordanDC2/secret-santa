import type { IPalette } from "Components/ElfFling/draw";
import { LOG_LENGTH, type IYuleLog } from "Components/ElfFling/yuleLogs";

/**
 * Yule log cannons: bark-brown logs lying in the snow, raised at the far end like a cannon,
 * with a dark open end facing the reindeer and a sprig of holly on top. Holding the elf, a log
 * shakes; firing, it puffs smoke. Drawn in front of the elf, so an elf inside is hidden.
 * World units (metres, y up).
 */

/** Zoomed far out, logs are drawn bigger than life, like snowmen, so they stay visible. */
const MIN_PIXELS = 34;
const RADIUS = 0.32;
/** The far end is raised this much, in radians. */
const TILT = 0.35;
const SMOKE_SECONDS = 1.2;
const LOG_INSIDE = "#3b2414";

export function drawYuleLogs(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	logs: IYuleLog[],
	loadedX: number | null,
	time: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const enlarge = Math.max(1, MIN_PIXELS / (LOG_LENGTH * pixelsPerMetre));

	for (const log of logs) {
		if (log.x < visible.left - 3 || log.x > visible.right + 3) {
			continue;
		}

		const shake = loadedX === log.x ? Math.sin(time * 70) * 0.04 : 0;
		context.save();
		context.translate(log.x + shake, RADIUS * enlarge);
		context.scale(enlarge, enlarge);
		context.rotate(TILT);
		drawLog(context, palette);
		context.restore();

		if (log.firedAt !== null && time - log.firedAt < SMOKE_SECONDS) {
			drawSmoke(context, palette, log.x, enlarge, (time - log.firedAt) / SMOKE_SECONDS);
		}
	}
}

/** The log along +x from its open end at the origin. */
function drawLog(context: CanvasRenderingContext2D, palette: IPalette) {
	context.fillStyle = palette.bark;
	context.fillRect(0, -RADIUS, LOG_LENGTH, RADIUS * 2);
	// Bark lines.
	context.strokeStyle = LOG_INSIDE;
	context.lineWidth = 0.035;
	context.beginPath();

	for (const y of [-0.15, 0.05, 0.2]) {
		context.moveTo(0.15, y);
		context.lineTo(LOG_LENGTH - 0.1, y + 0.02);
	}

	context.stroke();
	// The far end: a lighter cut face with rings.
	context.fillStyle = palette.fur;
	context.beginPath();
	context.ellipse(LOG_LENGTH, 0, RADIUS * 0.45, RADIUS, 0, 0, Math.PI * 2);
	context.fill();
	// The open end, facing the reindeer.
	context.fillStyle = palette.bark;
	context.beginPath();
	context.ellipse(0, 0, RADIUS * 0.5, RADIUS, 0, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = LOG_INSIDE;
	context.beginPath();
	context.ellipse(0, 0, RADIUS * 0.35, RADIUS * 0.75, 0, 0, Math.PI * 2);
	context.fill();
	// Holly on top.
	context.fillStyle = palette.green;
	context.beginPath();
	context.ellipse(LOG_LENGTH * 0.55 - 0.1, RADIUS + 0.03, 0.12, 0.05, 0.4, 0, Math.PI * 2);
	context.ellipse(LOG_LENGTH * 0.55 + 0.1, RADIUS + 0.03, 0.12, 0.05, -0.4, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.redBright;
	context.beginPath();
	context.arc(LOG_LENGTH * 0.55, RADIUS + 0.06, 0.045, 0, Math.PI * 2);
	context.fill();
}

/** Grey puffs drifting up from the open end and fading. progress runs 0 to 1. */
function drawSmoke(context: CanvasRenderingContext2D, palette: IPalette, x: number, enlarge: number, progress: number) {
	context.fillStyle = palette.snowShade;
	context.globalAlpha = 0.7 * (1 - progress);

	for (let puff = 0; puff < 4; puff++) {
		const rise = progress * (0.6 + puff * 0.25) * enlarge;
		context.beginPath();
		context.arc(
			x + (puff - 1.5) * 0.18 * enlarge,
			RADIUS * enlarge + rise,
			(0.18 + progress * 0.25) * enlarge,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.globalAlpha = 1;
}
