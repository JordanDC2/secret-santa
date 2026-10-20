/**
 * Silent Night's sprites, drawn once by code (pixelArt.ts) in La Flor's style: moody ramps,
 * candlelit rims on the side facing the light, a dark outline on the rest. Here: the elf and its
 * gun, the snowy ground, the fog, candles and stumps; everyone and
 * everything else is in characters.ts.
 */

import { fbm, flipped, hash, shade, Sprite, threshold } from "Components/SilentNight/pixelArt";

import { makeCharacters, type ICharacterSprites } from "Components/SilentNight/characters";
import { OUTLINE, RAMPS, RIMS } from "Components/SilentNight/palette";

export type ISprites = {
	/** The elf, facing right and left, in two steps of its walk. */
	elf: { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] };
	/** The candy cane gun, pointing right, held at (gunGrip.x, gunGrip.y). */
	gun: HTMLCanvasElement;
	characters: ICharacterSprites;
	ground: HTMLCanvasElement;
	fog: HTMLCanvasElement;
	candle: HTMLCanvasElement;
	stump: HTMLCanvasElement;
};

/** Where the elf's feet are on its sprite, and where its hand holds the gun. */
export const ELF_FEET = { x: 8, y: 21 };
export const GUN_GRIP = { x: 3, y: 2 };
/** The rings of light's radii (the elf's and a candle's), in the game's pixels. */
export const LIGHT_RADIUS = 72;
export const CANDLE_LIGHT_RADIUS = 24;

/** The elf: green tunic and gold belt, red pointed hat with a white bobble, pointed ears. */
function elf(step: 0 | 1): Sprite {
	const sprite = new Sprite(16, 22);
	// Legs, apart or together as it walks, and its boots.
	const spread = step === 0 ? 2 : 0.6;
	sprite.limb(7, 15, 7 - spread, 20, 1.3, 1.2, "green", -0.12);
	sprite.limb(9, 15, 9 + spread, 20, 1.3, 1.2, "green", -0.06);
	sprite.ellipse(6.5 - spread, 20.6, 1.9, 1, 0, "dark", 0.5);
	sprite.ellipse(9.5 + spread, 20.6, 1.9, 1, 0, "dark", 0.5);
	// Tunic, with its jagged hem, and the belt.
	sprite.ellipse(8, 12.5, 4, 4.4, 0, "green", 0);

	for (const x of [4.6, 7, 9.4, 11.4]) {
		sprite.limb(x, 15, x + 0.4, 16.6, 1.2, 0.4, "green", -0.05);
	}

	sprite.rect(4, 13, 8, 1, "gold", 0.55);
	sprite.put(8, 13, "gold", 0.95);
	// Head, ears, hat and bobble.
	sprite.ellipse(8, 6.5, 3.4, 3.2, 0, "skin", 0.02);
	sprite.limb(4.8, 6, 3, 4.6, 0.9, 0.3, "skin", 0);
	sprite.limb(11.2, 6, 13, 4.6, 0.9, 0.3, "skin", -0.05);
	sprite.limb(8, 3.6, 11.5, 0.4, 3.2, 0.5, "red", 0);
	sprite.rect(4.6, 3.2, 7, 1, "white", 0.5);
	sprite.ellipse(12.6, 0.9, 1.2, 1.1, 0, "white", 0.2);
	// Eyes, looking ahead.
	sprite.put(9, 6, "dark", 0.2);
	sprite.put(11, 6, "dark", 0.2);

	return sprite;
}

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
	const elfRight = [elf(0), elf(1)].map((sprite) => sprite.render(RAMPS, RIMS, OUTLINE, 1, 0.6));

	return {
		elf: { right: elfRight, left: elfRight.map(flipped) },
		gun: gun().render(RAMPS, RIMS, OUTLINE, 1, 0.6),
		characters: makeCharacters(),
		ground: ground(),
		fog: fog(),
		candle: candle(),
		stump: stump(),
	};
}
