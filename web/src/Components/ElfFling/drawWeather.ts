import type { IPalette } from "Components/ElfFling/draw";
import { GUST_DEPTH, UPDRAFT_WIDTH, type IGust, type IUpdraft } from "Components/ElfFling/weather";

/**
 * The weather, drawn faintly behind everything: high winds as white streaks racing along their
 * band, and updrafts as a pale column with flecks of snow rising up it. World units (metres,
 * y up); widths in pixels are kept steady as the camera zooms.
 */

const STREAKS = 9;
const FLECKS = 14;

export function drawWeather(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	gusts: IGust[],
	updrafts: IUpdraft[],
	clock: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const pixel = 1 / pixelsPerMetre;
	context.strokeStyle = palette.white;
	context.fillStyle = palette.white;
	context.lineCap = "round";

	for (const gust of gusts) {
		if (gust.x + gust.length < visible.left || gust.x > visible.right) {
			continue;
		}

		context.lineWidth = 2 * pixel;

		for (let streak = 0; streak < STREAKS; streak++) {
			// Each streak races along the band and wraps round, each at its own height and pace.
			const lane = fraction(gust.x + streak * 3.7);
			const pace = 0.5 + fraction(gust.x * 1.3 + streak) * 0.6;
			const along = (((clock * pace + lane) % 1) + 1) % 1;
			const x = gust.x + along * gust.length;
			const y = gust.y + (lane - 0.5) * GUST_DEPTH;
			const length = Math.min(4 + lane * 4, gust.x + gust.length - x);
			context.globalAlpha = 0.35 * Math.sin(along * Math.PI);
			context.beginPath();
			context.moveTo(x, y);
			context.lineTo(x + length, y);
			context.stroke();
		}
	}

	for (const updraft of updrafts) {
		if (updraft.x + UPDRAFT_WIDTH < visible.left || updraft.x - UPDRAFT_WIDTH > visible.right) {
			continue;
		}

		// A soft-sided column (clear at the edges, faint in the middle), fading out towards the top.
		const half = UPDRAFT_WIDTH / 2;
		const column = context.createLinearGradient(updraft.x - half, 0, updraft.x + half, 0);
		column.addColorStop(0, "rgba(255, 255, 255, 0)");
		column.addColorStop(0.5, "rgba(255, 255, 255, 0.14)");
		column.addColorStop(1, "rgba(255, 255, 255, 0)");
		context.fillStyle = column;
		const slices = 12;

		for (let slice = 0; slice < slices; slice++) {
			context.globalAlpha = 1 - slice / slices;
			context.fillRect(updraft.x - half, (slice * updraft.top) / slices, UPDRAFT_WIDTH, updraft.top / slices);
		}

		context.fillStyle = palette.white;

		for (let fleck = 0; fleck < FLECKS; fleck++) {
			// Flecks rise up the column, swaying, and fade as they near the top.
			const offset = fraction(updraft.x + fleck * 2.3);
			const rise = (((clock * 0.35 + offset) % 1) + 1) % 1;
			const x = updraft.x + (fraction(fleck * 5.1 + updraft.x) - 0.5) * UPDRAFT_WIDTH * 0.8;
			const sway = Math.sin(clock * 3 + fleck) * 0.4;
			context.globalAlpha = 0.5 * (1 - rise);
			context.beginPath();
			context.arc(x + sway, rise * updraft.top, 2.5 * pixel, 0, Math.PI * 2);
			context.fill();
		}
	}

	context.globalAlpha = 1;
}

/** A repeatable "random" number in [0, 1) from a seed. */
function fraction(seed: number): number {
	const value = Math.sin(seed * 12.9898) * 43758.5453;

	return value - Math.floor(value);
}
