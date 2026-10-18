import type { IPalette } from "Components/ElfFling/draw";
import { flyerEnlargement } from "Components/ElfFling/drawFlyers";
import type { IGameState } from "Components/ElfFling/physics";
import { ELF_RADIUS } from "Components/ElfFling/physics";
import {
	isActive,
	TIMED_POWER_UP_KINDS,
	SNOWBALL_REACH,
	type IPowerUp,
	type IPowerUpKind,
	type ITimedPowerUpKind,
} from "Components/ElfFling/powerUps";

/**
 * Power-ups: the pickups floating on the course (each bobbing in a soft gold glow), what they
 * do to the elf while they last (a star's shine, wings, a snowball rolled around it), and a
 * row of icons with countdown rings under the coin count. World units (metres, y up) unless a
 * function says so.
 */

const SIZE = 0.5;
/** Zoomed far out, pickups are drawn bigger than life, like coins, so they stay visible. */
const MIN_PIXELS = 22;
const GINGERBREAD = "#b5652b";
const SNOW_SHADE = "#c9d6de";
const COCOA = "#5a3420";

export function drawPowerUps(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	powerUps: IPowerUp[],
	time: number,
	pixelsPerMetre: number,
	visible: { left: number; right: number },
) {
	const size = SIZE * Math.max(1, MIN_PIXELS / (SIZE * 2 * pixelsPerMetre));

	for (const powerUp of powerUps) {
		if (powerUp.collectedAt !== null || powerUp.x < visible.left - 2 || powerUp.x > visible.right + 2) {
			continue;
		}

		const y = powerUp.y + Math.sin(time * 2.4 + powerUp.x) * size * 0.15;
		context.globalAlpha = 0.3 + 0.12 * Math.sin(time * 4 + powerUp.x);
		context.fillStyle = palette.gold;
		context.beginPath();
		context.arc(powerUp.x, y, size * 1.35, 0, Math.PI * 2);
		context.fill();
		context.globalAlpha = 1;
		context.save();
		context.translate(powerUp.x, y);
		drawIcon(context, palette, powerUp.kind, size);
		context.restore();
	}
}

/** Behind the elf: the Christmas star's pulsing shine. */
export function drawShine(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	state: IGameState,
	pixelsPerMetre: number,
) {
	if (!isActive(state.active, "christmasStar", state.time)) {
		return;
	}

	const enlarge = flyerEnlargement(pixelsPerMetre);
	const radius = ELF_RADIUS * enlarge * (2.2 + 0.25 * Math.sin(state.time * 10));
	const { x, y } = elfCentre(state, enlarge);
	const glow = context.createRadialGradient(x, y, 0, x, y, radius);
	glow.addColorStop(0, palette.gold);
	glow.addColorStop(1, "rgba(243, 217, 164, 0)");
	context.fillStyle = glow;
	context.beginPath();
	context.arc(x, y, radius, 0, Math.PI * 2);
	context.fill();
}

/** In front of the elf: wings while gliding, and the snowball rolled up around it. */
export function drawElfPowerUps(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	state: IGameState,
	pixelsPerMetre: number,
) {
	const enlarge = flyerEnlargement(pixelsPerMetre);
	const { x, y } = elfCentre(state, enlarge);

	if (isActive(state.active, "snowAngelWings", state.time) && state.phase === "flying") {
		// A slow flap.
		const lift = Math.sin(state.time * 6) * 0.25;
		context.save();
		context.translate(x, y);
		context.scale(enlarge, enlarge);
		context.fillStyle = palette.white;
		context.globalAlpha = 0.9;

		for (const side of [-1, 1]) {
			context.save();
			context.rotate(side * (0.6 + lift));
			context.beginPath();
			context.ellipse(side * 0.42, 0.12, 0.38, 0.14, 0, 0, Math.PI * 2);
			context.fill();
			context.restore();
		}

		context.restore();
	}

	if (isActive(state.active, "giantSnowball", state.time)) {
		// Big, to show the elf's longer reach; in the air it's round the elf, on the snow it rests on it.
		const radius = (ELF_RADIUS + SNOWBALL_REACH / 2) * enlarge;
		const ballY = Math.max(y, radius);
		context.fillStyle = palette.white;
		context.globalAlpha = 0.88;
		context.beginPath();
		context.arc(x, ballY, radius, 0, Math.PI * 2);
		context.fill();
		// Rolling: a shaded band turns with the spin.
		context.globalAlpha = 0.6;
		context.strokeStyle = SNOW_SHADE;
		context.lineWidth = radius * 0.18;
		context.beginPath();
		context.arc(x, ballY, radius * 0.6, -state.elf.spin, -state.elf.spin + 1.4);
		context.stroke();
		context.globalAlpha = 1;
	}
}

/** Where the elf is drawn: enlarged flyers rest on the snow, so the centre rises with them. */
function elfCentre(state: IGameState, enlarge: number): { x: number; y: number } {
	return { x: state.elf.x, y: state.elf.y + ELF_RADIUS * (enlarge - 1) };
}

/**
 * The power-ups going right now, under the coin (and gem) count: each icon with a gold ring
 * that runs down as it wears off. Screen units (y down): call outside the world transform.
 */
export function drawActivePowerUps(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	state: IGameState,
	top: number,
	seconds: (kind: ITimedPowerUpKind) => number,
) {
	let x = 26;

	for (const kind of TIMED_POWER_UP_KINDS) {
		const until = state.active[kind];

		if (until === null || state.time >= until) {
			continue;
		}

		const left = (until - state.time) / seconds(kind);
		context.fillStyle = "rgba(15, 32, 39, 0.55)";
		context.beginPath();
		context.arc(x, top, 14, 0, Math.PI * 2);
		context.fill();
		context.strokeStyle = palette.gold;
		context.lineWidth = 3;
		context.beginPath();
		context.arc(x, top, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
		context.stroke();
		// The icons are drawn y up, so flip around their centre.
		context.save();
		context.translate(x, top);
		context.scale(1, -1);
		drawIcon(context, palette, kind, 9);
		context.restore();
		x += 36;
	}
}

/** Each power-up's picture, centred on the origin, about `size` across each way. y runs up. */
function drawIcon(context: CanvasRenderingContext2D, palette: IPalette, kind: IPowerUpKind, size: number) {
	switch (kind) {
		case "christmasStar": {
			context.fillStyle = palette.gold;
			context.strokeStyle = palette.goldDeep;
			context.lineWidth = size * 0.12;
			context.beginPath();

			for (let point = 0; point < 10; point++) {
				const angle = Math.PI / 2 + (point * Math.PI) / 5;
				const reach = point % 2 === 0 ? size : size * 0.45;
				context.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
			}

			context.closePath();
			context.fill();
			context.stroke();
			break;
		}

		case "gingerbreadMan": {
			context.fillStyle = GINGERBREAD;
			context.beginPath();
			context.arc(0, size * 0.55, size * 0.35, 0, Math.PI * 2);
			context.fill();
			context.beginPath();
			context.ellipse(0, -size * 0.1, size * 0.34, size * 0.42, 0, 0, Math.PI * 2);
			context.fill();
			context.lineCap = "round";
			context.strokeStyle = GINGERBREAD;
			context.lineWidth = size * 0.24;
			context.beginPath();
			// Arms and legs.
			context.moveTo(-size * 0.28, size * 0.1);
			context.lineTo(-size * 0.75, size * 0.3);
			context.moveTo(size * 0.28, size * 0.1);
			context.lineTo(size * 0.75, size * 0.3);
			context.moveTo(-size * 0.18, -size * 0.45);
			context.lineTo(-size * 0.4, -size * 0.9);
			context.moveTo(size * 0.18, -size * 0.45);
			context.lineTo(size * 0.4, -size * 0.9);
			context.stroke();
			// Icing buttons and eyes.
			context.fillStyle = palette.white;

			for (const [dx, dy, r] of [
				[0, 0.05, 0.07],
				[0, -0.25, 0.07],
				[-0.12, 0.62, 0.05],
				[0.12, 0.62, 0.05],
			]) {
				context.beginPath();
				context.arc(dx * size, dy * size, r * size, 0, Math.PI * 2);
				context.fill();
			}

			break;
		}

		case "snowAngelWings": {
			context.fillStyle = palette.white;

			for (const side of [-1, 1]) {
				context.save();
				context.rotate(side * 0.5);
				context.beginPath();
				context.ellipse(side * size * 0.45, 0, size * 0.5, size * 0.22, 0, 0, Math.PI * 2);
				context.fill();
				context.beginPath();
				context.ellipse(side * size * 0.38, -size * 0.22, size * 0.36, size * 0.15, 0, 0, Math.PI * 2);
				context.fill();
				context.restore();
			}

			break;
		}

		case "northWind": {
			// The wind symbol, blowing right: a long middle gust, with the top one curling up and
			// back at its end and the bottom one curling down and back (y runs up).
			context.strokeStyle = palette.white;
			context.lineCap = "round";
			context.lineJoin = "round";
			context.lineWidth = size * 0.16;
			context.beginPath();
			context.moveTo(-size * 0.9, 0);
			context.lineTo(size * 0.75, 0);

			for (const side of [1, -1]) {
				const y = side * size * 0.42;
				const end = size * 0.3;
				context.moveTo(-size * 0.75, y);
				context.lineTo(end, y);
				context.bezierCurveTo(
					end + size * 0.32,
					y,
					end + size * 0.32,
					y + side * size * 0.4,
					end,
					y + side * size * 0.4,
				);
				context.quadraticCurveTo(end - size * 0.14, y + side * size * 0.4, end - size * 0.14, y + side * size * 0.26);
			}

			context.stroke();
			break;
		}

		case "hotCocoa": {
			// A red mug with a white band, cocoa on top, and steam.
			context.fillStyle = palette.red;
			context.fillRect(-size * 0.5, -size * 0.7, size * 0.9, size * 1.05);
			context.fillStyle = palette.white;
			context.fillRect(-size * 0.5, -size * 0.25, size * 0.9, size * 0.2);
			context.fillStyle = COCOA;
			context.fillRect(-size * 0.45, size * 0.22, size * 0.8, size * 0.12);
			context.strokeStyle = palette.red;
			context.lineWidth = size * 0.14;
			context.beginPath();
			context.arc(size * 0.48, -size * 0.18, size * 0.24, -Math.PI / 2, Math.PI / 2, true);
			context.stroke();
			context.strokeStyle = palette.white;
			context.lineWidth = size * 0.09;
			context.lineCap = "round";

			for (const dx of [-0.2, 0.15]) {
				context.beginPath();
				context.moveTo(dx * size, size * 0.45);
				context.quadraticCurveTo((dx + 0.15) * size, size * 0.65, dx * size, size * 0.9);
				context.stroke();
			}

			break;
		}

		case "spareFirework": {
			// A little rocket, tilted up and to the right.
			context.save();
			context.rotate(-Math.PI / 4);
			context.fillStyle = palette.goldDeep;
			context.beginPath();
			context.moveTo(-size * 0.18, -size * 0.55);
			context.lineTo(0, -size * 1);
			context.lineTo(size * 0.18, -size * 0.55);
			context.fill();
			context.fillStyle = palette.red;
			context.fillRect(-size * 0.2, -size * 0.55, size * 0.4, size * 1.1);
			context.fillStyle = palette.white;
			context.fillRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.14);
			context.fillStyle = palette.gold;
			context.beginPath();
			context.moveTo(-size * 0.2, size * 0.55);
			context.lineTo(0, size * 0.95);
			context.lineTo(size * 0.2, size * 0.55);
			context.fill();
			context.restore();
			break;
		}

		case "giantSnowball": {
			context.fillStyle = palette.white;
			context.beginPath();
			context.arc(0, 0, size * 0.85, 0, Math.PI * 2);
			context.fill();
			context.fillStyle = SNOW_SHADE;
			context.beginPath();
			context.arc(size * 0.2, -size * 0.2, size * 0.55, 0, Math.PI * 2);
			context.fill();
			context.fillStyle = palette.white;
			context.beginPath();
			context.arc(-size * 0.1, size * 0.1, size * 0.55, 0, Math.PI * 2);
			context.fill();
			break;
		}
	}
}
