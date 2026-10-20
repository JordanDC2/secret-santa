import type { IPalette } from "Components/ElfFling/draw";
import { drawOutOfFocus, hash } from "Components/ElfFling/drawForeground";
import { flyerEnlargement, drawCharacter } from "Components/ElfFling/drawFlyers";
import { burstsNow, CROWD, crowdMember } from "Components/ElfFling/journey";
import { ELF_RADIUS, type IGameState } from "Components/ElfFling/physics";

/**
 * Santa's village at the North Pole, where the journey ends (journey.ts). Behind the course
 * (drawNorthPole, screen pixels like the other biomes): the village's warm glow on the ice, far
 * rooftops with lit windows, elf cottages with candy-striped roofs and smoking chimneys, and
 * strings of lights. On the course itself (world units, metres, y up), at each journey's end:
 * Santa's workshop, a great Christmas tree and the North Pole; and during the welcome, the
 * crowd and the fireworks. In front of it all (drawNorthPoleForeground), out of focus: stacks
 * of wrapped presents, and now and then a candy-cane lamp post, glowing.
 */

type IMix = (from: string, to: string, t: number) => string;

const LIGHT_COLOURS = ["#ff5a5a", "#ffd166", "#6ee7a8", "#7cc6ff", "#ff9bd2"];

/** A little elf cottage: snowy walls, a candy-striped roof, lit windows and a smoking chimney. Its base at (x, base). */
function cottage(
	context: CanvasRenderingContext2D,
	x: number,
	base: number,
	wide: number,
	wall: string,
	roof: string,
	stripe: string,
	snow: string,
	window: string,
	clock: number,
	seed: number,
) {
	const tall = wide * 0.55;
	context.fillStyle = wall;
	context.fillRect(x - wide / 2, base - tall, wide, tall);

	// A chimney, and smoke curling up from it.
	context.fillRect(x + wide * 0.18, base - tall - wide * 0.5, wide * 0.12, wide * 0.3);
	context.fillStyle = "rgba(220, 225, 235, 0.35)";

	for (let puff = 0; puff < 3; puff++) {
		const rise = (clock * 0.4 + puff / 3 + seed * 0.13) % 1;
		context.beginPath();
		context.arc(
			x + wide * 0.24 + Math.sin(rise * 6 + seed) * 2,
			base - tall - wide * 0.55 - rise * 18,
			2 + rise * 3,
			0,
			Math.PI * 2,
		);
		context.fill();
	}

	// The roof, striped like a candy cane.
	context.save();
	context.beginPath();
	context.moveTo(x - wide * 0.62, base - tall);
	context.lineTo(x, base - tall - wide * 0.42);
	context.lineTo(x + wide * 0.62, base - tall);
	context.closePath();
	context.fillStyle = roof;
	context.fill();
	context.clip();
	context.strokeStyle = stripe;
	context.lineWidth = wide * 0.08;

	for (let line = -wide; line < wide; line += wide * 0.22) {
		context.beginPath();
		context.moveTo(x + line, base - tall);
		context.lineTo(x + line + wide * 0.4, base - tall - wide * 0.5);
		context.stroke();
	}

	context.restore();
	context.fillStyle = snow;
	context.fillRect(x - wide * 0.62, base - tall - 2, wide * 1.24, 3);

	// Lit windows and a door.
	context.fillStyle = window;
	context.fillRect(x - wide * 0.36, base - tall * 0.72, wide * 0.18, wide * 0.16);
	context.fillRect(x + wide * 0.18, base - tall * 0.72, wide * 0.18, wide * 0.16);
	context.fillStyle = roof;
	context.fillRect(x - wide * 0.08, base - tall * 0.5, wide * 0.16, tall * 0.5);
}

/** Behind the course: the village's glow, far rooftops, cottages and strings of lights. */
export function drawNorthPole(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	horizon: number,
	pan: number,
	day: number,
	amount: number,
	clock: number,
	mix: IMix,
) {
	context.save();
	context.globalAlpha = amount;
	const night = 1 - day;

	// The village's warm glow on the ice, brightest at night.
	const glow = context.createLinearGradient(0, horizon - 90, 0, horizon);
	glow.addColorStop(0, "rgba(255, 196, 110, 0)");
	glow.addColorStop(1, `rgba(255, 196, 110, ${(0.1 + 0.25 * night).toFixed(3)})`);
	context.fillStyle = glow;
	context.fillRect(0, horizon - 90, width, 90);

	// Far rooftops in a long row, their windows lit.
	const farDrift = pan * 0.1;
	const farSpacing = 26;
	const farFirst = Math.floor(farDrift / farSpacing) - 1;
	const farRoof = mix("#1c2b3a", "#94a9bd", day);
	const lit = mix("#ffd27a", "#f2e2b8", day);

	for (let index = farFirst; index * farSpacing - farDrift < width + farSpacing; index++) {
		const x = index * farSpacing - farDrift;
		const tall = 10 + hash(index * 3) * 12;
		context.fillStyle = farRoof;
		context.beginPath();
		context.moveTo(x - 12, horizon - 30);
		context.lineTo(x - 12, horizon - 30 - tall);
		context.lineTo(x, horizon - 38 - tall);
		context.lineTo(x + 12, horizon - 30 - tall);
		context.lineTo(x + 12, horizon - 30);
		context.closePath();
		context.fill();

		if (hash(index * 5) < 0.7) {
			context.fillStyle = lit;
			context.globalAlpha = amount * (0.4 + 0.6 * night);
			context.fillRect(x - 3, horizon - 30 - tall * 0.6, 3, 3);
			context.globalAlpha = amount;
		}
	}

	// A snowfield up to the cottages.
	context.fillStyle = mix("#3d5363", "#e6eef3", day);
	context.fillRect(0, horizon - 30, width, 30);

	// Elf cottages along the way.
	const cottageDrift = pan * 0.22;
	const cottageSpacing = 78;
	const cottageFirst = Math.floor(cottageDrift / cottageSpacing) - 1;
	const wall = mix("#3f3a40", "#efe6da", day);
	const snow = mix("#a9b6bf", palette.white, day);

	for (let index = cottageFirst; index * cottageSpacing - cottageDrift < width + cottageSpacing; index++) {
		if (hash(index * 7 + 1) > 0.8) {
			continue;
		}

		const x = index * cottageSpacing - cottageDrift + hash(index * 11) * 20;
		const roofs = [
			[mix("#5a1418", palette.red, day), mix("#d9c9c9", palette.white, day)],
			[mix("#163a26", palette.green, day), mix("#d9c9c9", palette.white, day)],
			[mix("#5a1418", palette.red, day), mix("#6b5a2a", palette.goldDeep, day)],
		][Math.floor(hash(index * 13) * 3)];
		cottage(context, x, horizon - 8, 30 + hash(index * 17) * 14, wall, roofs[0], roofs[1], snow, lit, clock, index);
	}

	// Strings of lights between candy-cane posts, nearest of all.
	const lightDrift = pan * 0.34;
	const postSpacing = 64;
	const postFirst = Math.floor(lightDrift / postSpacing) - 1;

	for (let index = postFirst; index * postSpacing - lightDrift < width + postSpacing; index++) {
		const x = index * postSpacing - lightDrift;
		context.strokeStyle = mix("#d9c9c9", palette.white, day);
		context.lineWidth = 3;
		context.beginPath();
		context.moveTo(x, horizon + 1);
		context.lineTo(x, horizon - 22);
		context.stroke();
		context.strokeStyle = palette.red;
		context.setLineDash([3, 4]);
		context.stroke();
		context.setLineDash([]);

		// The wire sagging to the next post, and its bulbs.
		context.strokeStyle = "rgba(20, 20, 20, 0.6)";
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(x, horizon - 22);
		context.quadraticCurveTo(x + postSpacing / 2, horizon - 10, x + postSpacing, horizon - 22);
		context.stroke();

		for (let bulb = 1; bulb < 8; bulb++) {
			const t = bulb / 8;
			const bx = x + postSpacing * t;
			const by = horizon - 22 + 24 * t * (1 - t);
			const twinkle = 0.55 + 0.45 * Math.sin(clock * 3 + index * 2 + bulb);
			context.fillStyle = LIGHT_COLOURS[(index * 3 + bulb) % LIGHT_COLOURS.length];
			context.globalAlpha = amount * (day + night * twinkle);
			context.beginPath();
			context.arc(bx, by + 2, 2, 0, Math.PI * 2);
			context.fill();
		}

		context.globalAlpha = amount;
	}

	context.restore();
}

/** A stack of wrapped presents in front of the course (screen pixels), its base at (x, base). */
function presentStack(
	context: CanvasRenderingContext2D,
	x: number,
	base: number,
	size: number,
	seed: number,
	wraps: string[],
	ribbons: string[],
) {
	let bottom = base;
	let left = x - size / 2;
	let wide = size;

	for (let box = 0; box < 2 + Math.floor(hash(seed * 3) * 2); box++) {
		const tall = wide * (0.6 + hash(seed * 5 + box) * 0.25);
		const colour = Math.floor(hash(seed * 7 + box) * wraps.length);
		context.fillStyle = wraps[colour];
		context.fillRect(left, bottom - tall, wide, tall);
		context.fillStyle = ribbons[colour];
		context.fillRect(left + wide / 2 - wide * 0.06, bottom - tall, wide * 0.12, tall);
		context.fillRect(left, bottom - tall / 2 - wide * 0.05, wide, wide * 0.1);
		bottom -= tall;
		// The next box smaller, a little to one side.
		const next = wide * (0.62 + hash(seed * 11 + box) * 0.15);
		left += (wide - next) * hash(seed * 13 + box);
		wide = next;
	}

	// A bow on top.
	const top = { x: left + wide / 2, y: bottom };
	context.fillStyle = ribbons[0];

	for (const side of [-1, 1]) {
		context.beginPath();
		context.ellipse(
			top.x + side * wide * 0.14,
			top.y - wide * 0.08,
			wide * 0.16,
			wide * 0.09,
			side * 0.5,
			0,
			Math.PI * 2,
		);
		context.fill();
	}
}

/** A tall candy-cane lamp post in front of the course, its lantern glowing; its base at (x, base). */
function lampPost(
	context: CanvasRenderingContext2D,
	x: number,
	base: number,
	tall: number,
	red: string,
	white: string,
	clock: number,
) {
	const wide = tall * 0.045;
	context.fillStyle = white;
	context.fillRect(x - wide / 2, base - tall, wide, tall);
	context.fillStyle = red;

	for (let band = 0; band < tall; band += wide * 2.4) {
		context.beginPath();
		context.moveTo(x - wide / 2, base - band);
		context.lineTo(x + wide / 2, base - band - wide);
		context.lineTo(x + wide / 2, base - band - wide * 1.8);
		context.lineTo(x - wide / 2, base - band - wide * 0.8);
		context.closePath();
		context.fill();
	}

	// The lantern hanging from a crook at the top, and its glow.
	const lantern = { x: x + tall * 0.16, y: base - tall + tall * 0.12 };
	context.strokeStyle = white;
	context.lineWidth = wide;
	context.beginPath();
	context.arc(x + tall * 0.08, base - tall, tall * 0.08, Math.PI, 0);
	context.stroke();
	const glow = context.createRadialGradient(lantern.x, lantern.y, 0, lantern.x, lantern.y, tall * 0.3);
	glow.addColorStop(0, `rgba(255, 210, 122, ${(0.6 + 0.08 * Math.sin(clock * 6)).toFixed(3)})`);
	glow.addColorStop(1, "rgba(255, 210, 122, 0)");
	context.fillStyle = glow;
	context.fillRect(lantern.x - tall * 0.3, lantern.y - tall * 0.3, tall * 0.6, tall * 0.6);
	context.fillStyle = "#ffd27a";
	context.fillRect(lantern.x - tall * 0.04, lantern.y - tall * 0.05, tall * 0.08, tall * 0.1);
}

/**
 * In front of the course (screen pixels, like the other biomes' foregrounds), out of focus:
 * stacks of wrapped presents every so often, and now and then a tall candy-cane lamp post.
 */
export function drawNorthPoleForeground(
	target: CanvasRenderingContext2D,
	palette: IPalette,
	width: number,
	base: number,
	skyHeight: number,
	pan: number,
	clock: number,
	day: number,
	amount: number,
	mix: IMix,
) {
	const wraps = [
		mix("#5a1418", palette.red, day),
		mix("#123a24", palette.green, day),
		mix("#6b4f1c", palette.goldDeep, day),
	];
	const ribbons = [
		mix("#a08a5a", palette.gold, day),
		mix("#7a1a22", palette.redBright, day),
		mix("#5a1418", palette.red, day),
	];
	const red = mix("#5a1418", palette.red, day);
	const white = mix("#a9b4b8", palette.white, day);

	drawOutOfFocus(target, amount, (context) => {
		// Now and then, a lamp post, nearer and so passing quicker than the presents.
		const lampDrift = pan * 1.6;
		const lampSpacing = 460;
		const lampFirst = Math.floor(lampDrift / lampSpacing) - 1;

		for (let index = lampFirst; index * lampSpacing - lampDrift < width + lampSpacing; index++) {
			if (hash(index * 43 + 5) > 0.4) {
				continue;
			}

			const x = index * lampSpacing - lampDrift + hash(index * 47) * lampSpacing * 0.4;
			lampPost(context, x, base + 6, skyHeight * (0.55 + hash(index * 53) * 0.15), red, white, clock);
		}

		// Stacks of presents every so often.
		const stackDrift = pan * 1.35;
		const stackSpacing = 240;
		const stackFirst = Math.floor(stackDrift / stackSpacing) - 1;

		for (let index = stackFirst; index * stackSpacing - stackDrift < width + stackSpacing; index++) {
			if (hash(index * 59 + 3) > 0.45) {
				continue;
			}

			const x = index * stackSpacing - stackDrift + hash(index * 61) * stackSpacing * 0.5;
			presentStack(context, x, base + 4, 34 + hash(index * 67) * 22, index, wraps, ribbons);
		}
	});
}

/** Text in world units (y up), centred on (x, y), this many metres tall. */
function worldText(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
	context.save();
	context.translate(x, y);
	// Fonts don't draw well at a fraction of a pixel: draw at 100 times the size, scaled down.
	context.scale(size / 100, -size / 100);
	context.font = '700 100px "Mountains of Christmas", Nunito, serif';
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(text, 0, 0);
	context.restore();
}

/**
 * At a journey's end (world units: metres, y up), with the village centre at `centre`: Santa's
 * workshop, its doors flung open while the crowd's out; a great Christmas tree to the left;
 * and the North Pole to the right, striped like a candy cane.
 */
export function drawVillage(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	centre: number,
	clock: number,
	doorsOpen: boolean,
) {
	context.save();

	// The great tree, its lights twinkling and a star on top.
	const treeX = centre - 9.5;
	context.fillStyle = "#4a2e1c";
	context.fillRect(treeX - 0.35, 0, 0.7, 1);

	for (let tier = 0; tier < 4; tier++) {
		const bottom = 0.8 + tier * 1.55;
		const half = 2.6 - tier * 0.55;
		context.fillStyle = tier % 2 === 0 ? "#1f5c39" : "#286e45";
		context.beginPath();
		context.moveTo(treeX - half, bottom);
		context.lineTo(treeX, bottom + 2.4);
		context.lineTo(treeX + half, bottom);
		context.closePath();
		context.fill();
	}

	for (let bulb = 0; bulb < 26; bulb++) {
		const tier = bulb % 4;
		const half = 2.6 - tier * 0.55;
		const along = hash(bulb * 3 + 1);
		const y = 0.95 + tier * 1.55 + along * 1.6;
		const x = treeX + (hash(bulb * 7) - 0.5) * 2 * half * (1 - along * 0.6);
		context.fillStyle = LIGHT_COLOURS[bulb % LIGHT_COLOURS.length];
		context.globalAlpha = 0.6 + 0.4 * Math.sin(clock * 4 + bulb * 1.3);
		context.beginPath();
		context.arc(x, y, 0.11, 0, Math.PI * 2);
		context.fill();
	}

	context.globalAlpha = 1;
	context.fillStyle = palette.goldDeep;
	context.beginPath();

	for (let point = 0; point < 10; point++) {
		const angle = Math.PI / 2 + (point * Math.PI) / 5;
		const r = point % 2 === 0 ? 0.55 : 0.22;
		context.lineTo(treeX + Math.cos(angle) * r, 7.6 + Math.sin(angle) * r);
	}

	context.closePath();
	context.fill();

	// Santa's workshop: red walls, a snowy roof, lit windows, a wreath and its sign.
	const left = centre - 6;
	const right = centre + 6;
	context.fillStyle = "#8f2a26";
	context.fillRect(left, 0, right - left, 4.2);
	context.fillStyle = "#6e1f1c";

	for (let plank = left + 0.6; plank < right; plank += 0.6) {
		context.fillRect(plank, 0, 0.04, 4.2);
	}

	// The chimney and its smoke.
	context.fillStyle = "#6e1f1c";
	context.fillRect(centre + 2.6, 5, 0.9, 2.2);
	context.fillStyle = "rgba(220, 225, 235, 0.45)";

	for (let puff = 0; puff < 4; puff++) {
		const rise = (clock * 0.35 + puff / 4) % 1;
		context.beginPath();
		context.arc(centre + 3.05 + Math.sin(rise * 5 + puff) * 0.4, 7.4 + rise * 3, 0.25 + rise * 0.45, 0, Math.PI * 2);
		context.fill();
	}

	context.fillStyle = "#3b2416";
	context.beginPath();
	context.moveTo(left - 0.6, 4.1);
	context.lineTo(centre, 7.2);
	context.lineTo(right + 0.6, 4.1);
	context.closePath();
	context.fill();
	context.fillStyle = palette.white;
	context.beginPath();
	context.moveTo(left - 0.7, 4);
	context.lineTo(centre, 7.3);
	context.lineTo(right + 0.7, 4);
	context.lineTo(right + 0.3, 4.35);
	context.lineTo(centre, 6.85);
	context.lineTo(left - 0.3, 4.35);
	context.closePath();
	context.fill();

	// Windows, glowing.
	for (const wx of [left + 1.2, left + 3, right - 4.2, right - 2.4]) {
		context.fillStyle = "#ffd27a";
		context.fillRect(wx, 1.6, 1.2, 1.2);
		context.fillStyle = "#6e1f1c";
		context.fillRect(wx + 0.56, 1.6, 0.08, 1.2);
		context.fillRect(wx, 2.16, 1.2, 0.08);
	}

	// The big double doors, open (warm light inside) while the crowd's out.
	context.fillStyle = doorsOpen ? "#ffcf7a" : "#4a2e1c";
	context.fillRect(centre - 1.2, 0, 2.4, 2.9);

	if (doorsOpen) {
		context.fillStyle = "#4a2e1c";
		context.fillRect(centre - 1.9, 0, 0.7, 2.9);
		context.fillRect(centre + 1.2, 0, 0.7, 2.9);
	} else {
		context.fillStyle = palette.goldDeep;
		context.fillRect(centre - 0.04, 0, 0.08, 2.9);
	}

	// The sign over the doors, and a wreath above it.
	context.fillStyle = "#f3e3c3";
	context.fillRect(centre - 2.6, 3.05, 5.2, 0.8);
	context.fillStyle = palette.red;
	worldText(context, "Santa's Workshop", centre, 3.47, 0.62);
	context.strokeStyle = "#1f5c39";
	context.lineWidth = 0.22;
	context.beginPath();
	context.arc(centre, 5.2, 0.5, 0, Math.PI * 2);
	context.stroke();
	context.fillStyle = palette.red;
	context.beginPath();
	context.arc(centre, 4.72, 0.13, 0, Math.PI * 2);
	context.fill();

	// The North Pole: candy-striped, with a gold ball on top and its sign.
	const poleX = centre + 8;
	context.fillStyle = palette.white;
	context.fillRect(poleX - 0.15, 0, 0.3, 4.2);
	context.fillStyle = palette.red;

	for (let band = 0; band < 4.2; band += 0.5) {
		context.beginPath();
		context.moveTo(poleX - 0.15, band);
		context.lineTo(poleX + 0.15, band + 0.15);
		context.lineTo(poleX + 0.15, band + 0.35);
		context.lineTo(poleX - 0.15, band + 0.2);
		context.closePath();
		context.fill();
	}

	context.fillStyle = palette.goldDeep;
	context.beginPath();
	context.arc(poleX, 4.45, 0.3, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = "#f3e3c3";
	context.fillRect(poleX + 0.15, 2.6, 2, 0.7);
	context.fillStyle = palette.red;
	worldText(context, "North Pole", poleX + 1.15, 2.96, 0.5);

	context.restore();
}

/** A post striped like a candy cane, `tall` metres, at x. */
function candyPost(context: CanvasRenderingContext2D, palette: IPalette, x: number, tall: number, wide: number) {
	context.fillStyle = palette.white;
	context.fillRect(x - wide / 2, 0, wide, tall);
	context.fillStyle = palette.red;

	for (let band = 0; band < tall; band += 0.5) {
		context.beginPath();
		context.moveTo(x - wide / 2, band);
		context.lineTo(x + wide / 2, band + wide / 2);
		context.lineTo(x + wide / 2, band + wide / 2 + 0.2);
		context.lineTo(x - wide / 2, band + 0.2);
		context.closePath();
		context.fill();
	}
}

/**
 * The runway up to a village (world units), from `start` to the village centre `end`: an arch
 * welcoming the elf at its start, lamp posts all along it, and a candy-striped kerb at the back
 * of the snow, streaming past. Only the part between `left` and `right` (the view) is drawn.
 */
export function drawRunway(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	start: number,
	end: number,
	left: number,
	right: number,
	clock: number,
) {
	context.save();

	// The kerb: red and white blocks, half a metre each.
	const from = Math.max(start, Math.floor(left * 2) / 2);
	const to = Math.min(end, right);

	for (let x = from; x < to; x += 0.5) {
		context.fillStyle = Math.round((x - start) * 2) % 2 === 0 ? palette.red : palette.white;
		context.fillRect(x, 0, 0.5, 0.14);
	}

	// Lamp posts every 15 metres, their lanterns glowing warm.
	for (
		let x = start + 10 + Math.max(0, Math.ceil((left - start - 12) / 15)) * 15;
		x < Math.min(end - 12, right + 2);
		x += 15
	) {
		context.fillStyle = "#2a2a2e";
		context.fillRect(x - 0.06, 0, 0.12, 2.5);
		const glow = context.createRadialGradient(x, 2.65, 0, x, 2.65, 1.1);
		const flicker = 0.85 + 0.15 * Math.sin(clock * 7 + x);
		glow.addColorStop(0, `rgba(255, 210, 122, ${(0.55 * flicker).toFixed(3)})`);
		glow.addColorStop(1, "rgba(255, 210, 122, 0)");
		context.fillStyle = glow;
		context.fillRect(x - 1.1, 1.55, 2.2, 2.2);
		context.fillStyle = "#ffd27a";
		context.fillRect(x - 0.16, 2.5, 0.32, 0.32);
		context.fillStyle = "#2a2a2e";
		context.fillRect(x - 0.2, 2.82, 0.4, 0.08);
	}

	// The welcome arch at the start.
	if (start + 4 > left && start - 4 < right) {
		candyPost(context, palette, start - 2.5, 4.4, 0.26);
		candyPost(context, palette, start + 2.5, 4.4, 0.26);
		context.strokeStyle = palette.green;
		context.lineWidth = 0.3;
		context.beginPath();
		context.moveTo(start - 2.5, 4.4);
		context.quadraticCurveTo(start, 5.6, start + 2.5, 4.4);
		context.stroke();
		context.fillStyle = "#f3e3c3";
		context.fillRect(start - 2.3, 3.2, 4.6, 0.85);
		context.fillStyle = palette.red;
		worldText(context, "Welcome to the North Pole", start, 3.63, 0.48);
	}

	context.restore();
}

/** The crowd are drawn this much smaller than the elf, so it stands out among them. */
const CROWD_SIZE = 0.85;

/** The crowd come out to celebrate, bouncing (and carrying the elf), at their size for this zoom. */
export function drawCrowd(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	state: IGameState,
	pixelsPerMetre: number,
) {
	if (!state.celebration) {
		return;
	}

	const enlarge = flyerEnlargement(pixelsPerMetre) * CROWD_SIZE;

	CROWD.forEach((skin, index) => {
		const place = crowdMember(state.celebration!, state.time, state.round, index);

		if (!place) {
			return;
		}

		context.save();
		context.translate(place.x, place.y + ELF_RADIUS * enlarge);
		// Squashed as it lands, and facing the elf.
		context.scale(enlarge * (1 + place.squash), enlarge * (1 - place.squash));

		if (place.x > state.elf.x) {
			context.scale(-1, 1);
		}

		drawCharacter(context, palette, skin);
		context.restore();
	});
}

/** Fireworks over the village: a streak going up, then a burst of sparks that falls and fades. */
export function drawFireworks(context: CanvasRenderingContext2D, state: IGameState) {
	if (!state.celebration) {
		return;
	}

	context.save();
	context.globalCompositeOperation = "lighter";
	context.lineCap = "round";

	for (const burst of burstsNow(state.celebration, state.time, hash)) {
		const colour = LIGHT_COLOURS[burst.id % LIGHT_COLOURS.length];
		const rising = 0.25;

		if (burst.age < rising) {
			// Going up.
			const p = burst.age / rising;
			context.strokeStyle = "#ffe7b0";
			context.lineWidth = 0.12;
			context.beginPath();
			context.moveTo(burst.x, burst.y * p - 0.8);
			context.lineTo(burst.x, burst.y * p);
			context.stroke();
			continue;
		}

		// The burst: a flash, then sparks flying out, slowing, drooping and fading.
		const p = (burst.age - rising) / (1 - rising);
		const spread = 3.2 * (1 - (1 - p) ** 3);
		const droop = 1.4 * p * p;

		if (p < 0.2) {
			const flash = context.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, 1.6);
			flash.addColorStop(0, `rgba(255, 245, 220, ${(0.7 * (1 - p / 0.2)).toFixed(3)})`);
			flash.addColorStop(1, "rgba(255, 245, 220, 0)");
			context.fillStyle = flash;
			context.fillRect(burst.x - 1.6, burst.y - 1.6, 3.2, 3.2);
		}

		context.globalAlpha = (1 - p) ** 0.7;
		context.strokeStyle = colour;
		context.fillStyle = "#fff6e0";
		context.lineWidth = 0.12;

		for (let spark = 0; spark < 28; spark++) {
			const angle = (spark / 28) * Math.PI * 2 + burst.id;
			const tipX = burst.x + Math.cos(angle) * spread;
			const tipY = burst.y + Math.sin(angle) * spread - droop;
			context.beginPath();
			context.moveTo(
				burst.x + Math.cos(angle) * spread * 0.55,
				burst.y + Math.sin(angle) * spread * 0.55 - droop * 0.6,
			);
			context.lineTo(tipX, tipY);
			context.stroke();
			// A bright head on each spark.
			context.beginPath();
			context.arc(tipX, tipY, 0.09, 0, Math.PI * 2);
			context.fill();
		}

		context.globalAlpha = 1;
	}

	context.restore();
}
