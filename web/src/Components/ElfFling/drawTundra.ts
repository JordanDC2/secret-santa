import { drawOutOfFocus, drawVignette, hash } from "Components/ElfFling/drawForeground";

/**
 * The Arctic tundra, wide open after the forest: the northern lights rippling across the night
 * sky; behind the course, blue-white glaciers and icebergs on the horizon, wind-carved pressure
 * ridges in the snowfield and the odd stone cairn; and in front (out of focus, like the
 * forest's), ice shards, drifts and now and then a great leaning slab of ice. Screen pixels,
 * `amount` of the way in (0 to 1); `day` 0 at night to 1 in full day.
 */

type IMix = (from: string, to: string, t: number) => string;

/** How soft the curtains' edges are, in CSS pixels of blur. */
const AURORA_BLUR = 6;

const AURORA_BANDS = [
	{ colour: [90, 255, 170], height: 0.16, speed: 0.3, phase: 0 },
	{ colour: [80, 220, 230], height: 0.26, speed: 0.22, phase: 2.1 },
	{ colour: [190, 120, 255], height: 0.36, speed: 0.35, phase: 4.3 },
];

/**
 * The northern lights: curtains rippling slowly across the sky, brightest at their lower edge
 * and fading upward, with faint rays down them. Only at night (`strength` falls to 0 by day).
 */
export function drawAurora(
	context: CanvasRenderingContext2D,
	width: number,
	skyHeight: number,
	clock: number,
	strength: number,
) {
	if (strength <= 0) {
		return;
	}

	context.save();
	context.globalCompositeOperation = "lighter";

	for (const band of AURORA_BANDS) {
		const [r, g, b] = band.colour;
		const edge = (x: number) =>
			skyHeight * band.height +
			Math.sin(x * 0.007 + clock * band.speed + band.phase) * 26 +
			Math.sin(x * 0.019 - clock * band.speed * 1.7) * 10;
		const tall = skyHeight * 0.24;
		const top = skyHeight * band.height - tall - 40;
		const bottom = skyHeight * band.height + 40;
		const gradient = context.createLinearGradient(0, top, 0, bottom);
		gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
		gradient.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${(0.32 * strength).toFixed(3)})`);
		gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
		context.fillStyle = gradient;

		// The curtain: from its rippling lower edge up to a softer, rippling top.
		context.beginPath();
		context.moveTo(0, edge(0));

		for (let x = 0; x <= width; x += 8) {
			context.lineTo(x, edge(x) + 8);
		}

		for (let x = width; x >= 0; x -= 8) {
			context.lineTo(x, edge(x) - tall * (0.7 + 0.3 * Math.sin(x * 0.011 + clock * 0.5 + band.phase)));
		}

		context.closePath();
		// Soft-edged, as the real thing is (blur in the canvas's own pixels).
		context.filter = `blur(${(AURORA_BLUR * (context.getTransform().a || 1)).toFixed(1)}px)`;
		context.fill();
		context.filter = "none";

		// Rays down it, shimmering.
		context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(0.12 * strength).toFixed(3)})`;
		context.lineWidth = 2;

		for (let ray = 0; ray < 24; ray++) {
			const x = (((hash(ray + band.phase * 10) * width + clock * 6 * band.speed) % width) + width) % width;
			const flicker = 0.5 + 0.5 * Math.sin(clock * 2 + ray);
			context.globalAlpha = flicker;
			context.beginPath();
			context.moveTo(x, edge(x) + 6);
			context.lineTo(x, edge(x) - tall * 0.8);
			context.stroke();
		}

		context.globalAlpha = 1;
	}

	context.restore();
}

/** Behind the course: glaciers and icebergs on the horizon, pressure ridges in the snowfield, cairns. */
export function drawTundra(
	context: CanvasRenderingContext2D,
	width: number,
	horizon: number,
	pan: number,
	day: number,
	amount: number,
	mix: IMix,
) {
	context.save();

	// Glaciers and icebergs: flat-topped, sheer-sided, pale.
	const iceDrift = pan * 0.12;
	const spacing = 150;
	const first = Math.floor(iceDrift / spacing) - 2;
	const iceFace = mix("#3c5868", "#d7ecf5", day);
	const iceLit = mix("#55788a", "#f4fbfe", day);

	for (let index = first; index * spacing - iceDrift < width + spacing; index++) {
		if (hash(index * 3 + 1) > 0.7) {
			continue;
		}

		const x = index * spacing - iceDrift;
		const wide = 90 + hash(index * 5) * 120;
		const tall = 28 + hash(index * 7) * 55;
		const lean = (hash(index * 9) - 0.5) * 20;
		context.globalAlpha = amount * 0.85;
		context.fillStyle = iceFace;
		context.beginPath();
		context.moveTo(x, horizon);
		context.lineTo(x + 10 + lean, horizon - tall);
		context.lineTo(x + wide * 0.45, horizon - tall - 6);
		context.lineTo(x + wide - 14 + lean, horizon - tall + 4);
		context.lineTo(x + wide, horizon);
		context.closePath();
		context.fill();
		// Its sunlit (or moonlit) left face.
		context.fillStyle = iceLit;
		context.beginPath();
		context.moveTo(x, horizon);
		context.lineTo(x + 10 + lean, horizon - tall);
		context.lineTo(x + wide * 0.25, horizon - tall - 3);
		context.lineTo(x + wide * 0.2, horizon);
		context.closePath();
		context.fill();
	}

	// Pressure ridges: a low, jagged line of snow and ice along the snowfield.
	const ridgeDrift = pan * 0.3;
	context.globalAlpha = amount;
	context.fillStyle = mix("#6d8795", "#e8f2f7", day);
	context.beginPath();
	context.moveTo(0, horizon + 1);
	const step = 12;
	const firstStep = Math.floor(ridgeDrift / step) - 1;

	for (let index = firstStep; index * step - ridgeDrift <= width + step; index++) {
		context.lineTo(index * step - ridgeDrift, horizon - 3 - hash(index * 13) * 12);
	}

	context.lineTo(width, horizon + 1);
	context.closePath();
	context.fill();

	// Cairns: stones stacked by someone who came this way before.
	const cairnDrift = pan * 0.45;
	const cairnSpacing = 260;
	const cairnFirst = Math.floor(cairnDrift / cairnSpacing) - 1;
	context.fillStyle = mix("#26333a", "#66747b", day);

	for (let index = cairnFirst; index * cairnSpacing - cairnDrift < width + cairnSpacing; index++) {
		if (hash(index * 17 + 5) > 0.35) {
			continue;
		}

		const x = index * cairnSpacing - cairnDrift + hash(index * 19) * 80;
		let y = horizon + 2;

		for (let stone = 0; stone < 4; stone++) {
			const wide = 14 - stone * 3 + hash(index + stone) * 3;
			const tall = 6 - stone;
			context.beginPath();
			context.ellipse(x + (hash(index * 2 + stone) - 0.5) * 3, y - tall / 2, wide / 2, tall / 2, 0, 0, Math.PI * 2);
			context.fill();
			y -= tall;
		}
	}

	context.restore();
}

/** In front: ice shards, snowdrifts, and now and then a great leaning slab of ice, out of focus. */
export function drawTundraForeground(
	target: CanvasRenderingContext2D,
	width: number,
	height: number,
	base: number,
	skyHeight: number,
	pan: number,
	day: number,
	amount: number,
	mix: IMix,
) {
	const shardFill = mix("#5f8496", "#cfe8f3", day);
	const shardEdge = mix("#2e4a58", "#8fb6c9", day);
	const driftFill = mix("#9fb4bf", "#f2f8fb", day);

	drawOutOfFocus(target, amount, (context) => {
		// Great slabs of ice, leaning, with cracks through them.
		const slabDrift = pan * 1.6;
		const slabSpacing = 420;
		const slabFirst = Math.floor(slabDrift / slabSpacing) - 1;

		for (let index = slabFirst; index * slabSpacing - slabDrift < width + slabSpacing; index++) {
			if (hash(index * 5 + 2) > 0.35) {
				continue;
			}

			const x = index * slabSpacing - slabDrift + hash(index * 11) * slabSpacing * 0.4;
			const tall = skyHeight * (0.35 + hash(index * 13) * 0.2);
			const wide = 40 + hash(index * 17) * 30;
			const lean = 20 + hash(index * 23) * 30;
			context.fillStyle = shardFill;
			context.strokeStyle = shardEdge;
			context.lineWidth = 3;
			context.beginPath();
			context.moveTo(x, base);
			context.lineTo(x + lean, base - tall);
			context.lineTo(x + lean + wide * 0.6, base - tall + 14);
			context.lineTo(x + wide, base);
			context.closePath();
			context.fill();
			context.stroke();
			// Cracks.
			context.lineWidth = 1.5;
			context.beginPath();
			context.moveTo(x + wide * 0.3, base - 10);
			context.lineTo(x + lean * 0.6 + 8, base - tall * 0.55);
			context.lineTo(x + lean * 0.8, base - tall * 0.7);
			context.moveTo(x + lean * 0.6 + 8, base - tall * 0.55);
			context.lineTo(x + lean * 0.6 + 20, base - tall * 0.6);
			context.stroke();
		}

		// Shards and drifts along the bottom.
		const groundDrift = pan * 1.3;
		const groundSpacing = 54;
		const groundFirst = Math.floor(groundDrift / groundSpacing) - 1;

		for (let index = groundFirst; index * groundSpacing - groundDrift < width + groundSpacing; index++) {
			const kind = hash(index * 29 + 3);
			const x = index * groundSpacing - groundDrift + (hash(index * 31) - 0.5) * groundSpacing * 0.6;

			if (kind < 0.25) {
				// A cluster of shards, jutting up at angles.
				context.fillStyle = shardFill;
				context.strokeStyle = shardEdge;
				context.lineWidth = 1.5;

				for (let shard = 0; shard < 3; shard++) {
					const tall = 12 + hash(index * 7 + shard) * 26;
					const lean = (hash(index * 3 + shard) - 0.5) * 16;
					const sx = x + (shard - 1) * 9;
					context.beginPath();
					context.moveTo(sx - 5, base + 4);
					context.lineTo(sx + lean, base + 4 - tall);
					context.lineTo(sx + 5, base + 4);
					context.closePath();
					context.fill();
					context.stroke();
				}
			} else if (kind < 0.45) {
				// A snowdrift: a smooth, wind-swept mound.
				const wide = 40 + hash(index * 37) * 40;
				const tall = 8 + hash(index * 41) * 10;
				context.fillStyle = driftFill;
				context.beginPath();
				context.moveTo(x - wide / 2, base + 4);
				context.quadraticCurveTo(x - wide * 0.1, base + 4 - tall * 2, x + wide / 2, base + 4);
				context.closePath();
				context.fill();
			}
		}
	});

	// The edges just a little darkened, and cold: it's open out here.
	drawVignette(target, width, height, 0.3 * amount, [10, 25, 40]);
}
