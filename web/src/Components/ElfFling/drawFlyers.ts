import type { IPalette } from "Components/ElfFling/draw";
import { ELF_RADIUS, type IGameState } from "Components/ElfFling/physics";
import type { ISkinId } from "Components/ElfFling/skins";

/**
 * Whoever's being flung, in the skin the player's wearing: the little elf, Santa, Mrs. Claus
 * or a little snowman. Each is drawn about its middle, ELF_RADIUS tall either side (feet at
 * -ELF_RADIUS), in world units (metres, y up), and tumbles as it flies.
 */

/** Zoomed far out, the flyer is drawn bigger than life so it stays easy to follow. */
export const FLYER_MIN_PIXELS = 26;

const COAL = "#1c120b";
const BOOT = "#3b2416";

const DRAWINGS: Record<ISkinId, (context: CanvasRenderingContext2D, palette: IPalette) => void> = {
	elf: drawElf,
	santa: drawSanta,
	mrsClaus: drawMrsClaus,
	snowman: drawLittleSnowman,
};

/**
 * One of the characters at life size, about its middle (feet at -ELF_RADIUS), facing ahead.
 * The batters reuse these, drawn big.
 */
export function drawCharacter(context: CanvasRenderingContext2D, palette: IPalette, id: ISkinId) {
	DRAWINGS[id](context, palette);
}

/** How much bigger than life the flyer is drawn at this zoom. */
export function flyerEnlargement(pixelsPerMetre: number): number {
	return Math.max(1, FLYER_MIN_PIXELS / (ELF_RADIUS * 2 * pixelsPerMetre));
}

export function drawFlyer(
	context: CanvasRenderingContext2D,
	palette: IPalette,
	state: IGameState,
	pixelsPerMetre: number,
	skin: ISkinId,
) {
	const { x, y, spin } = state.elf;
	const enlarge = flyerEnlargement(pixelsPerMetre);
	context.save();
	// Enlarged flyers still rest on the snow, not sunk into it.
	context.translate(x, y + ELF_RADIUS * (enlarge - 1));
	context.scale(enlarge, enlarge);
	context.rotate(-spin);
	drawCharacter(context, palette, skin);
	context.restore();
}

/** The little elf: green tunic, gold belt, red pointy hat with a pompom. */
function drawElf(context: CanvasRenderingContext2D, palette: IPalette) {
	// Boots and legs.
	context.fillStyle = palette.greenDark;
	context.fillRect(-0.13, -ELF_RADIUS, 0.09, 0.16);
	context.fillRect(0.04, -ELF_RADIUS, 0.09, 0.16);
	context.fillStyle = BOOT;
	context.fillRect(-0.16, -ELF_RADIUS, 0.13, 0.05);
	context.fillRect(0.03, -ELF_RADIUS, 0.13, 0.05);

	// Tunic with a gold belt.
	context.fillStyle = palette.green;
	ellipse(context, 0, -0.04, 0.17, 0.15);
	context.fillStyle = palette.goldDeep;
	context.fillRect(-0.16, -0.08, 0.32, 0.04);

	// Face, with pointy ears.
	context.fillStyle = palette.skin;
	ellipse(context, 0, 0.17, 0.12, 0.12);
	ellipse(context, -0.13, 0.19, 0.04, 0.025, 0.5);
	ellipse(context, 0.13, 0.19, 0.04, 0.025, -0.5);
	drawEyes(context, 0.19);

	// Hat, flopping over, with its pompom.
	drawFloppyHat(context, palette, palette.red);
}

/** Santa: red suit with white trim, black belt and gold buckle, white beard, red hat. */
function drawSanta(context: CanvasRenderingContext2D, palette: IPalette) {
	// Black boots under red trousers.
	context.fillStyle = palette.red;
	context.fillRect(-0.13, -ELF_RADIUS, 0.1, 0.16);
	context.fillRect(0.03, -ELF_RADIUS, 0.1, 0.16);
	context.fillStyle = COAL;
	context.fillRect(-0.16, -ELF_RADIUS, 0.14, 0.06);
	context.fillRect(0.02, -ELF_RADIUS, 0.14, 0.06);

	// A round red coat, white down the front and round the hem.
	context.fillStyle = palette.red;
	ellipse(context, 0, -0.03, 0.2, 0.17);
	context.fillStyle = palette.white;
	context.fillRect(-0.025, -0.18, 0.05, 0.28);
	context.fillRect(-0.18, -0.15, 0.36, 0.035);

	// Belt and buckle.
	context.fillStyle = COAL;
	context.fillRect(-0.19, -0.07, 0.38, 0.045);
	context.fillStyle = palette.goldDeep;
	context.fillRect(-0.035, -0.08, 0.07, 0.065);

	// Face, then the beard and moustache over its lower half.
	context.fillStyle = palette.skin;
	ellipse(context, 0, 0.18, 0.11, 0.11);
	drawEyes(context, 0.21);
	context.fillStyle = palette.white;
	ellipse(context, 0, 0.1, 0.13, 0.09);
	ellipse(context, -0.04, 0.155, 0.05, 0.022);
	ellipse(context, 0.04, 0.155, 0.05, 0.022);
	context.fillStyle = palette.redBright;
	ellipse(context, 0, 0.18, 0.022, 0.02);

	drawFloppyHat(context, palette, palette.red);
}

/** Mrs. Claus: red dress, white apron, white hair in a bun with holly, round glasses. */
function drawMrsClaus(context: CanvasRenderingContext2D, palette: IPalette) {
	// Shoes peeking out under a dress that flares toward the hem.
	context.fillStyle = COAL;
	context.fillRect(-0.13, -ELF_RADIUS, 0.1, 0.05);
	context.fillRect(0.03, -ELF_RADIUS, 0.1, 0.05);
	context.fillStyle = palette.red;
	context.beginPath();
	context.moveTo(-0.11, 0.07);
	context.lineTo(0.11, 0.07);
	context.lineTo(0.19, -0.26);
	context.lineTo(-0.19, -0.26);
	context.closePath();
	context.fill();
	context.fillStyle = palette.white;
	context.fillRect(-0.19, -0.27, 0.38, 0.035);

	// Apron.
	context.fillRect(-0.075, -0.2, 0.15, 0.22);
	context.fillStyle = palette.redBright;
	context.fillRect(-0.075, -0.2, 0.15, 0.025);

	// Hair behind the face, then the face, rosy cheeks, glasses.
	context.fillStyle = palette.white;
	ellipse(context, 0, 0.19, 0.135, 0.13);
	context.fillStyle = palette.skin;
	ellipse(context, 0, 0.165, 0.105, 0.105);
	context.fillStyle = palette.redBright;
	context.globalAlpha = 0.35;
	ellipse(context, -0.06, 0.13, 0.025, 0.018);
	ellipse(context, 0.06, 0.13, 0.025, 0.018);
	context.globalAlpha = 1;
	drawEyes(context, 0.18);
	context.strokeStyle = palette.goldDeep;
	context.lineWidth = 0.012;
	for (const side of [-1, 1]) {
		context.beginPath();
		context.arc(side * 0.04, 0.18, 0.03, 0, Math.PI * 2);
		context.stroke();
	}

	// The bun, with a sprig of holly.
	context.fillStyle = palette.white;
	ellipse(context, 0, 0.31, 0.07, 0.055);
	context.fillStyle = palette.green;
	ellipse(context, -0.05, 0.35, 0.035, 0.015, 0.5);
	ellipse(context, 0.05, 0.35, 0.035, 0.015, -0.5);
	context.fillStyle = palette.redBright;
	ellipse(context, 0, 0.35, 0.018, 0.018);
}

/** A little snowman: two snowballs, coal eyes and buttons, carrot nose, red scarf, top hat. */
function drawLittleSnowman(context: CanvasRenderingContext2D, palette: IPalette) {
	context.fillStyle = palette.white;
	ellipse(context, 0, -0.12, 0.18, 0.18);
	ellipse(context, 0, 0.14, 0.13, 0.13);

	context.fillStyle = COAL;
	ellipse(context, 0, -0.07, 0.018, 0.018);
	ellipse(context, 0, -0.15, 0.018, 0.018);
	drawEyes(context, 0.17);

	// Carrot nose, pointing ahead.
	context.fillStyle = palette.goldDeep;
	context.beginPath();
	context.moveTo(0.02, 0.14);
	context.lineTo(0.13, 0.12);
	context.lineTo(0.02, 0.11);
	context.closePath();
	context.fill();

	// Scarf, with an end hanging down.
	context.fillStyle = palette.red;
	context.fillRect(-0.12, 0.01, 0.24, 0.045);
	context.fillRect(0.05, -0.08, 0.045, 0.1);

	// Top hat with a green band.
	context.fillStyle = COAL;
	context.fillRect(-0.12, 0.25, 0.24, 0.025);
	context.fillRect(-0.08, 0.27, 0.16, 0.13);
	context.fillStyle = palette.green;
	context.fillRect(-0.08, 0.28, 0.16, 0.025);
}

function drawEyes(context: CanvasRenderingContext2D, y: number) {
	context.fillStyle = COAL;
	ellipse(context, -0.04, y, 0.016, 0.016);
	ellipse(context, 0.04, y, 0.016, 0.016);
}

/** The elf's (and Santa's) hat: a cone flopping over to the right, white brim and pompom. */
function drawFloppyHat(context: CanvasRenderingContext2D, palette: IPalette, color: string) {
	context.fillStyle = color;
	context.beginPath();
	context.moveTo(-0.13, 0.25);
	context.lineTo(0.13, 0.25);
	context.quadraticCurveTo(0.08, 0.5, 0.2, 0.52);
	context.closePath();
	context.fill();
	context.fillStyle = palette.white;
	context.fillRect(-0.14, 0.23, 0.28, 0.05);
	ellipse(context, 0.21, 0.52, 0.045, 0.045);
}

function ellipse(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	radiusX: number,
	radiusY: number,
	rotation = 0,
) {
	context.beginPath();
	context.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
	context.fill();
}
