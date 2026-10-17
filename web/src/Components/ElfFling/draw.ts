import {
	REINDEER_X,
	STACK,
	SWING_CONTACT_TIME,
	SWING_DURATION,
	SWEET_SPOT_Y,
	type IGameState,
} from "Components/ElfFling/physics";
import { drawCoinCount, drawCoins } from "Components/ElfFling/drawCoins";
import { drawCrackers, drawPopLabels } from "Components/ElfFling/drawCrackers";
import { drawFlyer, flyerEnlargement } from "Components/ElfFling/drawFlyers";
import { drawOrnaments } from "Components/ElfFling/drawOrnaments";
import { drawSleigh } from "Components/ElfFling/drawSleigh";
import { drawSnowmen } from "Components/ElfFling/drawSnowmen";
import type { ISkinId } from "Components/ElfFling/skins";

/**
 * Draws one frame of Elf Fling on a canvas: a snowy night, distance flags, the stack of
 * presents, the reindeer swinging its candy cane, and whoever's being flung (drawFlyers.ts). World units are metres
 * (y up); the camera follows the elf and zooms out when it flies high. The crackers, sky
 * ornaments, coins, snowmen and sleigh have their own files (drawCrackers.ts and so on).
 */

/** The scene's colours, read once from the app's --festive-* tokens. */
export type IPalette = {
	skyTop: string;
	skyBottom: string;
	snow: string;
	snowShade: string;
	red: string;
	redBright: string;
	green: string;
	greenDark: string;
	gold: string;
	goldDeep: string;
	bark: string;
	fur: string;
	white: string;
	skin: string;
};

export function readPalette(element: Element): IPalette {
	const styles = getComputedStyle(element);
	const token = (name: string, fallback: string) => styles.getPropertyValue(`--festive-${name}`).trim() || fallback;

	return {
		skyTop: token("darkest", "#0f2027"),
		skyBottom: token("dark-green", "#1a3a2e"),
		snow: token("cream", "#fdf6ec"),
		snowShade: token("fur-shadow", "#e3d6c3"),
		red: token("red", "#c00026"),
		redBright: token("red-bright", "#e01a3c"),
		green: token("green", "#286e45"),
		greenDark: token("green-dark", "#1f5c39"),
		gold: token("gold", "#f3d9a4"),
		goldDeep: token("gold-deep", "#e0a93b"),
		bark: token("bark", "#7a4a2a"),
		fur: "#a8744a",
		white: token("white", "#ffffff"),
		skin: "#f4c9a0",
	};
}

/** Where the camera is: the world's left edge on screen, and how many pixels make a metre. */
export type ICamera = { left: number; pixelsPerMetre: number };

/** The snow line sits this far up from the bottom of the canvas. */
const GROUND_SHARE = 0.18;
/** At rest the view is this tall; it grows to keep a high-flying elf in shot. */
const BASE_VIEW_HEIGHT = 5.2;

/** The camera for this frame, eased from the last one so zooming and panning stay smooth. */
export function nextCamera(previous: ICamera | null, state: IGameState, width: number, height: number): ICamera {
	const skyHeight = height * (1 - GROUND_SHARE);
	// In the air, leave room above the elf so it sits in the middle of the sky, not at the top.
	const headroom = state.phase === "flying" ? state.elf.y * 0.6 + 1.5 : 1.2;
	const viewHeight = Math.max(BASE_VIEW_HEIGHT, state.elf.y + headroom);
	const targetScale = skyHeight / viewHeight;
	const viewWidth = width / targetScale;
	const targetLeft = Math.max(-1.1, state.elf.x - viewWidth * 0.4);

	if (!previous) {
		return { left: targetLeft, pixelsPerMetre: targetScale };
	}

	// Zoom out quickly, so a rising elf never leaves the top of the shot; settle back in gently.
	const zoomEase = targetScale < previous.pixelsPerMetre ? 0.35 : 0.06;

	return {
		left: previous.left + (targetLeft - previous.left) * 0.2,
		pixelsPerMetre: previous.pixelsPerMetre + (targetScale - previous.pixelsPerMetre) * zoomEase,
	};
}

export function drawFrame(
	context: CanvasRenderingContext2D,
	state: IGameState,
	camera: ICamera,
	palette: IPalette,
	size: { width: number; height: number },
	best: number | null,
	skin: ISkinId,
) {
	const { width, height } = size;
	const groundY = height * (1 - GROUND_SHARE);
	const toScreen = (x: number, y: number) => ({
		x: (x - camera.left) * camera.pixelsPerMetre,
		y: groundY - y * camera.pixelsPerMetre,
	});

	drawSky(context, palette, width, groundY, camera);
	drawGround(context, palette, width, height, groundY);
	drawDistanceFlags(context, palette, camera, width, groundY, best);

	context.save();
	const origin = toScreen(0, 0);
	context.translate(origin.x, origin.y);
	context.scale(camera.pixelsPerMetre, -camera.pixelsPerMetre);
	drawPresents(context, palette);
	drawReindeer(context, palette, state.swingTime);
	const visible = { left: camera.left, right: camera.left + width / camera.pixelsPerMetre };
	drawCrackers(context, palette, state.crackers, state.time, camera.pixelsPerMetre, visible);
	drawOrnaments(context, palette, state.ornaments, state.time, camera.pixelsPerMetre, visible);
	drawSnowmen(context, palette, state.snowmen, state.time, camera.pixelsPerMetre, visible);
	drawSleigh(context, palette, state.sleigh, state.time, camera.pixelsPerMetre);
	drawRocketTrail(context, palette, state, camera.pixelsPerMetre);
	drawCoins(context, palette, state.coins, state.time, camera.pixelsPerMetre, visible);
	drawFlyer(context, palette, state, camera.pixelsPerMetre, skin);
	context.restore();
	drawPopLabels(context, palette, state.crackers, state.time, toScreen);
	drawCoinCount(context, palette, state.coinsCollected);

	if (state.phase === "flying" || state.phase === "sliding") {
		drawLiveDistance(context, palette, width, state.elf.x - REINDEER_X);
	}
}

function drawSky(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	groundY: number,
	camera: ICamera,
) {
	const sky = context.createLinearGradient(0, 0, 0, groundY);
	sky.addColorStop(0, palette.skyTop);
	sky.addColorStop(1, palette.skyBottom);
	context.fillStyle = sky;
	context.fillRect(0, 0, width, groundY);

	// Stars, scrolling slowly so the flight feels fast without being dizzy.
	context.fillStyle = palette.gold;
	const drift = camera.left * camera.pixelsPerMetre * 0.1;
	for (let index = 0; index < 40; index++) {
		const x = (((index * 137.5 - drift) % width) + width) % width;
		const y = (((index * 97) % 100) / 100) * groundY * 0.75;
		const radius = index % 5 === 0 ? 1.6 : 1;
		context.globalAlpha = 0.35 + (index % 3) * 0.2;
		context.beginPath();
		context.arc(x, y, radius, 0, Math.PI * 2);
		context.fill();
	}
	context.globalAlpha = 1;

	// Distant hills, slower still.
	context.fillStyle = palette.greenDark;
	context.globalAlpha = 0.55;
	context.beginPath();
	context.moveTo(0, groundY);
	const hillDrift = camera.left * camera.pixelsPerMetre * 0.3;
	for (let x = 0; x <= width; x += 8) {
		const worldX = (x + hillDrift) / 90;
		context.lineTo(x, groundY - 28 - Math.sin(worldX) * 16 - Math.sin(worldX * 2.7) * 8);
	}
	context.lineTo(width, groundY);
	context.fill();
	context.globalAlpha = 1;
}

function drawGround(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	height: number,
	groundY: number,
) {
	context.fillStyle = palette.snow;
	context.fillRect(0, groundY, width, height - groundY);
	context.fillStyle = palette.snowShade;
	context.fillRect(0, groundY, width, 3);
}

/** A peppermint pole every 10 m, and a gold "Best" flag at this device's best throw. */
function drawDistanceFlags(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	camera: ICamera,
	width: number,
	groundY: number,
	best: number | null,
) {
	const scale = camera.pixelsPerMetre;
	const every = scale < 6 ? 50 : scale < 14 ? 20 : 10;
	const first = Math.max(every, Math.ceil(camera.left / every) * every);
	const last = camera.left + width / scale;
	context.font = "600 12px Nunito, sans-serif";
	context.textAlign = "center";

	for (let metres = first; metres <= last + every; metres += every) {
		const x = (REINDEER_X + metres - camera.left) * scale;
		context.fillStyle = palette.red;
		context.fillRect(x - 1.5, groundY - 22, 3, 22);
		context.fillStyle = palette.white;
		context.fillRect(x - 1.5, groundY - 16, 3, 4);
		context.fillRect(x - 1.5, groundY - 8, 3, 4);
		context.fillStyle = palette.greenDark;
		context.fillText(`${metres} m`, x, groundY + 16);
	}

	if (best !== null && best > 0) {
		const x = (REINDEER_X + best - camera.left) * scale;
		context.fillStyle = palette.goldDeep;
		context.fillRect(x - 1.5, groundY - 34, 3, 34);
		context.beginPath();
		context.moveTo(x + 1.5, groundY - 34);
		context.lineTo(x + 16, groundY - 29);
		context.lineTo(x + 1.5, groundY - 24);
		context.fill();
		context.fillStyle = palette.gold;
		context.fillText("Best", x, groundY - 38);
	}
}

/** Three wrapped presents, the elf's diving board. (World units from here on: metres, y up.) */
function drawPresents(context: CanvasRenderingContext2D, palette: IPalette) {
	const boxes = [
		{ bottom: 0, height: 1.7, inset: 0, color: palette.red, ribbon: palette.gold },
		{ bottom: 1.7, height: 1.5, inset: 0.08, color: palette.green, ribbon: palette.redBright },
		{ bottom: 3.2, height: 1.3, inset: 0.16, color: palette.goldDeep, ribbon: palette.red },
	];

	for (const box of boxes) {
		const left = STACK.left + box.inset;
		const width = STACK.right - STACK.left - box.inset * 2;
		context.fillStyle = box.color;
		context.fillRect(left, box.bottom, width, box.height);
		context.fillStyle = box.ribbon;
		context.fillRect(left + width / 2 - 0.07, box.bottom, 0.14, box.height);
		context.fillRect(left, box.bottom + box.height / 2 - 0.07, width, 0.14);
	}
}

/** The bat's angle (radians, 0 = pointing ahead) at this point in the swing. */
function batAngle(swingTime: number | null): number {
	const raised = 1.9;
	const followThrough = -1.2;

	if (swingTime === null) {
		return raised;
	}

	const progress = Math.min(1, swingTime / SWING_DURATION);
	const contactShare = SWING_CONTACT_TIME / SWING_DURATION;

	// Fast down to the contact point (level, pointing ahead), then easing into the follow-through.
	if (progress <= contactShare) {
		return raised * (1 - progress / contactShare);
	}

	const after = (progress - contactShare) / (1 - contactShare);

	return followThrough * (1 - (1 - after) ** 2);
}

/** An upright reindeer, batter's stance, holding a candy cane. */
function drawReindeer(context: CanvasRenderingContext2D, palette: IPalette, swingTime: number | null) {
	context.save();
	context.translate(REINDEER_X, 0);

	// Legs and hooves.
	context.fillStyle = palette.bark;
	context.fillRect(-0.32, 0, 0.18, 0.75);
	context.fillRect(0.06, 0, 0.18, 0.75);
	context.fillStyle = "#3b2416";
	context.fillRect(-0.34, 0, 0.22, 0.1);
	context.fillRect(0.04, 0, 0.22, 0.1);

	// Body, with a pale belly.
	context.fillStyle = palette.fur;
	ellipse(context, -0.04, 1.2, 0.42, 0.58);
	context.fillStyle = palette.gold;
	ellipse(context, 0.06, 1.12, 0.22, 0.38);

	// Head, snout and ears.
	context.fillStyle = palette.fur;
	ellipse(context, 0.02, 1.98, 0.27, 0.27);
	ellipse(context, 0.24, 1.9, 0.17, 0.12);
	ellipse(context, -0.22, 2.12, 0.1, 0.05, -0.5);
	context.fillStyle = "#3b2416";
	ellipse(context, 0.39, 1.92, 0.06, 0.05);
	context.fillStyle = palette.white;
	ellipse(context, 0.1, 2.04, 0.06, 0.06);
	context.fillStyle = "#1c120b";
	ellipse(context, 0.12, 2.04, 0.032, 0.032);

	// Antlers.
	context.strokeStyle = palette.bark;
	context.lineWidth = 0.06;
	context.lineCap = "round";
	context.beginPath();
	context.moveTo(-0.06, 2.2);
	context.lineTo(-0.16, 2.6);
	context.moveTo(-0.13, 2.47);
	context.lineTo(-0.3, 2.6);
	context.moveTo(0.08, 2.21);
	context.lineTo(0.14, 2.62);
	context.moveTo(0.12, 2.48);
	context.lineTo(0.28, 2.6);
	context.stroke();

	// Arms and the candy cane, turning about the shoulder (level with the bat's sweet spot).
	context.translate(0.05, SWEET_SPOT_Y);
	context.rotate(batAngle(swingTime));
	context.strokeStyle = palette.fur;
	context.lineWidth = 0.13;
	context.beginPath();
	context.moveTo(0, 0);
	context.lineTo(0.38, 0);
	context.stroke();
	drawCandyCane(context, palette);
	context.restore();
}

/** Held at the straight end; the crook curls at the far end. */
function drawCandyCane(context: CanvasRenderingContext2D, palette: IPalette) {
	const path = () => {
		context.beginPath();
		context.moveTo(0.3, 0);
		context.lineTo(1.45, 0);
		context.arc(1.45, 0.17, 0.17, -Math.PI / 2, Math.PI / 2, false);
	};

	context.lineCap = "round";
	context.lineWidth = 0.12;
	context.strokeStyle = palette.white;
	path();
	context.stroke();
	context.setLineDash([0.08, 0.08]);
	context.strokeStyle = palette.red;
	path();
	context.stroke();
	context.setLineDash([]);

	context.fillStyle = palette.fur;
	ellipse(context, 0.36, 0, 0.09, 0.09);
}

/** While the rocket burns: sparks streaming out behind the elf, flickering red and gold. */
function drawRocketTrail(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	state: IGameState,
	pixelsPerMetre: number,
) {
	if (state.rocketUntil === null || state.time >= state.rocketUntil) {
		return;
	}

	const { x, y, vx, vy } = state.elf;
	const speed = Math.hypot(vx, vy) || 1;
	// Behind the elf, along the way it's going.
	const back = { x: -vx / speed, y: -vy / speed };
	const enlarge = flyerEnlargement(pixelsPerMetre);
	const colors = [palette.goldDeep, palette.gold, palette.redBright, palette.white];

	for (let spark = 0; spark < 14; spark++) {
		const along = (spark / 14) * 1.6 * enlarge;
		const wobble = Math.sin(state.time * 40 + spark * 1.7) * 0.15 * enlarge;
		context.globalAlpha = 1 - spark / 14;
		context.fillStyle = colors[spark % colors.length];
		context.beginPath();
		context.arc(
			x + back.x * along - back.y * wobble,
			y + back.y * along + back.x * wobble,
			(0.09 + 0.05 * (spark % 3)) * enlarge,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	context.globalAlpha = 1;
}

function drawLiveDistance(context: CanvasRenderingContext2D, palette: IPalette, width: number, metres: number) {
	context.font = "800 22px Nunito, sans-serif";
	context.textAlign = "right";
	context.fillStyle = palette.gold;
	context.fillText(`${Math.max(0, metres).toFixed(1)} m`, width - 14, 32);
}

function ellipse(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	radiusX: number,
	radiusY: number,
	rotation = 0,
) {
	context.beginPath();
	context.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
	context.fill();
}
