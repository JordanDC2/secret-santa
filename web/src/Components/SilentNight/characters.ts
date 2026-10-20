/**
 * Everyone and everything on the night's snow besides the elf, drawn once by code in La Flor's
 * style (pixelArt.ts, palette.ts): Krampus's horde and its bosses (two steps of a walk each,
 * facing either way, a white flash for the moment they're hit, and elites drawn half as big
 * again), the elf's allies, the pickups, and the patrons' shrines and Krampus's altar. Each
 * enemy's glowing eyes are listed too, to be drawn over the dark.
 */

import { RAMPS, RIMS, OUTLINE } from "Components/SilentNight/palette";
import { flipped, Sprite } from "Components/SilentNight/pixelArt";
import type { IEnemyKind } from "Components/SilentNight/types";

/** Draws shapes at a scale (1 for life size, 1.5 for an elite), in life-size coordinates. */
export class Pen {
	readonly sprite: Sprite;
	readonly s: number;

	constructor(width: number, height: number, s: number) {
		this.s = s;
		this.sprite = new Sprite(Math.ceil(width * s), Math.ceil(height * s));
	}

	e(cx: number, cy: number, rx: number, ry: number, rot: number, material: string, bias = 0) {
		this.sprite.ellipse(cx * this.s, cy * this.s, rx * this.s, ry * this.s, rot, material, bias);
	}

	l(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number, material: string, bias = 0) {
		this.sprite.limb(x1 * this.s, y1 * this.s, x2 * this.s, y2 * this.s, r1 * this.s, r2 * this.s, material, bias);
	}

	/** A dot: one pixel at life size, a block when scaled up. */
	d(x: number, y: number, material: string, t: number) {
		const size = Math.max(1, Math.round(this.s));

		for (let oy = 0; oy < size; oy++) {
			for (let ox = 0; ox < size; ox++) {
				this.sprite.put(Math.floor(x * this.s) + ox, Math.floor(y * this.s) + oy, material, t);
			}
		}
	}

	x(x: number, y: number) {
		const size = Math.max(1, Math.round(this.s));

		for (let oy = 0; oy < size; oy++) {
			for (let ox = 0; ox < size; ox++) {
				this.sprite.erase(Math.floor(x * this.s) + ox, Math.floor(y * this.s) + oy);
			}
		}
	}

	r(x: number, y: number, width: number, height: number, material: string, t: number) {
		this.sprite.rect(
			Math.floor(x * this.s),
			Math.floor(y * this.s),
			Math.ceil(width * this.s),
			Math.ceil(height * this.s),
			material,
			t,
		);
	}
}

type IArt = {
	width: number;
	height: number;
	/** Where it stands (its feet, or the point below it as it floats). */
	feet: { x: number; y: number };
	/** Its eyes, glowing (facing right), and their colour, or none. */
	eyes: Array<[number, number]>;
	eyeColour: string | null;
	/** Floats above the snow by this much, bobbing. */
	floats?: number;
	draw: (pen: Pen, step: 0 | 1) => void;
};

const ARTS: Record<IEnemyKind, IArt> = {
	gingerbread: {
		width: 14,
		height: 17,
		feet: { x: 7, y: 16 },
		eyes: [
			[8, 4],
			[10, 4],
		],
		eyeColour: "#ff3b2a",
		draw(p, step) {
			const spread = step === 0 ? 2.4 : 0.8;
			p.l(6, 11, 6 - spread, 15.5, 1.8, 1.5, "cookie", -0.08);
			p.l(8, 11, 8 + spread, 15.5, 1.8, 1.5, "cookie", -0.02);
			p.e(7, 9.5, 3.6, 3.8, 0, "cookie", 0);
			p.l(9.5, 8.5, 12.8, 7 + (step === 0 ? 0 : 1.2), 1.5, 1.2, "cookie", 0);
			p.l(4.5, 8.5, 1.6, 10 - (step === 0 ? 1 : 0), 1.5, 1.2, "cookie", -0.1);
			p.e(7, 4.5, 3.4, 3.3, 0, "cookie", 0.04);

			// A bite out of its head.
			for (const [x, y] of [
				[4, 2],
				[4, 3],
				[5, 1],
				[3, 3],
			]) {
				p.x(x, y);
			}

			for (const [x, y] of [
				[11, 7],
				[12, 7],
				[2, 9],
				[3, 9],
				[4, 14],
				[9, 14],
			]) {
				p.d(x, y, "icing", 0.5);
			}

			p.d(7, 8, "red", 0.5);
			p.d(7, 10, "red", 0.4);
			p.d(7, 6, "icing", 0.4);
			p.d(8, 6, "dark", 0.2);
			p.d(9, 6, "icing", 0.4);
			p.d(8, 4, "glow", 0.7);
			p.d(10, 4, "glow", 0.7);
		},
	},
	windup: {
		width: 14,
		height: 19,
		feet: { x: 7, y: 18 },
		eyes: [],
		eyeColour: null,
		draw(p, step) {
			const spread = step === 0 ? 1.8 : 0.5;
			p.l(6, 13, 6 - spread, 17.5, 1.2, 1.1, "cloth", -0.05);
			p.l(8, 13, 8 + spread, 17.5, 1.2, 1.1, "cloth", 0);
			p.e(6 - spread, 18, 1.5, 0.8, 0, "dark", 0.4);
			p.e(8 + spread, 18, 1.5, 0.8, 0, "dark", 0.4);
			// The wind-up key in its back.
			p.l(3.5, 9.5, 1.4, 9.5, 0.6, 0.6, "gold", 0.1);
			p.e(0.9, 9.5, 0.9, 1.6, 0, "gold", 0.05);
			// The red coat, its white crossbelt and gold buttons.
			p.e(7, 10.5, 3.4, 3.6, 0, "red", 0);

			for (const [x, y] of [
				[5, 8],
				[6, 9],
				[7, 10],
				[8, 11],
				[9, 12],
			]) {
				p.d(x, y, "white", 0.55);
			}

			p.d(7, 9, "gold", 0.8);
			p.d(7, 12, "gold", 0.7);
			// One arm, jerking; the other snapped off at the shoulder.
			p.l(9.5, 9, 12, 11 + (step === 0 ? 0 : 1.5), 1, 0.9, "red", 0.05);
			p.e(4.4, 8.6, 1, 1, 0, "porcelain", -0.15);
			// The porcelain face, cracked, under a tall shako with a gold band.
			p.e(7.4, 5.2, 2.6, 2.6, 0, "porcelain", 0.05);
			p.d(6, 4, "dark", 0.15);
			p.d(6, 5, "dark", 0.15);
			p.d(5, 6, "dark", 0.15);
			p.d(9, 5, "dark", 0.1);
			p.d(9, 7, "red", 0.4);
			p.l(7.4, 2.8, 7.4, 0.4, 2.3, 2.1, "dark", 0.3);
			p.r(5, 2, 5, 1, "gold", 0.6);
		},
	},
	golem: {
		width: 20,
		height: 22,
		feet: { x: 10, y: 21 },
		eyes: [
			[11, 6],
			[13, 6],
		],
		eyeColour: "#ff8a3a",
		draw(p, step) {
			const swing = step === 0 ? 0 : 1.5;
			p.e(7, 19.5, 2.6, 2.2, 0, "coal", 0);
			p.e(13, 19.5, 2.6, 2.2, 0, "coal", 0.02);
			p.l(3.5, 11, 2 - swing * 0.3, 17 - swing, 2.3, 2.1, "coal", -0.05);
			p.l(16.5, 11, 18 + swing * 0.3, 17 + swing - 1.5, 2.3, 2.1, "coal", 0);
			p.e(10, 13.5, 7, 6.5, 0, "coal", 0);
			p.e(4.5, 10, 3, 3.4, 0, "coal", 0.02);
			p.e(15.5, 10, 3, 3.4, 0, "coal", 0.04);
			p.e(11, 6.5, 4.6, 4.2, 0, "coal", 0.06);

			// Embers glowing in its cracks, and its eyes.
			for (const [x, y] of [
				[9, 9],
				[10, 10],
				[10, 11],
				[11, 12],
				[10, 13],
				[10, 14],
				[14, 8],
				[15, 9],
				[6, 13],
				[5, 14],
				[5, 15],
			]) {
				p.d(x, y, "ember", 0.5);
			}

			p.d(11, 6, "ember", 0.9);
			p.d(13, 6, "ember", 0.9);
		},
	},
	caroller: {
		width: 14,
		height: 20,
		feet: { x: 7, y: 19 },
		eyes: [],
		eyeColour: null,
		draw(p, step) {
			const sway = step === 0 ? 0 : 0.6;
			p.e(7 + sway, 12, 4.2, 6.5, 0, "cloth", 0);

			for (const [x, end] of [
				[4.2, 3.6],
				[7, 7],
				[9.8, 10.4],
			]) {
				p.l(x + sway, 16.5, end + sway, 19.4, 1.1, 0.4, "cloth", -0.08);
			}

			p.e(7 + sway, 5.6, 3.7, 3.9, 0, "cloth", 0.06);
			p.e(8 + sway, 6.6, 2, 2.4, 0, "porcelain", -0.15);
			// Hollow eyes and a mouth open in a wail.
			p.d(7 + sway, 5.6, "dark", 0.1);
			p.d(9 + sway, 5.6, "dark", 0.1);
			p.d(8 + sway, 7.6, "dark", 0);
			p.d(8 + sway, 8.4, "dark", 0.05);
			// The songbook, and the pale hands holding it.
			p.e(10.4 + sway, 11, 2, 1.4, 0.3, "porcelain", 0.15);
			p.d(9 + sway, 11.5, "porcelain", 0.3);
		},
	},
	angel: {
		width: 16,
		height: 19,
		feet: { x: 8, y: 18 },
		eyes: [[9, 5]],
		eyeColour: "#cfe8ff",
		floats: 3,
		draw(p, step) {
			const lift = step === 0 ? 0 : 1;
			// Wings behind, swept up from the shoulders to points, grey so the body reads in front, beating as it floats.
			p.l(6, 10, 1.5, 4 + lift * 2, 2.4, 0.9, "icing", -0.25);
			p.l(10, 10, 14.5, 4 + lift * 2, 2.4, 0.9, "icing", -0.32);
			p.l(5.5, 11, 2, 9 + lift, 1.4, 0.7, "icing", -0.3);
			p.l(10.5, 11, 14, 9 + lift, 1.4, 0.7, "icing", -0.36);
			// A robe, narrow at the shoulders and flaring to a chipped hem.
			p.l(8, 8.5, 8, 17, 2, 3.8, "porcelain", 0.1);
			p.x(5, 17);
			p.x(10, 17);
			// Hands together in prayer.
			p.l(6.4, 10, 8, 12, 0.9, 0.8, "porcelain", 0.22);
			p.l(9.6, 10, 8, 12, 0.9, 0.8, "porcelain", 0.16);
			p.e(8, 5.2, 2.3, 2.5, 0, "porcelain", 0.15);

			// The halo, tilted and chipped.
			for (const [x, y] of [
				[6, 1],
				[7, 1],
				[8, 1],
				[9, 1],
				[5, 2],
				[10, 2],
			]) {
				p.d(x, y, "gold", 0.7);
			}

			// Cracks through the porcelain: across the face, down the robe, through a wing.
			for (const [x, y] of [
				[7, 4],
				[7, 5],
				[8, 6],
				[9, 13],
				[10, 14],
				[9, 15],
			]) {
				p.d(x, y, "dark", 0.15);
			}

			// One eye painted shut; the other chipped open, glowing.
			p.d(7, 5.4, "fur", 0.3);
			p.d(9, 5, "frost", 0.9);
		},
	},
	imp: {
		width: 12,
		height: 13,
		feet: { x: 6, y: 12 },
		eyes: [[8, 4]],
		eyeColour: "#ffc030",
		draw(p, step) {
			const spread = step === 0 ? 1.4 : 0.3;
			p.l(2.6, 9, 0.6, 5.6, 0.6, 0.4, "impSkin", -0.05);
			p.d(0, 5, "impSkin", 0.4);
			p.l(5, 9.6, 4 - spread, 12.4, 1, 0.8, "impSkin", -0.05);
			p.l(7, 9.6, 8 + spread, 12.4, 1, 0.8, "impSkin", 0);
			p.e(6, 8, 3.6, 3.2, 0, "impSkin", 0);
			p.l(8.6, 7, 11.2, 6.4 + spread * 0.6, 0.9, 0.6, "impSkin", 0.05);
			p.e(7, 4.5, 2.6, 2.4, 0, "impSkin", 0.05);
			p.l(5.6, 3, 4, 0.4, 0.8, 0.3, "horn", 0.1);
			p.l(8.4, 3, 10, 0.4, 0.8, 0.3, "horn", 0.15);
			p.d(8, 4, "yellowGlow", 0.8);
			p.d(9, 6, "white", 0.6);
		},
	},
	rat: {
		width: 11,
		height: 7,
		feet: { x: 5, y: 6 },
		eyes: [[10, 3]],
		eyeColour: "#ff3b2a",
		draw(p, step) {
			p.l(1.8, 4.5, 0, 2.6 + (step === 0 ? 0 : 1.4), 0.5, 0.3, "pink", 0);
			p.e(5.4, 4, 3.8, 2.4, 0, "fur", 0);
			p.e(9, 3.8, 2, 1.7, 0.2, "fur", 0.06);
			p.e(8, 2.2, 0.9, 0.9, 0, "pink", 0.1);
			p.d(step === 0 ? 4 : 3, 6, "dark", 0.3);
			p.d(step === 0 ? 7 : 8, 6, "dark", 0.3);
			p.d(10, 3, "glow", 0.8);
		},
	},
	mouseKing: {
		width: 28,
		height: 30,
		feet: { x: 14, y: 29 },
		eyes: [[20, 8]],
		eyeColour: "#ff3b2a",
		draw(p, step) {
			const spread = step === 0 ? 1.6 : 0.4;
			// His tail, and his red cape behind him.
			p.l(8, 24, 2, 20, 1, 0.7, "pink", -0.05);
			p.l(2, 20, 1, 14, 0.7, 0.4, "pink", -0.05);
			p.e(12.5, 17, 8, 10.5, 0, "red", -0.12);
			p.l(11, 24, 10 - spread, 28.6, 2, 1.8, "fur", -0.05);
			p.l(17, 24, 18 + spread, 28.6, 2, 1.8, "fur", 0);
			p.e(14, 18, 6.5, 7.5, 0, "fur", 0);
			// His sword arm.
			p.l(19, 15, 23, 17, 1.6, 1.4, "fur", 0.05);
			p.l(23, 17, 27, 7, 0.7, 0.5, "steel", 0.15);
			p.d(23, 16, "gold", 0.8);
			p.d(22, 17, "gold", 0.7);
			// His head: long snout, big ears, a crown.
			p.e(17, 9, 5, 4.2, 0.15, "fur", 0.05);
			p.l(20, 10, 25, 11, 2.4, 1, "fur", 0.06);
			p.d(25, 11, "pink", 0.7);
			p.e(14, 5, 2.4, 2.4, 0, "pink", 0.05);
			p.e(19.4, 4.4, 2.2, 2.2, 0, "pink", 0.1);
			p.r(14, 3, 7, 1, "gold", 0.6);
			p.l(14.5, 3, 14, 0.6, 0.8, 0.3, "gold", 0.3);
			p.l(17.2, 3, 17.2, 0, 0.8, 0.3, "gold", 0.35);
			p.l(20, 3, 20.6, 0.6, 0.8, 0.3, "gold", 0.4);
			p.d(17, 2, "red", 0.7);
			p.d(20, 8, "glow", 0.8);
			p.d(22, 13, "white", 0.6);
		},
	},
	ghost: {
		width: 26,
		height: 38,
		feet: { x: 13, y: 37 },
		eyes: [
			[13, 8],
			[16, 8],
		],
		eyeColour: "#d8e8ff",
		floats: 2,
		draw(p, step) {
			const sway = step === 0 ? 0 : 1;
			p.l(13, 9, 13, 33, 6, 9, "blackFur", 0);

			for (const [x, end] of [
				[7, 5],
				[13, 13],
				[19, 21],
			]) {
				p.l(x, 32, end + sway, 37.4, 1.8, 0.4, "blackFur", -0.06);
			}

			p.e(13, 8.5, 6.6, 7, 0, "blackFur", 0.05);
			p.e(14, 9.4, 3.8, 4.4, 0, "dark", 0.05);
			// A skeletal hand, pointing.
			p.l(17, 15, 24, 13, 1.9, 1.1, "blackFur", 0.05);
			p.d(24, 13, "porcelain", 0.5);
			p.d(25, 12, "porcelain", 0.6);
			p.d(25, 13, "porcelain", 0.4);
			p.d(13, 8, "frost", 0.6);
			p.d(16, 8, "frost", 0.6);
		},
	},
	yuleCat: {
		width: 40,
		height: 30,
		feet: { x: 20, y: 29 },
		eyes: [
			[34, 9],
			[36, 9],
		],
		eyeColour: "#ffd040",
		draw(p, step) {
			const spread = step === 0 ? 1.6 : 0;
			p.l(4, 14, 1, 5, 1.6, 1.2, "blackFur", -0.05);
			p.l(1, 5, 4, 1, 1.2, 0.8, "blackFur", 0);
			p.l(10, 21, 9 - spread, 28.6, 2.2, 1.8, "blackFur", -0.06);
			p.l(14, 21, 15 + spread, 28.6, 2.2, 1.8, "blackFur", -0.02);
			p.l(25, 20, 24 - spread, 28.6, 2, 1.7, "blackFur", -0.04);
			p.l(28, 20, 29 + spread, 28.6, 2, 1.7, "blackFur", 0);
			p.e(9, 17, 6, 7, 0, "blackFur", 0);
			p.e(18, 17, 12, 6.5, 0, "blackFur", 0.02);
			p.e(27, 15.6, 6, 6.5, 0, "blackFur", 0.05);
			p.e(33, 10, 5.6, 5, 0, "blackFur", 0.08);
			p.l(30, 6, 29, 1.5, 1.8, 0.4, "blackFur", 0.05);
			p.l(35.4, 6, 36.6, 1.5, 1.8, 0.4, "blackFur", 0.1);
			p.d(34, 9, "yellowGlow", 0.8);
			p.d(36, 9, "yellowGlow", 0.8);
			p.d(37, 13, "white", 0.6);
			p.d(35, 13, "white", 0.5);
		},
	},
	krampus: {
		width: 36,
		height: 46,
		feet: { x: 18, y: 45 },
		eyes: [
			[18, 11],
			[22, 11],
		],
		eyeColour: "#ff3b2a",
		draw(p, step) {
			const stride = step === 0 ? 1 : -0.6;
			// Goat legs and hooves.
			p.e(14, 32, 4, 5, 0, "blackFur", -0.04);
			p.e(22, 32, 4, 5, 0, "blackFur", 0);
			p.l(13, 36, 12 - stride, 43, 2.2, 1.4, "blackFur", -0.04);
			p.l(23, 36, 24 + stride, 43, 2.2, 1.4, "blackFur", 0);
			p.e(12 - stride, 44.2, 1.6, 1, 0, "horn", 0.1);
			p.e(24 + stride, 44.2, 1.6, 1, 0, "horn", 0.15);
			// The birch rod in one hand.
			p.l(11, 20, 6, 30, 2.4, 2, "blackFur", -0.02);
			p.l(6, 30, 3, 42, 1.4, 1, "birch", 0.05);
			p.l(5, 31, 1, 40, 0.5, 0.4, "birch", 0);
			p.l(7, 31, 6, 42, 0.5, 0.4, "birch", 0.1);
			// His shaggy body, chains slung across it.
			p.e(18, 24, 8, 9.5, 0, "blackFur", 0.05);

			for (let i = 0; i < 8; i++) {
				p.d(11 + i * 2, 18 + i * 1.6, "steel", i % 2 === 0 ? 0.6 : 0.4);
			}

			// The other arm, raised, a chain hanging from it.
			p.l(25, 20, 31, 15, 2.4, 2, "blackFur", 0.04);

			for (let i = 0; i < 6; i++) {
				p.d(31 + (i % 2), 16 + i * 2, "steel", 0.5);
			}

			// His head: horns, a long red tongue, fangs.
			p.e(19, 12, 5, 5.6, 0, "blackFur", 0.08);
			p.e(21, 14, 3, 2.4, 0, "impSkin", -0.1);
			p.l(21.4, 16, 22.4, 22, 1, 0.6, "red", 0.1);
			p.d(20, 16, "white", 0.6);
			p.d(23, 16, "white", 0.6);
			p.l(16, 8, 11, 3, 1.6, 1, "horn", 0.05);
			p.l(11, 3, 9, 0, 1, 0.5, "horn", 0.1);
			p.l(22, 8, 27, 3, 1.6, 1, "horn", 0.1);
			p.l(27, 3, 29, 0, 1, 0.5, "horn", 0.15);
			p.d(18, 11, "glow", 0.8);
			p.d(22, 11, "glow", 0.8);
		},
	},
};

export type IEnemyArt = {
	right: HTMLCanvasElement[];
	left: HTMLCanvasElement[];
	flash: { right: HTMLCanvasElement; left: HTMLCanvasElement };
	/** Frost over it, while it's frozen; a gold glow behind it, for an elite. */
	ice: { right: HTMLCanvasElement; left: HTMLCanvasElement };
	aura: { right: HTMLCanvasElement; left: HTMLCanvasElement };
	feet: { x: number; y: number };
	eyes: Array<[number, number]>;
	eyeColour: string | null;
	floats: number;
	width: number;
};

/** The same sprite in a flat, bright colour: for the moment it's hit. */
export function flatOf(source: HTMLCanvasElement, colour = "#fff4e8"): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = source.width;
	canvas.height = source.height;
	const context = canvas.getContext("2d")!;
	context.drawImage(source, 0, 0);
	context.globalCompositeOperation = "source-in";
	context.fillStyle = colour;
	context.fillRect(0, 0, canvas.width, canvas.height);

	return canvas;
}

function makeArt(art: IArt, scale: number): IEnemyArt {
	const right = ([0, 1] as const).map((step) => {
		const pen = new Pen(art.width, art.height, scale);
		art.draw(pen, step);

		return pen.sprite.render(RAMPS, RIMS, OUTLINE, 1);
	});
	const flash = flatOf(right[0]);
	const ice = flatOf(right[0], "#9ad8ff");
	const aura = flatOf(right[0], "#ffd060");

	return {
		right,
		left: right.map(flipped),
		flash: { right: flash, left: flipped(flash) },
		ice: { right: ice, left: flipped(ice) },
		aura: { right: aura, left: flipped(aura) },
		feet: { x: Math.round(art.feet.x * scale), y: Math.round(art.feet.y * scale) },
		eyes: art.eyes.map(([x, y]) => [Math.floor(x * scale), Math.floor(y * scale)]),
		eyeColour: art.eyeColour,
		floats: (art.floats ?? 0) * scale,
		width: right[0].width,
	};
}

export type ICharacterSprites = {
	enemies: Record<IEnemyKind, IEnemyArt>;
	elites: Partial<Record<IEnemyKind, IEnemyArt>>;
	minion: { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] };
	globe: HTMLCanvasElement;
	flame: HTMLCanvasElement;
	crystal: HTMLCanvasElement;
	bigCrystal: HTMLCanvasElement;
	cocoa: HTMLCanvasElement;
	star: HTMLCanvasElement;
	chest: HTMLCanvasElement;
	shrine: HTMLCanvasElement;
	altar: HTMLCanvasElement;
};

const BOSSES = new Set<IEnemyKind>(["mouseKing", "ghost", "yuleCat", "krampus"]);

/** A friendly gingerbread minion: lighter, smiling, a green scarf, no glowing eyes, no bite out of it. */
function minion(step: 0 | 1): HTMLCanvasElement {
	const p = new Pen(14, 17, 1);
	const spread = step === 0 ? 2.4 : 0.8;
	p.l(6, 11, 6 - spread, 15.5, 1.8, 1.5, "cookie", 0.02);
	p.l(8, 11, 8 + spread, 15.5, 1.8, 1.5, "cookie", 0.08);
	p.e(7, 9.5, 3.6, 3.8, 0, "cookie", 0.1);
	p.l(9.5, 8.5, 12, 10, 1.5, 1.2, "cookie", 0.1);
	p.l(4.5, 8.5, 2, 10, 1.5, 1.2, "cookie", 0);
	p.e(7, 4.5, 3.4, 3.3, 0, "cookie", 0.14);
	p.r(4, 7, 7, 1, "green", 0.5);
	p.d(10, 8, "green", 0.4);
	p.d(10, 9, "green", 0.35);
	p.d(8, 4, "dark", 0.2);
	p.d(10, 4, "dark", 0.2);
	p.d(8, 6, "icing", 0.6);
	p.d(9, 6, "icing", 0.6);
	p.d(10, 6, "icing", 0.6);
	p.d(7, 10, "red", 0.5);
	p.d(7, 12, "green", 0.5);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

function small(width: number, height: number, draw: (pen: Pen) => void, rim = 1): HTMLCanvasElement {
	const pen = new Pen(width, height, 1);
	draw(pen);

	return pen.sprite.render(RAMPS, RIMS, OUTLINE, 1, rim);
}

export function makeCharacters(): ICharacterSprites {
	const enemies = Object.fromEntries(Object.entries(ARTS).map(([kind, art]) => [kind, makeArt(art, 1)])) as Record<
		IEnemyKind,
		IEnemyArt
	>;
	const elites: Partial<Record<IEnemyKind, IEnemyArt>> = {};

	for (const [kind, art] of Object.entries(ARTS) as Array<[IEnemyKind, IArt]>) {
		if (!BOSSES.has(kind)) {
			elites[kind] = makeArt(art, 1.5);
		}
	}

	const minionRight = [minion(0), minion(1)];

	return {
		enemies,
		elites,
		minion: { right: minionRight, left: minionRight.map(flipped) },
		globe: small(9, 11, (p) => {
			p.e(4.5, 4.6, 4, 4, 0, "glass", 0.1);
			p.d(4, 3, "green", 0.5);
			p.d(3, 4, "green", 0.4);
			p.d(4, 4, "green", 0.5);
			p.d(5, 4, "green", 0.4);
			p.d(4, 5, "cookie", 0.3);
			p.d(2, 2, "white", 0.9);
			p.d(6, 3, "white", 0.8);
			p.d(3, 6, "white", 0.8);
			p.r(1.5, 8, 6, 2, "gold", 0.55);
		}),
		flame: small(
			5,
			8,
			(p) => {
				p.e(2.5, 5, 1.6, 2.4, 0, "ember", 0.5);
				p.d(2, 2, "yellowGlow", 0.8);
				p.d(2, 5, "yellowGlow", 0.9);
			},
			0,
		),
		// Crystals of frost: small blue gems with a glint, lit only a little at the rim so they stay blue.
		crystal: small(
			5,
			7,
			(p) => {
				p.e(2.5, 3.5, 1.6, 2.8, 0, "frost", -0.05);
				p.d(2, 2, "frost", 0.95);
			},
			0.3,
		),
		bigCrystal: small(
			8,
			10,
			(p) => {
				p.e(3.5, 5, 2.4, 4, 0, "frost", -0.05);
				p.e(5.8, 6.6, 1.4, 2.5, 0.4, "frost", -0.15);
				p.d(3, 3, "frost", 0.95);
			},
			0.3,
		),
		cocoa: small(8, 8, (p) => {
			p.r(1, 3, 5, 5, "red", 0.5);
			p.r(1, 3, 5, 1, "cookie", 0.45);
			p.d(6, 4, "red", 0.45);
			p.d(7, 5, "red", 0.4);
			p.d(6, 6, "red", 0.45);
			p.d(3, 2, "white", 0.8);
		}),
		star: small(9, 9, (p) => {
			for (let i = 0; i < 5; i++) {
				const angle = -Math.PI / 2 + (i / 5) * Math.PI * 2;
				p.l(4.5, 4.5, 4.5 + Math.cos(angle) * 4.2, 4.5 + Math.sin(angle) * 4.2, 1.6, 0.3, "gold", 0.35);
			}
		}),
		chest: small(12, 11, (p) => {
			p.r(1, 3, 10, 8, "red", 0.42);
			p.r(0, 2, 12, 3, "red", 0.55);
			p.r(5, 2, 2, 9, "gold", 0.6);
			p.r(0, 6, 12, 1, "gold", 0.5);
			p.e(4.4, 1.2, 1.6, 1.1, -0.4, "gold", 0.2);
			p.e(7.6, 1.2, 1.6, 1.1, 0.4, "gold", 0.3);
		}),
		shrine: small(16, 24, (p) => {
			p.r(2, 21, 12, 3, "stone", 0.3);
			p.l(8, 10, 8, 21, 4, 4.6, "stone", 0);
			p.e(8, 7, 5, 5, 0, "stone", 0.1);
			p.e(8, 7.6, 2.6, 3, 0, "dark", 0.2);
			p.d(3, 20, "white", 0.6);
			p.d(13, 20, "white", 0.6);
			p.d(3, 19, "yellowGlow", 0.9);
			p.d(13, 19, "yellowGlow", 0.9);
		}),
		altar: small(18, 20, (p) => {
			p.l(2, 8, 0, 3, 1.2, 0.5, "horn", 0.1);
			p.l(16, 8, 18, 3, 1.2, 0.5, "horn", 0.15);
			p.r(1, 9, 16, 9, "coal", 0.35);
			p.l(1, 9, 17, 9, 1.6, 1.6, "coal", 0.2);

			for (let i = 0; i < 7; i++) {
				p.d(2 + i * 2, 13 + (i % 2), "steel", 0.5);
			}

			p.d(5, 7, "red", 0.5);
			p.d(13, 7, "red", 0.5);
			p.d(5, 6, "glow", 0.9);
			p.d(13, 6, "glow", 0.9);
		}),
	};
}
