import type { IPalette } from "Components/ElfFling/draw";

/**
 * The new-best moment: confetti bursting from the top of the game and drifting down, and a
 * big gold "New best!" that settles in and fades. Screen units (pixels), over everything.
 */

/** How long it lasts, in seconds. */
export const CELEBRATION_SECONDS = 3;
const PIECES = 90;

/** age: seconds since the throw ended as a new best. */
export function drawCelebration(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	size: { width: number; height: number },
	age: number,
) {
	if (age < 0 || age >= CELEBRATION_SECONDS) {
		return;
	}

	const { width, height } = size;
	const colors = [palette.red, palette.gold, palette.green, palette.white, palette.redBright, palette.goldDeep];
	const fade = Math.min(1, (CELEBRATION_SECONDS - age) / 0.6);

	context.save();
	context.globalAlpha = fade;

	for (let piece = 0; piece < PIECES; piece++) {
		// Fixed per piece, so the burst doesn't flicker from frame to frame.
		const angle = Math.PI * (0.05 + 0.9 * fraction(piece * 3.13));
		const speed = 180 + 260 * fraction(piece * 7.71);
		const x = width / 2 + Math.cos(angle) * speed * age + Math.sin(age * 3 + piece) * 12;
		const y = height * 0.12 - Math.sin(angle) * speed * age * 0.55 + 260 * age * age;

		context.fillStyle = colors[piece % colors.length];
		context.save();
		context.translate(x, y);
		context.rotate(age * (4 + (piece % 5)) + piece);
		context.fillRect(-4, -2.5, 8, 5);
		context.restore();
	}

	// "New best!": pops in a touch oversized, then settles.
	const pop = Math.min(1, age / 0.25);
	const scale = 1 + 0.25 * (1 - pop) * Math.sin(pop * Math.PI);
	const fontSize = Math.round(Math.min(56, Math.max(30, width / 12)));
	context.translate(width / 2, height * 0.32);
	context.scale(scale, scale);
	context.font = `700 ${fontSize}px "Mountains of Christmas", Nunito, serif`;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.lineWidth = 6;
	context.strokeStyle = "rgba(15, 32, 39, 0.75)";
	context.strokeText("New best!", 0, 0);
	context.fillStyle = palette.gold;
	context.fillText("New best!", 0, 0);
	context.restore();
}

/** A repeatable "random" number in [0, 1) from a seed. */
function fraction(seed: number): number {
	const value = Math.sin(seed * 12.9898) * 43758.5453;

	return value - Math.floor(value);
}
