/**
 * Little pictures (16 pixels square) for the weapons and passives, on the level-up cards and the
 * counters, and the patrons' symbols, marking those chosen in a night: drawn once by code in the
 * game's style and kept as image URLs.
 */

import { Pen } from "Components/SilentNight/characters";
import { OUTLINE, RAMPS, RIMS } from "Components/SilentNight/palette";
import type { IGearSlot, IPassiveId, IPatronId, IWeaponId } from "Components/SilentNight/types";

type IIconId = IWeaponId | IPassiveId | IGearSlot | IPatronId | "chains";

/** What each letter paints in a symbol drawn pixel by pixel: a material and its shade. */
const LETTERS: Record<string, [string, number]> = {
	w: ["porcelain", 0.92],
	p: ["porcelain", 0.62],
	s: ["porcelain", 0.34],
	k: ["coal", 0.15],
	e: ["green", 0.95],
	g: ["gold", 0.75],
	r: ["red", 0.6],
	v: ["green", 0.65],
	Y: ["gold", 0.85],
	y: ["gold", 0.6],
	z: ["gold", 0.35],
	h: ["cookie", 0.55],
	a: ["steel", 0.3],
	b: ["steel", 0.55],
	c: ["steel", 0.85],
};

/** A symbol drawn pixel by pixel, a row of letters (LETTERS) for each row of it. */
function paintRows(p: Pen, rows: string[]) {
	rows.forEach((row, y) =>
		[...row].forEach((letter, x) => {
			if (LETTERS[letter]) {
				p.d(x, y, ...LETTERS[letter]);
			}
		}),
	);
}

/**
 * Krampus's chains, hanging: iron rings seen face-on, each linked to the next by one seen edge-on,
 * passing through their holes; the last link dangling.
 */
const CHAINS = [
	"......bbc.......",
	".....b...c......",
	".....b.bcc......",
	"......abb.......",
	".......bc.......",
	"......bbc.......",
	".....b.bcc......",
	".....b.bcc......",
	"......abb.......",
	".......bc.......",
	"......bbc.......",
	".....b.bcc......",
	".....b.bcc......",
	"......abb.......",
	".......bc.......",
	".......ab.......",
];

/** The Christkind's wings: each swept up from the shoulder, its feathers hanging apart; a halo over them. */
const WINGS = [
	"................",
	"................",
	"......gggg......",
	".....g....g.....",
	"ww............ww",
	"ppww........wwpp",
	"spppw......wppps",
	".ssppw....wppss.",
	".s.sppp..ppps.s.",
	"s.s.spp..pps.s.s",
	".s.s.sp..ps.s.s.",
	".....s....s.....",
	"................",
	"................",
	"................",
	"................",
];

/** Mari Lwyd's skull, in profile: the long muzzle, the socket of its eye, its teeth, its ribbons. */
const SKULL = [
	"................",
	"................",
	"..........wwww..",
	"........wwppppw.",
	"......wwppkkkpps",
	"....wwpppkkekpps",
	"..wwppppppkkppsr",
	"wwpppppppppppssr",
	"wppppppsssspps.v",
	".kpk.k.k.k.ps..r",
	".wpspspspspps..v",
	"..sppppppppps..r",
	".....ssssppps..v",
	"..........ss....",
	"................",
	"................",
];

/**
 * The Yule Goat in profile, as the great straw goats stand: tall and square on long legs ending in
 * stumps, its horns curling back, a beard at its chin, bound in red.
 */
const GOAT = [
	"..........hhh...",
	".........h...h..",
	".........h..YYY.",
	"..........hzYkYY",
	"...........zyYYy",
	"..........yy..z.",
	"..y.YYrYYYyy....",
	"...yyyryyyry....",
	"...yyyryyyry....",
	"...yyyryyyry....",
	"...zzzrzzzrz....",
	"...z.z...z.z....",
	"...z.z...z.z....",
	"...z.z...z.z....",
	"...z.z...z.z....",
	"...z.z...z.z....",
];

const DRAWINGS: Record<IIconId, (p: Pen) => void> = {
	gun(p) {
		p.l(3, 11, 13, 5, 1.6, 1.4, "white", 0.1);

		for (let i = 0; i < 4; i++) {
			p.l(5 + i * 2.4, 10 - i * 1.4, 6 + i * 2.4, 8.4 - i * 1.4, 0.8, 0.8, "red", 0.1);
		}

		p.l(3, 11, 1.6, 13.4, 1.4, 1.2, "red", 0);
	},
	blunderbuss(p) {
		p.l(2, 12, 7, 8.6, 1.6, 1.3, "cookie", 0);
		p.l(7, 8.6, 12, 4.6, 1.1, 1.1, "steel", 0.05);
		p.l(12, 4.6, 14, 3, 1.1, 2.1, "steel", 0.15);
		p.d(8, 8, "gold", 0.6);
	},
	crossbow(p) {
		p.l(3, 12, 11, 4, 1.2, 1, "cookie", 0);
		p.l(6, 3, 9, 6.6, 0.8, 0.9, "frost", 0.1);
		p.l(9, 6.6, 12.6, 9.4, 0.9, 0.8, "frost", 0.05);
		p.l(5, 10, 14, 2, 0.6, 0.4, "glass", 0.3);
	},
	pistols(p) {
		for (const side of [-1, 1]) {
			p.l(8 - side * 5, 11, 8 + side * 3, 4, 1, 0.9, "gold", 0.05 + side * 0.05);
			p.l(8 - side * 5, 11, 8 - side * 6.4, 13.4, 1, 0.9, "gold", 0);
		}
	},
	romanCandle(p) {
		p.l(4, 13, 11, 5, 1.6, 1.6, "red", 0.05);
		p.l(5.4, 9.6, 7.4, 11.4, 0.6, 0.6, "gold", 0.3);
		p.l(8, 6.6, 10, 8.4, 0.6, 0.6, "gold", 0.3);
		p.d(12, 4, "glow", 0.9);
		p.d(13, 2, "yellowGlow", 0.9);
		p.d(11, 2, "glow", 0.7);
	},
	snowCannon(p) {
		p.l(2, 12, 9, 7, 2, 2.6, "coal", 0.25);
		p.e(11, 5.6, 2.6, 2.6, 0, "white", 0.2);
		p.d(3, 9, "steel", 0.5);
	},
	blade(p) {
		p.l(4, 12, 13, 2, 1.3, 0.6, "white", 0.15);

		for (let i = 0; i < 4; i++) {
			p.d(6 + i * 2, 9 - i * 2.2, "red", 0.5);
		}

		p.l(2, 10, 6, 14, 0.9, 0.9, "gold", 0.2);
		p.l(4, 12, 2, 14.4, 1, 0.9, "red", 0);
	},
	grenades(p) {
		p.e(8, 9.4, 5, 5, 0, "red", 0.1);
		p.r(6.5, 3, 3, 2, "gold", 0.6);
		p.d(7, 2, "gold", 0.4);
		p.d(6, 7, "white", 0.9);
		p.d(5, 8, "white", 0.6);
	},
	whip(p) {
		for (let i = 0; i < 12; i++) {
			const x = 2 + i;
			const y = 8 + Math.sin(i * 0.9) * 3.5;
			p.d(x, y, i % 2 === 0 ? "gold" : "white", 0.6 + (i % 3) * 0.1);
		}

		p.l(1, 12, 3, 10, 1.2, 1, "red", 0.1);
	},
	globes(p) {
		p.e(8, 7, 5.4, 5.4, 0, "glass", 0.1);
		p.d(7, 6, "green", 0.5);
		p.d(8, 5, "green", 0.55);
		p.d(9, 6, "green", 0.5);
		p.d(8, 7, "green", 0.5);
		p.d(5, 4, "white", 0.9);
		p.d(10, 8, "white", 0.8);
		p.r(3.5, 12, 9, 3, "gold", 0.55);
	},
	bells(p) {
		p.l(8, 4, 8, 11, 2.4, 5, "gold", 0.1);
		p.d(8, 13, "gold", 0.8);
		p.d(8, 2, "red", 0.5);
		p.d(7, 2, "red", 0.4);
		p.d(9, 2, "red", 0.4);
	},
	mortar(p) {
		p.l(5, 13, 11, 4, 2, 1.6, "red", 0.1);
		p.l(11, 4, 12.6, 1.6, 1.4, 0.3, "gold", 0.3);
		p.d(3, 14, "ember", 0.8);
		p.d(4, 15, "yellowGlow", 0.8);
	},
	cocoa(p) {
		p.r(3, 6, 8, 8, "red", 0.5);
		p.r(3, 6, 8, 2, "cookie", 0.45);
		p.d(11, 8, "red", 0.45);
		p.d(12, 9, "red", 0.4);
		p.d(11, 11, "red", 0.45);
		p.d(6, 3, "white", 0.6);
		p.d(8, 2, "white", 0.5);
	},
	minions(p) {
		p.l(6, 11, 4.5, 14.5, 1.5, 1.3, "cookie", 0.05);
		p.l(10, 11, 11.5, 14.5, 1.5, 1.3, "cookie", 0.05);
		p.e(8, 9.5, 3.6, 3.6, 0, "cookie", 0.1);
		p.l(5, 9, 2.4, 8, 1.3, 1, "cookie", 0.05);
		p.l(11, 9, 13.6, 8, 1.3, 1, "cookie", 0.1);
		p.e(8, 4.5, 3, 3, 0, "cookie", 0.14);
		p.d(7, 4, "dark", 0.2);
		p.d(9, 4, "dark", 0.2);
		p.r(5, 7, 6, 1, "green", 0.55);
	},
	peppermint(p) {
		p.e(8, 8, 5.4, 5.4, 0, "white", 0.15);

		for (let i = 0; i < 6; i++) {
			const angle = (i / 6) * Math.PI * 2;
			p.l(8, 8, 8 + Math.cos(angle) * 4.6, 8 + Math.sin(angle + 0.5) * 4.6, 0.7, 0.4, "red", 0.1);
		}
	},
	sleighBells(p) {
		p.e(5.4, 8, 3, 3, 0, "gold", 0.15);
		p.e(10.6, 9, 3, 3, 0, "gold", 0.05);
		p.d(5, 9, "dark", 0.2);
		p.d(10, 10, "dark", 0.2);
		p.l(3, 4, 13, 6, 0.6, 0.6, "red", 0.2);
	},
	tinsel(p) {
		for (let i = 0; i < 14; i++) {
			p.d(1 + i, 4 + i * 0.6 + (i % 2), "gold", 0.5 + (i % 3) * 0.15);
			p.d(1 + i, 6 + i * 0.6 - (i % 2), "white", 0.6);
		}
	},
	eggnog(p) {
		p.l(8, 13, 8, 4, 3.4, 4, "white", 0.15);
		p.r(4.5, 3, 7, 2, "cookie", 0.6);
		p.d(5, 3, "cookie", 0.8);
	},
	woolSocks(p) {
		p.l(6, 2, 6, 10, 2.6, 2.6, "red", 0.1);
		p.l(6, 10, 11, 12, 2.6, 2.4, "red", 0.15);
		p.r(3.5, 2, 5, 2, "white", 0.6);
		p.d(5, 6, "white", 0.5);
		p.d(7, 8, "white", 0.5);
	},
	fruitcake(p) {
		p.r(2, 7, 12, 6, "cookie", 0.4);
		p.r(2, 6, 12, 2, "white", 0.65);
		p.d(5, 10, "red", 0.5);
		p.d(9, 9, "green", 0.5);
		p.d(11, 11, "red", 0.5);
		p.d(7, 4, "red", 0.6);
	},
	stocking(p) {
		p.l(7, 2, 7, 10, 3, 3, "red", 0.1);
		p.l(7, 10, 12, 12.4, 3, 2.6, "red", 0.15);
		p.r(3.5, 1.5, 7, 2.4, "white", 0.65);
	},
	mistletoe(p) {
		p.l(8, 3, 4, 9, 1.4, 0.6, "green", 0.15);
		p.l(8, 3, 12, 9, 1.4, 0.6, "green", 0.05);
		p.l(8, 3, 8, 11, 1.4, 0.6, "green", 0.1);
		p.d(7, 5, "white", 0.85);
		p.d(9, 5, "white", 0.8);
		p.d(8, 6, "white", 0.85);
		p.l(8, 1, 8, 3, 0.6, 0.6, "red", 0.2);
	},
	hat(p) {
		p.e(8, 9, 5.5, 4.6, 0, "red", 0.1);
		p.r(2, 10, 12, 3, "white", 0.55);
		p.e(8, 3.4, 2.2, 2.2, 0, "white", 0.7);
	},
	scarf(p) {
		p.l(3, 5, 13, 5, 2, 2, "green", 0.15);
		p.l(10, 6, 11, 14, 2, 1.8, "green", 0.1);

		for (const [x, y] of [
			[5, 5],
			[9, 5],
			[11, 9],
			[11, 12],
		]) {
			p.d(x, y, "red", 0.5);
		}
	},
	mittens(p) {
		p.e(8, 8, 4, 4.6, 0, "red", 0.1);
		p.e(4, 7, 1.6, 2.4, -0.5, "red", 0.15);
		p.r(4, 12, 8, 2.6, "white", 0.55);
	},
	boots(p) {
		p.l(6, 3, 6, 11, 3, 3, "cookie", 0.15);
		p.l(6, 11, 12, 12, 3, 2.6, "cookie", 0.1);
		p.r(3, 3, 6, 2, "white", 0.6);
	},
	charm(p) {
		p.e(8, 8, 4.4, 4.6, 0, "steel", 0.2);
		p.d(8, 12, "steel", 0.8);
		p.l(8, 1, 8, 4, 0.6, 0.6, "red", 0.3);
		p.d(6, 6, "white", 0.9);
	},
	chains(p) {
		paintRows(p, CHAINS);
	},
	soldiers(p) {
		// A nutcracker's head and shoulders: the tall busby, the white face, the red coat.
		p.r(4.5, 1, 7, 5, "fur", 0.4);
		p.r(4.5, 5, 7, 1, "gold", 0.6);
		p.d(8, 3, "gold", 0.9);
		p.e(8, 8, 3, 2.6, 0, "porcelain", 0.25);
		p.r(6, 9, 4, 1.4, "white", 0.4);
		p.r(7, 8.5, 2, 1, "dark", 0.15);
		p.d(7, 7, "dark", 0.1);
		p.d(9, 7, "dark", 0.1);
		p.e(8, 13, 5, 2.6, 0, "red", 0.1);
		p.d(8, 13, "gold", 0.8);
	},
	advent(p) {
		// A calendar of little doors, one open, gold showing through.
		p.r(2.5, 3, 11, 11, "red", 0.35);
		p.r(2.5, 3, 11, 2, "green", 0.4);

		for (let row = 0; row < 3; row++) {
			for (let column = 0; column < 3; column++) {
				p.d(4.5 + column * 3.5, 6.5 + row * 2.6, "white", 0.55);
			}
		}

		p.d(8, 9.1, "gold", 0.95);
	},
	candle(p) {
		p.r(5.5, 6, 5, 9, "white", 0.5);
		p.d(8, 5, "dark", 0.2);
		p.d(8, 4, "gold", 0.9);
		p.d(8, 3, "glow", 0.9);
		p.d(8, 2, "yellowGlow", 0.9);
	},

	// The patrons' symbols, each from their portrait.
	// La Flor: a poinsettia, its red bracts round a gold heart.
	laFlor(p) {
		for (let i = 0; i < 5; i++) {
			const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
			p.e(8 + Math.cos(angle) * 3.6, 8 + Math.sin(angle) * 3.6, 3, 1.6, angle, "red", 0.1);
		}

		p.e(8, 8, 1.6, 1.6, 0, "gold", 0.3);
	},
	// Saint Lucia: her crown of candles, burning, in its wreath of lingonberry leaves.
	lucia(p) {
		p.e(8, 12, 6.6, 2.4, 0, "green", 0.08);

		for (const [x, y] of [
			[4, 13],
			[9, 13.5],
			[12, 12.6],
		]) {
			p.d(x, y, "red", 0.6);
		}

		for (const x of [4, 8, 12]) {
			p.r(x - 0.5, 6.5, 1.6, 5, "white", 0.55);
			p.d(x, 5, "glow", 0.9);
			p.d(x, 4, "yellowGlow", 0.95);
			p.d(x, 3, "yellowGlow", 0.75);
		}
	},
	// Ded Moroz: a star of ice.
	moroz(p) {
		for (let i = 0; i < 3; i++) {
			const angle = (i / 3) * Math.PI;
			p.l(
				8 - Math.cos(angle) * 6,
				8 - Math.sin(angle) * 6,
				8 + Math.cos(angle) * 6,
				8 + Math.sin(angle) * 6,
				0.8,
				0.8,
				"frost",
				0.15,
			);
		}

		p.d(8, 8, "frost", 0.95);
	},
	// The Christkind: a pair of wings, feathered, a halo over them.
	christkind(p) {
		paintRows(p, WINGS);
	},
	// The Yule Lads: two wooden spoons, licked clean, crossed, seen from above: each a thin handle
	// ending in a knob, and an egg-shaped bowl, its hollow dark, its far rim catching the light.
	yuleLads(p) {
		for (const side of [-1, 1]) {
			const bx = 8 + side * 3.4;
			const by = 4.6;
			const hx = 8 - side * 4.8;
			const hy = 14.2;
			const along = Math.atan2(by - hy, bx - hx);
			p.l(hx, hy, bx - Math.cos(along) * 3, by - Math.sin(along) * 3, 0.7, 0.6, "cookie", 0.06);
			p.e(hx, hy, 0.9, 0.9, 0, "cookie", 0.1);
			p.e(bx, by, 3, 2.3, along, "cookie", 0.24);
			p.e(bx - Math.cos(along) * 0.5, by - Math.sin(along) * 0.5, 2, 1.4, along, "cookie", -0.08);
			p.d(Math.round(bx + Math.cos(along) * 2), Math.round(by + Math.sin(along) * 2), "cookie", 0.75);
		}
	},
	// La Befana: her broom: the handle, two bands of red cord, and a long bundle of twigs along the
	// handle's line, drawn in at the cord and ragged at its end.
	befana(p) {
		const along = Math.atan2(6.6, -5.7);
		p.l(14.5, 1, 8.8, 7.6, 0.7, 0.7, "cookie", 0.02);

		for (let twig = -2; twig <= 2; twig++) {
			const angle = along + twig * 0.13;
			const length = 7.6 - Math.abs(twig) * 0.6;
			p.l(
				8.4,
				8.4,
				8.4 + Math.cos(angle) * length,
				8.4 + Math.sin(angle) * length,
				1,
				0.55,
				"gold",
				0.14 - Math.abs(twig) * 0.04,
			);
		}

		for (const twig of [-1, 1]) {
			const angle = along + twig * 0.07;
			p.l(8.6, 8.6, 8.6 + Math.cos(angle) * 6.4, 8.6 + Math.sin(angle) * 6.4, 0.3, 0.3, "cookie", 0.3);
		}

		p.l(7.6, 7.8, 9.6, 9.4, 0.7, 0.7, "red", 0.3);
		p.l(6.8, 8.8, 8.8, 10.4, 0.6, 0.6, "red", 0.2);
	},
	// The Yule Goat: a goat of straw bound in red, its long horns curling back (GOAT).
	yuleGoat(p) {
		paintRows(p, GOAT);
	},
	// Mari Lwyd: a horse's skull, its eye glowing green in its socket, its teeth bared, ribbons hanging.
	mariLwyd(p) {
		paintRows(p, SKULL);
	},
};

let urls: Record<IIconId, string> | null = null;

/** Each icon as an image URL, drawn the first time they're asked for. */
export function iconUrl(id: IIconId): string {
	if (!urls) {
		urls = Object.fromEntries(
			Object.entries(DRAWINGS).map(([key, draw]) => {
				const pen = new Pen(16, 16, 1);
				draw(pen);

				return [key, pen.sprite.render(RAMPS, RIMS, OUTLINE, 1, 0.6).toDataURL()];
			}),
		) as Record<IIconId, string>;
	}

	return urls[id];
}
