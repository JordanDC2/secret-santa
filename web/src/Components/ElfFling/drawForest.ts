import { drawOutOfFocus, drawVignette, hash } from "Components/ElfFling/drawForeground";
import type { IPalette } from "Components/ElfFling/draw";

/**
 * The boreal forest behind the course, in three layers drifting at their own pace: far, pale
 * mountains; a distant spruce forest; and nearer, taller spruces with snow on their tips. And
 * in front of it all (drawForestForeground), dark silhouettes sweeping past. Drawn
 * up from the horizon (floorY) in screen pixels, `amount` of the way in (0 to 1), greener by day.
 */

const MOUNTAIN_SPACING = 40;

/** A spruce: stacked tiers narrowing up to a point, its base at (x, base). */
function spruce(context: CanvasRenderingContext2D, x: number, base: number, height: number, snow: string | null) {
	const tiers = 4;
	const width = height * 0.42;

	context.beginPath();

	for (let tier = 0; tier < tiers; tier++) {
		const bottom = base - (height * tier) / (tiers + 0.6);
		const top = bottom - height * 0.42;
		const half = (width / 2) * (1 - tier / (tiers + 1));
		context.moveTo(x - half, bottom);
		context.lineTo(x, top);
		context.lineTo(x + half, bottom);
	}

	context.fill();

	if (snow) {
		const fill = context.fillStyle;
		context.fillStyle = snow;
		context.beginPath();
		const top = base - height * ((tiers - 1) / (tiers + 0.6) + 0.42);
		context.moveTo(x - width * 0.07, top + height * 0.1);
		context.lineTo(x, top);
		context.lineTo(x + width * 0.07, top + height * 0.1);
		context.fill();
		context.fillStyle = fill;
	}
}

/** One row of trees, `spacing` apart in the background's own pixels, scrolled by `drift`. */
function treeRow(
	context: CanvasRenderingContext2D,
	width: number,
	horizon: number,
	drift: number,
	spacing: number,
	height: { min: number; max: number },
	snow: string | null,
	seed: number,
) {
	const first = Math.floor(drift / spacing) - 1;
	const last = Math.ceil((drift + width) / spacing) + 1;

	for (let index = first; index <= last; index++) {
		const jitter = hash(index * 3 + seed);
		const x = index * spacing - drift + (jitter - 0.5) * spacing * 0.6;
		const tall = height.min + (height.max - height.min) * hash(index * 7 + seed + 1);
		spruce(context, x, horizon + 2, tall, snow);
	}
}

export function drawForest(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	horizon: number,
	pan: number,
	day: number,
	amount: number,
	mix: (from: string, to: string, t: number) => string,
) {
	context.save();
	context.globalAlpha = amount;

	// Far mountains: a jagged, pale ridge, a peak every MOUNTAIN_SPACING.
	const mountainDrift = pan * 0.12;
	const firstPeak = Math.floor(mountainDrift / MOUNTAIN_SPACING) - 1;
	context.fillStyle = mix("#2b4651", "#9db8c6", day);
	context.globalAlpha = amount * 0.6;
	context.beginPath();
	context.moveTo(0, horizon);

	for (let peak = firstPeak; peak * MOUNTAIN_SPACING - mountainDrift <= width + MOUNTAIN_SPACING; peak++) {
		context.lineTo(peak * MOUNTAIN_SPACING - mountainDrift, horizon - 60 - hash(peak) * 55);
	}

	context.lineTo(width, horizon);
	context.closePath();
	context.fill();

	// A distant forest, then nearer, taller trees with snowy tips.
	context.globalAlpha = amount * 0.8;
	context.fillStyle = mix("#0c2019", "#3f6b4a", day);
	treeRow(context, width, horizon, pan * 0.25, 13, { min: 34, max: 58 }, null, 11);
	context.globalAlpha = amount;
	context.fillStyle = mix("#123326", "#2f5a3a", day);
	treeRow(context, width, horizon, pan * 0.4, 26, { min: 64, max: 118 }, palette.white, 29);
	context.restore();
}

/** The foreground's spacing between its great trees, and its undergrowth, in its own (fast-drifting) pixels. */
const FOREGROUND_SPACING = 380;
const BRUSH_SPACING = 48;
/** Only this share of the undergrowth's places have anything, so it's sparse. */
const BRUSH_CHANCE = 0.4;
/** Near-black, faintly green: the foreground's silhouettes; a little lighter for the bark's grooves. */
const SILHOUETTE = "#040d0a";
const BARK_GROOVE = "#0b1a14";
/** Moonlight catching the trunks' left edges. */
const RIM_LIGHT = "rgba(160, 200, 210, 0.14)";

/**
 * In front of the course, in the boreal forest, standing on the ground: great spruces with thick,
 * grooved trunks and ragged boughs sweeping past faster than the course (only some places have
 * one, so they pass through rather than hide the elf), undergrowth along the bottom (ferns, snowy
 * bushes, stumps, rocks, fallen branches), and the edges darkened. It stands at `base` (the
 * bottom of the snow in view), so it drops away with the ground as the camera pans up. Screen pixels.
 */
export function drawForestForeground(
	target: CanvasRenderingContext2D,
	width: number,
	height: number,
	base: number,
	skyHeight: number,
	pan: number,
	amount: number,
) {
	drawOutOfFocus(target, amount, (context) => {
		// Great trees.
		const drift = pan * 1.6;
		const first = Math.floor(drift / FOREGROUND_SPACING) - 1;

		for (let index = first; index * FOREGROUND_SPACING - drift < width + FOREGROUND_SPACING; index++) {
			if (hash(index * 5 + 3) > 0.4) {
				continue;
			}

			const x = index * FOREGROUND_SPACING - drift + (hash(index * 11) - 0.5) * FOREGROUND_SPACING * 0.5;
			greatTree(context, x, base, skyHeight * (0.55 + hash(index * 13) * 0.3), 34 + hash(index * 19) * 20, index);
		}

		// Undergrowth along the bottom.
		const brushDrift = pan * 1.3;
		const brushFirst = Math.floor(brushDrift / BRUSH_SPACING) - 1;

		for (let index = brushFirst; index * BRUSH_SPACING - brushDrift < width + BRUSH_SPACING; index++) {
			if (hash(index * 41 + 7) > BRUSH_CHANCE) {
				continue;
			}

			const x = index * BRUSH_SPACING - brushDrift + (hash(index * 23) - 0.5) * BRUSH_SPACING * 0.6;
			undergrowth(context, x, base + 4, index);
		}
	});

	// The edges darkened, closing in.
	drawVignette(target, width, height, 0.55 * amount, [2, 8, 6]);
}

/**
 * A great spruce up close: a thick trunk flaring into roots, grooved bark with moonlight down
 * its left edge, and thin, ragged boughs drooping from halfway up to its top.
 */
function greatTree(
	context: CanvasRenderingContext2D,
	x: number,
	base: number,
	height: number,
	trunk: number,
	seed: number,
) {
	const top = base - height;
	const half = trunk / 2;

	// Trunk, narrowing a little upward, flaring into roots at the base.
	context.fillStyle = SILHOUETTE;
	context.beginPath();
	context.moveTo(x - half * 2.1, base);
	context.quadraticCurveTo(x - half * 1.05, base - 12, x - half, base - 34);
	context.lineTo(x - half * 0.6, top);
	context.lineTo(x + half * 0.6, top);
	context.lineTo(x + half, base - 34);
	context.quadraticCurveTo(x + half * 1.05, base - 12, x + half * 2.1, base);
	context.closePath();
	context.fill();

	// Bark: long, wavering grooves up the trunk.
	context.strokeStyle = BARK_GROOVE;
	context.lineWidth = 2;

	for (let groove = 0; groove < 5; groove++) {
		const across = (groove / 4 - 0.5) * trunk * 0.7;
		const wobble = 1.5 + hash(seed * 31 + groove) * 2.5;
		context.beginPath();
		context.moveTo(x + across, base - 6);

		for (let y = base - 6; y > top + height * 0.3; y -= 14) {
			const sway = Math.sin(y * 0.09 + groove + seed) * wobble;
			context.lineTo(x + across * (0.6 + (0.4 * (y - top)) / height) + sway, y);
		}

		context.stroke();
	}

	// Moonlight down the left edge.
	context.strokeStyle = RIM_LIGHT;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(x - half * 0.95, base - 34);
	context.lineTo(x - half * 0.6, top + height * 0.3);
	context.stroke();

	// Boughs: thin, drooping, ragged bands from halfway up, longest lowest, with gaps between
	// them so the trunk shows through.
	context.fillStyle = SILHOUETTE;
	const boughs = 7;

	for (let bough = 0; bough < boughs; bough++) {
		const t = bough / (boughs - 1);
		const y = base - height * (0.5 + 0.5 * t);
		const reach = trunk * (2.2 - 1.7 * t) * (0.85 + hash(seed * 7 + bough) * 0.3);
		const droop = 10 + reach * 0.3;
		const thick = 9 - 4 * t;

		for (const side of [-1, 1]) {
			context.beginPath();
			context.moveTo(x, y - thick);
			context.quadraticCurveTo(x + side * reach * 0.55, y - thick, x + side * reach, y + droop);
			// The ragged underside, back to the trunk.
			const teeth = 7;

			for (let tooth = teeth; tooth >= 0; tooth--) {
				const along = tooth / teeth;
				const sag = Math.sin(along * Math.PI) * 4;
				const jag = tooth % 2 === 0 ? 0 : 4 + hash(seed + bough * 3 + tooth) * 5;
				context.lineTo(x + side * reach * along, y + droop * along * along + sag + jag);
			}

			context.closePath();
			context.fill();
		}
	}

	// The very top: a spike.
	context.beginPath();
	context.moveTo(x - 5, top + 10);
	context.lineTo(x, top - 24);
	context.lineTo(x + 5, top + 10);
	context.fill();
}

/** One piece of undergrowth at x, standing on `base`: a fern, a snowy bush, a stump, a rock or a fallen branch. */
function undergrowth(context: CanvasRenderingContext2D, x: number, base: number, seed: number) {
	const kind = hash(seed * 29);
	const size = 0.7 + hash(seed * 37) * 0.6;
	context.fillStyle = SILHOUETTE;
	context.strokeStyle = SILHOUETTE;

	if (kind < 0.4) {
		// A fern: fronds arcing out from the middle, each with leaflets along it.
		const fronds = 5;
		context.lineWidth = 1.6;

		for (let frond = 0; frond < fronds; frond++) {
			const angle = -Math.PI / 2 + (frond / (fronds - 1) - 0.5) * 2.2;
			const length = (16 + hash(seed + frond) * 10) * size;
			const tipX = x + Math.cos(angle) * length;
			const tipY = base + Math.sin(angle) * length * 0.9;
			const bendX = x + Math.cos(angle) * length * 0.5;
			const bendY = base + Math.sin(angle) * length * 0.7 - 6;
			context.beginPath();
			context.moveTo(x, base);
			context.quadraticCurveTo(bendX, bendY, tipX, tipY + 6);
			context.stroke();

			for (let leaf = 1; leaf < 6; leaf++) {
				const t = leaf / 6;
				const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * bendX + t * t * tipX;
				const py = (1 - t) * (1 - t) * base + 2 * (1 - t) * t * bendY + t * t * (tipY + 6);
				const leafLength = 6 * (1 - t) * size + 1;
				context.beginPath();
				context.moveTo(px - leafLength, py - leafLength * 0.6);
				context.lineTo(px, py);
				context.lineTo(px + leafLength, py - leafLength * 0.6);
				context.stroke();
			}
		}
	} else if (kind < 0.6) {
		// A bush under snow: dark clumps with a white cap.
		const r = 10 * size;
		context.beginPath();
		context.arc(x - r * 0.7, base - r * 0.5, r * 0.8, 0, Math.PI * 2);
		context.arc(x + r * 0.6, base - r * 0.45, r * 0.75, 0, Math.PI * 2);
		context.arc(x, base - r * 0.9, r, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = "rgba(220, 232, 236, 0.55)";
		context.beginPath();
		context.ellipse(x, base - r * 1.75, r * 0.8, r * 0.28, 0, Math.PI, 0);
		context.fill();
	} else if (kind < 0.72) {
		// A stump, sawn flat.
		const w = 14 * size;
		const h = 16 * size;
		context.fillRect(x - w / 2, base - h, w, h);
		context.beginPath();
		context.moveTo(x - w / 2 - 5, base);
		context.lineTo(x - w / 2, base - 6);
		context.lineTo(x + w / 2, base - 6);
		context.lineTo(x + w / 2 + 5, base);
		context.fill();
		context.fillStyle = "rgba(220, 232, 236, 0.5)";
		context.beginPath();
		context.ellipse(x, base - h, w / 2, 2.5, 0, 0, Math.PI * 2);
		context.fill();
	} else if (kind < 0.86) {
		// A rock, with snow on top.
		const w = 18 * size;
		const h = 11 * size;
		context.beginPath();
		context.moveTo(x - w / 2, base);
		context.quadraticCurveTo(x - w / 2, base - h, x - w * 0.1, base - h);
		context.quadraticCurveTo(x + w / 2, base - h * 1.1, x + w / 2, base);
		context.fill();
		context.fillStyle = "rgba(220, 232, 236, 0.55)";
		context.beginPath();
		context.ellipse(x - w * 0.05, base - h + 1, w * 0.32, 2.5, 0, Math.PI, 0);
		context.fill();
	} else {
		// A fallen branch, with a few twigs.
		const length = 30 * size;
		context.lineWidth = 3;
		context.beginPath();
		context.moveTo(x - length / 2, base - 2);
		context.lineTo(x + length / 2, base - 6);
		context.stroke();
		context.lineWidth = 1.5;

		for (let twig = 0; twig < 3; twig++) {
			const along = x - length / 2 + ((twig + 0.5) / 3) * length;
			context.beginPath();
			context.moveTo(along, base - 3 - twig);
			context.lineTo(along + 4, base - 11 - twig);
			context.stroke();
		}
	}
}
