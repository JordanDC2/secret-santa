import { drawTally } from "Components/ElfFling/drawCoins";
import type { IPalette } from "Components/ElfFling/draw";

/**
 * The gem count under the coin count, once the player has prestiged: a cut ruby and their
 * balance. Gems only come from prestige, so the count doesn't change during a throw.
 */

const RUBY_DARK = "#7d0018";

/**
 * A brilliant-cut gem seen side on, centred at (x, y): a flat table on top, a short crown and a
 * long point below. size is its width. y runs up, as in the world.
 */
function drawRuby(context: CanvasRenderingContext2D, palette: IPalette, x: number, y: number, size: number) {
	const half = size / 2;
	const table = size * 0.28;
	const top = y + size * 0.32;
	const girdle = y + size * 0.1;
	const point = y - size * 0.55;

	context.fillStyle = palette.red;
	context.beginPath();
	context.moveTo(x - table, top);
	context.lineTo(x + table, top);
	context.lineTo(x + half, girdle);
	context.lineTo(x, point);
	context.lineTo(x - half, girdle);
	context.closePath();
	context.fill();

	// The shaded right-hand facets.
	context.fillStyle = RUBY_DARK;
	context.beginPath();
	context.moveTo(x + table, top);
	context.lineTo(x + half, girdle);
	context.lineTo(x, point);
	context.lineTo(x + table * 0.4, girdle);
	context.closePath();
	context.fill();

	// The lit crown, and a glint on the table.
	context.fillStyle = palette.redBright;
	context.beginPath();
	context.moveTo(x - table, top);
	context.lineTo(x + table * 0.4, top);
	context.lineTo(x + table * 0.4, girdle);
	context.lineTo(x - half, girdle);
	context.closePath();
	context.fill();
	context.fillStyle = palette.white;
	context.globalAlpha = 0.8;
	context.beginPath();
	context.moveTo(x - table * 0.7, top - size * 0.04);
	context.lineTo(x - table * 0.1, top - size * 0.04);
	context.lineTo(x - table * 0.45, girdle + size * 0.04);
	context.closePath();
	context.fill();
	context.globalAlpha = 1;
}

/** Screen units (y down): call outside the world transform. */
export function drawGemCount(context: CanvasRenderingContext2D, palette: IPalette, total: number) {
	const x = 26;
	const y = 54;
	// The gem is drawn y-up, so flip around its own centre.
	context.save();
	context.translate(x, y);
	context.scale(1, -1);
	drawRuby(context, palette, 0, 0, 20);
	context.restore();
	drawTally(context, palette, x, y, total, 0);
}
