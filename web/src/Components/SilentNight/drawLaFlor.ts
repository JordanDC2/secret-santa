/**
 * La Flor de Nochebuena, the poinsettia patron of Silent Night, as her portrait: the reference
 * for the game's look (portraitKit.ts). Pixel art in the style of Death Must Die: dark and moody,
 * backlit by warm candlelight that rims the figure, a dim cool key light from the front left,
 * dithered shading in rich ramps, a dark outline only on the shadowed side, fog, and petals
 * swirling in the dark.
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
	strands,
	type IPut,
} from "Components/SilentNight/portraitKit";

const RAMPS: Record<string, string[]> = {
	skin: ["#2a1410", "#4a2618", "#6e3e26", "#93583a", "#b5774f", "#d39a6c"],
	hair: ["#060309", "#0f0810", "#1a0f17", "#291820", "#3d242b", "#563439"],
	red: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648", "#f2666a"],
	leaf: ["#05120c", "#0c2416", "#163b22", "#245630", "#387640", "#589a56"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060", "#fff0a8"],
	eye: ["#0b0507", "#1e0f0a", "#3a2010", "#5a3418"],
	white: ["#8a7a72", "#c9b8ac", "#f2e6da"],
};
// Candlelight from behind her, on the right: each material's rim.
const RIM: Record<string, string[]> = {
	skin: ["#b85a3a", "#f08c56", "#ffbe84", "#ffe2b8"],
	hair: ["#4a2028", "#8a3a34", "#c86a4a", "#f0a070"],
	red: ["#b0283a", "#f05a5a", "#ff9a7a", "#ffd0a0"],
	leaf: ["#3a5a2a", "#7a8a3a", "#c0b060", "#f0e090"],
	gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
	eye: ["#3a2010", "#5a3418", "#8a5a30", "#c08a50"],
	white: ["#f2e6da", "#ffffff", "#ffffff", "#ffffff"],
};

/** Draws her portrait on a new 256 × 160 canvas. */
export function drawLaFlor(): HTMLCanvasElement {
	const { put, ellipse, petal, limb, filled, light } = figure(RAMPS, RIM);

	// --- The figure, back to front. ---

	// Her hair behind her, streaming to the left in the wind.
	ellipse(78, 52, 19, 22, 0, "hair", -0.05, strands);
	ellipse(62, 74, 13, 24, 0.35, "hair", -0.08, strands);
	ellipse(52, 100, 10, 22, 0.3, "hair", -0.12, strands);
	ellipse(44, 124, 7, 18, 0.25, "hair", -0.16, strands);

	// The poinsettia's green leaves, under the bracts of her skirt.
	for (const [angle, len] of [
		[0.18, 46],
		[2.96, 46],
		[0.5, 50],
		[2.64, 50],
	]) {
		petal(78, 112, len, 9, angle, "leaf", -0.02);
	}

	// Her skirt: layers of bracts fanning from her waist, the back layer darker.
	for (let i = 0; i < 9; i++) {
		petal(78, 104, 66, 15, Math.PI / 2 + (i - 4) * 0.2, "red", -0.12);
	}

	for (let i = 0; i < 7; i++) {
		petal(78, 106, 56, 14, Math.PI / 2 + (i - 3) * 0.21, "red", -0.02);
	}

	// Bare shoulders and slim arms, then her bodice of deep red bracts, and bract sleeves off her shoulders.
	ellipse(68, 72, 6.5, 4, 0.3, "skin", -0.04);
	ellipse(88, 72, 6.5, 4, -0.3, "skin", -0.06);
	// Her upper arms, at her sides from shoulder to elbow (her forearms come in front, later).
	limb(67, 74, 60, 93, 4.2, 3.4, "skin", -0.04);
	limb(89, 74, 96, 93, 4.2, 3.4, "skin", -0.06);
	ellipse(78, 88, 11.5, 17, 0, "red", -0.26);

	for (const angle of [-Math.PI / 2 - 0.38, -Math.PI / 2 - 0.13, -Math.PI / 2 + 0.13, -Math.PI / 2 + 0.38]) {
		petal(78, 106, 32, 6.5, angle, "red", -0.22);
	}

	petal(69, 73, 14, 5, 2.6, "red", -0.02);
	petal(87, 73, 14, 5, 0.55, "red", -0.04);

	// Her neck, and her face.
	// A short, slim neck, in shadow under her chin, and a gold choker with a little poinsettia.
	ellipse(78, 61, 3.6, 5, 0, "skin", -0.14, (x, y) => (y < 60 ? -0.12 : 0));

	for (let x = 75; x <= 81; x++) {
		put(x, 63, "gold", x === 78 ? 0.85 : 0.55);
	}

	for (const [dx, dy] of [
		[0, 1],
		[-1, 2],
		[1, 2],
		[0, 3],
	]) {
		put(78 + dx, 63 + dy, "red", 0.7);
	}

	put(78, 65, "gold", 0.95);
	// Her face, rounded softly by the light, a shadow under her jaw.
	ellipse(78, 44, 12, 15, 0, "skin", 0, (x, y) => {
		const across = (x + 0.5 - 78) / 12;

		return 0.06 * Math.sqrt(Math.max(0, 1 - across * across)) - 0.03 - 0.06 * clamp((y - 55) / 3);
	});

	// Her hair falling over her right shoulder.
	ellipse(96, 74, 5.5, 15, -0.18, "hair", -0.02, strands);
	ellipse(99, 92, 4.5, 11, -0.08, "hair", -0.06, strands);

	// The fringe, parted, framing her face, and locks down either cheek.
	for (let y = 28; y <= 44; y++) {
		for (let x = 62; x <= 94; x++) {
			const dx = (x + 0.5 - 78) / 13;
			const dy = (y + 0.5 - 44) / 16;

			if (dx * dx + dy * dy <= 1 && y <= 34 + Math.abs(x + 0.5 - 76) * 0.55) {
				put(x, y, "hair", 0.28 + (x < 76 ? 0.1 : -0.04) + strands(x, y));
			}
		}
	}

	ellipse(66.5, 48, 2.6, 11, 0.08, "hair", -0.04, strands);
	ellipse(89.5, 48, 2.6, 11, -0.08, "hair", -0.1, strands);

	// Her face: knowing, half-lidded eyes looking out at you; brows level and soft; a shaded
	// nose; a soft smile.
	for (const [cx, out] of [
		[73, -1],
		[84, 1],
	]) {
		// A crease above the eye, and the upper lid, heavy and lashed, flicking up at the outer corner.
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, 42, "skin", 0.2);
			put(cx + dx, 43, "eye", 0.05);
			put(cx + dx, 44, "eye", Math.abs(dx) === 2 ? 0.1 : 0.16);
		}

		put(cx - 3, 44, "eye", 0.1);
		put(cx + 3, 44, "eye", 0.1);
		put(cx + out * 3, 43, "eye", 0);
		put(cx + out * 4, 42, "eye", 0.05);
		// Under the lid: a little white at the corners, a dark brown iris looking straight out, a catchlight.
		put(cx - 2, 45, "white", 0.1);
		put(cx + 2, 45, "white", 0.08);
		put(cx - 1, 45, "white", 0.95);
		put(cx, 45, "eye", 0.15);
		put(cx + 1, 45, "eye", 0.5);

		// The lower lid, a soft shadow.
		for (let dx = -2; dx <= 2; dx++) {
			put(cx + dx, 46, "skin", 0.2);
		}

		// The brow: full and level from its inner end by her nose, tapering down to a fine tail,
		// in her soft hair brown, close over the eye. (`inner` counts toward her nose.)
		for (const [inner, y, t] of [
			[2, 39, 0.34],
			[2, 40, 0.42],
			[1, 39, 0.3],
			[1, 40, 0.42],
			[0, 39, 0.32],
			[0, 40, 0.44],
			[-1, 39, 0.36],
			[-2, 39, 0.42],
			[-3, 40, 0.48],
		]) {
			put(cx - out * inner, y, "hair", t);
		}
	}

	// The nose: shadow down the side away from the light, a soft tip, nostrils.
	for (let y = 45; y <= 49; y++) {
		put(80, y, "skin", 0.22);
	}

	// A soft light down the bridge, on the lit side of the shadow.
	put(79, 47, "skin", 0.42);
	put(79, 48, "skin", 0.44);
	put(79, 50, "skin", 0.25);
	put(78, 50, "skin", 0.6);
	put(77, 51, "skin", 0.14);
	put(79, 51, "skin", 0.12);
	put(78, 51, "skin", 0.32);
	put(78, 52, "skin", 0.22);

	// The mouth: a soft smile, both corners turned up a little, a small upper lip with a gentle
	// bow over a fuller, lighter lower lip.
	for (const [x, y, t] of [
		[75, 54, 0.3],
		[81, 54, 0.3],
		[77, 54, 0.26],
		[78, 54, 0.22],
		[79, 54, 0.26],
		[76, 55, 0.36],
		[77, 55, 0.42],
		[78, 55, 0.46],
		[79, 55, 0.42],
		[80, 55, 0.36],
		[77, 56, 0.42],
		[78, 56, 0.48],
		[79, 56, 0.42],
	]) {
		put(x, y, "red", t);
	}

	put(76, 54, "skin", 0.2);
	put(80, 54, "skin", 0.2);
	put(78, 57, "skin", 0.18);

	// Her bouquet of humble weeds, blooming red, held in her hands.
	for (let i = 0; i < 20; i++) {
		put(74 + Math.round(i * 0.1), 84 + i, "leaf", 0.4);
		put(78, 82 + i, "leaf", 0.55);
		put(82 - Math.round(i * 0.1), 85 + i, "leaf", 0.4);
	}

	petal(74, 94, 9, 3, 3.6, "leaf", 0.05);
	petal(82, 95, 9, 3, -0.45, "leaf", 0);

	// Her forearms, from her elbows in front of her bodice, and her hands clasped round the stems.
	limb(60, 93, 73, 101, 3.4, 2.7, "skin", -0.02);
	limb(96, 93, 83, 101, 3.4, 2.7, "skin", -0.05);
	// Her hands meeting round the stems, each from its own side: her left over her right, its
	// fingers wrapped across the back of the other.
	ellipse(75.5, 101, 4, 3.2, -0.35, "skin", -0.04);
	ellipse(80.5, 101, 4, 3.2, 0.35, "skin", 0);

	for (const y of [99.4, 101.2, 103]) {
		limb(80, y, 75.6, y + 0.4, 0.85, 0.75, "skin", 0.1);
	}

	const bloom = (cx: number, cy: number, size: number, petals: number, turn: number, bias = 0, target: IPut = put) => {
		for (let i = 0; i < petals; i++) {
			petal(cx, cy, size, size * 0.4, turn + (i / petals) * Math.PI * 2, "red", bias, target);
		}

		for (const [dx, dy, t] of [
			[0, 0, 0.9],
			[-1, 0, 0.6],
			[1, -1, 0.75],
			[0, -1, 0.5],
			[-1, 1, 0.4],
		]) {
			target(cx + dx, cy + dy, "gold", t);
		}
	};

	// Each bloom set apart from the ones behind it by its shadow, leaves tucked between them.
	const shadowed = (cx: number, cy: number, size: number, petals: number, turn: number, bias: number) => {
		for (let i = 0; i < petals; i++) {
			petal(cx, cy + 1, size + 1, (size + 1) * 0.42, turn + (i / petals) * Math.PI * 2, "red", -0.3);
		}

		bloom(cx, cy, size, petals, turn, bias);
	};

	petal(70, 78, 7, 2.6, 3.9, "leaf", 0.02);
	petal(87, 80, 7, 2.6, -0.7, "leaf", -0.02);
	shadowed(73, 82, 6, 6, 0.3, 0.1);
	shadowed(84, 84, 5.5, 6, -0.2, 0.08);
	shadowed(78, 76, 7, 7, 0, 0.18);

	// Her crown: three poinsettias.
	bloom(65, 33, 8, 7, 0.4, 0.04);
	bloom(91, 33, 8, 7, -0.25, 0);
	bloom(78, 25, 10, 8, 0, 0.08);

	// --- Light: rim light from the candle behind her, high on the right; a fade into the dark below. ---
	const colours = light({
		side: 1,
		reach: (x, y) => clamp(1 - (y - 40) / 140) * clamp((x - 50) / 40),
		fade: (_x, y) => clamp((y - 112) / 48) * 0.55,
		outlineAbove: 128,
	});

	// --- The scene: candlelight behind her, high on the right of her; a cold mist drifting on the far right. ---
	const warmBg = ["#040208", "#0e0510", "#1c0814", "#2e0c1a", "#481222", "#64182a"];
	const coldBg = ["#030508", "#070c12", "#0c161c", "#112228", "#163236", "#1e4644"];
	const { canvas, context } = canvasWith((x, y) => {
		const fog = fbm(x * 0.035 + 3, y * 0.06);
		const warm = clamp(1 - Math.hypot((x - 100) / 95, (y - 40) / 80));
		const cold = clamp(1 - Math.hypot((x - 215) / 100, (y - 75) / 80)) * (0.6 + fog * 1.2);
		const dark = clamp(1 - y / 200) * clamp(1 - Math.abs(x - 128) / 260);
		// Where the warm light and the cold mist meet, dithered from one to the other rather than cut.
		const ramp = warm * 1.1 - cold > (hash(x, y) - 0.5) * 0.5 ? warmBg : coldBg;

		return shade(x, y, (Math.max(warm * 0.85, cold * 0.7) + fog * 0.28 - 0.08) * dark, ramp);
	});

	// Petals swirling round her in the dark: small and dim far behind, larger and lit nearer.
	const swirl: Array<{ x: number; y: number; size: number; angle: number; front: boolean }> = [];

	for (let i = 0; i < 22; i++) {
		const angle = i * 0.83 + 0.4;
		const radius = 36 + i * 3.4;
		const x = 82 + Math.cos(angle) * radius * 1.35;
		const y = 66 + Math.sin(angle) * radius * 0.62;
		// The near ones kept off her, so none lands on her as a patch.
		swirl.push({
			x,
			y,
			size: 2.5 + (i % 5) * 1.3,
			angle: angle * 1.7,
			front: i % 4 === 1 && !filled(Math.round(x), Math.round(y)),
		});
	}

	const paint = (front: boolean) => {
		for (const p of swirl.filter((q) => q.front === front)) {
			paintLayer(
				context,
				(keep) => petal(p.x, p.y, p.size * 2, p.size * 0.75, p.angle, "red", front ? 0.05 : -0.22, keep),
				RAMPS,
				front ? RIM : null,
			);
		}
	};

	paint(false);
	paintFigure(context, colours);
	paint(true);

	return canvas;
}
