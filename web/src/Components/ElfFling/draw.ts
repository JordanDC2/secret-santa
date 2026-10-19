import { canJump, REINDEER_X, STACK, type IGameState } from "Components/ElfFling/physics";
import { drawCelebration } from "Components/ElfFling/drawCelebration";
import { drawCoinCount, drawCoins, drawOutlinedText } from "Components/ElfFling/drawCoins";
import { drawGemCount } from "Components/ElfFling/drawGems";
import { drawActivePowerUps, drawElfPowerUps, drawPowerUps, drawShine } from "Components/ElfFling/drawPowerUps";
import { POWER_UP_SECONDS } from "Components/ElfFling/powerUps";
import { arrivingIn, biomeWeights, type IBiomeId } from "Components/ElfFling/biomes";
import { sunAt, warmth } from "Components/ElfFling/dayNight";
import { drawForest, drawForestForeground } from "Components/ElfFling/drawForest";
import { drawHills, drawHillsForeground } from "Components/ElfFling/drawHills";
import { drawAurora, drawTundra, drawTundraForeground } from "Components/ElfFling/drawTundra";
import { drawMountains, drawStreamWater } from "Components/ElfFling/drawStream";
import { drawChimneys } from "Components/ElfFling/drawChimneys";
import { drawWeather } from "Components/ElfFling/drawWeather";
import { drawYuleLogs } from "Components/ElfFling/drawYuleLogs";
import { drawCrackers, drawPopLabels } from "Components/ElfFling/drawCrackers";
import { drawFlyer, flyerEnlargement } from "Components/ElfFling/drawFlyers";
import { drawOrnaments } from "Components/ElfFling/drawOrnaments";
import { drawSleigh } from "Components/ElfFling/drawSleigh";
import { drawSnowfall, ELF_ACROSS, parallaxPan } from "Components/ElfFling/drawSnowfall";
import { drawSnowmen } from "Components/ElfFling/drawSnowmen";
import type { IBatterId, ISkinId } from "Components/ElfFling/skins";
import { drawBatter } from "Components/ElfFling/drawBatters";

/**
 * Draws one frame of Elf Fling on a canvas: a snowy night, distance flags, the stack of
 * presents, whoever's swinging the candy cane (drawBatters.ts) and whoever's being flung
 * (drawFlyers.ts). World units are metres
 * (y up); the camera follows the elf and zooms out when it flies high. The crackers, sky
 * ornaments, coins, power-ups, Yule logs, chimneys, weather, snowmen and sleigh have their own files (drawCrackers.ts and so on).
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
/**
 * Where the camera is: the world's left edge on screen, how many pixels make a metre, and how
 * far up the world it has panned (0 with the snow in view; more while following a high elf).
 */
export type ICamera = { left: number; pixelsPerMetre: number; bottom: number };

/** The snow line sits this far up from the bottom of the canvas. */
const GROUND_SHARE = 0.18;
/** At rest the view is this tall; it grows to keep a high-flying elf in shot, up to MAX_VIEW_HEIGHT. */
const BASE_VIEW_HEIGHT = 5.2;
/**
 * The camera zooms out no further than this, so everything stays near its real size. Above it
 * the camera pans up with the elf instead, holding it a little above the middle, and the snow
 * drops out of the bottom of the shot.
 */
const MAX_VIEW_HEIGHT = 30;
const ELF_HEIGHT_IN_VIEW = 0.55;
/** At least this much of the course is always in view across, so a tall, narrow screen (a phone held upright) still shows the batter and the presents. */
const MIN_VIEW_WIDTH = 6.6;

/** The camera for this frame, eased from the last one so zooming and panning stay smooth. */
export function nextCamera(previous: ICamera | null, state: IGameState, width: number, height: number): ICamera {
	const skyHeight = height * (1 - GROUND_SHARE);
	// In the air, leave room above the elf so it sits in the middle of the sky, not at the top.
	const headroom = state.phase === "flying" ? state.elf.y * 0.6 + 1.5 : 1.2;
	const wanted = Math.max(BASE_VIEW_HEIGHT, state.elf.y + headroom);
	const viewHeight = Math.min(MAX_VIEW_HEIGHT, wanted);
	const targetScale = Math.min(skyHeight / viewHeight, width / MIN_VIEW_WIDTH);
	const viewWidth = width / targetScale;
	const targetLeft = Math.max(-1.4, state.elf.x - viewWidth * ELF_ACROSS);
	// Too high to zoom out to: pan up with the elf instead.
	const targetBottom = wanted > MAX_VIEW_HEIGHT ? Math.max(0, state.elf.y - viewHeight * ELF_HEIGHT_IN_VIEW) : 0;

	if (!previous) {
		return { left: targetLeft, pixelsPerMetre: targetScale, bottom: targetBottom };
	}

	// Zoom out quickly, so a rising elf never leaves the top of the shot; settle back in gently.
	// Panning follows quickly up, and back down more gently.
	const zoomEase = targetScale < previous.pixelsPerMetre ? 0.35 : 0.06;
	const panEase = targetBottom > previous.bottom ? 0.3 : 0.12;

	return {
		left: previous.left + (targetLeft - previous.left) * 0.2,
		pixelsPerMetre: previous.pixelsPerMetre + (targetScale - previous.pixelsPerMetre) * zoomEase,
		bottom: previous.bottom + (targetBottom - previous.bottom) * panEase,
	};
}

/** Where a point in the world (metres, y up) is on a canvas `height` tall, through the camera. */
export function toScreenPoint(camera: ICamera, height: number, x: number, y: number): { x: number; y: number } {
	const floorY = height * (1 - GROUND_SHARE) + camera.bottom * camera.pixelsPerMetre;

	return { x: (x - camera.left) * camera.pixelsPerMetre, y: floorY - y * camera.pixelsPerMetre };
}

export function drawFrame(
	context: CanvasRenderingContext2D,
	state: IGameState,
	camera: ICamera,
	palette: IPalette,
	size: { width: number; height: number },
	best: number | null,
	skin: ISkinId,
	batter: IBatterId,
	/** Seconds on the page's own clock, for the falling snow. */
	clock: number,
	/** Seconds since this round's new best, while it's being celebrated. */
	celebrationAge: number | null,
	/** The player's coins, before this throw's are banked, and gems (null before they've prestiged). */
	balance: { coins: number; gems: number | null },
) {
	const { width, height } = size;
	const groundY = height * (1 - GROUND_SHARE);
	// Where the snow is on screen: below groundY (maybe off the bottom) while the camera's panned up.
	const floorY = groundY + camera.bottom * camera.pixelsPerMetre;
	const toScreen = (x: number, y: number) => toScreenPoint(camera, height, x, y);

	// How far into the day the middle of the view is (dayNight.ts).
	const viewMiddle = camera.left + width / camera.pixelsPerMetre / 2;
	const day = warmth(viewMiddle);
	// Which biome's scenery, and how much of each while one fades into the next (biomes.ts).
	const biomes = biomeWeights(viewMiddle);
	drawSky(context, palette, width, height, groundY, floorY, camera, day, sunAt(viewMiddle), biomes, clock);

	if (floorY < height) {
		drawGround(context, palette, width, height, floorY, camera, day);
		drawDistanceFlags(context, palette, camera, width, floorY, best);
	}

	context.save();
	const origin = toScreen(0, 0);
	context.translate(origin.x, origin.y);
	context.scale(camera.pixelsPerMetre, -camera.pixelsPerMetre);
	const visible = { left: camera.left, right: camera.left + width / camera.pixelsPerMetre };
	drawWeather(
		context,
		palette,
		state.gusts,
		state.updrafts,
		clock,
		camera.pixelsPerMetre,
		visible,
		state.upgrades.highWinds > 0,
	);
	drawPresents(context, palette);
	drawBatter(context, palette, state.swingTime, batter);
	drawCrackers(context, palette, state.crackers, state.time, camera.pixelsPerMetre, visible);
	drawOrnaments(context, palette, state.ornaments, state.time, camera.pixelsPerMetre, visible);
	drawSnowmen(context, palette, state.snowmen, state.time, camera.pixelsPerMetre, visible);
	drawSleigh(context, palette, state.sleigh, state.time, camera.pixelsPerMetre);
	drawRocketTrail(context, palette, state, camera.pixelsPerMetre);
	drawCoins(context, palette, state.coins, state.time, camera.pixelsPerMetre, visible);
	drawPowerUps(context, palette, state.powerUps, state.time, camera.pixelsPerMetre, visible);
	drawShine(context, palette, state, camera.pixelsPerMetre);
	drawFlyer(context, palette, state, camera.pixelsPerMetre, skin);
	drawElfPowerUps(context, palette, state, camera.pixelsPerMetre);
	// In front of the elf, so one inside a log or down a chimney is hidden by it.
	drawChimneys(context, palette, state.chimneys, state.inChimney?.x ?? null, clock, camera.pixelsPerMetre, visible);
	drawYuleLogs(context, palette, state.yuleLogs, state.inLog?.x ?? null, state.time, camera.pixelsPerMetre, visible);
	context.restore();

	// Along the mountain stream, the water under the bank, mirroring all of the above.
	if (biomes.mountainStream > 0) {
		drawStreamWater(
			context,
			palette,
			width,
			height,
			floorY,
			parallaxPan(camera, width),
			clock,
			day,
			biomes.mountainStream,
			mix,
		);
	}

	drawPopLabels(context, palette, state.crackers, state.time, toScreen);
	drawSnowfall(context, palette, camera, size, clock, 1 - day * 0.8);

	// The biome's foreground in front of the course (behind the counts and controls), standing at
	// the bottom of the snow in view, so it drops away as the camera pans up.
	const foregroundBase = floorY + (height - groundY);

	if (biomes.hills > 0) {
		drawHillsForeground(
			context,
			palette,
			width,
			foregroundBase,
			groundY,
			parallaxPan(camera, width),
			clock,
			day,
			biomes.hills,
			mix,
		);
	}

	if (biomes.borealForest > 0) {
		drawForestForeground(
			context,
			width,
			height,
			foregroundBase,
			groundY,
			parallaxPan(camera, width),
			biomes.borealForest,
		);
	}

	if (biomes.tundra > 0) {
		drawTundraForeground(
			context,
			width,
			height,
			foregroundBase,
			groundY,
			parallaxPan(camera, width),
			day,
			biomes.tundra,
			mix,
		);
	}

	if (celebrationAge !== null) {
		drawCelebration(context, palette, size, celebrationAge);
	}
	drawCoinCount(context, palette, balance.coins + state.coinsCollected, state.coinsCollected);

	if (balance.gems !== null) {
		drawGemCount(context, palette, balance.gems);
	}

	const badgeRow = balance.gems !== null ? 86 : 58;
	const nextBadge = drawActivePowerUps(
		context,
		palette,
		state,
		badgeRow,
		(kind) => POWER_UP_SECONDS[kind][Math.max(0, state.upgrades[kind] - 1)],
	);

	if (state.phase === "flying" || state.phase === "sliding") {
		drawJumpsLeft(context, palette, nextBadge, badgeRow, state.jumpsLeft, canJump(state));
	}

	if (state.phase === "flying" || state.phase === "sliding") {
		drawLiveDistance(context, palette, width, state.elf.x - REINDEER_X);
		drawSpeed(context, palette, width, Math.hypot(state.elf.vx, state.elf.vy));
	}

	// Arriving in a new biome: its name, fading in and out over the first stretch of it.
	const arriving = state.phase === "flying" || state.phase === "sliding" ? arrivingIn(state.elf.x) : null;

	if (arriving) {
		drawBiomeTitle(context, palette, width, height, arriving.name, Math.sin(arriving.along * Math.PI));
	}

	// Panned up with a high elf, the snow's out of shot: say how high it is instead.
	if (camera.bottom > 0.5) {
		drawAltitude(context, palette, width, state.elf.y);
	}
}

/** The winter day: a pale blue sky, low sun and greener hills, blended in as it warms. */
const SUN_RADIUS = 20;
const DAY = { skyTop: "#5e9fd6", skyBottom: "#cfe6f3", slush: "#c9d2cd", grass: "#5c8f4e" };

/**
 * The sky: night blue-green, warming to a winter blue by day (day: 0 to 1), with stars that fade
 * out by day, the sun (sun: 0 rising to 1 setting, null at night) and distant hills on the
 * horizon at floorY (which drops away as the camera pans up). The sun and stars keep to groundY.
 */
function drawSky(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	height: number,
	groundY: number,
	floorY: number,
	camera: ICamera,
	day: number,
	sun: number | null,
	biomes: Record<IBiomeId, number>,
	clock: number,
) {
	// Down to the snow, or the whole canvas while the camera's panned up above it.
	const horizon = Math.min(height, floorY);
	const sky = context.createLinearGradient(0, 0, 0, horizon);
	sky.addColorStop(0, mix(palette.skyTop, DAY.skyTop, day));
	sky.addColorStop(1, mix(palette.skyBottom, DAY.skyBottom, day));
	context.fillStyle = sky;
	context.fillRect(0, 0, width, horizon);

	if (sun !== null) {
		// Low across the sky, as a winter sun is. The elf heads east (right), so the sun comes up
		// on the right, is highest at noon, and sets on the left in the west. It starts and ends
		// below the horizon (hidden: only the sky above it is drawn on), so it rises up through
		// it, behind the hills, rather than appearing, and its glow brightens as it climbs.
		const rise = Math.sin(sun * Math.PI);
		const x = width * (0.9 - 0.8 * sun);
		const y = groundY + SUN_RADIUS + 6 - rise * (groundY * 0.55 + SUN_RADIUS + 16);
		context.save();
		context.beginPath();
		context.rect(0, 0, width, groundY);
		context.clip();
		const glow = context.createRadialGradient(x, y, 0, x, y, 70);
		glow.addColorStop(0, `rgba(255, 236, 170, ${(0.55 * Math.min(1, rise * 3)).toFixed(3)})`);
		glow.addColorStop(1, "rgba(255, 236, 170, 0)");
		context.fillStyle = glow;
		context.fillRect(x - 70, y - 70, 140, 140);
		context.fillStyle = "#fff3c4";
		context.beginPath();
		context.arc(x, y, SUN_RADIUS, 0, Math.PI * 2);
		context.fill();
		context.restore();
	}

	// Stars, scrolling slowly so the flight feels fast without being dizzy; gone by day.
	context.fillStyle = palette.gold;
	const drift = parallaxPan(camera, width) * 0.1;
	for (let index = 0; index < 40; index++) {
		const x = (((index * 137.5 - drift) % width) + width) % width;
		const y = (((index * 97) % 100) / 100) * groundY * 0.75;
		const radius = index % 5 === 0 ? 1.6 : 1;
		context.globalAlpha = (0.35 + (index % 3) * 0.2) * (1 - day);
		context.beginPath();
		context.arc(x, y, radius, 0, Math.PI * 2);
		context.fill();
	}
	context.globalAlpha = 1;

	// On the tundra, the northern lights, at night.
	drawAurora(context, width, groundY, clock, biomes.tundra * (1 - day));

	// The biomes' scenery behind the course (biomes.ts), fading from one into the next.
	if (biomes.hills > 0) {
		drawHills(context, palette, width, floorY, parallaxPan(camera, width), day, biomes.hills, clock, mix);
	}

	if (biomes.borealForest > 0) {
		drawForest(context, palette, width, floorY, parallaxPan(camera, width), day, biomes.borealForest, mix);
	}

	if (biomes.tundra > 0) {
		drawTundra(context, width, floorY, parallaxPan(camera, width), day, biomes.tundra, mix);
	}

	if (biomes.mountainStream > 0) {
		drawMountains(context, width, floorY, parallaxPan(camera, width), day, biomes.mountainStream, mix);
	}
}

/** The snow, going grey and slushy by day (day: 0 to 1), with patches of grass showing through. */
function drawGround(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	height: number,
	groundY: number,
	camera: ICamera,
	day: number,
) {
	context.fillStyle = mix(palette.snow, DAY.slush, day * 0.7);
	context.fillRect(0, groundY, width, height - groundY);

	if (day > 0) {
		// Patches fixed to the course every few metres and sized in metres, so they slide past
		// steadily with it whatever the zoom.
		const first = Math.floor(camera.left / PATCH_SPACING) * PATCH_SPACING - PATCH_SPACING;
		context.fillStyle = DAY.grass;
		context.globalAlpha = day * 0.55;

		for (let metre = first; metre < camera.left + width / camera.pixelsPerMetre; metre += PATCH_SPACING) {
			const chance = patch(metre);

			if (chance < 0.35) {
				const x = (metre - camera.left) * camera.pixelsPerMetre;
				const halfWidth = Math.max(1, (1 + chance * 6) * camera.pixelsPerMetre);
				context.beginPath();
				context.ellipse(x, groundY + 6 + chance * 20, halfWidth, 3 + chance * 6, 0, 0, Math.PI * 2);
				context.fill();
			}
		}

		context.globalAlpha = 1;
	}

	context.fillStyle = palette.snowShade;
	context.fillRect(0, groundY, width, 3);
}

/** Grass patches can show every this many metres along the course. */
const PATCH_SPACING = 6;

/** A repeatable "random" number in [0, 1) for a spot on the course. */
function patch(metre: number): number {
	const value = Math.sin(metre * 12.9898) * 43758.5453;

	return value - Math.floor(value);
}

/** Two #rrggbb colours mixed: t of the way from a to b. */
function mix(a: string, b: string, t: number): string {
	if (t <= 0) {
		return a;
	}

	const from = parseHex(a);
	const to = parseHex(b);

	if (!from || !to) {
		return t < 0.5 ? a : b;
	}

	const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * Math.min(1, t));

	return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function parseHex(color: string): [number, number, number] | null {
	const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());

	return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : null;
}

/**
 * A peppermint pole every 10 m, and a gold "Best" flag at this device's best throw. Every 50 m
 * always shows; the poles between fade in as the camera zooms in (rather than the spacing
 * switching at set zooms, which flickered as the zoom hovered by a switch).
 */
const MINOR_POLES = { hiddenBelow: 7, solidAbove: 14 };

function drawDistanceFlags(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	camera: ICamera,
	width: number,
	groundY: number,
	best: number | null,
) {
	const scale = camera.pixelsPerMetre;
	const minor = Math.min(
		1,
		Math.max(0, (scale - MINOR_POLES.hiddenBelow) / (MINOR_POLES.solidAbove - MINOR_POLES.hiddenBelow)),
	);
	const first = Math.max(10, Math.floor((camera.left - REINDEER_X) / 10) * 10);
	const last = camera.left - REINDEER_X + width / scale;
	context.font = "600 12px Nunito, sans-serif";
	context.textAlign = "center";

	for (let metres = first; metres <= last + 10; metres += 10) {
		const major = metres % 50 === 0;

		if (!major && minor === 0) {
			continue;
		}

		const x = (REINDEER_X + metres - camera.left) * scale;
		context.globalAlpha = major ? 1 : minor;
		context.fillStyle = palette.red;
		context.fillRect(x - 1.5, groundY - 22, 3, 22);
		context.fillStyle = palette.white;
		context.fillRect(x - 1.5, groundY - 16, 3, 4);
		context.fillRect(x - 1.5, groundY - 8, 3, 4);
		context.fillStyle = palette.greenDark;
		context.fillText(`${metres} m`, x, groundY + 16);
	}

	context.globalAlpha = 1;

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

/** How high the elf is, under the distance: a small up-pointing triangle and "74 m up". */
/** A biome's name across the sky as the elf comes into it, `alpha` of the way faded in. */
function drawBiomeTitle(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	height: number,
	name: string,
	alpha: number,
) {
	context.globalAlpha = alpha;
	context.font = '700 34px "Mountains of Christmas", Nunito, serif';
	context.textAlign = "center";
	context.fillStyle = palette.gold;
	drawOutlinedText(context, name, width / 2, height * 0.28);
	context.globalAlpha = 1;
}

/** How high the elf is, under the speed (only while it's flying, when the speed shows). */
const ALTITUDE_Y = 78;

function drawAltitude(context: CanvasRenderingContext2D, palette: IPalette, width: number, metres: number) {
	const text = `${Math.round(metres)} m up`;
	context.font = "700 15px Nunito, sans-serif";
	context.textAlign = "right";
	context.fillStyle = palette.white;
	drawOutlinedText(context, text, width - 14, ALTITUDE_Y);
	const left = width - 14 - context.measureText(text).width - 14;
	context.fillStyle = palette.gold;
	context.beginPath();
	context.moveTo(left, ALTITUDE_Y + 2);
	context.lineTo(left + 5, ALTITUDE_Y - 8);
	context.lineTo(left + 10, ALTITUDE_Y + 2);
	context.closePath();
	context.fill();
}

/** How fast the elf's going, under the distance. */
function drawSpeed(context: CanvasRenderingContext2D, palette: IPalette, width: number, metresPerSecond: number) {
	context.font = "700 15px Nunito, sans-serif";
	context.textAlign = "right";
	context.fillStyle = palette.white;
	drawOutlinedText(context, `${Math.round(metresPerSecond)} m/s`, width - 14, 56);
}

/**
 * The jumps the elf has left this throw, after the power-ups' badges: a gold up arrow each,
 * dimmed while one can't be used (on the snow, say). Screen units (y down).
 */
function drawJumpsLeft(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	x: number,
	y: number,
	left: number,
	available: boolean,
) {
	if (left === 0) {
		return;
	}

	context.globalAlpha = available ? 1 : 0.45;
	context.fillStyle = "rgba(15, 32, 39, 0.55)";
	context.beginPath();
	context.arc(x, y, 14, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.gold;
	context.beginPath();
	context.moveTo(x, y - 9);
	context.lineTo(x + 7, y - 1);
	context.lineTo(x + 3, y - 1);
	context.lineTo(x + 3, y + 8);
	context.lineTo(x - 3, y + 8);
	context.lineTo(x - 3, y - 1);
	context.lineTo(x - 7, y - 1);
	context.closePath();
	context.fill();
	// How many, beside it.
	context.font = "800 15px Nunito, sans-serif";
	context.textAlign = "left";
	drawOutlinedText(context, `${left}`, x + 18, y + 5);
	context.globalAlpha = 1;
}

function drawLiveDistance(context: CanvasRenderingContext2D, palette: IPalette, width: number, metres: number) {
	context.font = "800 22px Nunito, sans-serif";
	context.textAlign = "right";
	context.fillStyle = palette.gold;
	drawOutlinedText(context, `${Math.max(0, metres).toFixed(1)} m`, width - 14, 32);
}
