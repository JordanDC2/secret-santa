import type { ICoin } from "Components/ElfFling/coins";
import type { IPalette } from "Components/ElfFling/draw";

/**
 * The coins: gold discs turning slowly in place, and a quick sparkle where one was collected.
 * Also the coin count in the corner. World units (metres, y up) unless a function says so.
 */

const RADIUS = 0.28;

/** Each value has its own rim colour and size, so the valuable ones stand out. */
function coinStyle(palette: IPalette, value: number): { rim: string; scale: number } {
	if (value >= 10) {
		return { rim: palette.redBright, scale: 1.8 };
	}

	if (value >= 5) {
		return { rim: palette.red, scale: 1.5 };
	}

	if (value >= 3) {
		return { rim: palette.green, scale: 1.25 };
	}

	return { rim: palette.goldDeep, scale: 1 };
}
/** Zoomed far out, coins are drawn bigger than life, like the elf, so they stay visible. */
const MIN_PIXELS = 10;
const SPARKLE_SECONDS = 0.4;

export function drawCoins(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	coins: ICoin[],
	time: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const enlarge = Math.max(1, MIN_PIXELS / (RADIUS * 2 * pixelsPerMetre));

	for (const coin of coins) {
		if (coin.x < visible.left - 2 || coin.x > visible.right + 2) {
			continue;
		}

		const style = coinStyle(palette, coin.value);
		const radius = RADIUS * style.scale * enlarge;

		if (coin.collectedAt === null) {
			// Turning: the disc narrows and widens, each coin a little out of step with its neighbours.
			const turn = Math.max(0.25, Math.abs(Math.cos(time * 2.5 + coin.x * 0.7)));
			drawDisc(context, palette, coin.x, coin.y, radius, turn, style.rim);
		} else if (time - coin.collectedAt < SPARKLE_SECONDS) {
			drawSparkle(context, palette, coin.x, coin.y, radius, (time - coin.collectedAt) / SPARKLE_SECONDS);
		}
	}
}

function drawDisc(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	x: number,
	y: number,
	radius: number,
	turn: number,
	rim: string,
) {
	context.fillStyle = rim;
	context.beginPath();
	context.ellipse(x, y, radius * turn, radius, 0, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.gold;
	context.beginPath();
	context.ellipse(x, y, radius * 0.72 * turn, radius * 0.72, 0, 0, Math.PI * 2);
	context.fill();
	// A glint.
	context.fillStyle = palette.white;
	context.globalAlpha = 0.7;
	context.beginPath();
	context.ellipse(x - radius * 0.25 * turn, y + radius * 0.3, radius * 0.16 * turn, radius * 0.12, 0, 0, Math.PI * 2);
	context.fill();
	context.globalAlpha = 1;
}

/** A four-pointed star that grows and fades. progress runs 0 to 1. */
function drawSparkle(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	x: number,
	y: number,
	radius: number,
	progress: number,
) {
	const size = radius * (1 + progress * 1.2);
	context.globalAlpha = 1 - progress;
	context.fillStyle = palette.gold;
	context.beginPath();
	for (let point = 0; point < 8; point++) {
		const angle = (point * Math.PI) / 4;
		const reach = point % 2 === 0 ? size : size * 0.3;
		context.lineTo(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
	}
	context.closePath();
	context.fill();
	context.globalAlpha = 1;
}

/**
 * The player's coins, top left: their whole balance, and beside it what this throw has
 * picked up so far ("+19"). Screen units: call outside the world transform.
 */
export function drawCoinCount(context: CanvasRenderingContext2D, palette: IPalette, total: number, thisThrow: number) {
	const x = 26;
	const y = 26;
	drawDisc(context, palette, x, y, 10, 1, palette.goldDeep);
	drawTally(context, palette, x, y, total, thisThrow);
}

/**
 * Text over the game with a dark outline, so it reads on the night sky and the pale day sky
 * alike. Uses the context's current font, alignment and fill.
 */
export function drawOutlinedText(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
	context.save();
	context.lineJoin = "round";
	context.lineWidth = 4;
	context.strokeStyle = "rgba(15, 32, 39, 0.8)";
	context.strokeText(text, x, y);
	context.restore();
	context.fillText(text, x, y);
}

/**
 * A balance beside its icon (centred at x, y), and what this throw has added in smaller,
 * fainter type after it. Screen units.
 */
export function drawTally(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	x: number,
	y: number,
	total: number,
	thisThrow: number,
) {
	context.textAlign = "left";
	context.textBaseline = "middle";
	context.font = "800 20px Nunito, sans-serif";
	context.fillStyle = palette.gold;
	const totalText = total.toLocaleString();
	drawOutlinedText(context, totalText, x + 18, y + 1);

	if (thisThrow > 0) {
		const after = x + 18 + context.measureText(totalText).width + 8;
		context.font = "700 14px Nunito, sans-serif";
		context.fillStyle = palette.white;
		drawOutlinedText(context, `+${thisThrow.toLocaleString()}`, after, y + 2);
	}

	context.textBaseline = "alphabetic";
}
