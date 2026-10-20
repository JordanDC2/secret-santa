/**
 * Draws a frame of Silent Night at the game's own resolution (shown scaled up, crisp): the
 * snowy ground and what's scattered on it, the shrines, everything on the snow back to front,
 * the weapons' sweeps, bursts and rings, fog drifting over it all, then the dark, with every light
 * cut out of it (the elf's, the candles', the shrines', Saint Lucia's flames, a burst's flash).
 * Over the dark: eyes glowing, and arrows to shrines out of sight.
 */

import { PROP_CELL, propAt, snuffed } from "Components/SilentNight/candles";
import type { IEnemyArt } from "Components/SilentNight/characters";
import { PATRONS } from "Components/SilentNight/patrons";
import { hash, threshold } from "Components/SilentNight/pixelArt";
import { CANDLE_LIGHT_RADIUS, ELF_FEET, GUN_GRIP, LIGHT_RADIUS, type ISprites } from "Components/SilentNight/sprites";
import type { IEffect, IEnemy, IWorld } from "Components/SilentNight/types";
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

		if (pickup.kind === "chest" || pickup.kind === "star") {
			glows.push({ x: pickup.x, y: pickup.y - 4, radius: 16 });
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

	// Everyone, back to front (the world keeps the enemies in order of depth).
	let elfDrawn = false;

	for (const enemy of world.enemies) {
		if (!elfDrawn && enemy.y > player.y) {
			drawElf(context, world, sprites, sx, sy);
			elfDrawn = true;
		}

		if (inView(enemy.x, enemy.y, 50)) {
			drawEnemy(context, world, enemy, enemyArt(sprites, enemy), sx, sy);
		}
	}

	if (!elfDrawn) {
		drawElf(context, world, sprites, sx, sy);
	}

	// Allies: minions running, snow globes circling, candle flames.
	for (const ally of world.allies) {
		if (ally.kind === "minion") {
			const frames = art.minion[Math.cos(ally.angle) >= 0 ? "right" : "left"];
			context.drawImage(frames[Math.floor(time * 8) % 2], sx(ally.x) - 7, sy(ally.y) - 16);
		} else if (ally.kind === "globe") {
			context.drawImage(art.globe, sx(ally.x) - 4, sy(ally.y) - 5);
		} else {
			context.drawImage(art.flame, sx(ally.x) - 2, sy(ally.y) - 4);
			glows.push({ x: ally.x, y: ally.y, radius: 14 });
		}
	}

	for (const shot of world.shots) {
		if (inView(shot.x, shot.y, 8)) {
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
function drawElf(context: CanvasRenderingContext2D, world: IWorld, sprites: ISprites, sx: IToScreen, sy: IToScreen) {
	const { player, time } = world;

	if (time < player.hurtUntil && Math.floor(time * 16) % 2 === 0) {
		return;
	}

	const image = sprites.elf[player.facing === 1 ? "right" : "left"][player.moving ? Math.floor(time * 8) % 2 : 1];
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

	// Christkind's halo, while it's ready to stop a hit.
	if (player.haloReadyAt !== null && time >= player.haloReadyAt) {
		context.fillStyle = "#ffe6a0";
		context.fillRect(x + 5, y - 3, 6, 1);
		context.fillRect(x + 4, y - 2, 1, 1);
		context.fillRect(x + 11, y - 2, 1, 1);
	}

	if (!player.weapons.some((weapon) => weapon.id === "gun")) {
		return;
	}

	// The gun, in its hand, pointing where it aims (or ahead), turned over when aiming left.
	const aim = player.aim ?? { x: player.facing, y: 0 };
	context.save();
	context.translate(sx(player.x) + player.facing * 2, sy(player.y) - 8);
	context.rotate(Math.atan2(aim.y, aim.x));

	if (aim.x < 0) {
		context.scale(1, -1);
	}

	context.drawImage(sprites.gun, -GUN_GRIP.x, -GUN_GRIP.y);

	if (time - player.lastShotAt < 0.05) {
		context.fillStyle = "#ffd060";
		context.fillRect(12, 1, 3, 3);
		context.fillStyle = "#fff4e8";
		context.fillRect(13, 2, 1, 1);
	}

	context.restore();
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
