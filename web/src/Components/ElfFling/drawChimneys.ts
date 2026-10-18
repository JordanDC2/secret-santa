import { CHIMNEY_HEIGHT, CHIMNEY_WIDTH, type IChimney } from "Components/ElfFling/chimneys";
import type { IPalette } from "Components/ElfFling/draw";

/**
 * Chimneys standing in the snow: red brick with a snowy cap and a curl of smoke, glowing warm
 * at the top while the elf is down one. Drawn in front of the elf, so it disappears inside.
 * World units (metres, y up).
 */

/** Zoomed far out, chimneys are drawn bigger than life, like snowmen, so they stay visible. */
const MIN_PIXELS = 46;
const BRICK = "#a8452f";
const MORTAR = "#7c2f20";

export function drawChimneys(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	chimneys: IChimney[],
	occupiedX: number | null,
	clock: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const enlarge = Math.max(1, MIN_PIXELS / (CHIMNEY_HEIGHT * pixelsPerMetre));
	const half = CHIMNEY_WIDTH / 2;

	for (const chimney of chimneys) {
		if (chimney.x < visible.left - 4 || chimney.x > visible.right + 4) {
			continue;
		}

		context.save();
		context.translate(chimney.x, 0);
		context.scale(enlarge, enlarge);

		// Brick stack with mortar lines.
		context.fillStyle = BRICK;
		context.fillRect(-half, 0, CHIMNEY_WIDTH, CHIMNEY_HEIGHT);
		context.strokeStyle = MORTAR;
		context.lineWidth = 0.05;
		context.beginPath();

		for (let row = 1, y = 0.35; y < CHIMNEY_HEIGHT; row++, y += 0.35) {
			context.moveTo(-half, y);
			context.lineTo(half, y);
			const offset = row % 2 === 0 ? -0.2 : 0.2;
			context.moveTo(offset, y);
			context.lineTo(offset, y - 0.35);
		}

		context.stroke();

		// The rim, capped with snow.
		context.fillStyle = BRICK;
		context.fillRect(-half - 0.12, CHIMNEY_HEIGHT - 0.25, CHIMNEY_WIDTH + 0.24, 0.3);
		context.fillStyle = palette.white;
		context.beginPath();
		context.ellipse(0, CHIMNEY_HEIGHT + 0.07, half + 0.2, 0.14, 0, 0, Math.PI * 2);
		context.fill();

		// Something's going on down there: a warm glow at the top.
		if (occupiedX === chimney.x) {
			context.fillStyle = palette.goldDeep;
			context.globalAlpha = 0.5 + 0.3 * Math.sin(clock * 8);
			context.beginPath();
			context.ellipse(0, CHIMNEY_HEIGHT + 0.12, half * 0.8, 0.12, 0, 0, Math.PI * 2);
			context.fill();
			context.globalAlpha = 1;
		}

		// A lazy curl of smoke.
		context.fillStyle = palette.snowShade;

		for (let puff = 0; puff < 3; puff++) {
			const rise = (clock * 0.4 + puff / 3) % 1;
			context.globalAlpha = 0.35 * (1 - rise);
			context.beginPath();
			context.arc(
				Math.sin(rise * 4 + puff) * 0.25,
				CHIMNEY_HEIGHT + 0.3 + rise * 1.6,
				0.18 + rise * 0.25,
				0,
				Math.PI * 2,
			);
			context.fill();
		}

		context.globalAlpha = 1;
		context.restore();
	}
}
