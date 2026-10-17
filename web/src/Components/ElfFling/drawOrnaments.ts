import type { IPalette } from "Components/ElfFling/draw";
import { ORNAMENT_RADIUS, type IOrnament } from "Components/ElfFling/ornaments";

/**
 * The sky ornaments: glass baubles with a gold cap, bobbing gently, and the shards when one
 * shatters. World units (metres, y up).
 */

/** Zoomed far out, ornaments are drawn bigger than life, like the elf, so they stay visible. */
const MIN_PIXELS = 18;
const SHATTER_SECONDS = 0.8;
const SHARDS = 10;

export function drawOrnaments(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	ornaments: IOrnament[],
	time: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const enlarge = Math.max(1, MIN_PIXELS / (ORNAMENT_RADIUS * 2 * pixelsPerMetre));
	const colors = [palette.red, palette.green, palette.goldDeep];

	ornaments.forEach((ornament, index) => {
		if (ornament.x < visible.left - 3 || ornament.x > visible.right + 3) {
			return;
		}

		const color = colors[index % colors.length];
		const radius = ORNAMENT_RADIUS * enlarge;

		if (ornament.shatteredAt === null) {
			// A slow bob, each one out of step with its neighbours.
			const bob = Math.sin(time * 1.8 + index) * 0.12 * enlarge;
			drawBauble(context, palette, ornament.x, ornament.y + bob, radius, color);
		} else if (time - ornament.shatteredAt < SHATTER_SECONDS) {
			drawShards(
				context,
				ornament.x,
				ornament.y,
				radius,
				color,
				(time - ornament.shatteredAt) / SHATTER_SECONDS,
				index,
			);
		}
	});
}

function drawBauble(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	x: number,
	y: number,
	radius: number,
	color: string,
) {
	// The string it hangs from, fading up into the sky.
	context.strokeStyle = palette.gold;
	context.globalAlpha = 0.35;
	context.lineWidth = radius * 0.06;
	context.beginPath();
	context.moveTo(x, y + radius * 1.2);
	context.lineTo(x, y + radius * 3);
	context.stroke();
	context.globalAlpha = 1;

	// Cap and loop.
	context.fillStyle = palette.goldDeep;
	context.fillRect(x - radius * 0.28, y + radius * 0.85, radius * 0.56, radius * 0.3);
	context.strokeStyle = palette.goldDeep;
	context.lineWidth = radius * 0.08;
	context.beginPath();
	context.arc(x, y + radius * 1.25, radius * 0.12, 0, Math.PI * 2);
	context.stroke();

	// The glass ball, a band round it, and a highlight.
	context.fillStyle = color;
	context.beginPath();
	context.arc(x, y, radius, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.gold;
	context.fillRect(x - radius * 0.95, y - radius * 0.08, radius * 1.9, radius * 0.16);
	context.fillStyle = palette.white;
	context.globalAlpha = 0.6;
	context.beginPath();
	context.ellipse(x - radius * 0.35, y + radius * 0.4, radius * 0.22, radius * 0.14, -0.6, 0, Math.PI * 2);
	context.fill();
	context.globalAlpha = 1;
}

/** Glass shards flying out from where it was, falling and fading. progress runs 0 to 1. */
function drawShards(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	color: string,
	progress: number,
	seed: number,
) {
	const seconds = progress * SHATTER_SECONDS;
	context.fillStyle = color;
	context.globalAlpha = 1 - progress;

	for (let shard = 0; shard < SHARDS; shard++) {
		const angle = (shard / SHARDS) * Math.PI * 2 + seed;
		const speed = radius * (4 + (shard % 3) * 1.5);
		const sx = x + Math.cos(angle) * speed * seconds;
		const sy = y + Math.sin(angle) * speed * seconds - 4.9 * seconds * seconds;
		const size = radius * 0.3;

		context.beginPath();
		context.moveTo(sx, sy + size);
		context.lineTo(sx + size * 0.7, sy - size * 0.5);
		context.lineTo(sx - size * 0.7, sy - size * 0.5);
		context.closePath();
		context.fill();
	}

	context.globalAlpha = 1;
}
