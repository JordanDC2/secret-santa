/**
 * Ded Moroz, Grandfather Frost of Russia, as his portrait (portraitKit.ts): an old man in a tall
 * fur-banded hat and a long blue shuba stitched with silver frost, his white beard falling to
 * his waist, his staff topped with a star of ice. The ice is the light: cold, from above on the
 * right, and snow falls through it.
 */

import {
	canvasWith,
	clamp,
	fbm,
	figure,
	fur,
	hash,
	paintFigure,
	paintLayer,
	shade,
	type ITexture,
	paintSwirl,
	swirl,
	type ISwirlItem,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#2a1414", "#4e2626", "#7a3e36", "#a65a4a", "#c87a64", "#e09a80"],
	nose: ["#3a1010", "#6a2020", "#9a3a34", "#c05a4c", "#e07a68"],
	fur: ["#1a1e28", "#3a404e", "#626c7c", "#929cac", "#c4ccd8", "#eef2f8"],
	coat: ["#04060e", "#0a1226", "#121e40", "#1c2e5c", "#284480", "#3a5ea4"],
	silver: ["#2a2e38", "#5a606c", "#9aa2ae", "#d0d6de", "#f4f6fa"],
	wood: ["#120a06", "#24160c", "#3c2816", "#563c22", "#725232"],
	ice: ["#1a4a7a", "#4a8ac8", "#8ac8f0", "#d0f0ff", "#ffffff"],
	eye: ["#06080c", "#141a24", "#2a3a50", "#6a8aa8"],
};
// The cold light of the ice star, above him on the right.
const RIM: Record<string, string[]> = {
	skin: ["#a07080", "#d0a0b0", "#f0d0d8", "#fff0f4"],
	nose: ["#c07080", "#e0a0a8", "#f8d0d0", "#fff0f0"],
	fur: ["#a0c8f0", "#d0ecff", "#ffffff", "#ffffff"],
	coat: ["#3a6aa8", "#5a90d0", "#90c0f0", "#d0ecff"],
	silver: ["#c0e0ff", "#ffffff", "#ffffff", "#ffffff"],
	wood: ["#5a6a80", "#8aa0b8", "#c0d4e8", "#e8f4ff"],
};

const STAR = { x: 112, y: 16 };

/** A beard's strands: falling, waving a little, in locks. */
const beard: ITexture = (x, y) => 0.1 * Math.sin(x * 0.9 + 3 * fbm(x * 0.08, y * 0.035)) + 0.05 * (hash(x, y) - 0.5);

/** The ice star's cold light on what's near it. */
const chill = (x: number, y: number) => 0.14 * clamp(1 - Math.hypot(x - STAR.x, y - STAR.y) / 70);

export function drawMoroz(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, fill, light } = figure(RAMPS, RIM);

	// Swirling round him: snowflakes, six-armed, the bigger ones branched.
	const drawThing = (keep: IPut, { x, y, size, angle, front }: ISwirlItem) => {
		const arm = size * 1.1;
		const bias = front ? 0.1 : -0.35;

		for (let k = 0; k < 3; k++) {
			const a = angle + (k * Math.PI) / 3;
			limb(
				x - Math.cos(a) * arm,
				y - Math.sin(a) * arm,
				x + Math.cos(a) * arm,
				y + Math.sin(a) * arm,
				0.6,
				0.6,
				"ice",
				bias,
				null,
				keep,
			);
		}

		if (size > 5) {
			for (let k = 0; k < 6; k++) {
				const a = angle + (k * Math.PI) / 3;
				const bx = x + Math.cos(a) * arm * 0.6;
				const by = y + Math.sin(a) * arm * 0.6;

				for (const turn of [-1, 1]) {
					limb(
						bx,
						by,
						bx + Math.cos(a + turn) * arm * 0.35,
						by + Math.sin(a + turn) * arm * 0.35,
						0.5,
						0.5,
						"ice",
						bias,
						null,
						keep,
					);
				}
			}
		}
	};
	const things = swirl(82, 76, 62, 42, -0.12, 6);

	// --- The figure, back to front. ---

	// The staff, held upright on his left (our right), behind his arm.
	limb(112, 24, 110, 160, 1.8, 2.2, "wood", 0.05, (x, y) => 0.06 * Math.sin(y * 0.9 + x));

	// His long blue shuba: broad at the shoulders, falling wide to the ground.
	fill(
		62,
		160,
		(y) => {
			const half = y < 70 ? 14 + (y - 62) * 1.1 : 22.8 + (y - 70) * 0.14;

			return [79 - half, 79 + half];
		},
		"coat",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return (
				0.3 +
				0.18 * -across +
				0.26 * Math.sqrt(Math.max(0, 1 - across * across)) +
				0.04 * Math.sin((x - 79) * 0.5) +
				chill(x, y)
			);
		},
	);

	// Silver frost stitched over it: little six-pointed stars in rows.
	for (let row = 0; row < 4; row++) {
		for (let col = 0; col < 5; col++) {
			const cx = 60 + col * 10 + (row % 2) * 5;
			const cy = 92 + row * 14;

			if (Math.abs(cx - 79) < 6) {
				continue;
			}

			for (const [dx, dy] of [
				[0, 0],
				[0, -2],
				[0, 2],
				[-2, -1],
				[2, -1],
				[-2, 1],
				[2, 1],
			]) {
				put(cx + dx, cy + dy, "silver", dx === 0 && dy === 0 ? 0.7 : 0.45);
			}
		}
	}

	// Fur down the front and round the hem of his sleeves.
	limb(79, 70, 79, 160, 3.4, 4.6, "fur", 0.08, fur);

	// His arms: his right (our left) at his side; his left raised to grip the staff.
	limb(63, 68, 57, 100, 6, 6.4, "coat", -0.04);
	limb(57, 100, 56, 104, 7, 7, "fur", 0.02, fur);
	ellipse(56, 108, 4, 4.2, 0, "skin", -0.04);
	limb(95, 68, 104, 86, 6, 5.6, "coat", -0.08);
	limb(104, 86, 109, 80, 5.6, 5, "coat", -0.06);
	limb(108, 81, 110, 79, 5.6, 5.6, "fur", 0.04, fur);
	ellipse(111, 79, 4.2, 4.6, 0.3, "skin", 0);
	put(110, 77, "skin", 0.2);
	put(110, 80, "skin", 0.2);

	// His face: weathered, his cheeks and nose red with cold.
	ellipse(78, 46, 11, 13, 0, "skin", 0, chill);
	ellipse(70.5, 50, 3, 2.2, 0, "nose", 0.08);
	ellipse(85.5, 50, 3, 2.2, 0, "nose", 0.02);

	// Eyes: small and pale, deep under his brows, a glint of ice in each.
	for (const cx of [73, 83]) {
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, 45, "skin", 0.16);
		}

		put(cx - 1, 46, "eye", 0.1);
		put(cx, 46, "eye", 0.85);
		put(cx + 1, 46, "eye", 0.2);
		put(cx, 45, "eye", 0.05);
		put(cx - 1, 45, "eye", 0.05);
		put(cx + 1, 45, "eye", 0.05);
		put(cx - 1, 46, "fur", 1);

		// The crease under each eye.
		put(cx - 1, 48, "skin", 0.2);
		put(cx, 48, "skin", 0.22);
		put(cx + 1, 48, "skin", 0.24);
	}

	// His big red nose.
	ellipse(78.5, 49.5, 2.6, 2.6, 0, "nose", 0.12);

	// The beard: white, long and full, falling in strands to a point at his waist.
	fill(
		50,
		136,
		(y) => {
			const half = y < 58 ? 9 + (y - 50) * 0.8 : y < 80 ? 15.4 + (y - 58) * 0.08 : 17.2 - (y - 80) * 0.28;

			return half > 0.5 ? [78.5 - half, 78.5 + half] : null;
		},
		"fur",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return (
				0.42 +
				0.16 * -across +
				0.18 * Math.sqrt(Math.max(0, 1 - across * across)) +
				beard(x, y) -
				clamp((y - 100) / 60) * 0.12
			);
		},
	);

	// His moustache, sweeping out over the beard; the mouth hidden under it.
	petal(77, 53, 11, 3.2, Math.PI * 0.78, "fur", 0.18);
	petal(80, 53, 11, 3.2, Math.PI * 0.22, "fur", 0.12);
	put(78, 55, "nose", 0.05);
	put(79, 55, "nose", 0.05);

	// Bushy white brows, sweeping up and out.
	petal(76, 43, 8, 2.4, Math.PI + 0.32, "fur", 0.16);
	petal(81, 43, 8, 2.4, -0.32, "fur", 0.12);

	// His tall hat: blue velvet over a broad band of white fur, a silver star on its front.
	ellipse(78, 22, 12.5, 14, 0, "coat", 0.04, (x, y) => (y > 30 ? -1 : chill(x, y)));
	fill(
		30,
		37,
		(y) => [64.5 - (y - 30) * 0.2, 91.5 + (y - 30) * 0.2],
		"fur",
		(x, y, left, right) => {
			const across = ((x + 0.5 - left) / (right - left)) * 2 - 1;

			return 0.36 + 0.16 * -across + 0.22 * Math.sqrt(Math.max(0, 1 - across * across)) + fur(x, y) + chill(x, y);
		},
	);

	for (const [dx, dy, t] of [
		[0, 0, 0.9],
		[0, -2, 0.6],
		[0, 2, 0.6],
		[-2, -1, 0.5],
		[2, -1, 0.5],
		[-2, 1, 0.5],
		[2, 1, 0.5],
		[0, -3, 0.4],
		[0, 3, 0.4],
	]) {
		put(78 + dx, 21 + dy, "silver", t);
	}

	// --- Light: the ice star's, cold, above on the right; a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 20) / 150) * clamp((x - 54) / 36),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.55,
		outlineAbove: 128,
	});

	// --- The scene: the ice star's cold glow in the dark, a bitter mist drifting. ---
	const iceBg = ["#020308", "#050a14", "#0a1424", "#102038", "#182e4e", "#224068"];
	const { canvas, context } = canvasWith((x, y) => {
		const mist = fbm(x * 0.03 + 7, y * 0.05);
		const glow = clamp(1 - Math.hypot((x - STAR.x) / 100, (y - STAR.y) / 85));
		const dark = clamp(1 - y / 200) * clamp(1 - Math.abs(x - 110) / 240);

		return shade(x, y, (glow * 0.9 + mist * 0.26 - 0.1) * dark, iceBg);
	});

	// Snow falling: small and dim far off, larger and lit nearer.
	const snow = (front: boolean) =>
		paintLayer(
			context,
			(keep) => {
				for (let i = 0; i < 70; i++) {
					if ((i % 6 === 0) !== front) {
						continue;
					}

					const x = Math.round(hash(i, 7) * 256);
					const y = Math.round(hash(i, 8) * 160);
					const t = front ? 0.95 : 0.4 + hash(i, 9) * 0.4;
					keep(x, y, "fur", t * clamp(1.2 - y / 200));

					if (front) {
						keep(x + 1, y, "fur", t * 0.8);
						keep(x, y + 1, "fur", t * 0.8);
						keep(x + 1, y + 1, "fur", t * 0.6);
					}
				}
			},
			RAMPS,
			null,
		);

	snow(false);
	paintSwirl(context, things, false, drawThing, RAMPS, RIM);
	paintFigure(context, colours);
	paintSwirl(context, things, true, drawThing, RAMPS, RIM);

	// The star of ice on his staff, shining.
	paintLayer(
		context,
		(keep) => {
			for (let i = 0; i < 6; i++) {
				petal(STAR.x, STAR.y, 9, 2.4, (i / 6) * Math.PI * 2 - Math.PI / 2, "ice", 0.2, keep);
			}

			for (let i = 0; i < 6; i++) {
				petal(STAR.x, STAR.y, 5, 1.6, (i / 6) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6, "ice", 0.1, keep);
			}

			keep(STAR.x, STAR.y, "ice", 1);
			keep(STAR.x - 1, STAR.y, "ice", 0.95);
			keep(STAR.x, STAR.y - 1, "ice", 0.95);
		},
		RAMPS,
		null,
	);
	snow(true);

	return canvas;
}
