/**
 * Draws a frame of Silent Night at the game's own resolution (shown scaled up, crisp): the
 * snowy ground and what's scattered on it, everyone sorted by depth, fog drifting over it all,
 * then the dark, with the elf's ring of light (and the candles') cut out of it. The gingerbread
 * men's eyes glow even out in the dark.
 */

import { hash } from "Components/SilentNight/pixelArt";
import {
	CANDLE_LIGHT_RADIUS,
	ELF_FEET,
	GINGERBREAD_FEET,
	GUN_GRIP,
	LIGHT_RADIUS,
	type ISprites,
} from "Components/SilentNight/sprites";
import { dashing, type IEnemy, type IWorld } from "Components/SilentNight/world";

/** Props are scattered one per cell of this many pixels, at most. */
const PROP_CELL = 72;
/** How dark the night is beyond the light (0 to 1). */
const NIGHT = 0.93;

type IView = { width: number; height: number };

const mod = (a: number, b: number) => ((a % b) + b) % b;

export function drawWorld(
	context: CanvasRenderingContext2D,
	darkness: CanvasRenderingContext2D,
	world: IWorld,
	sprites: ISprites,
	view: IView,
) {
	const { player, time } = world;
	// The camera follows the elf, on whole pixels so nothing shimmers.
	const left = Math.round(player.x - view.width / 2);
	const top = Math.round(player.y - view.height / 2);
	const sx = (x: number) => Math.round(x - left);
	const sy = (y: number) => Math.round(y - top);

	context.imageSmoothingEnabled = false;

	// The snowy ground, tiled.
	const tile = sprites.ground.width;

	for (let y = -mod(top, tile); y < view.height; y += tile) {
		for (let x = -mod(left, tile); x < view.width; x += tile) {
			context.drawImage(sprites.ground, x, y);
		}
	}

	// Candles half buried in the snow, and burnt stumps, scattered.
	const candles: Array<{ x: number; y: number }> = [];

	for (let cy = Math.floor(top / PROP_CELL) - 1; cy * PROP_CELL < top + view.height + PROP_CELL; cy++) {
		for (let cx = Math.floor(left / PROP_CELL) - 1; cx * PROP_CELL < left + view.width + PROP_CELL; cx++) {
			const roll = hash(cx * 1.37, cy * 2.71);
			const x = cx * PROP_CELL + hash(cx, cy + 9) * PROP_CELL;
			const y = cy * PROP_CELL + hash(cx + 5, cy) * PROP_CELL;

			if (roll < 0.1) {
				candles.push({ x, y });
				context.drawImage(sprites.candle, sx(x) - 2, sy(y) - 8);
			} else if (roll < 0.24) {
				context.drawImage(sprites.stump, sx(x) - 7, sy(y) - 8);
			}
		}
	}

	// Shadows on the snow under everyone.
	context.fillStyle = "rgba(2, 1, 6, 0.55)";

	for (const enemy of world.enemies) {
		context.fillRect(sx(enemy.x) - 4, sy(enemy.y) - 1, 8, 2);
	}

	context.fillRect(sx(player.x) - 4, sy(player.y) - 1, 8, 2);

	// Everyone, back to front (the world keeps the gingerbread men in order of depth).
	const drawEnemy = (enemy: IEnemy) => {
		const facing = enemy.facing === 1 ? "right" : "left";
		const flash = time - enemy.hitAt < 0.07;
		const frame = Math.floor(time * 7 + enemy.stride * 2) % 2;
		const image = flash ? sprites.gingerbread.flash[facing] : sprites.gingerbread[facing][frame];
		const feetX = enemy.facing === 1 ? GINGERBREAD_FEET.x : image.width - GINGERBREAD_FEET.x;
		context.drawImage(image, sx(enemy.x) - feetX, sy(enemy.y) - GINGERBREAD_FEET.y);
	};
	let playerDrawn = false;

	for (const enemy of world.enemies) {
		if (!playerDrawn && enemy.y > player.y) {
			drawElf(context, world, sprites, sx, sy);
			playerDrawn = true;
		}

		drawEnemy(enemy);
	}

	if (!playerDrawn) {
		drawElf(context, world, sprites, sx, sy);
	}

	// Peppermint shots: a bright head and a red streak behind.
	for (const bullet of world.bullets) {
		const speed = Math.hypot(bullet.vx, bullet.vy);
		const bx = sx(bullet.x);
		const by = sy(bullet.y);
		context.fillStyle = "#e0303e";
		context.fillRect(Math.round(bx - (bullet.vx / speed) * 3), Math.round(by - (bullet.vy / speed) * 3), 1, 1);
		context.fillRect(Math.round(bx - (bullet.vx / speed) * 2), Math.round(by - (bullet.vy / speed) * 2), 1, 1);
		context.fillStyle = "#fff4e8";
		context.fillRect(bx, by, 1, 1);
		context.fillRect(Math.round(bx - bullet.vx / speed), Math.round(by - bullet.vy / speed), 1, 1);
	}

	// Crumbs flying.
	for (const crumb of world.crumbs) {
		context.fillStyle = crumb.shade < 0.5 ? "#5e3214" : "#a8703a";
		context.fillRect(sx(crumb.x), sy(crumb.y), 1, 1);
	}

	// Fog drifting over everything, in two layers.
	context.globalAlpha = 0.55;
	drawTiled(
		context,
		sprites.fog,
		mod(left * 0.9 + time * 5, sprites.fog.width),
		mod(top * 0.9, sprites.fog.height),
		view,
	);
	context.globalAlpha = 0.35;
	drawTiled(
		context,
		sprites.fog,
		mod(left * 1.1 - time * 3, sprites.fog.width),
		mod(top * 1.1 + 70, sprites.fog.height),
		view,
	);
	context.globalAlpha = 1;

	// The dark, with the light cut out of it round the elf and each candle.
	darkness.globalCompositeOperation = "source-over";
	darkness.clearRect(0, 0, view.width, view.height);
	darkness.fillStyle = `rgba(3, 2, 8, ${NIGHT})`;
	darkness.fillRect(0, 0, view.width, view.height);
	darkness.globalCompositeOperation = "destination-out";
	darkness.drawImage(sprites.light, sx(player.x) - LIGHT_RADIUS, sy(player.y) - 6 - LIGHT_RADIUS);

	for (const candle of candles) {
		darkness.drawImage(sprites.candleLight, sx(candle.x) - CANDLE_LIGHT_RADIUS, sy(candle.y) - 4 - CANDLE_LIGHT_RADIUS);
	}

	context.drawImage(darkness.canvas, 0, 0);

	// The light's warmth: candlelight round the elf.
	const glow = context.createRadialGradient(
		sx(player.x),
		sy(player.y) - 6,
		0,
		sx(player.x),
		sy(player.y) - 6,
		LIGHT_RADIUS,
	);
	glow.addColorStop(0, "rgba(255, 150, 70, 0.14)");
	glow.addColorStop(1, "rgba(255, 150, 70, 0)");
	context.globalCompositeOperation = "lighter";
	context.fillStyle = glow;
	context.fillRect(0, 0, view.width, view.height);
	context.globalCompositeOperation = "source-over";

	// Eyes glowing in the dark: every gingerbread man's, over the night.
	context.fillStyle = "#ff3b2a";

	for (const enemy of world.enemies) {
		const ex = sx(enemy.x) - (enemy.facing === 1 ? GINGERBREAD_FEET.x : 14 - GINGERBREAD_FEET.x);
		const ey = sy(enemy.y) - GINGERBREAD_FEET.y + 4;
		const eyes = enemy.facing === 1 ? [8, 10] : [5, 3];

		for (const eye of eyes) {
			context.fillRect(ex + eye, ey, 1, 1);
		}
	}
}

/** The elf (blinking while it's safe after a hit, trailing ghosts as it dashes), and its gun. */
function drawElf(
	context: CanvasRenderingContext2D,
	world: IWorld,
	sprites: ISprites,
	sx: (x: number) => number,
	sy: (y: number) => number,
) {
	const { player, time } = world;

	if (time < player.hurtUntil && Math.floor(time * 16) % 2 === 0) {
		return;
	}

	const facing = player.facing === 1 ? "right" : "left";
	const frame = player.moving ? Math.floor(time * 8) % 2 : 1;
	const image = sprites.elf[facing][frame];
	const x = sx(player.x) - ELF_FEET.x;
	const y = sy(player.y) - ELF_FEET.y;

	if (dashing(world)) {
		context.globalAlpha = 0.3;
		context.drawImage(image, Math.round(x - player.dash.x * 8), Math.round(y - player.dash.y * 8));
		context.globalAlpha = 0.15;
		context.drawImage(image, Math.round(x - player.dash.x * 16), Math.round(y - player.dash.y * 16));
		context.globalAlpha = 1;
	}

	context.drawImage(image, x, y);

	// The gun, in its hand, pointing where it aims (or ahead), turned over when aiming left.
	const aim = player.aim ?? { x: player.facing, y: 0 };
	const angle = Math.atan2(aim.y, aim.x);
	const hand = { x: sx(player.x) + player.facing * 2, y: sy(player.y) - 8 };
	context.save();
	context.translate(hand.x, hand.y);
	context.rotate(angle);

	if (aim.x < 0) {
		context.scale(1, -1);
	}

	context.drawImage(sprites.gun, -GUN_GRIP.x, -GUN_GRIP.y);

	// A muzzle flash, just after a shot.
	if (time - player.lastShotAt < 0.05) {
		context.fillStyle = "#ffd060";
		context.fillRect(12, 1, 3, 3);
		context.fillStyle = "#fff4e8";
		context.fillRect(13, 2, 1, 1);
	}

	context.restore();
}

function drawTiled(
	context: CanvasRenderingContext2D,
	image: HTMLCanvasElement,
	offsetX: number,
	offsetY: number,
	view: IView,
) {
	for (let y = -offsetY; y < view.height; y += image.height) {
		for (let x = -offsetX; x < view.width; x += image.width) {
			context.drawImage(image, Math.round(x), Math.round(y));
		}
	}
}
