/**
 * Helpers for the biomes' scenery (drawForest.ts, drawTundra.ts): a steady pseudo-random number
 * for placing things, the out-of-focus foreground layer, and darkened edges.
 */

/** A steady pseudo-random 0–1 for a number, so each thing keeps its own size and place. */
export function hash(n: number): number {
	const s = Math.sin(n * 127.1) * 43758.5453;

	return s - Math.floor(s);
}

/** How out of focus a foreground is (CSS pixels of blur), and how see-through. */
const FOREGROUND_BLUR = 2.5;
const FOREGROUND_OPACITY = 0.88;

/** The foreground's own layer, reused frame to frame. */
let layer: HTMLCanvasElement | null = null;

/**
 * Draws a foreground with `draw` on a layer of its own (the target's size and scale), then lays
 * it over the target blurred and a little see-through, out of focus in front of the game, at
 * `amount` (0 to 1). Blurring the finished layer once is much cheaper than blurring each shape.
 */
export function drawOutOfFocus(
	target: CanvasRenderingContext2D,
	amount: number,
	draw: (context: CanvasRenderingContext2D) => void,
) {
	layer ??= document.createElement("canvas");

	if (layer.width !== target.canvas.width || layer.height !== target.canvas.height) {
		layer.width = target.canvas.width;
		layer.height = target.canvas.height;
	}

	const context = layer.getContext("2d")!;
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, layer.width, layer.height);
	context.setTransform(target.getTransform());
	draw(context);

	// In the canvas's own pixels.
	const pixelRatio = target.getTransform().a || 1;
	target.save();
	target.setTransform(1, 0, 0, 1, 0, 0);
	target.filter = `blur(${(FOREGROUND_BLUR * pixelRatio).toFixed(1)}px)`;
	target.globalAlpha = amount * FOREGROUND_OPACITY;
	target.drawImage(layer, 0, 0);
	target.restore();
}

/** The edges darkened (by `darkness` at the corners), closing in. */
export function drawVignette(
	target: CanvasRenderingContext2D,
	width: number,
	height: number,
	darkness: number,
	colour: [number, number, number],
) {
	const [r, g, b] = colour;
	const vignette = target.createRadialGradient(
		width / 2,
		height / 2,
		Math.min(width, height) * 0.35,
		width / 2,
		height / 2,
		Math.max(width, height) * 0.75,
	);
	vignette.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
	vignette.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${darkness.toFixed(3)})`);
	target.save();
	target.fillStyle = vignette;
	target.fillRect(0, 0, width, height);
	target.restore();
}
