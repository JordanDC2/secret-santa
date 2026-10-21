/**
 * Little pictures (16 pixels square) for the weapons and passives, on the level-up cards and the
 * counters: drawn once by code in the game's style and kept as image URLs.
 */

import { Pen } from "Components/SilentNight/characters";
import { OUTLINE, RAMPS, RIMS } from "Components/SilentNight/palette";
import type { IGearSlot, IPassiveId, IWeaponId } from "Components/SilentNight/types";

type IIconId = IWeaponId | IPassiveId | IGearSlot;

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
	candle(p) {
		p.r(5.5, 6, 5, 9, "white", 0.5);
		p.d(8, 5, "dark", 0.2);
		p.d(8, 4, "gold", 0.9);
		p.d(8, 3, "glow", 0.9);
		p.d(8, 2, "yellowGlow", 0.9);
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
