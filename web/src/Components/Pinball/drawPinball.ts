import type { IPalette } from "Components/ElfFling/draw";
import {
	BALL_RADIUS,
	BUMPERS,
	FLIPPER_RADIUS,
	flipperPivot,
	flipperTip,
	GIFT_PEAK,
	GIFTS,
	SLINGSHOTS,
	TABLE,
	WALLS,
	type IFlipperSide,
	type IPinballState,
} from "Components/Pinball/pinball";

/**
 * The pinball table, in Elf Fling's colours: a deep evergreen playfield with gold rails, a
 * brick chimney the ball drops from, ornament bumpers that flash when hit, candy-striped
 * slingshots, gift targets that light up, and candy-cane flippers. The score and balls are
 * along the top. Table units: the caller scales the context to fit.
 */

const FLASH_SECONDS = 0.18;
const ORNAMENT_COLOURS = ["red", "green", "goldDeep"] as const;

export function drawPinball(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	drawField(context, palette);
	drawChimney(context, palette);
	drawGifts(context, palette, state.gifts);
	drawBumpers(context, palette, state);
	drawSlingshots(context, palette, state);
	drawWalls(context, palette);

	for (const side of ["left", "right"] as const) {
		drawFlipper(context, palette, side, state.flippers[side].angle);
	}

	if (state.ball) {
		drawBall(context, palette, state.ball.x, state.ball.y);
	}

	drawScore(context, palette, state);

	if (state.message && state.time < state.message.until) {
		drawMessage(context, palette, state.message.text);
	}
}

function drawField(context: CanvasRenderingContext2D, palette: IPalette) {
	const field = context.createLinearGradient(0, 0, 0, TABLE.height);
	field.addColorStop(0, palette.skyTop);
	field.addColorStop(1, palette.greenDark);
	context.fillStyle = field;
	context.fillRect(0, 0, TABLE.width, TABLE.height);

	// A faint Christmas tree painted on the playfield.
	context.fillStyle = palette.green;
	context.globalAlpha = 0.18;
	context.beginPath();
	context.moveTo(200, 360);
	context.lineTo(270, 500);
	context.lineTo(130, 500);
	context.closePath();
	context.moveTo(200, 400);
	context.lineTo(290, 560);
	context.lineTo(110, 560);
	context.closePath();
	context.fill();
	context.globalAlpha = 1;
}

function drawChimney(context: CanvasRenderingContext2D, palette: IPalette) {
	context.fillStyle = palette.bark;
	context.fillRect(178, 0, 44, 30);
	context.fillStyle = palette.white;
	context.fillRect(172, 26, 56, 8);
	// Brick lines.
	context.strokeStyle = palette.skyTop;
	context.lineWidth = 1;
	context.beginPath();

	for (const y of [8, 17]) {
		context.moveTo(178, y);
		context.lineTo(222, y);
	}

	context.stroke();
}

function drawWalls(context: CanvasRenderingContext2D, palette: IPalette) {
	context.strokeStyle = palette.goldDeep;
	context.lineWidth = 4;
	context.lineCap = "round";
	context.beginPath();

	for (const { a, b } of WALLS) {
		context.moveTo(a.x, a.y);
		context.lineTo(b.x, b.y);
	}

	context.stroke();
}

function drawSlingshots(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	SLINGSHOTS.forEach(({ a, b }, index) => {
		const lit = state.time - state.slingshotHitAt[index] < FLASH_SECONDS;
		// Candy stripes along the kicking face.
		const length = Math.hypot(b.x - a.x, b.y - a.y);
		const stripes = Math.floor(length / 10);

		for (let stripe = 0; stripe < stripes; stripe++) {
			const from = stripe / stripes;
			const to = (stripe + 1) / stripes;
			context.strokeStyle = stripe % 2 === 0 ? palette.redBright : palette.white;
			context.lineWidth = lit ? 9 : 7;
			context.lineCap = "butt";
			context.beginPath();
			context.moveTo(a.x + (b.x - a.x) * from, a.y + (b.y - a.y) * from);
			context.lineTo(a.x + (b.x - a.x) * to, a.y + (b.y - a.y) * to);
			context.stroke();
		}
	});
}

function drawBumpers(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	BUMPERS.forEach((bumper, index) => {
		const lit = state.time - state.bumperHitAt[index] < FLASH_SECONDS;

		if (lit) {
			context.fillStyle = palette.gold;
			context.globalAlpha = 0.45;
			context.beginPath();
			context.arc(bumper.x, bumper.y, bumper.radius + 10, 0, Math.PI * 2);
			context.fill();
			context.globalAlpha = 1;
		}

		// A glass bauble: coloured ball, gold cap, a white glint.
		context.fillStyle = lit ? palette.redBright : palette[ORNAMENT_COLOURS[index % ORNAMENT_COLOURS.length]];
		context.beginPath();
		context.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
		context.fill();
		context.fillStyle = palette.gold;
		context.fillRect(bumper.x - 6, bumper.y - bumper.radius - 6, 12, 8);
		context.fillStyle = palette.white;
		context.globalAlpha = 0.7;
		context.beginPath();
		context.ellipse(bumper.x - bumper.radius * 0.35, bumper.y - bumper.radius * 0.35, 5, 8, -0.6, 0, Math.PI * 2);
		context.fill();
		context.globalAlpha = 1;
	});
}

function drawGifts(context: CanvasRenderingContext2D, palette: IPalette, lit: boolean[]) {
	GIFTS.forEach((gift, index) => {
		const left = gift.x - gift.width / 2;
		const top = gift.y - gift.height / 2;
		context.globalAlpha = lit[index] ? 1 : 0.45;
		context.fillStyle = index % 2 === 0 ? palette.red : palette.green;
		context.beginPath();
		context.moveTo(left, top);
		context.lineTo(gift.x, top - GIFT_PEAK);
		context.lineTo(left + gift.width, top);
		context.lineTo(left + gift.width, top + gift.height);
		context.lineTo(left, top + gift.height);
		context.closePath();
		context.fill();
		// Ribbon.
		context.fillStyle = palette.gold;
		context.fillRect(gift.x - 2, top - GIFT_PEAK + 2, 4, gift.height + GIFT_PEAK - 2);
		context.globalAlpha = 1;
	});
}

/** A candy cane: white with red stripes, round at both ends. */
function drawFlipper(context: CanvasRenderingContext2D, palette: IPalette, side: IFlipperSide, angle: number) {
	const pivot = flipperPivot(side);
	const tip = flipperTip(side, angle);
	context.lineCap = "round";
	context.strokeStyle = palette.white;
	context.lineWidth = FLIPPER_RADIUS * 2;
	context.beginPath();
	context.moveTo(pivot.x, pivot.y);
	context.lineTo(tip.x, tip.y);
	context.stroke();
	context.strokeStyle = palette.redBright;
	context.lineWidth = 4;
	context.lineCap = "butt";

	for (let stripe = 1; stripe < 6; stripe += 2) {
		const from = stripe / 6;
		const to = (stripe + 0.6) / 6;
		context.beginPath();
		context.moveTo(pivot.x + (tip.x - pivot.x) * from, pivot.y + (tip.y - pivot.y) * from);
		context.lineTo(pivot.x + (tip.x - pivot.x) * to, pivot.y + (tip.y - pivot.y) * to);
		context.stroke();
	}
}

function drawBall(context: CanvasRenderingContext2D, palette: IPalette, x: number, y: number) {
	context.fillStyle = palette.white;
	context.beginPath();
	context.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = palette.snowShade;
	context.beginPath();
	context.arc(x + 2.5, y + 2.5, BALL_RADIUS * 0.55, 0, Math.PI * 2);
	context.fill();
}

function drawScore(context: CanvasRenderingContext2D, palette: IPalette, state: IPinballState) {
	context.textBaseline = "middle";
	context.font = "800 18px Nunito, sans-serif";
	context.fillStyle = palette.gold;
	context.textAlign = "left";
	context.fillText(state.score.toLocaleString(), 28, 72);
	// Balls to come, as little snowballs.
	const waiting = Math.max(0, state.ballsLeft - (state.ball ? 1 : 0));

	for (let ball = 0; ball < waiting; ball++) {
		drawBall(context, palette, 364 - ball * 22, 72);
	}

	context.textBaseline = "alphabetic";
}

function drawMessage(context: CanvasRenderingContext2D, palette: IPalette, text: string) {
	context.font = '700 30px "Mountains of Christmas", Nunito, serif';
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.lineWidth = 6;
	context.strokeStyle = "rgba(15, 32, 39, 0.8)";
	context.strokeText(text, TABLE.width / 2, 400);
	context.fillStyle = palette.gold;
	context.fillText(text, TABLE.width / 2, 400);
	context.textBaseline = "alphabetic";
}
