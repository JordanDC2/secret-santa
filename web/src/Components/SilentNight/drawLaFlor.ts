/**
 * La Flor de Nochebuena, the poinsettia patron of Silent Night, as her portrait (256 × 160
 * pixels): the reference for the game's look. Pixel art in the style of Death Must Die: dark and
 * moody, backlit by warm candlelight that rims the figure, a dim cool key light from the front
 * left, dithered shading in rich ramps, a dark outline only on the shadowed side, fog, and
 * petals swirling in the dark. Drawn by code, so it can be drawn at any size: shapes write a
 * material and a brightness into a buffer; a rim-light pass, a fade into the dark at the bottom
 * and dithered palettes turn that into pixels.
 */

type IMaterial = "skin" | "hair" | "red" | "leaf" | "gold" | "eye" | "white";
type IPut = (x: number, y: number, material: IMaterial, t: number) => void;

const bayer = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** A colour from a ramp for brightness t (0 to 1), dithered only where one shade meets the next. */
const shade = (x: number, y: number, t: number, ramp: string[]) => {
	const v = clamp(t) * (ramp.length - 1);
	const i = Math.floor(v);
	const f = clamp((v - i - 0.5) * 2.4 + 0.5);

	return ramp[Math.min(ramp.length - 1, f > (bayer[y & 3][x & 3] + 0.5) / 16 ? i + 1 : i)];
};

// Value noise, for fog, hair strands and texture.
const hash = (x: number, y: number) => {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;

	return s - Math.floor(s);
};
const noise = (x: number, y: number) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const a = hash(xi, yi);
	const b = hash(xi + 1, yi);
	const c = hash(xi, yi + 1);
	const d = hash(xi + 1, yi + 1);

	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x: number, y: number) =>
	noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;

// Hair: dark, with strands streaming in the wind.
const strands = (x: number, y: number) =>
	0.13 * Math.sin(x * 0.55 - y * 0.32 + 4 * fbm(x * 0.05, y * 0.05)) + 0.05 * (hash(x, y) - 0.5);

/** Draws her portrait on a new 256 × 160 canvas, to show scaled up with `image-rendering: pixelated`. */
export function drawLaFlor(): HTMLCanvasElement {
	const W = 256;
	const H = 160;
	const RAMPS: Record<IMaterial, string[]> = {
		skin: ["#2a1410", "#4a2618", "#6e3e26", "#93583a", "#b5774f", "#d39a6c"],
		hair: ["#060309", "#0f0810", "#1a0f17", "#291820", "#3d242b", "#563439"],
		red: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648", "#f2666a"],
		leaf: ["#05120c", "#0c2416", "#163b22", "#245630", "#387640", "#589a56"],
		gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060", "#fff0a8"],
		eye: ["#0b0507", "#1e0f0a", "#3a2010", "#5a3418"],
		white: ["#8a7a72", "#c9b8ac", "#f2e6da"],
	};
	// Candlelight from behind her, on the right: each material's rim.
	const RIM: Record<IMaterial, string[]> = {
		skin: ["#b85a3a", "#f08c56", "#ffbe84", "#ffe2b8"],
		hair: ["#4a2028", "#8a3a34", "#c86a4a", "#f0a070"],
		red: ["#b0283a", "#f05a5a", "#ff9a7a", "#ffd0a0"],
		leaf: ["#3a5a2a", "#7a8a3a", "#c0b060", "#f0e090"],
		gold: ["#dca02c", "#ffd060", "#fff0a8", "#ffffff"],
		eye: ["#3a2010", "#5a3418", "#8a5a30", "#c08a50"],
		white: ["#f2e6da", "#ffffff", "#ffffff", "#ffffff"],
	};
	const OUTLINE = "#050208";

	// The figure's buffer: a material and a brightness per pixel.
	const mat: Array<IMaterial | null> = Array.from({ length: W * H }, () => null);
	const bright = new Float32Array(W * H);
	const put: IPut = (x, y, material, t) => {
		if (x >= 0 && x < W && y >= 0 && y < H) {
			mat[y * W + x] = material;
			bright[y * W + x] = t;
		}
	};
	// The key light: dim and cool, from the front left and above.
	const KEY = [-0.5, -0.85];
	const lit = (nx: number, ny: number, z: number) => 0.3 + 0.32 * (nx * KEY[0] + ny * KEY[1]) + 0.28 * z;

	const ellipse = (
		cx: number,
		cy: number,
		rx: number,
		ry: number,
		rot: number,
		material: IMaterial,
		bias = 0,
		texture: ((x: number, y: number) => number) | null = null,
	) => {
		const c = Math.cos(rot);
		const s = Math.sin(rot);
		const r = Math.ceil(Math.max(rx, ry)) + 1;

		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				const dx = x + 0.5 - cx;
				const dy = y + 0.5 - cy;
				const u = (dx * c + dy * s) / rx;
				const v = (-dx * s + dy * c) / ry;
				const d = u * u + v * v;

				if (d <= 1) {
					const nx = u * c - v * s;
					const ny = u * s + v * c;
					put(x, y, material, lit(nx, ny, Math.sqrt(1 - d)) + bias + (texture ? texture(x, y) : 0));
				}
			}
		}
	};

	// A pointed petal or leaf from its base, `len` along `angle`, `wide` at its widest, veined.
	const petal = (
		bx: number,
		by: number,
		len: number,
		wide: number,
		angle: number,
		material: IMaterial,
		bias = 0,
		target: IPut = put,
	) => {
		const ax = Math.cos(angle);
		const ay = Math.sin(angle);
		const r = len + wide + 1;

		for (let y = Math.floor(by - r); y <= by + r; y++) {
			for (let x = Math.floor(bx - r); x <= bx + r; x++) {
				const dx = x + 0.5 - bx;
				const dy = y + 0.5 - by;
				const t = (dx * ax + dy * ay) / len;
				const side = -dx * ay + dy * ax;

				if (t < 0 || t > 1) {
					continue;
				}

				const half = wide * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.12)), 0.7) * (1 - 0.2 * t);

				if (Math.abs(side) <= half) {
					const across = side / Math.max(half, 0.01);
					// A petal curls: its normal tips toward the side it's on.
					const nx = -ay * across * 0.8;
					const ny = ax * across * 0.8;
					const z = Math.sqrt(Math.max(0, 1 - across * across * 0.64));
					const vein =
						(Math.abs(across) < 0.12 && t > 0.1 && t < 0.9 ? -0.16 : 0) +
						(Math.abs(Math.abs(across) - 0.55 + 0.25 * t) < 0.07 && t > 0.2 && t < 0.8 ? -0.08 : 0);
					const edge = Math.abs(side) > half - 1 ? -0.18 : 0;
					target(x, y, material, lit(nx, ny, z) + 0.12 * t + vein + edge + bias);
				}
			}
		}
	};

	// A limb from (x1, y1) to (x2, y2), tapering from r1 to r2, shaded as a rounded form; joints
	// drawn as limbs meeting end to end come out smooth.
	const limb = (
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		r1: number,
		r2: number,
		material: IMaterial,
		bias = 0,
	) => {
		const lx = x2 - x1;
		const ly = y2 - y1;
		const length2 = lx * lx + ly * ly;
		const r = Math.max(r1, r2) + 1;

		for (let y = Math.floor(Math.min(y1, y2) - r); y <= Math.max(y1, y2) + r; y++) {
			for (let x = Math.floor(Math.min(x1, x2) - r); x <= Math.max(x1, x2) + r; x++) {
				const px = x + 0.5 - x1;
				const py = y + 0.5 - y1;
				const t = clamp((px * lx + py * ly) / length2);
				const dx = px - lx * t;
				const dy = py - ly * t;
				const radius = r1 + (r2 - r1) * t;
				const d = Math.hypot(dx, dy) / radius;

				if (d <= 1) {
					const nx = dx / radius;
					const ny = dy / radius;
					put(x, y, material, lit(nx, ny, Math.sqrt(Math.max(0, 1 - d * d))) + bias);
				}
			}
		}
	};

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
	ellipse(78, 44, 12, 15, 0, "skin", 0);

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

	put(79, 50, "skin", 0.25);
	put(78, 50, "skin", 0.6);
	put(77, 51, "skin", 0.2);
	put(79, 51, "skin", 0.18);
	put(78, 52, "skin", 0.25);

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
	ellipse(75.5, 101, 4, 3.2, -0.35, "skin", 0.02);
	ellipse(80.5, 101, 4, 3.2, 0.35, "skin", 0);
	put(75, 100, "skin", 0.12);
	put(77, 101, "skin", 0.12);
	put(79, 101, "skin", 0.12);
	put(81, 100, "skin", 0.12);

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

	bloom(73, 82, 6, 6, 0.3, 0.14);
	bloom(84, 84, 5.5, 6, -0.2, 0.12);
	bloom(78, 76, 7, 7, 0, 0.18);

	// Her crown: three poinsettias.
	bloom(65, 33, 8, 7, 0.4, 0.04);
	bloom(91, 33, 8, 7, -0.25, 0);
	bloom(78, 25, 10, 8, 0, 0.08);

	// --- Light: rim light from the candle behind her on the right, a fade into the dark below. ---
	const figure = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H && mat[y * W + x] !== null;
	const colours: Array<string | null> = Array.from({ length: W * H }, () => null);

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const m = mat[y * W + x];

			if (!m) {
				continue;
			}

			// Open to the light up and to the right: lit along the edge.
			let rim = 0;

			if (!figure(x + 1, y) || !figure(x + 1, y - 1)) {
				rim = 1;
			} else if (!figure(x + 2, y) || !figure(x + 2, y - 2)) {
				rim = 0.55;
			} else if (!figure(x + 3, y - 1)) {
				rim = 0.25;
			}

			// The light is behind her, high on the right: the left and bottom edges get none.
			rim *= clamp(1 - (y - 40) / 140) * clamp((x - 50) / 40);
			const fade = clamp((y - 112) / 48) * 0.55;

			if (rim > 0.2 && (rim > 0.6 || (bayer[y & 3][x & 3] + 0.5) / 16 < rim)) {
				colours[y * W + x] = shade(x, y, rim * (1 - fade), RIM[m]);
			} else {
				colours[y * W + x] = shade(x, y, bright[y * W + x] - fade, RAMPS[m]);
			}
		}
	}

	// A dark outline on the shadowed side (left and below); the lit side glows instead.
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (!mat[y * W + x] && (figure(x + 1, y) || figure(x, y - 1)) && y < 128) {
				colours[y * W + x] = OUTLINE;
			}
		}
	}

	// --- The scene. ---
	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	const context = canvas.getContext("2d")!;
	const warmBg = ["#040208", "#0e0510", "#1c0814", "#2e0c1a", "#481222", "#64182a"];
	const coldBg = ["#030508", "#070c12", "#0c161c", "#112228", "#163236", "#1e4644"];

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const fog = fbm(x * 0.035 + 3, y * 0.06);
			// Candlelight behind her, high on the right of her; a cold mist drifting on the far right.
			const warm = clamp(1 - Math.hypot((x - 100) / 95, (y - 40) / 80));
			const cold = clamp(1 - Math.hypot((x - 215) / 100, (y - 75) / 80)) * (0.6 + fog * 1.2);
			const dark = clamp(1 - y / 200) * clamp(1 - Math.abs(x - 128) / 260);
			const ramp = warm * 1.1 > cold ? warmBg : coldBg;
			const t = (Math.max(warm * 0.85, cold * 0.7) + fog * 0.28 - 0.08) * dark;
			context.fillStyle = shade(x, y, t, ramp);
			context.fillRect(x, y, 1, 1);
		}
	}

	// Petals swirling round her in the dark: small and dim far behind, larger and lit nearer.
	const swirl: Array<{ x: number; y: number; size: number; angle: number; front: boolean }> = [];

	for (let i = 0; i < 22; i++) {
		const angle = i * 0.83 + 0.4;
		const radius = 36 + i * 3.4;
		swirl.push({
			x: 82 + Math.cos(angle) * radius * 1.35,
			y: 66 + Math.sin(angle) * radius * 0.62,
			size: 2.5 + (i % 5) * 1.3,
			angle: angle * 1.7,
			front: i % 4 === 1,
		});
	}

	const paint = (front: boolean) => {
		for (const p of swirl.filter((q) => q.front === front)) {
			const layer = new Map<string, [number, number, IMaterial, number]>();
			const keep: IPut = (x, y, m, t) => layer.set(`${x},${y}`, [x, y, m, t]);
			petal(p.x, p.y, p.size * 2, p.size * 0.75, p.angle, "red", front ? 0.05 : -0.22, keep);

			for (const [x, y, m, t] of layer.values()) {
				if (x < 0 || x >= W || y < 0 || y >= H) {
					continue;
				}

				const open = !layer.has(`${x + 1},${y}`) || !layer.has(`${x},${y - 1}`);
				context.fillStyle = open && front ? shade(x, y, 0.7, RIM[m]) : shade(x, y, t, RAMPS[m]);
				context.fillRect(x, y, 1, 1);
			}
		}
	};

	paint(false);

	for (let i = 0; i < W * H; i++) {
		const colour = colours[i];

		if (colour) {
			context.fillStyle = colour;
			context.fillRect(i % W, Math.floor(i / W), 1, 1);
		}
	}

	paint(true);

	return canvas;
}
