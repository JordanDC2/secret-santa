/**
 * The kit the patrons' portraits are drawn with (256 × 160 pixels each, shown scaled up with
 * `image-rendering: pixelated`), in the style La Flor's set for the game: shapes write a
 * material and a brightness into a buffer, lit dimly from the front left; then a rim-light pass
 * (the candle behind each figure), a fade into the dark at the bottom and dithered palettes turn
 * that into pixels, with a dark outline on the shadowed side only.
 */

export const W = 256;
export const H = 160;

export type IPut = (x: number, y: number, material: string, t: number) => void;
export type ITexture = (x: number, y: number) => number;

const bayer = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** The dither threshold at a pixel (0 to 1). */
export const dither = (x: number, y: number) => (bayer[y & 3][x & 3] + 0.5) / 16;

/** A colour from a ramp for brightness t (0 to 1), dithered only where one shade meets the next. */
export const shade = (x: number, y: number, t: number, ramp: string[]) => {
	const v = clamp(t) * (ramp.length - 1);
	const i = Math.floor(v);
	const f = clamp((v - i - 0.5) * 2.4 + 0.5);

	return ramp[Math.min(ramp.length - 1, f > dither(x, y) ? i + 1 : i)];
};

// Value noise, for fog, hair strands and texture.
export const hash = (x: number, y: number) => {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;

	return s - Math.floor(s);
};

export const noise = (x: number, y: number) => {
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

export const fbm = (x: number, y: number) =>
	noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;

/** Hair: strands streaming in the wind. */
export const strands: ITexture = (x, y) =>
	0.13 * Math.sin(x * 0.55 - y * 0.32 + 4 * fbm(x * 0.05, y * 0.05)) + 0.05 * (hash(x, y) - 0.5);

/** Fur or a beard: strands falling straight down, with tufts. */
export const fur: ITexture = (x, y) =>
	0.12 * Math.sin(x * 1.3 + 3 * fbm(x * 0.08, y * 0.03)) + 0.06 * (hash(x, y) - 0.5);

// The key light: dim and cool, from the front left and above.
const KEY = [-0.5, -0.85];
const lit = (nx: number, ny: number, z: number) => 0.3 + 0.32 * (nx * KEY[0] + ny * KEY[1]) + 0.28 * z;

export type ILighting = {
	/** Which side the candle behind the figure is on: its rim light is on that side's edges. */
	side: 1 | -1;
	/** How strongly the rim light reaches each pixel (0 to 1). */
	reach: (x: number, y: number) => number;
	/** How far each pixel fades into the dark (0 to 1). */
	fade: (x: number, y: number) => number;
	/** No outline below this row (where the figure's faded into the dark). */
	outlineAbove: number;
};

/** A figure being drawn: its buffer, the shapes that draw into it, and the pass that lights it. */
export function figure(ramps: Record<string, string[]>, rims: Record<string, string[]>) {
	const mat: Array<string | null> = Array.from({ length: W * H }, () => null);
	const bright = new Float32Array(W * H);
	const put: IPut = (x, y, material, t) => {
		if (x >= 0 && x < W && y >= 0 && y < H) {
			mat[y * W + x] = material;
			bright[y * W + x] = t;
		}
	};
	const erase = (x: number, y: number) => {
		if (x >= 0 && x < W && y >= 0 && y < H) {
			mat[y * W + x] = null;
		}
	};

	const ellipse = (
		cx: number,
		cy: number,
		rx: number,
		ry: number,
		rot: number,
		material: string,
		bias = 0,
		texture: ITexture | null = null,
		target: IPut = put,
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
					target(x, y, material, lit(nx, ny, Math.sqrt(1 - d)) + bias + (texture ? texture(x, y) : 0));
				}
			}
		}
	};

	// A pointed petal or leaf (or flame, or feather) from its base, `len` along `angle`, `wide` at its widest, veined.
	const petal = (
		bx: number,
		by: number,
		len: number,
		wide: number,
		angle: number,
		material: string,
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
		material: string,
		bias = 0,
		texture: ITexture | null = null,
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
					put(x, y, material, lit(nx, ny, Math.sqrt(Math.max(0, 1 - d * d))) + bias + (texture ? texture(x, y) : 0));
				}
			}
		}
	};

	/** A shape filled row by row between two edges: `span(y)` gives [left, right] or null; `shadeAt` a brightness, or null for a hole. */
	const fill = (
		top: number,
		bottom: number,
		span: (y: number) => [number, number] | null,
		material: string,
		shadeAt: (x: number, y: number, left: number, right: number) => number | null,
	) => {
		for (let y = Math.floor(top); y <= bottom; y++) {
			const edges = span(y);

			if (!edges) {
				continue;
			}

			for (let x = Math.ceil(edges[0]); x <= edges[1]; x++) {
				const t = shadeAt(x, y, edges[0], edges[1]);

				if (t !== null) {
					put(x, y, material, t);
				}
			}
		}
	};

	const filled = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H && mat[y * W + x] !== null;

	/** The figure lit: rim light from the candle behind, a fade into the dark, an outline on the shadowed side. */
	const light = ({ side, reach, fade, outlineAbove }: ILighting): Array<string | null> => {
		const colours: Array<string | null> = Array.from({ length: W * H }, () => null);

		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				const m = mat[y * W + x];

				if (!m) {
					continue;
				}

				// Open to the light, up and to its side: lit along the edge.
				let rim = 0;

				if (!filled(x + side, y) || !filled(x + side, y - 1)) {
					rim = 1;
				} else if (!filled(x + side * 2, y) || !filled(x + side * 2, y - 2)) {
					rim = 0.55;
				} else if (!filled(x + side * 3, y - 1)) {
					rim = 0.25;
				}

				rim *= reach(x, y);
				const dark = fade(x, y);

				if (rim > 0.2 && rims[m] && (rim > 0.6 || dither(x, y) < rim)) {
					colours[y * W + x] = shade(x, y, rim * (1 - dark), rims[m]);
				} else {
					colours[y * W + x] = shade(x, y, bright[y * W + x] - dark, ramps[m]);
				}
			}
		}

		for (let y = 0; y < outlineAbove; y++) {
			for (let x = 0; x < W; x++) {
				if (!mat[y * W + x] && (filled(x + side, y) || filled(x, y - 1))) {
					colours[y * W + x] = OUTLINE;
				}
			}
		}

		return colours;
	};

	return { put, erase, ellipse, petal, limb, fill, filled, light };
}

export const OUTLINE = "#050208";

/** A new portrait canvas, with a background painted pixel by pixel by `colourAt`. */
export function canvasWith(colourAt: (x: number, y: number) => string): {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
} {
	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	const context = canvas.getContext("2d")!;

	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			context.fillStyle = colourAt(x, y);
			context.fillRect(x, y, 1, 1);
		}
	}

	return { canvas, context };
}

/** Paints a lit figure's colours over the canvas. */
export function paintFigure(context: CanvasRenderingContext2D, colours: Array<string | null>) {
	for (let i = 0; i < W * H; i++) {
		const colour = colours[i];

		if (colour) {
			context.fillStyle = colour;
			context.fillRect(i % W, Math.floor(i / W), 1, 1);
		}
	}
}

/** Paints a small shape (drawn by `draw` into its own layer) with its own rim light where it's open to `side`. */
export function paintLayer(
	context: CanvasRenderingContext2D,
	draw: (keep: IPut) => void,
	ramps: Record<string, string[]>,
	rims: Record<string, string[]> | null,
	side: 1 | -1 = 1,
	rimT = 0.7,
) {
	const layer = new Map<string, [number, number, string, number]>();
	draw((x, y, m, t) => layer.set(`${x},${y}`, [x, y, m, t]));

	for (const [x, y, m, t] of layer.values()) {
		if (x < 0 || x >= W || y < 0 || y >= H) {
			continue;
		}

		const open = !layer.has(`${x + side},${y}`) || !layer.has(`${x},${y - 1}`);
		context.fillStyle = open && rims?.[m] ? shade(x, y, rimT, rims[m]) : shade(x, y, t, ramps[m]);
		context.fillRect(x, y, 1, 1);
	}
}
