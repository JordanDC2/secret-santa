/**
 * The gun's magazine, as 20 Minutes Till Dawn shows it: a row of the gun's own rounds (candy
 * canes, walnut shells, icicles, bells, candles, snowballs), the ones fired dimmed, filling back
 * up as it reloads.
 */

import type { IGunId } from "Components/SilentNight/types";

/** Each gun's round, as rows of pixels: a letter is a colour (below), a dot is empty. */
const ROUNDS: Record<IGunId, string[]> = {
	gun: ["ww", "rr", "ww", "rr", "ww", "rr"],
	blunderbuss: [".b.", "bdb", ".b."],
	crossbow: ["ww", "ii", "ii", "ii", "i.", "i."],
	pistols: [".g.", "ggg", "ggg", ".d."],
	romanCandle: [".f", "rr", "rg", "rr", "rg", "rr"],
	snowCannon: [".ww.", "wwww", "wwsw", ".ss."],
};

const COLOURS: Record<string, string> = {
	w: "#f2e8e0",
	r: "#d73648",
	b: "#a07040",
	d: "#5a3a1c",
	i: "#9ad0f0",
	g: "#ffd060",
	f: "#ffa040",
	s: "#8a9aac",
};

/** Rounds to a row before the next row starts. */
const PER_ROW = 20;

/** Draws `magazine` rounds of `gun` on `canvas`, `loaded` of them bright. */
export function drawAmmo(canvas: HTMLCanvasElement, gun: IGunId, loaded: number, magazine: number) {
	const round = ROUNDS[gun];
	const width = round[0].length;
	const height = round.length;
	const columns = Math.min(PER_ROW, magazine);
	const rows = Math.ceil(magazine / PER_ROW);
	canvas.width = columns * (width + 1) - 1;
	canvas.height = rows * (height + 1) - 1;
	const context = canvas.getContext("2d")!;

	for (let i = 0; i < magazine; i++) {
		const left = (i % PER_ROW) * (width + 1);
		const top = Math.floor(i / PER_ROW) * (height + 1);
		context.globalAlpha = i < loaded ? 1 : 0.25;

		round.forEach((line, y) => {
			[...line].forEach((pixel, x) => {
				if (pixel !== ".") {
					context.fillStyle = COLOURS[pixel];
					context.fillRect(left + x, top + y, 1, 1);
				}
			});
		});
	}
}
