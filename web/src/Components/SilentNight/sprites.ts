/**
 * Silent Night's sprites, drawn once by code (pixelArt.ts) in La Flor's style: moody ramps,
 * candlelit rims on the side facing the light, a dark outline on the rest. Here: the cast (the
 * elf, Santa, Mrs. Claus, the snowman and the reindeer) and the gun, the snowy ground, the fog,
 * candles and stumps; the enemies and everything else are in characters.ts.
 */

import { fbm, flipped, hash, shade, Sprite, threshold } from "Components/SilentNight/pixelArt";

import { makeCharacters, type ICharacterSprites } from "Components/SilentNight/characters";
import { OUTLINE, RAMPS, RIMS } from "Components/SilentNight/palette";
import type { ICastId, IGunId } from "Components/SilentNight/types";

export type ISprites = {
	/** Each of the cast, facing right and left, in two steps of their walk. */
	cast: Record<ICastId, { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] }>;
	/** Each gun (guns.ts), pointing right, held at (GUN_GRIP.x, GUN_GRIP.y). */
	guns: Record<IGunId, HTMLCanvasElement>;
	characters: ICharacterSprites;
	ground: HTMLCanvasElement;
	fog: HTMLCanvasElement;
	candle: HTMLCanvasElement;
	stump: HTMLCanvasElement;
};

/** Where each of the cast stands on their sprite, and where a hand holds the gun. */
export const CAST_FEET: Record<ICastId, { x: number; y: number }> = {
	elf: { x: 8, y: 21 },
	santa: { x: 8, y: 21 },
	mrsClaus: { x: 8, y: 21 },
	snowman: { x: 8, y: 21 },
	reindeer: { x: 10, y: 21 },
};
export const GUN_GRIP = { x: 3, y: 2 };
/** The rings of light's radii (the elf's and a candle's), in the game's pixels. */
export const LIGHT_RADIUS = 72;
export const CANDLE_LIGHT_RADIUS = 24;

/**
 * The elf: a crumpled felt hat, its tip drooping behind with a bobble, over long pointed ears and
 * a face in shadow; a belted green tunic with a jagged hem, one arm reaching out to hold the gun;
 * dark woollen hose and worn leather boots, their toes curled.
 */
function elf(step: 0 | 1): Sprite {
	const sprite = new Sprite(16, 22);
	const spread = step === 0 ? 2 : 0.6;
	// Legs, apart or together as it walks, and its boots.
	sprite.limb(7, 15, 7 - spread, 19.6, 1.2, 1, "green", -0.24);
	sprite.limb(9, 15, 9 + spread, 19.6, 1.2, 1, "green", -0.16);

	for (const [x, bias] of [
		[6.4 - spread, -0.12],
		[9.6 + spread, -0.04],
	]) {
		sprite.ellipse(x, 20.5, 1.9, 1.1, 0, "cookie", bias);
		sprite.limb(x + 1.4, 20.4, x + 2.4, 19.2, 0.6, 0.35, "cookie", bias);
	}

	// Tunic, a fold down it, its jagged hem, and a leather belt with a brass buckle.
	sprite.ellipse(8, 12.5, 4, 4.4, 0, "green", -0.02);
	sprite.limb(6.6, 10.4, 6, 15.6, 0.4, 0.4, "green", -0.2);

	for (const x of [4.6, 7, 9.4, 11.4]) {
		sprite.limb(x, 15, x + 0.4, 16.6, 1.2, 0.4, "green", -0.08);
	}

	sprite.rect(4, 13, 8, 1, "cookie", 0.12);
	sprite.put(8, 13, "gold", 0.55);
	// Its far arm hanging, its near arm reaching out to the gun.
	sprite.limb(4.8, 10.4, 3.8, 14, 1, 0.8, "green", -0.14);
	sprite.ellipse(3.8, 14.6, 0.8, 0.8, 0, "skin", -0.06);
	sprite.limb(10.6, 10.4, 10.8, 12.6, 1, 0.9, "green", 0.02);
	sprite.ellipse(10.6, 13.2, 0.9, 0.8, 0, "skin", 0.02);
	// Head in shadow, long ears, a sharp nose.
	sprite.ellipse(8, 6.6, 3.3, 3.1, 0, "skin", -0.02);
	sprite.limb(5, 6, 2.2, 3.8, 0.9, 0.25, "skin", -0.04);
	sprite.limb(11, 6, 13.6, 4, 0.9, 0.25, "skin", -0.08);
	sprite.put(11, 7, "skin", 0.32);
	// Hat: worn felt, crumpled, its tip drooping behind, a bobble, a dingy fur brim.
	sprite.limb(8, 3.6, 9.6, 0.8, 3.2, 1.1, "red", -0.06);
	sprite.limb(9.6, 0.8, 5.2, 0.6, 1.1, 0.5, "red", -0.12);
	sprite.ellipse(4.4, 1.2, 1.1, 1, 0, "white", -0.06);
	sprite.rect(4.6, 3.2, 7, 1.2, "white", 0.18);
	// Eyes, catching the light.
	sprite.put(9, 6, "dark", 0.2);
	sprite.put(11, 6, "dark", 0.2);
	sprite.weather(0.14);

	return sprite;
}

/**
 * Santa: weathered, his hat flopping back, a great untidy beard down his coat, the coat's fur trim
 * gone grey, a black belt with a dull brass buckle, a mitten held out to the gun, old black boots.
 */
function santa(step: 0 | 1): Sprite {
	const sprite = new Sprite(16, 22);
	const spread = step === 0 ? 2 : 0.6;
	sprite.limb(7, 16, 7 - spread, 20, 1.5, 1.4, "red", -0.2);
	sprite.limb(9, 16, 9 + spread, 20, 1.5, 1.4, "red", -0.12);
	sprite.ellipse(6.5 - spread, 20.6, 2.1, 1.1, 0, "dark", 0.45);
	sprite.ellipse(9.5 + spread, 20.6, 2.1, 1.1, 0, "dark", 0.5);
	// His heavy coat, a fold in it, its grey fur hem, and the belt.
	sprite.ellipse(8, 13, 5, 4.8, 0, "red", -0.02);
	sprite.limb(5.4, 10.6, 4.8, 16, 0.4, 0.4, "red", -0.2);
	sprite.rect(3.4, 16.4, 9.4, 1.2, "white", 0.2);
	sprite.rect(3.2, 13, 9.8, 1, "dark", 0.3);
	sprite.put(9, 13, "gold", 0.55);
	// His far arm, and his near one held out, mittened, to the gun.
	sprite.limb(4, 10.6, 3.2, 14.4, 1.4, 1.1, "red", -0.14);
	sprite.ellipse(3.2, 15, 1, 0.9, 0, "dark", 0.4);
	sprite.limb(11, 10.6, 11, 12.6, 1.3, 1.1, "red", 0.02);
	sprite.ellipse(10.8, 13.2, 1.1, 0.9, 0, "dark", 0.45);
	// His face, the great beard down his front, his moustache, and his hat.
	sprite.ellipse(8.5, 6.6, 3.2, 3, 0, "skin", 0);
	sprite.ellipse(8.8, 10.4, 3.2, 2.6, 0, "white", 0.12);
	sprite.limb(8.4, 11.8, 8.8, 13.4, 1.6, 0.6, "white", 0.06);
	sprite.limb(9.6, 8, 12.4, 8.4, 0.8, 0.5, "white", 0.28);
	sprite.limb(8, 3.6, 4.2, 2.6, 3, 0.8, "red", -0.04);
	sprite.limb(4.2, 2.6, 2.6, 5.4, 0.9, 0.5, "red", -0.1);
	sprite.ellipse(2.6, 6, 1.2, 1.1, 0, "white", 0.06);
	sprite.rect(5, 3.4, 7, 1.2, "white", 0.24);
	sprite.put(10, 6, "dark", 0.2);
	sprite.put(12, 6, "dark", 0.2);
	sprite.put(12, 7, "pink", 0.45);
	sprite.weather(0.12, 3);

	return sprite;
}

/**
 * Mrs. Claus: her grey hair up in a bun, little spectacles glinting, a green wool shawl, a long red
 * dress under a work-worn apron, a hand held out to the gun.
 */
function mrsClaus(step: 0 | 1): Sprite {
	const sprite = new Sprite(16, 22);
	const sway = step === 0 ? -0.5 : 0.5;
	sprite.ellipse(6.5 + sway, 20.6, 1.6, 1, 0, "dark", 0.45);
	sprite.ellipse(9.5 - sway, 20.6, 1.6, 1, 0, "dark", 0.5);
	// Her dress, belling out to her ankles, a fold in it, and her apron.
	sprite.limb(8, 11, 8 + sway * 0.4, 18.6, 3, 5, "red", -0.04);
	sprite.limb(5.6, 13, 4.4 + sway * 0.4, 19, 0.4, 0.5, "red", -0.22);
	sprite.limb(9, 12, 9.4, 18, 1.6, 2.4, "white", 0.14);
	// Her shawl over her shoulders, its fringe, and her hand held out.
	sprite.ellipse(8, 10.6, 4.4, 2.3, 0, "green", 0);

	for (const x of [4.4, 6.2, 8, 9.8, 11.6]) {
		sprite.put(Math.round(x), 13, "green", -0.08);
	}

	sprite.limb(11, 11, 11, 12.8, 0.9, 0.8, "green", 0.04);
	sprite.ellipse(10.8, 13.2, 0.9, 0.8, 0, "skin", 0.02);
	// Her face, her spectacles, her hair and its bun.
	sprite.ellipse(8.4, 6.6, 3.1, 3, 0, "skin", 0);
	sprite.ellipse(7.6, 4.6, 3.4, 2, 0, "porcelain", 0.02);
	sprite.ellipse(6.4, 2.4, 1.6, 1.5, 0, "porcelain", 0.06);
	sprite.put(5, 6, "porcelain", -0.04);
	sprite.put(9, 6, "gold", 0.6);
	sprite.put(11, 6, "gold", 0.6);
	sprite.put(10, 6, "gold", 0.3);
	sprite.put(11, 8, "pink", 0.4);
	sprite.weather(0.12, 5);

	return sprite;
}

/**
 * The snowman: three lumpy balls of old snow, grimy at the bottom, coal eyes and a crooked coal
 * mouth, a carrot nose, a frayed red scarf, forked twig arms, rocking as he goes.
 */
function snowman(step: 0 | 1): Sprite {
	const sprite = new Sprite(16, 22);
	const rock = step === 0 ? -0.5 : 0.5;
	sprite.ellipse(8 + rock * 0.4, 17.4, 5.2, 3.8, 0, "white", -0.02);
	sprite.ellipse(8 + rock * 0.8, 11.4, 4, 3.4, 0, "white", 0.04);
	sprite.ellipse(8 + rock, 6, 3.2, 3, 0, "white", 0.1);
	// Grime and slush round his base.
	sprite.ellipse(8 + rock * 0.4, 20, 4.6, 1.2, 0, "white", -0.22);
	// Twig arms, forked.
	sprite.limb(4.4 + rock, 11, 1.4, 8.6, 0.5, 0.4, "cookie", -0.12);
	sprite.limb(2.4 + rock, 9.4, 2, 7.6, 0.4, 0.3, "cookie", -0.12);
	sprite.limb(11.6 + rock, 11, 14.6, 9.4, 0.5, 0.4, "cookie", -0.06);
	sprite.limb(13.4 + rock, 10, 14.2, 8, 0.4, 0.3, "cookie", -0.06);
	// A red scarf, its frayed end hanging.
	sprite.rect(4.6 + rock, 8.4, 7, 1.2, "red", 0.3);
	sprite.limb(6 + rock, 9, 5 + rock, 12, 0.7, 0.6, "red", 0.2);
	sprite.put(Math.round(4.6 + rock), 12, "red", 0.1);
	sprite.put(Math.round(5.6 + rock), 12, "red", 0.14);
	// Coal eyes, a crooked coal mouth and coal buttons, and a carrot nose.
	sprite.put(Math.round(9 + rock), 5, "coal", 0.1);
	sprite.put(Math.round(11 + rock), 5, "coal", 0.1);

	for (const [x, y] of [
		[8.6, 7.2],
		[9.8, 7.6],
		[11, 7.4],
	]) {
		sprite.put(Math.round(x + rock), Math.round(y), "coal", 0.14);
	}

	sprite.put(Math.round(8 + rock), 11, "coal", 0.15);
	sprite.put(Math.round(8 + rock), 13, "coal", 0.15);
	sprite.put(Math.round(8 + rock * 0.4), 16, "coal", 0.15);
	sprite.limb(10.6 + rock, 6.2, 13.6 + rock, 6.6, 0.6, 0.3, "ember", 0.5);
	sprite.weather(0.16, 7);

	return sprite;
}

/**
 * The reindeer: on four slender legs, jointed, the far pair darker; a dark back, a pale shaggy mane
 * under its neck, a short white tail; antlers branching into tines; dark hooves; a nose that glows red.
 */
function reindeer(step: 0 | 1): Sprite {
	const sprite = new Sprite(20, 22);
	const stride = step === 0 ? 1.4 : -1.4;

	// Legs, the far pair darker, trotting, each bending at the hock or knee, with dark hooves.
	for (const [x, sign, bias] of [
		[6, -1, -0.22],
		[13, 1, -0.22],
		[7, 1, -0.02],
		[14, -1, -0.02],
	]) {
		const foot = x + sign * stride;
		sprite.limb(x, 14.6, x - 0.6 + sign * stride * 0.4, 17.6, 1, 0.7, "cookie", bias);
		sprite.limb(x - 0.6 + sign * stride * 0.4, 17.6, foot, 20.2, 0.7, 0.55, "cookie", bias);
		sprite.put(Math.round(foot - 0.5), 21, "dark", 0.3);
		sprite.put(Math.round(foot + 0.5), 21, "dark", 0.3);
	}

	// The body, darker along its back, the pale belly, a short white tail.
	sprite.ellipse(10, 13.4, 6, 3.4, 0, "cookie", 0.02);
	sprite.limb(5, 11, 14, 10.6, 1, 1, "cookie", -0.14);
	sprite.ellipse(10.4, 15.4, 4, 1.2, 0, "icing", 0.04);
	sprite.ellipse(3.6, 11.6, 1.2, 1, 0, "white", 0.24);
	// Neck with its shaggy pale mane, the head and snout, the antlers' tines, the glowing nose.
	sprite.limb(14, 12, 15.4, 7.6, 1.8, 1.4, "cookie", 0.04);

	for (const [x, y] of [
		[13.6, 13],
		[14.2, 11.6],
		[14.6, 10.4],
	]) {
		sprite.limb(x, y, x - 0.4, y + 1.4, 0.7, 0.3, "icing", 0.06);
	}

	sprite.ellipse(16, 6.6, 2.4, 2, 0, "cookie", 0.08);
	sprite.limb(16.6, 7.4, 18.4, 7.8, 1.2, 0.9, "cookie", 0.06);
	sprite.limb(15.4, 4.8, 14, 1.4, 0.5, 0.4, "horn", 0.2);
	sprite.limb(14.6, 3, 12.4, 2.2, 0.4, 0.3, "horn", 0.16);
	sprite.limb(14.2, 1.8, 13, 0.4, 0.35, 0.25, "horn", 0.14);
	sprite.limb(16.4, 4.8, 17.6, 1.6, 0.5, 0.4, "horn", 0.24);
	sprite.limb(17.2, 2.6, 18.8, 1.8, 0.35, 0.25, "horn", 0.2);
	sprite.put(15, 6, "dark", 0.2);
	sprite.put(19, 7, "glow", 0.9);
	sprite.weather(0.12, 11);

	return sprite;
}

const CAST_DRAWINGS: Record<ICastId, (step: 0 | 1) => Sprite> = { elf, santa, mrsClaus, snowman, reindeer };

/** The candy cane gun: a striped barrel, its stock the cane's crook. */
function gun(): Sprite {
	const sprite = new Sprite(14, 6);
	sprite.limb(3, 2.5, 13, 2.5, 1.4, 1.2, "white", 0.05);

	for (let x = 4; x < 13; x += 3) {
		sprite.limb(x, 1.4, x + 1.4, 3.6, 0.7, 0.7, "red", 0.05);
	}

	// The crook, curling down behind the hand.
	sprite.limb(3, 2.5, 1.2, 3.6, 1.3, 1.2, "red", 0);
	sprite.limb(1.2, 3.6, 1.6, 5.4, 1.2, 1, "white", 0);

	return sprite;
}

/** The Nutcracker's blunderbuss: a wooden stock, a steel barrel flaring at the mouth. */
function blunderbuss(): Sprite {
	const sprite = new Sprite(14, 6);
	sprite.limb(0.6, 3.6, 5, 2.6, 1.3, 1.1, "cookie", 0);
	sprite.limb(5, 2.4, 11, 2.4, 1, 1, "steel", 0.05);
	sprite.limb(11, 2.4, 13, 2.4, 1, 1.9, "steel", 0.12);
	sprite.put(6, 2, "gold", 0.6);

	return sprite;
}

/** The icicle crossbow: a wooden stock, a bow of ice across it, an icicle bolt laid on it. */
function crossbow(): Sprite {
	const sprite = new Sprite(14, 7);
	sprite.limb(1, 3, 10, 3, 1, 0.9, "cookie", 0);
	sprite.limb(10, 0.6, 9, 3, 0.7, 0.8, "frost", 0.1);
	sprite.limb(9, 3, 10, 5.6, 0.8, 0.7, "frost", 0.05);
	sprite.limb(4, 2.4, 13, 2.4, 0.5, 0.4, "glass", 0.3);

	return sprite;
}

/** One of the jingle pistols: a little gold pistol, a bell at its grip. */
function pistols(): Sprite {
	const sprite = new Sprite(14, 6);
	sprite.limb(3, 2.4, 10, 2.4, 1, 0.9, "gold", 0.05);
	sprite.limb(3, 2.4, 2, 5, 1, 0.9, "gold", -0.05);
	sprite.put(1, 5, "gold", 0.8);

	return sprite;
}

/** The Roman candle: a red paper tube banded with gold, sparking at its mouth. */
function romanCandle(): Sprite {
	const sprite = new Sprite(14, 6);
	sprite.limb(1, 2.6, 12, 2.6, 1.4, 1.4, "red", 0.05);

	for (const x of [4, 8]) {
		sprite.limb(x, 1.2, x, 4, 0.5, 0.5, "gold", 0.3);
	}

	sprite.put(13, 2, "glow", 0.9);

	return sprite;
}

/** The snowball cannon: a fat iron barrel, a snowball in its mouth. */
function snowCannon(): Sprite {
	const sprite = new Sprite(14, 7);
	sprite.limb(1, 3.2, 10, 3.2, 1.8, 2.2, "coal", 0.25);
	sprite.ellipse(11.4, 3.2, 1.8, 1.8, 0, "white", 0.2);
	sprite.put(4, 1, "steel", 0.5);

	return sprite;
}

const GUN_DRAWINGS: Record<IGunId, () => Sprite> = { gun, blunderbuss, crossbow, pistols, romanCandle, snowCannon };

/** A tile of night snow, trodden and sooty, to cover the ground: 128 pixels square, seamless. */
function ground(): HTMLCanvasElement {
	const size = 128;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext("2d")!;
	const snow = ["#07080c", "#0c0f16", "#121722", "#1a2130", "#232c3c", "#2e3a4c"];
	// Wraps round at the tile's edges, so the noise tiles.
	const wrapped = (x: number, y: number, scale: number) => {
		const u = (x / size) * Math.PI * 2;
		const v = (y / size) * Math.PI * 2;

		return fbm(Math.cos(u) * scale + 10, Math.sin(u) * scale + Math.cos(v) * scale + Math.sin(v) * scale);
	};

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const drift = wrapped(x, y, 1.6);
			const soot = wrapped(x + 37, y + 11, 3.2);
			const t = 0.35 + drift * 0.35 - (soot > 0.62 ? 0.25 : 0) + (hash(x, y) - 0.5) * 0.08;
			context.fillStyle = shade(x, y, t, snow);
			context.fillRect(x, y, 1, 1);
		}
	}

	return canvas;
}

/** Fog: soft, uneven, seamless, white with transparency, to drift over everything. */
function fog(): HTMLCanvasElement {
	const size = 256;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext("2d")!;
	const image = context.createImageData(size, size);

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const u = (x / size) * Math.PI * 2;
			const v = (y / size) * Math.PI * 2;
			const n = fbm(Math.cos(u) * 1.3 + Math.sin(v) * 1.3 + 5, Math.sin(u) * 1.3 + Math.cos(v) * 1.3 + 9);
			// Dithered into a few steps of see-through, so it stays pixel art.
			const level = Math.floor(Math.max(0, n - 0.42) * 6 + threshold(x, y));
			const i = (y * size + x) * 4;
			image.data[i] = 150;
			image.data[i + 1] = 170;
			image.data[i + 2] = 185;
			image.data[i + 3] = Math.min(3, level) * 26;
		}
	}

	context.putImageData(image, 0, 0);

	return canvas;
}

/** A candle burning half buried in the snow. */
function candle(): HTMLCanvasElement {
	const sprite = new Sprite(5, 9);
	sprite.rect(1, 4, 3, 5, "white", 0.5);
	sprite.put(2, 3, "dark", 0.2);
	sprite.put(2, 2, "gold", 0.9);
	sprite.put(2, 1, "glow", 0.9);
	sprite.put(1, 2, "glow", 0.4);

	return sprite.render(RAMPS, RIMS, OUTLINE, 1, 0);
}

/** A burnt stump, black and cracked. */
function stump(): HTMLCanvasElement {
	const sprite = new Sprite(14, 10);
	sprite.ellipse(7, 6, 5.5, 3.8, 0, "dark", 0.4);
	sprite.ellipse(7, 3.4, 4.6, 1.8, 0, "cookie", -0.25);
	sprite.limb(2, 8, 0.5, 9.5, 1, 0.6, "dark", 0.3);
	sprite.limb(12, 8, 13.5, 9.5, 1, 0.6, "dark", 0.3);

	return sprite.render(RAMPS, RIMS, OUTLINE, 1, 0);
}

export function makeSprites(): ISprites {
	const cast = Object.fromEntries(
		Object.entries(CAST_DRAWINGS).map(([id, draw]) => {
			const right = [draw(0), draw(1)].map((sprite) => sprite.render(RAMPS, RIMS, OUTLINE, 1, 0.6));

			return [id, { right, left: right.map(flipped) }];
		}),
	) as ISprites["cast"];

	return {
		cast,
		guns: Object.fromEntries(
			Object.entries(GUN_DRAWINGS).map(([id, draw]) => [id, draw().render(RAMPS, RIMS, OUTLINE, 1, 0.6)]),
		) as ISprites["guns"],
		characters: makeCharacters(),
		ground: ground(),
		fog: fog(),
		candle: candle(),
		stump: stump(),
	};
}
