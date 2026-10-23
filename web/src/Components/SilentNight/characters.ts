/**
 * Everyone and everything on the night's snow besides the elf, drawn once by code in La Flor's
 * style (pixelArt.ts, palette.ts): Krampus's horde and its bosses (two steps of a walk each,
 * facing either way, a white flash for the moment they're hit, and elites drawn half as big
 * again), the elf's allies, the pickups, and the patrons' shrines and Krampus's altar. Each
 * enemy's glowing eyes are listed too, to be drawn over the dark.
 */

import { RAMPS, RIMS, OUTLINE } from "Components/SilentNight/palette";
import { flipped, Sprite, type IRamps } from "Components/SilentNight/pixelArt";
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

	/** Grime and wear (Sprite.weather). */
	weather(amount: number, seed = 0) {
		this.sprite.weather(amount, seed);
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
	/** The rim lights it takes, if not every material's. */
	rims?: IRamps;
	draw: (pen: Pen, step: 0 | 1) => void;
};

/** Krampus's face: his skin's shades (0–4), his mouth (m), fangs (W, w), tongue (r, R, E), the goatee (f, F) and his eyes' sockets (y). */
const KRAMPUS_FACE: IPaintKey = {
	"0": ["impSkin", 0],
	"1": ["impSkin", 1],
	"2": ["impSkin", 2],
	"3": ["impSkin", 3],
	"4": ["impSkin", 4],
	m: ["dark", 0],
	W: ["white", 3],
	w: ["white", 2],
	r: ["red", 3],
	R: ["red", 4],
	E: ["red", 5],
	f: ["blackFur", 2],
	F: ["blackFur", 3],
	y: ["yellowGlow", 0],
};

/** His face from his brow (row 9) down to his tongue's tip, from x 15 (KRAMPUS_FACE). */
const KRAMPUS_FACE_ROWS = [
	".33.....32.",
	".0y32023y0.",
	".10y121y01.",
	".221232121.",
	".123040310.",
	".01WmmmW10.",
	"..0mmRrm0..",
	"...01Rr0...",
	"...fFRrf...",
	"....fRrf...",
	"....fRr....",
	"......Rr...",
	".......E...",
];

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

			// Cracked across the chest and down a leg, burnt dark at the edges, slavering.
			for (const [x, y] of [
				[5, 9],
				[6, 10],
				[6, 11],
				[5, 13],
				[9, 14],
			]) {
				p.d(x, y, "cookie", -0.3);
			}

			p.d(8, 7, "icing", 0.2);
			p.weather(0.2, 1);
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

			// The spring sprung from its broken shoulder, rust on its coat, its chin strap.
			p.d(4, 7, "steel", 0.45);
			p.d(3, 8, "steel", 0.3);
			p.d(4, 9, "steel", 0.45);

			for (const [x, y] of [
				[8, 9],
				[6, 12],
				[9, 13],
			]) {
				p.d(x, y, "cookie", 0.05);
			}

			p.d(9, 6, "gold", 0.35);
			p.weather(0.16, 2);
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

			// Glossy where the coal broke, and more embers through its arms.
			for (const [x, y] of [
				[9, 3],
				[3, 8],
				[16, 8],
				[12, 15],
			]) {
				p.d(x, y, "steel", 0.4);
			}

			for (const [x, y] of [
				[3, 12],
				[2, 14],
				[17, 12],
				[18, 13],
			]) {
				p.d(x, y, "ember", 0.4);
			}

			p.weather(0.14, 3);
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
			// The songbook, dark and worn, its pages pale, and the pale hands holding it.
			p.e(10.4 + sway, 11, 2, 1.4, 0.3, "red", -0.12);
			p.d(10 + sway, 10.4, "white", 0.2);
			p.d(11 + sway, 10.8, "white", 0.15);
			p.d(9 + sway, 11.5, "porcelain", 0.3);
			p.d(12 + sway, 11.8, "porcelain", 0.2);

			// Its hem in tatters.
			p.x(3 + Math.round(sway), 18);
			p.x(9 + Math.round(sway), 19);
			p.weather(0.16, 4);
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

			// Chips out of a wing and the hem, and grime in the porcelain.
			p.x(1, 4 + lift * 2);
			p.x(6, 17);
			p.weather(0.12, 5);
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

			// Its tail's barbed tip, its claws and fangs.
			p.d(0, 4, "impSkin", 0.2);
			p.d(1, 5, "impSkin", 0.2);
			p.d(11, 6, "horn", 0.1);
			p.d(10, 6, "white", 0.5);
			p.weather(0.16, 6);
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

			// Mangy, its tail in rings.
			p.d(1, 4, "pink", -0.15);
			p.weather(0.2, 7);
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

			// A scar across his snout, his cape ragged at its hem, mangy.
			p.d(22, 10, "pink", -0.1);
			p.d(23, 10, "pink", -0.15);
			p.x(6, 26);
			p.x(8, 27);
			p.weather(0.16, 8);
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

			// Its shroud rotting into tatters.
			p.x(9, 36);
			p.x(16, 35);
			p.weather(0.12, 9);
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

			// Its fur bristling along its arched back, its fangs.
			for (let x = 8; x < 30; x += 3) {
				p.l(x, 11.4 - Math.abs(x - 18) * 0.12, x - 0.6, 9.6 - Math.abs(x - 18) * 0.12, 0.6, 0.3, "blackFur", 0.04);
			}

			p.d(36, 13, "white", 0.55);
			p.weather(0.12, 10);
		},
	},
	krampus: {
		width: 36,
		height: 46,
		feet: { x: 18, y: 45 },
		// Slanted slits, burning, as in his portrait.
		eyes: [
			[17, 10],
			[18, 11],
			[22, 11],
			[23, 10],
		],
		eyeColour: "#ffb040",
		// Candlelit at the edge of his fur; his horns, face, hands and all he carries are too fine for
		// it (it would bleach them) and are lit as they're drawn.
		rims: { blackFur: RIMS.blackFur },
		draw(p, step) {
			const stride = step === 0 ? 1.2 : -0.8;
			// Goat legs, bent back at the hock, and cloven hooves.
			for (const [hip, side, bias] of [
				[14, -1, -0.08],
				[22, 1, 0],
			] as const) {
				const hoof = hip + side * (1.4 + stride);
				p.e(hip, 33, 3.4, 4.2, 0, "blackFur", bias);
				p.l(hip, 35.4, hip + side * 0.4 - stride * 0.3, 39.6, 2, 1.5, "blackFur", bias);
				p.l(hip + side * 0.4 - stride * 0.3, 39.6, hoof, 43.6, 1.3, 1, "blackFur", bias - 0.04);
				p.e(hoof, 44.4, 1.6, 0.9, 0, "horn", bias - 0.1);
				p.x(Math.round(hoof), 45);
			}

			// His shaggy body, long locks of his pelt hanging down it, ragged below.
			p.e(18, 24, 8.6, 10, 0, "blackFur", 0.04);

			for (const [x, bias] of [
				[12, 0.08],
				[14.6, -0.06],
				[24.6, 0.06],
				[26.8, -0.04],
			]) {
				p.l(x, 17, x - 0.6, 30, 0.8, 0.4, "blackFur", 0.04 + bias);
			}

			for (let x = 10; x <= 27; x += 1.7) {
				p.l(x, 31, x - 0.4, 34 + ((x * 7) % 3), 1, 0.3, "blackFur", -0.04 + ((x * 3) % 2) * 0.05);
			}

			// His left arm hanging, the chain's end swinging from his claw.
			p.l(11, 19, 8.4, 24.4, 2.1, 1.8, "blackFur", 0.02);
			p.l(8.4, 24.4, 7, 28, 1.8, 1.4, "blackFur", 0.04);
			p.e(7, 28.8, 1.4, 1.2, 0, "impSkin", -0.04);

			for (let i = 0; i < 6; i++) {
				p.d(6.6 - Math.sin(i * 0.8 + step) * 0.8, 30.4 + i * 1.6, "steel", i % 2 === 0 ? 0.55 : 0.3);
			}

			// The chain coiled twice round him, sagging, link by link.
			for (const [y0, y1] of [
				[19, 24],
				[26, 30],
			]) {
				for (let i = 0; i <= 18; i++) {
					const t = i / 18;
					p.d(9.4 + t * 18.6, y0 + (y1 - y0) * t + 2.5 * 4 * t * (1 - t), "steel", i % 2 === 0 ? 0.6 : 0.32);
				}
			}

			// The cowbell on the lower turn, at his hip: boxy, dull brass, its mouth dark.
			p.r(9.6, 30.6, 3.6, 3.6, "gold", 0.26);
			p.r(10.4, 30.6, 1.4, 3.4, "gold", 0.42);
			p.r(9.4, 34, 4, 0.8, "dark", 0.3);
			p.d(11, 34, "steel", 0.3);
			// His right arm raised, a sheaf of birch switches bound in red in his fist.
			p.l(26, 18.5, 30.4, 24, 2.6, 2.2, "blackFur", 0.06);
			p.l(30.4, 24, 32.4, 17.6, 2.2, 1.8, "blackFur", 0.1);

			for (const [tx, ty, bias] of [
				[29.2, 3.6, -0.1],
				[30.4, 0.8, 0.04],
				[32, 2.6, -0.14],
				[33.2, 0.2, 0.02],
				[34.6, 2.8, -0.08],
				[35.4, 1, 0.06],
			]) {
				p.l(32.2, 13, tx, ty, 0.45, 0.3, "birch", bias);
			}

			p.r(30.8, 12, 2.8, 1.6, "red", 0.3);
			p.l(33.4, 13, 35.2, 15.6, 0.5, 0.4, "red", 0.2);
			p.e(32.2, 15.4, 1.8, 1.7, 0, "impSkin", 0.02);
			p.d(30, 15, "horn", 0.1);
			p.d(30, 16, "horn", 0.1);
			// His head, sunk between his shoulders, long black goat hair hanging from his crown like a
			// hood and falling down his sides onto his shoulders, as in his portrait; tufts of it
			// between his horns.
			p.e(20, 11.4, 6.6, 6.6, 0, "blackFur", 0.08);

			for (const side of [-1, 1]) {
				for (let j = 0; j < 3; j++) {
					p.l(
						20 + side * (4.6 + j * 1.3),
						7.6 + j * 2.4,
						20 + side * (6 + j * 1.8),
						18.6 + j * 2.6,
						1.3,
						0.4,
						"blackFur",
						0.03 + j * 0.03,
					);
				}
			}

			for (const [x, lean, top] of [
				[18, -1.4, 4.2],
				[20.6, 0.4, 3.6],
				[22.4, 1.6, 4.8],
			]) {
				p.l(x, 7.4, x + lean, top, 1.3, 0.4, "blackFur", 0.06);
			}

			// His face, after his portrait's, pixel by pixel: brow ridges knotted low in a scowl over deep
			// sockets, his eyes burning in them as slanted slits, a snout down to his nostrils, his mouth
			// gaping with fangs at its corners, his long tongue hanging over the goatee under his jaw.
			paint(p, KRAMPUS_FACE, KRAMPUS_FACE_ROWS, 15, 9);

			// His long pointed ears, a devil's, sweeping out and up from his hair, catching the light at
			// their tips.
			for (const side of [-1, 1]) {
				p.d(20 + side * 6, 10, "impSkin", 0.25);
				p.d(20 + side * 7, 10, "impSkin", 0.5);
				p.d(20 + side * 8, 9, "impSkin", 0.5);
				p.d(20 + side * 9, 8, "impSkin", 0.75);
			}

			// Great ridged horns, sweeping out from his brow and up.
			for (const side of [-1, 1]) {
				const along = (t: number) => [
					(1 - t) ** 2 * (20 + side * 3.6) + 2 * (1 - t) * t * (20 + side * 8.4) + t * t * (20 + side * 8.2),
					(1 - t) ** 2 * 7.8 + 2 * (1 - t) * t * 5.6 + t * t * 0.4,
				];

				for (let i = 0; i < 6; i++) {
					const [x1, y1] = along(i / 6);
					const [x2, y2] = along((i + 1) / 6);
					p.l(x1, y1, x2, y2, 1.7 - (i / 6) * 1.25, 1.7 - ((i + 1) / 6) * 1.25, "horn", i % 2 === 0 ? 0.02 : 0.14);
				}
			}

			p.weather(0.14, 14);
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

		return pen.sprite.render(RAMPS, art.rims ?? RIMS, OUTLINE, 1);
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
	/** A toy soldier standing guard, facing right and left. */
	soldier: { right: HTMLCanvasElement; left: HTMLCanvasElement };
	globe: HTMLCanvasElement;
	flame: HTMLCanvasElement;
	/** La Flor's xolo, facing right and left, in two steps of its run. */
	xolo: { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] };
	/** One of La Flor's poinsettias, in turns of its spin. */
	poinsettia: HTMLCanvasElement[];
	/** A poinsettia's bract flying from La Flor's seed pod: its base in the middle, pointing each of 16 ways (the first to the right). */
	petal: HTMLCanvasElement[];
	/** Saint Lucia's star boy, Ded Moroz's Snow Maiden and Mari Lwyd's mummer: facing right and left, in two steps of their walk. */
	starBoy: { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] };
	maiden: { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] };
	mummer: { right: HTMLCanvasElement[]; left: HTMLCanvasElement[] };
	crystal: HTMLCanvasElement;
	bigCrystal: HTMLCanvasElement;
	cocoa: HTMLCanvasElement;
	star: HTMLCanvasElement;
	chest: HTMLCanvasElement;
	coal: HTMLCanvasElement;
	coalSack: HTMLCanvasElement;
	clock: HTMLCanvasElement;
	bell: HTMLCanvasElement;
	/** Gear, lying in the snow: a parcel in brown paper, tied with string. */
	gear: HTMLCanvasElement;
	shrine: HTMLCanvasElement;
	altar: HTMLCanvasElement;
};

const BOSSES = new Set<IEnemyKind>(["mouseKing", "ghost", "yuleCat", "krampus"]);

/** A friendly gingerbread minion: lighter, smiling, a Santa hat and a bright green scarf, no glowing eyes, no bite out of it. */
function minion(step: 0 | 1): HTMLCanvasElement {
	const p = new Pen(14, 17, 1);
	const spread = step === 0 ? 2.4 : 0.8;
	p.l(6, 11, 6 - spread, 15.5, 1.8, 1.5, "cookie", 0.02);
	p.l(8, 11, 8 + spread, 15.5, 1.8, 1.5, "cookie", 0.08);
	p.e(7, 9.5, 3.6, 3.8, 0, "cookie", 0.1);
	p.l(9.5, 8.5, 12, 10, 1.5, 1.2, "cookie", 0.1);
	p.l(4.5, 8.5, 2, 10, 1.5, 1.2, "cookie", 0);
	p.e(7, 4.5, 3.4, 3.3, 0, "cookie", 0.14);
	p.r(4, 7, 7, 1, "green", 0.85);
	p.d(10, 8, "green", 0.8);
	p.d(10, 9, "green", 0.75);
	// A Santa hat: red, a white trim and bobble, flopping to one side.
	p.r(4, 1, 6, 1, "white", 0.8);
	p.l(5, 0.4, 9, 0.4, 0.9, 0.6, "red", 0.4);
	p.l(9, 0.4, 11.4, 1.6, 0.6, 0.4, "red", 0.35);
	p.d(12, 2, "white", 0.9);
	p.d(8, 4, "dark", 0.2);
	p.d(10, 4, "dark", 0.2);
	p.d(8, 6, "icing", 0.6);
	p.d(9, 6, "icing", 0.6);
	p.d(10, 6, "icing", 0.6);
	p.d(7, 10, "red", 0.5);
	p.d(7, 12, "green", 0.5);

	p.weather(0.1, 13);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

/** A leaf or a poinsettia's bract, from (`x`, `y`): broadening to its middle, then narrowing to a point. */
function leaf(
	p: Pen,
	x: number,
	y: number,
	angle: number,
	length: number,
	width: number,
	material: string,
	bias: number,
) {
	const mx = x + Math.cos(angle) * length * 0.45;
	const my = y + Math.sin(angle) * length * 0.45;
	p.l(x, y, mx, my, 0.3, width, material, bias);
	p.l(mx, my, x + Math.cos(angle) * length, y + Math.sin(angle) * length, width, 0.15, material, bias);
}

/**
 * A poinsettia, as it's painted on Christmas cards: five broad red bracts, pointed, in a star round
 * the little gold-and-green flowers at its heart, its green leaves showing between them, a dark
 * crease between each bract; turned by `turn`.
 */
function bloom(p: Pen, cx: number, cy: number, length: number, turn: number) {
	const between = (i: number) => turn + ((i + 0.5) * Math.PI * 2) / 5;

	for (let i = 0; i < 5; i++) {
		leaf(p, cx, cy, between(i), length, 0.7, "green", 0.12);
	}

	for (let i = 0; i < 5; i++) {
		const angle = turn + (i * Math.PI * 2) / 5;
		leaf(p, cx, cy, angle, length, 1.3, "red", 0.1 - 0.05 * Math.sin(angle));
	}

	for (let i = 0; i < 5; i++) {
		const reach = length * 0.55;
		p.l(cx, cy, cx + Math.cos(between(i)) * reach, cy + Math.sin(between(i)) * reach, 0.3, 0.3, "red", -0.3);
	}

	const [x, y] = [Math.floor(cx - 0.5), Math.floor(cy - 0.5)];
	p.d(x, y, "gold", 0.85);
	p.d(x + 1, y, "green", 0.8);
	p.d(x, y + 1, "green", 0.7);
	p.d(x + 1, y + 1, "gold", 0.6);
}

/**
 * La Flor's xolo, an alebrije: a lean, hairless dog with great upright ears, carved and painted
 * near-black, patterned in Christmas colours (gold and white dots down its back, a green stripe
 * dotted white along its flank, red and green bands on its legs, a gold star on its haunch), a
 * poinsettia on its back and a little one at the tip of its tail, its eye glowing like a candle.
 */
function xolo(step: 0 | 1): HTMLCanvasElement {
	const p = new Pen(22, 17, 1);
	const stride = step === 0 ? 1.6 : -1.6;

	// Its tail, thin and whip-like, curling up behind, a little poinsettia at its tip.
	p.l(4.6, 8.6, 2.2, 7, 0.6, 0.45, "coal", -0.1);
	p.l(2.2, 7, 1.6, 4.6, 0.45, 0.35, "coal", -0.08);

	for (const angle of [-2.4, -1.4, -0.4, 0.8]) {
		leaf(p, 1.6, 3.6, angle, 2, 0.6, "red", 0.18);
	}

	p.d(1, 3, "gold", 0.7);

	// Legs, long and fine, the far pair darker, each painted with a red band and a green one.
	for (const [x, sign, bias] of [
		[6.4, -1, -0.24],
		[14.4, 1, -0.24],
		[7.4, 1, -0.02],
		[15.2, -1, -0.02],
	]) {
		const foot = x + sign * stride;
		const knee = x + sign * stride * 0.4;
		p.l(x, 9.6, knee, 13, 1.3, 0.7, "coal", bias);
		p.l(knee, 13, foot, 15.6, 0.7, 0.55, "coal", bias);
		p.d(Math.round(knee), 13, "red", 0.55 + bias);
		p.d(Math.round((knee + foot) / 2), 14, "green", 0.7 + bias);
		p.d(Math.round(foot), 16, "coal", 0.2 + bias);
	}

	// Its body: a deep chest, a tucked waist, a lean haunch.
	p.e(10.6, 9, 5.6, 2.4, -0.05, "coal", 0.04);
	p.e(14, 9.4, 2.6, 2.6, 0, "coal", 0.06);
	p.e(6.6, 8.6, 2.2, 2.1, 0, "coal", 0);

	// Its patterns.
	for (const [x, material] of [
		[5, "gold"],
		[6, "white"],
		[7, "gold"],
		[14, "white"],
		[15, "gold"],
	] as const) {
		p.d(x, 7, material, material === "gold" ? 0.75 : 0.6);
	}

	p.l(8, 10.4, 15, 10.4, 0.5, 0.5, "green", 0.5);

	for (const x of [9, 11, 13]) {
		p.d(x, 10, "white", 0.6);
	}

	for (const [dx, dy] of [
		[0, 0],
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	]) {
		p.d(6 + dx, 9 + dy, "gold", dx === 0 && dy === 0 ? 0.9 : 0.6);
	}

	bloom(p, 10.5, 4.6, 4.6, -Math.PI / 2);

	// Its neck rising to its head: a long wedge of a snout, the great upright ears painted red inside.
	p.l(15, 8, 17, 5.4, 1.6, 1.2, "coal", 0.08);
	p.e(17.4, 4.6, 2.2, 1.9, 0, "coal", 0.1);
	p.l(18.6, 5, 21.4, 6.2, 1.2, 0.6, "coal", 0.08);
	p.l(16.6, 3.4, 15.6, 0.2, 0.8, 0.3, "coal", 0.02);
	p.l(18.2, 3.2, 18.8, 0, 0.8, 0.3, "coal", 0.14);
	p.d(16, 2, "red", 0.6);
	p.d(18, 1, "red", 0.7);
	p.d(19, 6, "gold", 0.65);
	// Its eye, glowing like a candle, and its nose.
	p.d(18, 4, "yellowGlow", 0.9);
	p.d(21, 6, "coal", -0.3);
	p.weather(0.1, 7);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

/** One of La Flor's poinsettias, flying as a chakram, turned by `turn`. */
function poinsettia(turn: number): HTMLCanvasElement {
	return small(13, 13, (p) => bloom(p, 6.5, 6.5, 5.8, turn));
}

/**
 * A star boy from Saint Lucia's procession: a long white gown with a gold tinsel belt, a tall
 * pointed white hat with gold stars on it, sitting on his head above his face, a gold star held up
 * on a stick.
 */
function starBoy(step: 0 | 1): HTMLCanvasElement {
	const p = new Pen(14, 22, 1);
	const spread = step === 0 ? 1.2 : 0.3;
	// His shoes under the gown's hem.
	p.e(6 - spread, 20.6, 1.2, 0.8, 0, "blackFur", 0.1);
	p.e(8 + spread, 20.6, 1.2, 0.8, 0, "blackFur", 0.16);
	// The gown, falling in folds; his far arm hanging, his near one holding up the star.
	p.l(7, 11, 7, 19.4, 2.6, 3.6, "white", 0.06);
	p.l(5.6, 13, 5, 19.6, 0.5, 0.5, "white", -0.18);
	p.l(8.6, 13, 9.2, 19.6, 0.5, 0.5, "white", -0.1);
	p.l(4.6, 11.4, 4, 15.4, 1, 0.8, "white", -0.12);
	p.l(9.4, 11.4, 10.8, 10.2, 1, 0.8, "white", 0.1);
	p.e(11, 9.8, 0.8, 0.8, 0, "skin", 0.1);
	// The stick and its star.
	p.l(11, 10, 11.6, 4.6, 0.4, 0.4, "cookie", 0.1);

	for (const [dx, dy] of [
		[0, 0],
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	]) {
		p.d(11.6 + dx, 3.6 + dy, "gold", dx === 0 && dy === 0 ? 0.95 : 0.6);
	}

	// The gold tinsel belt.
	p.r(4.6, 13, 5, 1, "gold", 0.6);
	// The tall pointed hat, gold stars on it, sitting above his face: his eyes, rosy cheeks, a fringe of hair.
	p.l(7, 6.2, 7.6, 0.2, 2.3, 0.3, "white", 0.1);
	p.d(7, 4, "gold", 0.8);
	p.d(7, 2, "gold", 0.7);
	p.e(7, 8.8, 2.1, 2, 0, "skin", 0.08);
	p.r(5, 6.8, 4, 1, "cookie", 0.35);
	p.d(6, 8, "dark", 0.15);
	p.d(8, 8, "dark", 0.15);
	p.d(5, 9, "pink", 0.5);
	p.d(9, 9, "pink", 0.45);
	p.weather(0.1, 17);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

/**
 * Snegurochka, the Snow Maiden: a long blue coat trimmed with white fur, a kokoshnik of frost
 * behind her head, a long pale braid, a hand held out with frost at its fingertips.
 */
function maiden(step: 0 | 1): HTMLCanvasElement {
	const p = new Pen(14, 21, 1);
	const spread = step === 0 ? 1 : 0.2;
	// Her braid, down her back.
	p.l(5.2, 7.4, 4.2, 14.6, 0.8, 0.5, "icing", -0.04);
	// Her boots under the hem.
	p.e(6 - spread, 19.6, 1.1, 0.8, 0, "blackFur", 0.1);
	p.e(8 + spread, 19.6, 1.1, 0.8, 0, "blackFur", 0.16);
	// The coat, flaring to its hem, its fur trim down the front and round the hem.
	p.l(7, 10, 7, 18.4, 2.4, 3.8, "cloth", 0.1);
	p.r(4, 18, 7, 1, "white", 0.45);
	p.l(7.4, 10.6, 7.6, 17.6, 0.4, 0.4, "white", 0.4);
	// Her far arm at her side, her near one held out, frost at its fingertips.
	p.l(4.8, 10.6, 4.4, 14.4, 0.9, 0.8, "cloth", -0.1);
	p.l(9.2, 10.6, 11.6, 12, 0.9, 0.8, "cloth", 0.08);
	p.d(12, 12, "frost", 0.9);
	p.d(13, 11, "frost", 0.7);
	// Her pale face, her eyes and rosy cheeks; the kokoshnik behind it, pearls on its rim.
	p.e(7, 5.4, 3, 2.4, 0, "frost", -0.1);
	p.e(7, 7.6, 2, 2, 0, "porcelain", 0.12);
	p.d(6, 7, "cloth", 0.15);
	p.d(8, 7, "cloth", 0.15);
	p.d(5, 8, "pink", 0.5);
	p.d(9, 8, "pink", 0.45);

	for (const x of [5, 7, 9]) {
		p.d(x, 3, "white", 0.8);
	}

	p.weather(0.08, 19);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

/**
 * A Christmas mummer, risen from the fallen: hidden under a costume of ragged strips (red, green,
 * white and gold), a tall battered hat with strips hanging over the face.
 */
function mummer(step: 0 | 1): HTMLCanvasElement {
	const p = new Pen(14, 19, 1);
	const spread = step === 0 ? 2 : 0.6;
	// Legs in dark trousers, running.
	p.l(6, 13, 6 - spread, 17.6, 1, 0.9, "blackFur", 0.04);
	p.l(8, 13, 8 + spread, 17.6, 1, 0.9, "blackFur", 0.1);
	// The strips, hanging from the shoulders to a ragged hem, swinging as it runs.
	const colours = ["red", "green", "white", "gold", "red", "green", "white"];
	colours.forEach((material, i) => {
		const x = 3.6 + i * 1.1;
		p.l(x + 0.4, 7.6, x - (step === 0 ? 0.4 : -0.3), 14 + (i % 2), 0.7, 0.6, material, i % 2 === 0 ? 0 : -0.12);
	});
	// The hat: tall, battered, a red band round it, strips hanging from its brim over the face.
	p.r(4.4, 1, 5.2, 4.2, "fur", 0.45);
	p.r(4.4, 4, 5.2, 1, "red", 0.5);
	p.r(3.4, 5, 7.2, 1, "fur", 0.5);

	for (const [x, material] of [
		[4.4, "red"],
		[6, "white"],
		[7.6, "green"],
		[9.2, "gold"],
	] as const) {
		p.l(x, 6, x, 8.4, 0.5, 0.4, material, 0.1);
	}

	p.weather(0.12, 23);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

/** A nutcracker toy soldier at attention: a tall black busby, a white face with a big jaw, a red coat crossed with a white sash, black boots, his musket held across him. */
function soldier(): HTMLCanvasElement {
	const p = new Pen(14, 19, 1);
	// Legs and boots.
	p.l(6, 13, 6, 17.5, 1.1, 1.1, "blackFur", 0.1);
	p.l(8, 13, 8, 17.5, 1.1, 1.1, "blackFur", 0.15);
	p.r(5, 12, 4, 2, "white", 0.55);
	// His red coat, gold buttons, the white sash across it.
	p.e(7, 9.5, 2.8, 3.6, 0, "red", 0.1);
	p.l(5, 7, 9, 12, 0.6, 0.6, "white", 0.6);
	p.d(7, 9, "gold", 0.8);
	p.d(7, 11, "gold", 0.8);
	// His head: a white face, a big wooden jaw, a black moustache and eyes, rosy cheeks.
	p.e(7, 5.4, 2.2, 2.2, 0, "porcelain", 0.25);
	p.r(5.5, 6.4, 3, 1.4, "white", 0.4);
	p.r(6, 6, 2, 1, "dark", 0.15);
	p.d(6, 5, "dark", 0.1);
	p.d(8, 5, "dark", 0.1);
	p.d(5, 6, "pink", 0.5);
	// The tall busby, a gold plate on its front.
	p.r(4.6, 0.4, 4.8, 3.8, "fur", 0.35);
	p.d(7, 2, "gold", 0.85);
	// The musket, held across him, pointing ahead.
	p.l(4, 10, 12.6, 7.2, 0.6, 0.5, "steel", 0.2);
	p.l(4, 10, 6, 9.4, 0.8, 0.8, "cookie", 0.05);
	p.weather(0.12, 12);

	return p.sprite.render(RAMPS, RIMS, OUTLINE, 1);
}

/** A painted sprite's colours, by letter: a material and a step of its ramp (palette.ts). */
type IPaintKey = Record<string, [string, number]>;

/** Coal's five shades from black up (0–4), and the glossy grey of its broken edges and glints (a–c, w). */
const COAL: IPaintKey = {
	"0": ["coal", 0],
	"1": ["coal", 1],
	"2": ["coal", 2],
	"3": ["coal", 3],
	"4": ["coal", 4],
	a: ["steel", 1],
	b: ["steel", 2],
	c: ["steel", 3],
	w: ["steel", 4],
};

/**
 * A sprite painted pixel by pixel from rows of letters ("." is empty), each an exact shade from
 * `key`, rim-lit only in `rims` (the candlelight would tint small things painted this way).
 */
function painted(key: IPaintKey, rows: string[], rims: IRamps = {}): HTMLCanvasElement {
	const pen = new Pen(rows[0].length, rows.length, 1);
	paint(pen, key, rows);

	return pen.sprite.render(RAMPS, rims, OUTLINE, 1);
}

/** Paints rows of letters ("." is empty) with `pen`, from (`left`, `top`), each an exact shade from `key`. */
function paint(pen: Pen, key: IPaintKey, rows: string[], left = 0, top = 0) {
	rows.forEach((row, y) => {
		[...row].forEach((letter, x) => {
			const shade = key[letter];

			if (shade) {
				const [material, step] = shade;
				pen.d(left + x, top + y, material, step / (RAMPS[material].length - 1));
			}
		});
	});
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
	const soldierRight = soldier();
	const xoloRight = [xolo(0), xolo(1)];
	const starBoyRight = [starBoy(0), starBoy(1)];
	const maidenRight = [maiden(0), maiden(1)];
	const mummerRight = [mummer(0), mummer(1)];

	return {
		enemies,
		elites,
		minion: { right: minionRight, left: minionRight.map(flipped) },
		soldier: { right: soldierRight, left: flipped(soldierRight) },
		xolo: { right: xoloRight, left: xoloRight.map(flipped) },
		starBoy: { right: starBoyRight, left: starBoyRight.map(flipped) },
		maiden: { right: maidenRight, left: maidenRight.map(flipped) },
		mummer: { right: mummerRight, left: mummerRight.map(flipped) },
		// A turn of its spin in three steps (its five bracts look the same every fifth of a turn).
		poinsettia: [0, 1, 2].map((step) => poinsettia(-Math.PI / 2 + (step * Math.PI * 2) / 15)),
		petal: Array.from({ length: 16 }, (_, way) => {
			const angle = (way / 16) * Math.PI * 2;

			return small(13, 13, (p) => leaf(p, 6.5, 6.5, angle, 5, 1.3, "red", 0.1 - 0.05 * Math.sin(angle)));
		}),
		// A snow globe: a little tree with a red bauble in the snow under the glass, on a gold base.
		globe: painted(
			{
				a: ["glass", 1],
				b: ["glass", 2],
				c: ["glass", 3],
				X: ["white", 4],
				W: ["white", 3],
				g: ["green", 3],
				G: ["green", 5],
				T: ["cookie", 2],
				o: ["gold", 2],
				O: ["gold", 3],
				y: ["gold", 4],
				R: ["red", 4],
			},
			[
				"..abbba..",
				".abcaXba.",
				"abaagaaXa",
				"aXagGgaaa",
				"aaaGgRgaa",
				"aaXgGGgXa",
				".aWWTWWa.",
				"..aaaaa..",
				".oOyyyOo.",
				".oOOOOOo.",
				"..ooooo..",
			],
		),
		// A flame, white-hot at its heart.
		flame: painted(
			{
				y: ["yellowGlow", 1],
				Y: ["yellowGlow", 2],
				W: ["white", 4],
				M: ["ember", 1],
				m: ["ember", 0],
			},
			["..y..", ".yy..", ".yYy.", "yYWYy", "yYWYy", "MyYyM", ".MyM.", "..m.."],
		),
		// Crystals of frost: a little faceted gem, and a big one with a smaller spike broken off its side.
		crystal: painted({ "1": ["frost", 1], "2": ["frost", 2], "3": ["frost", 3], "4": ["frost", 4] }, [
			"..4..",
			".432.",
			"43321",
			"43221",
			"43221",
			".321.",
			"..1..",
		]),
		bigCrystal: painted({ "1": ["frost", 1], "2": ["frost", 2], "3": ["frost", 3], "4": ["frost", 4] }, [
			"...3.....",
			"..432....",
			".43321...",
			".43221...",
			".43221.4.",
			".4322143.",
			".43221432",
			".43214321",
			".43213221",
			"..2112110",
		]),
		// A red mug of cocoa, steaming, a marshmallow afloat.
		cocoa: painted(
			{
				P: ["red", 5],
				R: ["red", 4],
				r: ["red", 3],
				d: ["red", 2],
				e: ["red", 1],
				L: ["cookie", 3],
				C: ["cookie", 2],
				m: ["icing", 3],
				s: ["white", 1],
			},
			[
				"...s..s....",
				"....s..s...",
				"...s..s....",
				".RRRRRRr...",
				".rLmmLCr...",
				".RRRRRrrdd.",
				".RPRRrrd.d.",
				".RPRRrrd.d.",
				".RPRrrrddd.",
				".RRrrrrd...",
				"..eeeee....",
			],
		),
		// A gold star, each point bevelled, light on its upper left halves.
		star: painted({ "1": ["gold", 1], "2": ["gold", 2], "3": ["gold", 3], "4": ["gold", 4], W: ["white", 4] }, [
			".....4.....",
			".....43....",
			"....443....",
			"44444W33322",
			".444443332.",
			"..4443322..",
			"..4433322..",
			".4433.3322.",
			".443...322.",
			".43.....22.",
		]),
		// A lump of coal: a chipped chunk of anthracite, its top facet catching the light in a curved
		// sheen where it broke, a glint on it, a sharp ridge down to its darker side, its front and
		// underside falling away into black.
		coal: painted(COAL, [
			".....bc.....",
			"....b44c3...",
			"...b4w44c3..",
			"..b44c444c2.",
			".b44c4443c21",
			"b444c44432c1",
			".3333cc32221",
			"..2222222111",
			"...11.1110..",
		]),
		// A burlap sack of coal: the weave lighter on its lit side, darker round to the right, tied
		// at the neck with twine, coal heaped in its mouth.
		coalSack: painted(
			{
				...COAL,
				D: ["cookie", 2],
				M: ["cookie", 3],
				L: ["cookie", 4],
				H: ["cookie", 5],
				t: ["birch", 1],
				T: ["birch", 2],
			},
			[
				".....b3.....",
				"...b4c3.b4..",
				"..44c32b4c3.",
				".LL3221122DD",
				".HLLMMMMMDD.",
				"...DttTtD...",
				"..LMLMMMMD..",
				".LMLMLMMMMD.",
				"LMLMLMMMMMDD",
				"LLMLMMMMMMDD",
				"LMLMMMMMMDDD",
				".LMMMMMMDDD.",
				"..DDDDDDDD..",
			],
		),
		// A stopped pocket watch: a gold case on its bow, a pale face with its hours marked, both
		// hands at midnight.
		clock: painted(
			{
				"0": ["gold", 0],
				"1": ["gold", 1],
				"2": ["gold", 2],
				"3": ["gold", 3],
				"4": ["gold", 4],
				W: ["white", 4],
				w: ["white", 3],
				v: ["white", 2],
				k: ["dark", 0],
			},
			[
				"....434....",
				"...4...2...",
				"....323....",
				"...44432...",
				".344443322.",
				".44WWkWw32.",
				"43WWWkWWw21",
				"43WWWkWWw21",
				"34vWW1WWv21",
				"33WWWWWww11",
				"22wWWvWww11",
				".22wwwww11.",
				".122221110.",
				"...11100...",
			],
		),
		// A silver bell under a red bow, a bright streak down it, its clapper hanging below.
		bell: painted(
			{
				"0": ["steel", 0],
				"1": ["steel", 1],
				"2": ["steel", 2],
				"3": ["steel", 3],
				"4": ["steel", 4],
				w: ["white", 4],
				P: ["red", 5],
				R: ["red", 4],
				r: ["red", 3],
				d: ["red", 2],
			},
			[
				".RRr...rRd.",
				"R..rRPRr..d",
				".RRdrRrdrd.",
				"...r434d...",
				"...3w432...",
				"...3w432...",
				"..23w4321..",
				"..34w4321..",
				".234w43211.",
				".34w443321.",
				"34444443322",
				"..1000001..",
				"....232....",
			],
		),
		// A present: red, its lid overhanging, a gold ribbon and bow.
		chest: painted(
			{
				P: ["red", 5],
				R: ["red", 4],
				r: ["red", 3],
				d: ["red", 2],
				e: ["red", 1],
				G: ["gold", 4],
				g: ["gold", 3],
				o: ["gold", 2],
				b: ["gold", 1],
			},
			[
				"...GG..GG...",
				"..GobGGboG..",
				"...ggGGgg...",
				"PRRRRGGRRRRr",
				"rrrrrgorrrrd",
				".eeeeobeeee.",
				".RRRRgorrrd.",
				".RRRRgorrrd.",
				".RRRrgorrdd.",
				".RRrrgordde.",
				".ddddbbeeee.",
			],
		),
		// Gear: a parcel in brown paper, tied with string in a bow.
		gear: painted(
			{ H: ["cookie", 5], L: ["cookie", 4], M: ["cookie", 3], D: ["cookie", 2], T: ["birch", 3], t: ["birch", 2] },
			[
				"..TT..TT..",
				"...tTTt...",
				"HHHHTtHHHL",
				"LLLLTtLLLM",
				"TTTTTtTTTt",
				"LLLLTtLMMD",
				"LLLMTtMMMD",
				"LMMMTtMMDD",
				"MMMDtDDDDD",
			],
		),
		// A wayside shrine: a weathered stone pillar under a snow-laden gable, a candle guttering in its
		// niche, stubs of candles and a sprig of holly in the snow at its foot.
		shrine: small(16, 24, (p) => {
			p.r(1.5, 21, 13, 3, "stone", 0.36);
			p.r(1.5, 20.6, 13, 0.8, "white", 0.3);
			p.l(8, 12, 8, 21, 2.6, 2.8, "stone", 0.02);

			for (const y of [14, 17]) {
				p.r(5.4, y, 5.2, 0.6, "stone", -0.2);
			}

			p.r(3, 6, 10, 7, "stone", 0.08);
			p.e(8, 9.4, 2.6, 2.8, 0, "yellowGlow", -0.2);
			p.e(8, 9.8, 1.8, 1.9, 0, "yellowGlow", 0.25);
			p.r(7.6, 9.4, 1, 2.2, "white", 0.45);
			p.d(8, 8, "yellowGlow", 0.9);
			p.l(1.4, 6, 8, 1.2, 1.1, 1.1, "stone", 0.12);
			p.l(14.6, 6, 8, 1.2, 1.1, 1.1, "stone", 0.04);
			p.l(1.4, 5.2, 8, 0.4, 0.8, 0.8, "white", 0.2);
			p.l(14.6, 5.2, 8, 0.4, 0.8, 0.8, "white", 0.12);

			for (const x of [3, 13]) {
				p.r(x - 0.5, 19, 1, 2, "white", 0.4);
				p.d(x, 18, "yellowGlow", 0.8);
			}

			p.d(10, 20, "green", 0.4);
			p.d(11, 20, "red", 0.5);
			p.weather(0.14, 16);
		}),
		// Krampus's altar: a slab of black stone, goat horns rising from its corners, red candles burning
		// on it, a chain swagged across its face over a goat skull carved with red eyes.
		altar: small(18, 20, (p) => {
			p.l(2.4, 7, 1, 3, 1.2, 0.8, "horn", 0.08);
			p.l(1, 3, 1.6, 0.3, 0.8, 0.4, "horn", 0.16);
			p.l(15.6, 7, 17, 3, 1.2, 0.8, "horn", 0.12);
			p.l(17, 3, 16.4, 0.3, 0.8, 0.4, "horn", 0.2);

			for (const x of [5, 12]) {
				p.r(x - 0.5, 3, 1.2, 4, "red", 0.3);
				p.d(x, 2, "yellowGlow", 0.7);
				p.d(x, 1, "yellowGlow", 0.95);
			}

			p.r(1, 6, 16, 2, "stone", 0.26);
			p.r(2.4, 8, 13.2, 9, "stone", 0.06);
			p.r(1, 17, 16, 3, "stone", 0.16);
			p.e(9, 12.4, 2.2, 1.8, 0, "porcelain", 0.04);
			p.d(8, 12, "glow", 0.7);
			p.d(10, 12, "glow", 0.7);
			p.d(9, 14, "porcelain", 0.1);
			p.l(6.6, 10.6, 5.6, 9.6, 0.4, 0.3, "horn", 0.1);
			p.l(11.4, 10.6, 12.4, 9.6, 0.4, 0.3, "horn", 0.1);

			for (let i = 0; i <= 14; i++) {
				const t = i / 14;
				p.d(2 + 13 * t, 9 + 3.2 * Math.sin(Math.PI * t), "steel", i % 2 === 0 ? 0.55 : 0.3);
			}

			p.weather(0.18, 17);
		}),
	};
}
