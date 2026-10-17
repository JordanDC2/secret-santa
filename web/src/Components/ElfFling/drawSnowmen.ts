import type { IPalette } from "Components/ElfFling/draw";
import type { ISnowman } from "Components/ElfFling/snowmen";

/**
 * Snowmen standing in the snow (three balls, a hat, a scarf, a carrot nose), and toppling
 * over when the elf runs into one. World units (metres, y up).
 */

/** Zoomed far out, snowmen are drawn bigger than life, like the elf, so they stay visible. */
const MIN_PIXELS = 30;
const HEIGHT = 1.7;
const TOPPLE_SECONDS = 0.5;

export function drawSnowmen(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	snowmen: ISnowman[],
	time: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const enlarge = Math.max(1, MIN_PIXELS / (HEIGHT * pixelsPerMetre));

	for (const snowman of snowmen) {
		if (snowman.x < visible.left - 3 || snowman.x > visible.right + 3) {
			continue;
		}

		// Falls forward (the way the elf was going), pivoting on its base, and lies there.
		const fallen = snowman.toppledAt === null ? 0 : Math.min(1, (time - snowman.toppledAt) / TOPPLE_SECONDS);

		context.save();
		context.translate(snowman.x, 0);
		context.scale(enlarge, enlarge);
		context.rotate((-Math.PI / 2) * fallen ** 2);
		drawSnowman(context, palette);
		context.restore();
	}
}

function drawSnowman(context: CanvasRenderingContext2D, palette: IPalette) {
	const ball = (y: number, radius: number) => {
		context.beginPath();
		context.arc(0, y, radius, 0, Math.PI * 2);
		context.fill();
	};

	context.fillStyle = palette.white;
	ball(0.42, 0.42);
	ball(0.98, 0.32);
	ball(1.42, 0.23);

	// Coal buttons and eyes.
	context.fillStyle = "#1c120b";
	ball(1.05, 0.04);
	ball(0.9, 0.04);
	ball(1.47, 0.03);
	context.beginPath();
	context.arc(0.09, 1.47, 0.03, 0, Math.PI * 2);
	context.fill();

	// Carrot nose, pointing ahead.
	context.fillStyle = palette.goldDeep;
	context.beginPath();
	context.moveTo(0.12, 1.42);
	context.lineTo(0.38, 1.38);
	context.lineTo(0.12, 1.36);
	context.closePath();
	context.fill();

	// Scarf and top hat.
	context.fillStyle = palette.red;
	context.fillRect(-0.24, 1.2, 0.48, 0.08);
	context.fillRect(0.1, 1.04, 0.08, 0.18);
	context.fillStyle = "#1c120b";
	context.fillRect(-0.24, 1.6, 0.48, 0.05);
	context.fillRect(-0.15, 1.64, 0.3, 0.3);
	context.fillStyle = palette.green;
	context.fillRect(-0.15, 1.66, 0.3, 0.05);
}
