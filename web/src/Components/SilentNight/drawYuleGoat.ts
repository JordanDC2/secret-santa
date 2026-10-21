/**
 * The Yule Goat of Scandinavia, as his portrait (portraitKit.ts): a great goat of bound straw,
 * tied round with red ribbons, his horns curling back, a straw beard; and burning, as straw
 * goats have a way of doing, standing on the snow on his four bound legs: charred black in places, embers glowing in the burns, flames
 * licking along his back, his eyes like coals. Smoke and fire behind him, embers and loose straw
 * drifting up.
 */

import {
	canvasWith,
	clamp,
	fbm,
	figure,
	hash,
	paintFigure,
	paintLayer,
	shade,
	type ITexture,
	paintSwirl,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	straw: ["#0c0804", "#1e1408", "#38280e", "#584016", "#7a5c20", "#9c7a2e"],
	ribbon: ["#16030a", "#320810", "#560e1a", "#7c1626", "#a02234"],
	fire: ["#7a1a08", "#e0502a", "#ffa040", "#ffe080", "#fff8d0"],
	eye: ["#040302", "#0e0a06", "#2a2016", "#d8c8a0"],
	sky: ["#030202", "#0c0504", "#1a0806", "#2e0c08", "#4a1208", "#6e1c0a"],
	ember: ["#7a1a08", "#e0502a", "#ffb060", "#fff0a0"],
	snow: ["#0a0806", "#1a1410", "#2e241c", "#46382a"],
};
// Firelight from behind him, low on the right.
const RIM: Record<string, string[]> = {
	straw: ["#e08a30", "#ffb050", "#ffe090", "#fff8d0"],
	ribbon: ["#e04a30", "#ff7a50", "#ffb080", "#ffe0c0"],
};

/** Where the straw's burnt, from none (0) to charred black (1). */
const burnt = (x: number, y: number) => clamp((fbm(x * 0.07 + 5, y * 0.07) - 0.46) * 4) * clamp(0.6 + (y - 60) / 70);

/** Straw bound along a direction: fine stalks running that way, charred where it's burnt. */
const stalks =
	(angle: number): ITexture =>
	(x, y) => {
		const across = -x * Math.sin(angle) + y * Math.cos(angle);

		return 0.12 * Math.sin(across * 1.7 + 2 * fbm(x * 0.05, y * 0.05)) + 0.06 * (hash(x, y) - 0.5) - 0.45 * burnt(x, y);
	};

/** His horn, root to tip, as points along it and how thick it is at each. */
const HORN: Array<[number, number, number]> = [
	[95, 52, 5.4],
	[92, 38, 5],
	[84, 27, 4.4],
	[72, 22, 3.6],
	[61, 25, 2.8],
	[55, 34, 2.2],
	[58, 42, 1.4],
];

/** The top of his body's bundle, where flames lick along his back. */
const backAt = (x: number) => 110 - 22 * Math.sqrt(Math.max(0, 1 - ((x - 54) / 50) ** 2));

export function drawYuleGoat(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, filled, light } = figure(RAMPS, RIM);

	// Loose straw carried up off the fire on the heat, turning as it rises.
	const drawThing = (keep: IPut, { x, y, size, angle, front }: ISwirlItem) => {
		const along = { x: Math.cos(angle), y: Math.sin(angle) };
		limb(
			x - along.x * size,
			y - along.y * size,
			x + along.x * size,
			y + along.y * size,
			0.55,
			0.4,
			"straw",
			front ? 0.2 : -0.1,
			null,
			keep,
		);
		limb(
			x,
			y,
			x + Math.cos(angle + 0.35) * size * 0.8,
			y + Math.sin(angle + 0.35) * size * 0.8,
			0.45,
			0.3,
			"straw",
			front ? 0.15 : -0.15,
			null,
			keep,
		);
	};
	const things: ISwirlItem[] = Array.from({ length: 18 }, (_, index) => {
		const t = index / 17;

		return {
			x: 40 + Math.sin(t * 9 + 0.5) * (8 + t * 30) + t * 10,
			y: 100 - t * 96,
			size: 8 * (1 - 0.45 * t),
			angle: index * 1.1,
			front: false,
			index,
		};
	});

	/** A red ribbon tied round a bundle: a band across the line from (x1, y1) to (x2, y2), at `t` along it, `half` wide. */
	const band = (x1: number, y1: number, x2: number, y2: number, t: number, half: number) => {
		const length = Math.hypot(x2 - x1, y2 - y1);
		const px = -(y2 - y1) / length;
		const py = (x2 - x1) / length;
		const cx = x1 + (x2 - x1) * t;
		const cy = y1 + (y2 - y1) * t;
		limb(cx - px * half, cy - py * half, cx + px * half, cy + py * half, 1.6, 1.6, "ribbon", 0.12);
	};

	// --- The figure, back to front. ---

	// The far horn, darker, curling back behind the near one.
	for (let i = 0; i < HORN.length - 1; i++) {
		const [x1, y1, r1] = HORN[i];
		const [x2, y2, r2] = HORN[i + 1];
		limb(x1 + 8, y1 - 2, x2 + 8, y2 - 2, r1 * 0.9, r2 * 0.9, "straw", -0.2, stalks(Math.atan2(y2 - y1, x2 - x1)));
	}

	// His far legs, darker, behind.
	for (const [x1, x2] of [
		[26, 22],
		[80, 78],
	]) {
		limb(x1, 116, x2, 148, 5, 4.2, "straw", -0.14, stalks(Math.PI / 2));
	}

	// His body, a great bundle of straw, bound lengthwise.
	ellipse(54, 110, 50, 22, -0.04, "straw", -0.02, stalks(-0.04));

	// His near legs, straw bound tight, splaying a little at the hoof.
	for (const [x1, x2] of [
		[36, 38],
		[94, 97],
	]) {
		limb(x1, 118, x2, 148, 5.6, 4.6, "straw", 0.02, stalks(Math.PI / 2));
		petal(x2, 146, 7, 3.4, Math.PI / 2, "straw", -0.04);
	}

	// His chest, and his neck rising short and thick to his head.
	ellipse(88, 104, 20, 18, 0, "straw", 0, stalks(-1.2));
	limb(84, 100, 98, 70, 16, 12.5, "straw", 0.02, stalks(Math.atan2(70 - 100, 98 - 84)));

	// His head, his snout reaching down to the right, an ear back.
	ellipse(99, 61, 13, 11.5, 0, "straw", 0.04, stalks(0.4));
	limb(102, 64, 130, 80, 10, 6.4, "straw", 0.06, stalks(Math.atan2(16, 28)));
	petal(90, 60, 13, 4, Math.PI + 0.35, "straw", -0.02);

	// His beard, straggling straws hanging from his chin.
	for (let i = 0; i < 6; i++) {
		const x = 114 + i * 1.6;
		limb(x, 80, x - 2 + hash(i, 77) * 3, 92 + hash(i, 78) * 6, 1, 0.5, "straw", -0.06 + (i % 2) * 0.08);
	}

	// The near horn, sweeping up and curling back.
	for (let i = 0; i < HORN.length - 1; i++) {
		const [x1, y1, r1] = HORN[i];
		const [x2, y2, r2] = HORN[i + 1];
		limb(x1, y1, x2, y2, r1, r2, "straw", 0.04, stalks(Math.atan2(y2 - y1, x2 - x1)));
	}

	// Red ribbons bound round him: round his neck, his snout, the root of his horn, his body and his legs.
	for (const t of [0.25, 0.7]) {
		band(84, 100, 98, 70, t, 15 - t * 3.5);
	}

	band(102, 64, 130, 80, 0.55, 8);
	band(95, 52, 90, 37, 0.3, 5);

	for (const x of [24, 62]) {
		band(x - 10, 110, x + 10, 110, 0.5, 21 - Math.abs(x - 54) * 0.12);
	}

	for (const [x1, x2] of [
		[36, 38],
		[94, 97],
	]) {
		band(x1, 118, x2, 148, 0.55, 5.6);
	}

	// A bow at his throat.
	petal(104, 92, 9, 3.6, Math.PI * 0.85, "ribbon", 0.1);
	petal(104, 92, 9, 3.6, Math.PI * 0.15, "ribbon", 0.04);
	limb(104, 92, 101, 102, 1.4, 1, "ribbon", 0.06);
	limb(104, 92, 108, 101, 1.4, 1, "ribbon", 0.1);
	ellipse(104, 92, 2.2, 2.2, 0, "ribbon", 0.2);

	// His eye socket: dark, for the coal of his eye (painted over the dark, below).
	ellipse(107, 62, 2.4, 2.2, 0, "eye", 0.02);

	// His nostril.
	put(128, 78, "eye", 0.1);

	// --- Light: the fire behind him, low on the right; a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp((y - 10) / 80) * clamp((x - 40) / 50),
		fade: (_x, y) => clamp((y - 120) / 40) * 0.5,
		outlineAbove: 136,
	});

	// --- The scene: fire glowing up behind him in the dark, snow below. ---
	const { canvas, context } = canvasWith((x, y) => {
		const smoke = fbm(x * 0.03 + 51, y * 0.05 - 2);

		if (y > 140 + Math.round(fbm(x * 0.05, 9) * 6)) {
			return shade(x, y, 0.3 + clamp(1 - Math.abs(x - 170) / 120) * 0.5 + smoke * 0.1, RAMPS.snow);
		}

		const fire = clamp(1 - Math.hypot((x - 170) / 130, (y - 170) / 120));
		// Smoke rolling up in dark plumes across the glow.
		const plume = clamp((fbm(x * 0.02 + 8, y * 0.03 + x * 0.004) - 0.45) * 3);

		return shade(x, y, (fire * 1.05 + smoke * 0.25 - 0.12) * (1 - plume * 0.6), RAMPS.sky);
	});

	// Embers and loose straw drifting up on the heat.
	const drift = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				for (let i = 0; i < 44; i++) {
					if ((i % 5 === 0) !== front) {
						continue;
					}

					const x = Math.round(hash(i, 61) * 256);
					const y = Math.round(20 + hash(i, 62) * 130);

					if (i % 3 === 0) {
						// A stalk of straw, tumbling.
						const angle = hash(i, 63) * Math.PI;

						for (let s = 0; s < 4; s++) {
							keep(
								Math.round(x + Math.cos(angle) * s),
								Math.round(y + Math.sin(angle) * s),
								"straw",
								front ? 0.8 : 0.4,
							);
						}
					} else {
						keep(x, y, "ember", 0.4 + hash(i, 64) * 0.6);

						if (front) {
							keep(x, y - 1, "ember", 0.5);
						}
					}
				}
			},
			RAMPS,
			null,
		);

	drift(false);
	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);

	// Embers glowing in the burnt straw, his eye like a coal, and flames licking along his back.
	paintLayer(
		context,
		(keep) => {
			for (let y = 0; y < 160; y++) {
				for (let x = 0; x < 256; x++) {
					if (filled(x, y) && burnt(x, y) > 0.5 && hash(x, y) > 0.9) {
						keep(x, y, "fire", 0.3 + hash(y, x) * 0.5);
					}
				}
			}

			ellipse(107, 62, 1.6, 1.4, 0, "fire", -0.05, null, keep);
			keep(106, 61, "fire", 0.7);

			// A ragged blaze along his back: tongues of flame of every height, licking up and
			// wavering, dark red at their edges, white-hot down at their roots.
			for (let x = 4; x <= 104; x++) {
				const back = backAt(x) + 4;
				const height = 10 + 26 * clamp(1 - Math.abs(x - 50) / 54);

				for (let y = Math.floor(back - height * 1.4); y <= back; y++) {
					const tongue = 0.5 + 0.5 * Math.sin(x * 0.55 + fbm(x * 0.08, y * 0.06) * 7);
					const up = (back - y) / (height * (0.35 + 0.75 * tongue));
					const heat = 1 - up - 0.4 * (fbm(x * 0.2 + 3, y * 0.15) - 0.5);

					if (heat > 0) {
						keep(x, y, "fire", clamp(heat * 1.15) * 0.88);
					}
				}
			}

			// Flames tearing loose above it.
			for (let i = 0; i < 8; i++) {
				const x = 14 + i * 11 + (hash(i, 75) - 0.5) * 6;
				const y = backAt(x) - 22 - hash(i, 76) * 16 * clamp(1 - Math.abs(x - 50) / 54);
				petal(x, y, 5 + hash(i, 77) * 3, 1.4, -Math.PI / 2 + (hash(i, 78) - 0.5) * 0.5, "fire", -0.1, keep);
			}
		},
		RAMPS,
		null,
	);
	drift(true);

	return canvas;
}
