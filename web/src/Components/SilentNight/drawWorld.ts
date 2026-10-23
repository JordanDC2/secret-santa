/**
 * Draws a frame of Silent Night at the game's own resolution (shown scaled up, crisp): the
 * snowy ground and what's scattered on it, the shrines, everything on the snow back to front,
 * the weapons' sweeps, bursts and rings, fog drifting over it all, then the dark, with every light
 * cut out of it (the elf's, the candles', the shrines', Saint Lucia's flames, a burst's flash).
 * Over the dark: eyes glowing, and arrows to shrines out of sight.
 */

import { PROP_CELL, propAt, snuffed } from "Components/SilentNight/candles";
import type { IEnemyArt } from "Components/SilentNight/characters";
import { RARITY_COLOURS } from "Components/SilentNight/gear";
import { isGun } from "Components/SilentNight/guns";
import { PATRONS } from "Components/SilentNight/patrons";
import { hash, threshold } from "Components/SilentNight/pixelArt";
import { CANDLE_LIGHT_RADIUS, CAST_FEET, GUN_GRIP, LIGHT_RADIUS, type ISprites } from "Components/SilentNight/sprites";
import type { IEffect, IEnemy, IGunId, IWorld } from "Components/SilentNight/types";
import { WAIL_REACH } from "Components/SilentNight/enemies";
import { cocoaReach } from "Components/SilentNight/weapons";
import { dashing } from "Components/SilentNight/world";

/** How dark the night is beyond the light (0 to 1). */
const NIGHT = 0.93;

type IView = { width: number; height: number };
type IGlow = { x: number; y: number; radius: number };
type IToScreen = (n: number) => number;

const mod = (a: number, b: number) => ((a % b) + b) % b;

/** Rings of light by radius, made as they're needed: opaque where lit, dithering out to clear. */
const lights = new Map<number, HTMLCanvasElement>();

function lightOf(radius: number): HTMLCanvasElement {
	const size = Math.max(4, Math.round(radius));
	let canvas = lights.get(size);

	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.width = size * 2;
		canvas.height = size * 2;
		const context = canvas.getContext("2d")!;
		context.fillStyle = "#000";

		for (let y = 0; y < size * 2; y++) {
			for (let x = 0; x < size * 2; x++) {
				const d = Math.hypot(x + 0.5 - size, y + 0.5 - size) / size;
				const lit = d < 0.55 ? 1 : Math.max(0, 1 - (d - 0.55) / 0.45);

				if (lit > threshold(x, y)) {
					context.fillRect(x, y, 1, 1);
				}
			}
		}

		lights.set(size, canvas);
	}

	return canvas;
}

/** Colours of the crumbs each kind breaks into (by ENEMY_KINDS order; a candle's wax is -1). */
const CRUMBS: string[][] = [
	["#5e3214", "#a8703a"],
	["#ab1f31", "#d6ccc8"],
	["#18151c", "#e0502a"],
	["#26324a", "#d8d0d4"],
	["#d8d0d4", "#a8a0a8"],
	["#5a1418", "#a8343a"],
	["#3e3842", "#a04a58"],
	["#3e3842", "#ffd060"],
	["#141016", "#d8e8ff"],
	["#141016", "#ffd040"],
	["#141016", "#ab1f31"],
];
const CANDLE_CRUMBS = ["#f2e8e0", "#ffd060"];

/** The colours of each burst: its outer ring and its bright middle. */
const BURSTS: Record<string, [string, string]> = {
	blast: ["255, 176, 96", "255, 240, 200"],
	steam: ["230, 240, 245", "255, 255, 255"],
	slam: ["120, 40, 40", "200, 90, 70"],
	pounce: ["150, 140, 140", "210, 200, 200"],
};

export function drawWorld(
	context: CanvasRenderingContext2D,
	darkness: CanvasRenderingContext2D,
	world: IWorld,
	sprites: ISprites,
	view: IView,
) {
	const { player, time } = world;
	const art = sprites.characters;
	const left = Math.round(player.x - view.width / 2);
	const top = Math.round(player.y - view.height / 2);
	const sx = (x: number) => Math.round(x - left);
	const sy = (y: number) => Math.round(y - top);
	const inView = (x: number, y: number, margin: number) =>
		x > left - margin && x < left + view.width + margin && y > top - margin && y < top + view.height + margin;
	const glows: IGlow[] = [];
	context.imageSmoothingEnabled = false;

	// The snowy ground, tiled.
	drawTiled(context, sprites.ground, mod(left, sprites.ground.width), mod(top, sprites.ground.height), view);

	// Candles (lit, or knocked out) and burnt stumps.
	for (let cy = Math.floor(top / PROP_CELL) - 1; cy * PROP_CELL < top + view.height + PROP_CELL; cy++) {
		for (let cx = Math.floor(left / PROP_CELL) - 1; cx * PROP_CELL < left + view.width + PROP_CELL; cx++) {
			const prop = propAt(cx, cy);

			if (prop?.kind === "candle" && !snuffed(world, prop)) {
				glows.push({ x: prop.x, y: prop.y - 4, radius: CANDLE_LIGHT_RADIUS });
				context.drawImage(sprites.candle, sx(prop.x) - 2, sy(prop.y) - 8);
			} else if (prop?.kind === "stump") {
				context.drawImage(sprites.stump, sx(prop.x) - 7, sy(prop.y) - 8);
			}
		}
	}

	// Shrines and altars, a light bobbing over each in its patron's colour (Krampus's, red).
	for (const shrine of world.shrines) {
		const image = shrine.kind === "altar" ? art.altar : art.shrine;
		const pulse = 0.5 + 0.5 * Math.sin(time * 3);
		context.drawImage(image, sx(shrine.x) - Math.floor(image.width / 2), sy(shrine.y) - image.height + 2);
		context.fillStyle = shrine.patron ? PATRONS[shrine.patron].colour : "#c8343a";
		context.globalAlpha = 0.6 + 0.4 * pulse;
		context.fillRect(sx(shrine.x) - 1, sy(shrine.y) - image.height - 4 - Math.round(pulse * 2), 3, 3);
		context.globalAlpha = 1;
		glows.push({ x: shrine.x, y: shrine.y - 10, radius: 26 + pulse * 4 });
	}

	// Pickups, bobbing gently.
	for (const pickup of world.pickups) {
		if (!inView(pickup.x, pickup.y, 12)) {
			continue;
		}

		const image = art[pickup.kind];
		const bob = pickup.kind === "chest" ? 0 : Math.round(Math.sin(time * 4 + pickup.id));
		context.drawImage(image, sx(pickup.x) - Math.floor(image.width / 2), sy(pickup.y) - image.height + bob);

		if (
			pickup.kind === "chest" ||
			pickup.kind === "star" ||
			pickup.kind === "gear" ||
			pickup.kind === "clock" ||
			pickup.kind === "bell"
		) {
			glows.push({ x: pickup.x, y: pickup.y - 4, radius: 16 });
		}

		// Gear: a spark over it in its rarity's colour.
		if (pickup.gear) {
			context.fillStyle = RARITY_COLOURS[pickup.gear.rarity];
			context.fillRect(sx(pickup.x), sy(pickup.y) - image.height - 3 - Math.round(Math.sin(time * 3) + 1), 1, 2);
		}
	}

	// Shadows on the snow, and warnings of a boss's next attack.
	context.fillStyle = "rgba(2, 1, 6, 0.55)";

	for (const enemy of world.enemies) {
		if (inView(enemy.x, enemy.y, 20)) {
			const width = Math.round(enemy.radius * 1.6);
			context.fillRect(sx(enemy.x) - Math.round(width / 2), sy(enemy.y) - 1, width, 2);
		}
	}

	context.fillRect(sx(player.x) - 4, sy(player.y) - 1, 8, 2);
	drawTelegraphs(context, world, sx, sy);
	drawCocoa(context, world, sx, sy);
	drawSong(context, world, sx, sy);
	drawWails(context, world, sx, sy);

	// The enemies, back to front (the world keeps them in order of depth), then the elf over
	// them all, so it's never lost in a crowd.
	for (const enemy of world.enemies) {
		if (inView(enemy.x, enemy.y, 50)) {
			drawEnemy(context, world, enemy, enemyArt(sprites, enemy), sx, sy);
		}
	}

	drawElf(context, world, sprites, sx, sy);

	// Allies: minions running, snow globes circling, candle flames, and the patrons' helpers.
	for (const ally of world.allies) {
		if (ally.kind === "minion") {
			// A ring of green light at its feet, so a friend stands out from the horde.
			context.fillStyle = "rgba(111, 210, 122, 0.75)";

			for (let i = 0; i < 16; i++) {
				const angle = (i / 16) * Math.PI * 2;
				context.fillRect(
					Math.round(sx(ally.x) + Math.cos(angle) * 5),
					Math.round(sy(ally.y) + Math.sin(angle) * 2),
					1,
					1,
				);
			}

			glows.push({ x: ally.x, y: ally.y - 6, radius: 10 });
			const frames = art.minion[Math.cos(ally.angle) >= 0 ? "right" : "left"];
			context.drawImage(frames[Math.floor(time * 8) % 2], sx(ally.x) - 7, sy(ally.y) - 16);
		} else if (ally.kind === "soldier") {
			// Fading out as his guard ends; a flash at his musket's mouth as he fires.
			const right = Math.cos(ally.angle) >= 0;
			context.globalAlpha = Math.min(1, (ally.until - time) / 0.5);
			context.drawImage(art.soldier[right ? "right" : "left"], sx(ally.x) - 7, sy(ally.y) - 18);
			context.globalAlpha = 1;

			if (ally.shotAt !== undefined && time - ally.shotAt < 0.06) {
				context.fillStyle = "#ffd060";
				context.fillRect(sx(ally.x) + (right ? 5 : -7), sy(ally.y) - 12, 2, 2);
				glows.push({ x: ally.x + (right ? 6 : -6), y: ally.y - 11, radius: 8 });
			}
		} else if (ally.kind === "globe") {
			context.drawImage(art.globe, sx(ally.x) - 4, sy(ally.y) - 5);
		} else if (ally.kind === "xolo") {
			const frames = art.xolo[Math.cos(ally.angle) >= 0 ? "right" : "left"];
			const charging = time < (ally.chargeUntil ?? 0);

			// Charging: a blur of it trailing behind.
			if (charging) {
				for (const [back, alpha] of [
					[12, 0.15],
					[6, 0.35],
				]) {
					context.globalAlpha = alpha;
					context.drawImage(
						frames[0],
						sx(ally.x - Math.cos(ally.angle) * back) - 11,
						sy(ally.y - Math.sin(ally.angle) * back) - 16,
					);
				}

				context.globalAlpha = 1;
			}

			context.drawImage(frames[Math.floor(time * (charging ? 16 : 8)) % 2], sx(ally.x) - 11, sy(ally.y) - 16);
		} else if (ally.kind === "starBoy" || ally.kind === "maiden") {
			// Walking with the elf, facing where it faces.
			const frame = art[ally.kind][player.facing > 0 ? "right" : "left"][Math.floor(time * 6) % 2];
			context.drawImage(frame, sx(ally.x) - 7, sy(ally.y) - frame.height + 1);
		} else if (ally.kind === "mummer") {
			// A ring of green light at its feet, as a minion's, fading as its ten seconds end.
			context.globalAlpha = Math.min(1, (ally.until - time) / 0.5);
			context.fillStyle = "rgba(111, 210, 122, 0.75)";

			for (let i = 0; i < 16; i++) {
				const angle = (i / 16) * Math.PI * 2;
				context.fillRect(
					Math.round(sx(ally.x) + Math.cos(angle) * 5),
					Math.round(sy(ally.y) + Math.sin(angle) * 2),
					1,
					1,
				);
			}

			const frames = art.mummer[Math.cos(ally.angle) >= 0 ? "right" : "left"];
			context.drawImage(frames[Math.floor(time * 8) % 2], sx(ally.x) - 7, sy(ally.y) - 18);
			context.globalAlpha = 1;
		} else if (ally.kind === "poinsettia") {
			context.drawImage(art.poinsettia[Math.floor(time * 30) % art.poinsettia.length], sx(ally.x) - 6, sy(ally.y) - 6);
		} else {
			context.drawImage(art.flame, sx(ally.x) - 2, sy(ally.y) - 4);
			glows.push({ x: ally.x, y: ally.y, radius: 14 });
		}
	}

	for (const shot of world.shots) {
		if (!inView(shot.x, shot.y, 8)) {
			continue;
		}

		// La Flor's petals: a poinsettia's bracts, pointing the way they fly (bursting from the
		// same spot, at first they're the flower's star).
		if (shot.kind === "petal") {
			const way = Math.round((Math.atan2(shot.vy, shot.vx) / (Math.PI * 2)) * art.petal.length);
			const frame = art.petal[(way + art.petal.length) % art.petal.length];
			context.drawImage(frame, sx(shot.x) - 6, sy(shot.y) - 6);
		} else {
			drawShot(context, shot, sx, sy, glows);
		}
	}

	for (const effect of world.effects) {
		drawEffect(context, world, effect, sx, sy, glows);
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

	// The dark, with every light cut out of it.
	const radius = LIGHT_RADIUS * world.numbers.light;
	darkness.globalCompositeOperation = "source-over";
	darkness.clearRect(0, 0, view.width, view.height);
	darkness.fillStyle = `rgba(3, 2, 8, ${NIGHT})`;
	darkness.fillRect(0, 0, view.width, view.height);
	darkness.globalCompositeOperation = "destination-out";
	glows.push({ x: player.x, y: player.y - 6, radius });

	for (const glow of glows) {
		if (inView(glow.x, glow.y, glow.radius)) {
			darkness.drawImage(
				lightOf(glow.radius),
				sx(glow.x) - Math.round(glow.radius),
				sy(glow.y) - Math.round(glow.radius),
			);
		}
	}

	context.drawImage(darkness.canvas, 0, 0);

	// The light's warmth: candlelight round the elf.
	const warmth = context.createRadialGradient(
		sx(player.x),
		sy(player.y) - 6,
		0,
		sx(player.x),
		sy(player.y) - 6,
		radius,
	);
	warmth.addColorStop(0, "rgba(255, 150, 70, 0.14)");
	warmth.addColorStop(1, "rgba(255, 150, 70, 0)");
	context.globalCompositeOperation = "lighter";
	context.fillStyle = warmth;
	context.fillRect(0, 0, view.width, view.height);
	context.globalCompositeOperation = "source-over";

	// Eyes glowing in the dark.
	for (const enemy of world.enemies) {
		const look = enemyArt(sprites, enemy);

		if (!look.eyeColour || !inView(enemy.x, enemy.y, 50) || enemy.action === "blink") {
			continue;
		}

		const ex = sx(enemy.x) - (enemy.facing === 1 ? look.feet.x : look.width - look.feet.x);
		const ey = sy(enemy.y) - look.feet.y - floatOf(look, enemy, time);
		context.fillStyle = look.eyeColour;

		for (const [x, y] of look.eyes) {
			context.fillRect(ex + (enemy.facing === 1 ? x : look.width - 1 - x), ey + y, 1, 1);
		}
	}

	drawShrineArrows(context, world, view, left, top);
}

function enemyArt(sprites: ISprites, enemy: IEnemy): IEnemyArt {
	return (enemy.elite ? sprites.characters.elites[enemy.kind] : undefined) ?? sprites.characters.enemies[enemy.kind];
}

/** How high a floating enemy is off the snow this moment. */
function floatOf(art: IEnemyArt, enemy: IEnemy, time: number): number {
	return art.floats > 0 ? Math.round(art.floats + Math.sin(time * 3 + enemy.stride * 6) * 1.5) : 0;
}

function drawEnemy(
	context: CanvasRenderingContext2D,
	world: IWorld,
	enemy: IEnemy,
	art: IEnemyArt,
	sx: IToScreen,
	sy: IToScreen,
) {
	const { time } = world;
	const facing = enemy.facing === 1 ? "right" : "left";
	const frozen = time < enemy.frozenUntil;
	const frame = frozen || time < enemy.stunUntil ? 0 : Math.floor(time * 7 + enemy.stride * 2) % 2;
	const x = sx(enemy.x) - (enemy.facing === 1 ? art.feet.x : art.width - art.feet.x);
	const y = sy(enemy.y) - art.feet.y - floatOf(art, enemy, time);

	// An elite's golden glow, a pixel out all round.
	if (enemy.elite) {
		context.globalAlpha = 0.45 + 0.25 * Math.sin(time * 5);
		context.drawImage(art.aura[facing], x - 1, y);
		context.drawImage(art.aura[facing], x + 1, y);
		context.drawImage(art.aura[facing], x, y - 1);
		context.drawImage(art.aura[facing], x, y + 1);
		context.globalAlpha = 1;
	}

	// A boss shakes as it winds up; the ghost fades as it vanishes.
	const windingUp = enemy.boss && (enemy.action === "charge" || enemy.action === "pounce") && time < enemy.actAt - 0.5;
	const shake = windingUp ? Math.round(Math.sin(time * 60)) : 0;
	context.globalAlpha = enemy.action === "blink" ? Math.min(1, Math.max(0.15, enemy.actAt - time)) : 1;
	context.drawImage(art[facing][frame], x + shake, y);

	// Frost over it while it's frozen; a flash as it's hit (flickering, under a stream of hits, so it doesn't stay white).
	if (frozen) {
		context.globalAlpha = 0.35;
		context.drawImage(art.ice[facing], x, y);
	}

	if (time - enemy.hitAt < 0.07 && Math.floor(time * 24) % 2 === 0) {
		context.globalAlpha = 0.75;
		context.drawImage(art.flash[facing], x + shake, y);
	}

	context.globalAlpha = 1;

	// Burning: little flames flickering over it.
	if (time < enemy.burnUntil) {
		const flicker = Math.floor(time * 10) % 2;
		context.fillStyle = Math.floor(time * 12) % 2 === 0 ? "#ffb060" : "#e0502a";
		context.fillRect(x + Math.round(art.width * 0.3), y + 1 + flicker, 1, 2);
		context.fillRect(x + Math.round(art.width * 0.6), y + 2 - flicker, 1, 2);
	}
}

/**
 * The carollers' wailing: a faint ring wavering round each, out to where it slows the elf
 * (WAIL_REACH); and while it does, notes drifting from each caroller near enough to the elf.
 */
function drawWails(context: CanvasRenderingContext2D, world: IWorld, sx: IToScreen, sy: IToScreen) {
	const { player, time } = world;
	const slowed = time < player.slowedUntil;

	for (const enemy of world.enemies) {
		if (enemy.kind !== "caroller") {
			continue;
		}

		const x = sx(enemy.x);
		const y = sy(enemy.y) - 6;
		context.fillStyle = "rgba(196, 180, 230, 0.5)";

		// In dashes, so it stands apart from the snow's speckle.
		for (let i = 0; i < 120; i++) {
			if (i % 5 > 2) {
				continue;
			}

			const angle = (i / 120) * Math.PI * 2;
			const reach = WAIL_REACH + Math.sin(angle * 5 + time * 4 + enemy.stride * 9) * 2;
			context.fillRect(Math.round(x + Math.cos(angle) * reach), Math.round(y + Math.sin(angle) * reach), 1, 1);
		}

		if (!slowed || Math.hypot(enemy.x - player.x, enemy.y - player.y) >= WAIL_REACH) {
			continue;
		}

		// Two notes at a time, drifting from its mouth to the elf, wavering as they go.
		context.fillStyle = "rgba(220, 208, 246, 0.85)";

		for (let i = 0; i < 2; i++) {
			const along = (time * 0.9 + i / 2 + enemy.stride) % 1;
			const nx = Math.round(x + (sx(player.x) - x) * along + Math.sin(along * 12) * 2);
			const ny = Math.round(y + (sy(player.y) - 8 - y) * along);
			context.fillRect(nx, ny, 2, 1);
			context.fillRect(nx + 1, ny - 3, 1, 3);
		}
	}
}

/** The hot cocoa aura: a warm haze round the elf, its edge simmering, steam rising inside. */
/** Mari Lwyd's song round the elf: a faint ring, notes drifting round it. */
function drawSong(context: CanvasRenderingContext2D, world: IWorld, sx: IToScreen, sy: IToScreen) {
	const reach = world.numbers.song;

	if (reach <= 0) {
		return;
	}

	const { player, time } = world;
	const x = sx(player.x);
	const y = sy(player.y) - 3;
	const dots = Math.round(reach * 0.8);
	context.fillStyle = "rgba(232, 228, 220, 0.22)";

	for (let i = 0; i < dots; i++) {
		const angle = (i / dots) * Math.PI * 2 - time * 0.6;
		context.fillRect(Math.round(x + Math.cos(angle) * reach), Math.round(y + Math.sin(angle) * reach * 0.7), 1, 1);
	}

	// Notes, three of them, going round.
	context.fillStyle = "rgba(232, 228, 220, 0.6)";

	for (let i = 0; i < 3; i++) {
		const angle = time * 1.2 + (i / 3) * Math.PI * 2;
		const nx = Math.round(x + Math.cos(angle) * reach * 0.8);
		const ny = Math.round(y + Math.sin(angle) * reach * 0.56);
		context.fillRect(nx, ny, 2, 1);
		context.fillRect(nx + 1, ny - 3, 1, 3);
	}
}

function drawCocoa(context: CanvasRenderingContext2D, world: IWorld, sx: IToScreen, sy: IToScreen) {
	const weapon = world.player.weapons.find((carried) => carried.id === "cocoa");

	if (!weapon) {
		return;
	}

	const { player, time } = world;
	const reach = cocoaReach(weapon, world.numbers);
	const x = sx(player.x);
	const y = sy(player.y) - 3;
	context.fillStyle = weapon.evolved ? "rgba(255, 220, 200, 0.1)" : "rgba(150, 80, 40, 0.14)";
	context.beginPath();
	context.ellipse(x, y, reach, reach * 0.7, 0, 0, Math.PI * 2);
	context.fill();
	const dots = Math.round(reach * 1.2);

	for (let i = 0; i < dots; i++) {
		const angle = (i / dots) * Math.PI * 2 + time * 0.4;
		context.fillStyle = i % 3 === 0 ? "rgba(255, 200, 150, 0.5)" : "rgba(168, 112, 58, 0.45)";
		context.fillRect(Math.round(x + Math.cos(angle) * reach), Math.round(y + Math.sin(angle) * reach * 0.7), 1, 1);
	}

	// Wisps of steam, each rising and fading on its own clock.
	context.fillStyle = "rgba(242, 232, 224, 0.35)";

	for (let i = 0; i < 6; i++) {
		const rise = (time * 0.8 + i / 6) % 1;
		const angle = i * 2.4;
		const out = reach * 0.6 * hash(i, 3);
		context.fillRect(
			Math.round(x + Math.cos(angle) * out),
			Math.round(y + Math.sin(angle) * out * 0.7 - rise * 10),
			1,
			2,
		);
	}
}

/** Warnings before a boss's attack: where the Yule Cat will land, Krampus's slam, the Mouse King's charge. */
function drawTelegraphs(context: CanvasRenderingContext2D, world: IWorld, sx: IToScreen, sy: IToScreen) {
	for (const boss of world.enemies) {
		if (!boss.boss || !boss.action) {
			continue;
		}

		context.strokeStyle = `rgba(228, 60, 60, ${(0.35 + 0.3 * Math.sin(world.time * 20)).toFixed(2)})`;
		context.lineWidth = 1;
		context.beginPath();

		if (boss.action === "pounce" && boss.target) {
			context.ellipse(sx(boss.target.x), sy(boss.target.y), 28, 14, 0, 0, Math.PI * 2);
		} else if (boss.action === "slam") {
			context.ellipse(sx(boss.x), sy(boss.y), 44, 22, 0, 0, Math.PI * 2);
		} else if (boss.action === "charge" && boss.target) {
			context.moveTo(sx(boss.x), sy(boss.y) - 6);
			context.lineTo(sx(boss.target.x), sy(boss.target.y) - 6);
		}

		context.stroke();
	}
}

/** A shot: a peppermint tracer, glass shrapnel or ice; an angel's shard, a ghost's orb, Krampus's chain. */
function drawShot(
	context: CanvasRenderingContext2D,
	shot: IWorld["shots"][number],
	sx: IToScreen,
	sy: IToScreen,
	glows: IGlow[],
) {
	const speed = Math.hypot(shot.vx, shot.vy) || 1;
	const x = sx(shot.x);
	const y = sy(shot.y);
	// A point `back` pixels behind it.
	const bx = (back: number) => Math.round(x - (shot.vx / speed) * back);
	const by = (back: number) => Math.round(y - (shot.vy / speed) * back);

	switch (shot.kind) {
		case "peppermint":
			context.fillStyle = "#e0303e";
			context.fillRect(bx(3), by(3), 1, 1);
			context.fillRect(bx(2), by(2), 1, 1);
			context.fillStyle = "#fff4e8";
			context.fillRect(x, y, 1, 1);
			context.fillRect(bx(1), by(1), 1, 1);
			break;
		case "ice":
			context.fillStyle = "#c8ecff";
			context.fillRect(x, y, 2, 1);
			context.fillStyle = "#7ac0e8";
			context.fillRect(bx(2), by(2), 1, 1);
			break;
		case "shard":
			context.fillStyle = shot.hostile ? "#f4eeee" : "#d73648";
			context.fillRect(x, y, 2, 2);
			context.fillStyle = shot.hostile ? "#a8a0a8" : "#ffd060";
			context.fillRect(bx(2), by(2), 1, 1);
			break;
		case "orb":
			context.fillStyle = "#3a1050";
			context.fillRect(x - 2, y - 2, 4, 4);
			context.fillStyle = "#d8b8ff";
			context.fillRect(x - 1, y - 1, 2, 2);
			glows.push({ x: shot.x, y: shot.y, radius: 8 });
			break;
		case "chain":
			context.fillStyle = "#8a909a";
			context.fillRect(x - 1, y - 1, 3, 2);
			context.fillStyle = "#c4c8d0";
			context.fillRect(bx(3), by(3), 2, 2);
			break;
		case "pellet":
			// A walnut shell.
			context.fillStyle = "#a07040";
			context.fillRect(x, y, 2, 2);
			context.fillStyle = "#5a3a1c";
			context.fillRect(bx(2), by(2), 1, 1);
			break;
		case "bolt":
			// An icicle, long and pale, trailing cold.
			context.fillStyle = "#e8f8ff";
			context.fillRect(x, y, 1, 1);
			context.fillRect(bx(1), by(1), 1, 1);
			context.fillStyle = "#9ad0f0";
			context.fillRect(bx(2), by(2), 1, 1);
			context.fillRect(bx(3), by(3), 1, 1);
			context.fillStyle = "#4a88b8";
			context.fillRect(bx(5), by(5), 1, 1);
			break;
		case "jingle":
			context.fillStyle = "#ffd060";
			context.fillRect(x, y, 1, 1);
			context.fillStyle = "#a87018";
			context.fillRect(bx(2), by(2), 1, 1);
			break;
		case "fireball":
			context.fillStyle = "#e0502a";
			context.fillRect(bx(3) - 1, by(3) - 1, 2, 2);
			context.fillStyle = "#ffa040";
			context.fillRect(x - 2, y - 1, 4, 3);
			context.fillRect(x - 1, y - 2, 3, 4);
			context.fillStyle = "#fff0a0";
			context.fillRect(x - 1, y - 1, 2, 2);
			glows.push({ x: shot.x, y: shot.y, radius: 12 });
			break;
		case "snowball": {
			// A ball of snow, lit on top, its size its own.
			const r = Math.max(1, Math.round(shot.radius));

			for (let dy = -r; dy <= r; dy++) {
				const half = Math.round(Math.sqrt(r * r - dy * dy));
				// Shaded on its underside, row by row.
				context.fillStyle = dy > r * 0.4 ? "#7a8a9c" : dy > -r * 0.3 ? "#c8d4e0" : "#eef4f8";
				context.fillRect(x - half, y + dy, half * 2 + 1, 1);
			}

			break;
		}
		case "spark":
			context.fillStyle = "#ffc040";
			context.fillRect(x, y, 1, 1);
			context.fillStyle = "#e0502a";
			context.fillRect(bx(1), by(1), 1, 1);
			break;
		case "star":
			// A star boy's star: gold, its heart white-hot.
			context.fillStyle = "#dca02c";
			context.fillRect(x - 1, y, 3, 1);
			context.fillRect(x, y - 1, 1, 3);
			context.fillStyle = "#fff0a8";
			context.fillRect(x, y, 1, 1);
			glows.push({ x: shot.x, y: shot.y, radius: 6 });
			break;
	}
}

function drawEffect(
	context: CanvasRenderingContext2D,
	world: IWorld,
	effect: IEffect,
	sx: IToScreen,
	sy: IToScreen,
	glows: IGlow[],
) {
	const { time } = world;

	if (time < effect.at) {
		return;
	}

	const span = effect.until - effect.at;
	const t = span > 0 ? Math.min(1, (time - effect.at) / span) : 1;
	const x = sx(effect.x);
	const y = sy(effect.y);

	switch (effect.kind) {
		case "sweep": {
			// The blade's sweep: a candy-striped arc, fading.
			const arc = effect.data[0];
			context.lineWidth = 2;

			for (let i = 0; i < 10; i++) {
				const a = effect.angle - arc / 2 + (arc * i) / 10;
				context.strokeStyle = i % 2 === 0 ? `rgba(242, 232, 224, ${1 - t})` : `rgba(215, 54, 72, ${1 - t})`;
				context.beginPath();
				context.arc(x, y, effect.radius * (0.7 + 0.3 * t), a, a + arc / 10);
				context.stroke();
			}

			break;
		}
		case "blast":
		case "steam":
		case "slam":
		case "pounce": {
			const [outer, inner] = BURSTS[effect.kind];
			const r = effect.radius * Math.sqrt(t);
			context.fillStyle = `rgba(${outer}, ${(0.5 * (1 - t)).toFixed(3)})`;
			context.beginPath();
			context.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
			context.fill();
			context.fillStyle = `rgba(${inner}, ${(0.7 * (1 - t)).toFixed(3)})`;
			context.beginPath();
			context.ellipse(x, y, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
			context.fill();

			if (effect.kind === "blast" && t < 0.5) {
				glows.push({ x: effect.x, y: effect.y, radius: effect.radius * 1.5 });
			}

			break;
		}
		case "ring":
		case "frost": {
			context.strokeStyle =
				effect.kind === "ring"
					? `rgba(255, 208, 96, ${(1 - t).toFixed(3)})`
					: `rgba(154, 216, 255, ${(1 - t).toFixed(3)})`;
			context.lineWidth = 2;
			context.beginPath();
			context.ellipse(x, y, effect.radius * t, effect.radius * t * 0.7, 0, 0, Math.PI * 2);
			context.stroke();
			break;
		}
		case "lash": {
			// Tinsel: glittering gold and white, cracking out to the side.
			const reach = effect.radius * Math.min(1, t * 3);

			for (let i = 0; i < reach; i += 2) {
				context.fillStyle = (i / 2) % 2 === 0 ? `rgba(255, 208, 96, ${1 - t})` : `rgba(255, 244, 232, ${1 - t})`;
				context.fillRect(x + effect.angle * i, y + Math.round(Math.sin(i * 0.4 + time * 30) * 1.5), 2, 1);
			}

			break;
		}
		case "shell": {
			// In the air: an ornament (or a firework shell, angle 1) arcing to where it lands.
			if (effect.data[3] === 1) {
				break;
			}

			const tx = sx(effect.data[0]);
			const ty = sy(effect.data[1]);
			const px = Math.round(x + (tx - x) * t);
			const py = Math.round(y + (ty - y) * t - Math.sin(t * Math.PI) * 30);
			context.fillStyle = "rgba(255, 176, 96, 0.25)";
			context.fillRect(tx - 1, ty - 1, 3, 3);

			if (effect.angle === 1) {
				context.fillStyle = "#ffd060";
				context.fillRect(px, py, 2, 2);
				context.fillStyle = "#e0502a";
				context.fillRect(px, py + 2, 1, 1);
			} else {
				context.fillStyle = "#d73648";
				context.fillRect(px - 1, py - 1, 3, 3);
				context.fillStyle = "#fff4e8";
				context.fillRect(px - 1, py - 1, 1, 1);
			}

			break;
		}
		case "crumbs":
		case "shards": {
			// Broken to bits: crumbs, coal, porcelain, ice or wax, flying out and falling.
			const colours =
				effect.kind === "shards"
					? ["#c8ecff", "#7ac0e8"]
					: effect.data[0] === -1
						? CANDLE_CRUMBS
						: (CRUMBS[effect.data[0]] ?? CRUMBS[0]);
			const count = Math.min(14, 5 + Math.round(effect.radius));

			for (let i = 0; i < count; i++) {
				const angle = effect.angle + i * 2.4;
				const speed = 20 + hash(i, effect.at) * 30;
				context.fillStyle = colours[i % 2];
				context.fillRect(
					Math.round(x + Math.cos(angle) * speed * t),
					Math.round(y + Math.sin(angle) * speed * t * 0.7 + 30 * t * t),
					1,
					1,
				);
			}

			break;
		}
		case "coal": {
			// A lump of coal on the snow, its fuse sparking, until it goes off.
			if (effect.data[3] === 1 || effect.data[4] === 1) {
				break;
			}

			context.fillStyle = "#18151c";
			context.fillRect(x - 2, y - 3, 4, 3);
			context.fillStyle = "#3a3440";
			context.fillRect(x - 1, y - 3, 1, 1);
			context.fillStyle = Math.floor(time * 20) % 2 === 0 ? "#ffd060" : "#e0502a";
			context.fillRect(x + 1, y - 5, 1, 1);
			glows.push({ x: effect.x, y: effect.y - 4, radius: 8 });
			break;
		}
		case "tracks": {
			// Ded Moroz's frost tracks: ice along the snow where the elf dashed, glinting, fading.
			const [x1, y1, x2, y2] = effect.data;
			const steps = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 2));
			context.fillStyle = `rgba(200, 236, 255, ${(0.6 * (1 - t)).toFixed(3)})`;

			for (let i = 0; i <= steps; i++) {
				const px = sx(x1 + ((x2 - x1) * i) / steps);
				const py = sy(y1 + ((y2 - y1) * i) / steps);
				context.fillRect(px - 1, py, 3, 1);

				if (hash(i, 7) > 0.6) {
					context.fillRect(px + (i % 2 === 0 ? 2 : -3), py - 1, 1, 1);
				}
			}

			break;
		}
		case "soot":
			// La Befana's soot: smoke hanging where a coal bomb went off, ash rising from it, thinning.
			for (let i = 0; i < 14; i++) {
				const angle = i * 2.4 + time * 0.3;
				const out = effect.radius * 0.8 * hash(i, 11);
				const cx = x + Math.cos(angle) * out;
				const cy = y + Math.sin(angle) * out * 0.6 - 3;
				context.fillStyle = `rgba(96, 88, 100, ${(0.3 * (1 - t)).toFixed(3)})`;
				context.beginPath();
				context.ellipse(cx, cy, 5, 3.5, 0, 0, Math.PI * 2);
				context.fill();
				context.fillStyle = `rgba(170, 160, 168, ${(0.8 * (1 - t)).toFixed(3)})`;
				context.fillRect(Math.round(cx), Math.round(cy - ((time * 6 + i) % 8)), 1, 1);
				context.fillRect(Math.round(cx) + 2, Math.round(cy - ((time * 5 + i * 3) % 10)), 1, 1);
			}

			break;
		case "chant":
			context.strokeStyle = `rgba(232, 228, 220, ${(0.8 * (1 - t)).toFixed(3)})`;
			context.lineWidth = 1;
			context.beginPath();
			context.ellipse(x, y, effect.radius * t, effect.radius * t * 0.7, 0, 0, Math.PI * 2);
			context.stroke();
			break;
		case "chains":
			context.strokeStyle = "rgba(196, 200, 208, 0.8)";
			context.lineWidth = 1;
			context.beginPath();
			context.moveTo(x, y);
			context.lineTo(sx(effect.data[0]), sy(effect.data[1]));
			context.stroke();
			break;
		case "heal":
		case "levelUp":
			// Sparkles rising: gold for a level, warm white for a heal.
			context.fillStyle = effect.kind === "levelUp" ? "#ffd060" : "#fff4e8";
			context.globalAlpha = 1 - t;

			for (let i = 0; i < 8; i++) {
				if (hash(i, Math.floor(time * 10)) > 0.3) {
					context.fillRect(
						x + Math.round(Math.cos(i * 2.1) * effect.radius * 0.6),
						y - Math.round(t * 18 + (i % 3) * 3),
						1,
						1,
					);
				}
			}

			context.globalAlpha = 1;
			break;
	}
}

/** The elf (blinking while it's safe after a hit, trailing ghosts as it dashes), and its gun. */
/** Each of the elf's frames in the wailing's lilac, made as it's first needed. */
const wailedFrames = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

function wailedOf(image: HTMLCanvasElement): HTMLCanvasElement {
	let tinted = wailedFrames.get(image);

	if (!tinted) {
		tinted = document.createElement("canvas");
		tinted.width = image.width;
		tinted.height = image.height;
		const paint = tinted.getContext("2d")!;
		paint.drawImage(image, 0, 0);
		paint.globalCompositeOperation = "source-atop";
		paint.fillStyle = "#c4b4e6";
		paint.fillRect(0, 0, tinted.width, tinted.height);
		wailedFrames.set(image, tinted);
	}

	return tinted;
}

function drawElf(context: CanvasRenderingContext2D, world: IWorld, sprites: ISprites, sx: IToScreen, sy: IToScreen) {
	const { player, time } = world;

	if (time < player.hurtUntil && Math.floor(time * 16) % 2 === 0) {
		return;
	}

	const image =
		sprites.cast[player.character][player.facing === 1 ? "right" : "left"][
			player.moving ? Math.floor(time * 8) % 2 : 1
		];
	const feet = CAST_FEET[player.character];
	const x = sx(player.x) - (player.facing === 1 ? feet.x : image.width - feet.x);
	const y = sy(player.y) - feet.y;

	if (dashing(world)) {
		context.globalAlpha = 0.3;
		context.drawImage(image, Math.round(x - player.dash.x * 8), Math.round(y - player.dash.y * 8));
		context.globalAlpha = 0.15;
		context.drawImage(image, Math.round(x - player.dash.x * 16), Math.round(y - player.dash.y * 16));
		context.globalAlpha = 1;
	}

	context.drawImage(image, x, y);

	// Wavering a cold, wan lilac while a caroller's wailing slows it.
	if (time < player.slowedUntil) {
		context.globalAlpha = 0.5 + 0.12 * Math.sin(time * 6);
		context.drawImage(wailedOf(image), x, y);
		context.globalAlpha = 1;
	}

	// Christkind's halo, while it's ready to stop a hit.
	if (player.haloReadyAt !== null && time >= player.haloReadyAt) {
		context.fillStyle = "#ffe6a0";
		context.fillRect(x + 5, y - 3, 6, 1);
		context.fillRect(x + 4, y - 2, 1, 1);
		context.fillRect(x + 11, y - 2, 1, 1);
	}

	const gun = player.weapons.find((weapon) => isGun(weapon.id));

	if (!gun) {
		return;
	}

	// The gun, in its hand, pointing where it aims (or ahead), turned over when aiming left; the
	// jingle pistols, one in each hand.
	const aim = player.aim ?? { x: player.facing, y: 0 };
	const hands = gun.id === "pistols" ? [-2, 2] : [0];

	for (const offset of hands) {
		context.save();
		context.translate(sx(player.x) + player.facing * 2, sy(player.y) - 8 + offset);
		context.rotate(Math.atan2(aim.y, aim.x));

		if (aim.x < 0) {
			context.scale(1, -1);
		}

		context.drawImage(sprites.guns[gun.id as IGunId], -GUN_GRIP.x, -GUN_GRIP.y);

		if (time - player.lastShotAt < 0.05) {
			context.fillStyle = "#ffd060";
			context.fillRect(12, 1, 3, 3);
			context.fillStyle = "#fff4e8";
			context.fillRect(13, 2, 1, 1);
		}

		context.restore();
	}
}

/** An arrow at the edge of the view toward each shrine out of sight, in its patron's colour. */
function drawShrineArrows(context: CanvasRenderingContext2D, world: IWorld, view: IView, left: number, top: number) {
	const cx = view.width / 2;
	const cy = view.height / 2;

	for (const shrine of world.shrines) {
		const x = shrine.x - left;
		const y = shrine.y - top;

		if (x > 0 && x < view.width && y > 0 && y < view.height) {
			continue;
		}

		const angle = Math.atan2(y - cy, x - cx);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		// Where the line to it leaves the view, a little inside the edge.
		const reach = Math.min((cx - 10) / Math.max(Math.abs(cos), 0.001), (cy - 10) / Math.max(Math.abs(sin), 0.001));
		const ax = cx + cos * reach;
		const ay = cy + sin * reach;
		context.fillStyle = shrine.patron ? PATRONS[shrine.patron].colour : "#e04040";
		context.globalAlpha = Math.floor(world.time * 3) % 2 === 0 ? 1 : 0.6;
		context.fillRect(Math.round(ax), Math.round(ay), 1, 1);

		for (let back = 1; back < 4; back++) {
			const px = ax - cos * back;
			const py = ay - sin * back;
			context.fillRect(Math.round(px - sin * back), Math.round(py + cos * back), 1, 1);
			context.fillRect(Math.round(px + sin * back), Math.round(py - cos * back), 1, 1);
		}

		context.globalAlpha = 1;
	}
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
