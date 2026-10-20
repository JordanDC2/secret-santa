/**
 * Silent Night's colours: a dark-to-light ramp for each material (dithered between by
 * pixelArt.ts), and the candlelit rim each takes on the edge facing the light. Materials with no
 * rim (glowing eyes, embers, the darkest parts) aren't rim-lit.
 */

import type { IRamps } from "Components/SilentNight/pixelArt";

export const RAMPS: IRamps = {
	skin: ["#2a1410", "#4a2618", "#6e3e26", "#93583a", "#b5774f", "#d39a6c"],
	green: ["#06120c", "#0d2418", "#163a24", "#225232", "#326c40", "#4a8a52"],
	red: ["#22050b", "#480b15", "#781323", "#ab1f31", "#d73648", "#f2666a"],
	white: ["#4a4650", "#7a7480", "#aaa2a8", "#d6ccc8", "#f2e8e0"],
	gold: ["#3a2408", "#6e460e", "#a87018", "#dca02c", "#ffd060"],
	cookie: ["#1a0c06", "#3a1d0c", "#5e3214", "#86501f", "#a8703a", "#c89458"],
	icing: ["#5a5054", "#8e8488", "#c4bab6", "#ece2da"],
	glow: ["#a01810", "#ff3b2a", "#ff8a5a"],
	yellowGlow: ["#a06010", "#ffc030", "#fff0a0"],
	dark: ["#050208", "#0e0810", "#1a1018"],
	coal: ["#050406", "#0d0b10", "#18151c", "#26222b", "#3a3440"],
	ember: ["#7a1a08", "#e0502a", "#ffb060"],
	porcelain: ["#3a3640", "#6e6874", "#a8a0a8", "#d8d0d4", "#f4eeee"],
	fur: ["#141218", "#26222a", "#3e3842", "#5a525c", "#7a7078"],
	blackFur: ["#040306", "#0a080c", "#141016", "#1e1820", "#2a222c"],
	cloth: ["#0c0f16", "#18202c", "#26324a", "#384a66", "#4e6688"],
	impSkin: ["#1a0406", "#360a0e", "#5a1418", "#82222a", "#a8343a"],
	steel: ["#1a1c22", "#34383f", "#5a5f68", "#8a909a", "#c4c8d0"],
	pink: ["#3a141c", "#6a2a36", "#a04a58", "#d07a86"],
	birch: ["#2a2620", "#5a544a", "#a8a090", "#e0dacc"],
	horn: ["#1a140c", "#3a2e1c", "#6a5634", "#9a8256", "#c8b080"],
	stone: ["#0a0a0e", "#16161c", "#24242c", "#36363f", "#4c4c56"],
	glass: ["#203040", "#406070", "#80a8c0", "#c8e4f0"],
	frost: ["#1a3a5a", "#3a7aa8", "#7ac0e8", "#c8ecff", "#ffffff"],
};

export const RIMS: IRamps = {
	skin: ["#b85a3a", "#f08c56", "#ffbe84"],
	green: ["#3a6a3a", "#7a9a4a", "#c0c070"],
	red: ["#b0283a", "#f05a5a", "#ff9a7a"],
	white: ["#d6ccc8", "#fff4e8", "#ffffff"],
	gold: ["#dca02c", "#ffd060", "#fff0a8"],
	cookie: ["#c86a30", "#f09a50", "#ffc88a"],
	icing: ["#ece2da", "#fff6ee", "#ffffff"],
	coal: ["#5a3020", "#8a4a2a", "#c87040"],
	porcelain: ["#e8dcd0", "#fff4e8", "#ffffff"],
	fur: ["#8a6050", "#c08a68", "#f0b88a"],
	blackFur: ["#5a2a20", "#8a4030", "#c06040"],
	cloth: ["#6a6a7a", "#a09090", "#e0c0a0"],
	impSkin: ["#c0402a", "#f07040", "#ffa060"],
	steel: ["#c4c8d0", "#f0f0f4", "#ffffff"],
	pink: ["#d07a86", "#f0a0a8", "#ffd0d4"],
	birch: ["#e0dacc", "#fff8e8", "#ffffff"],
	horn: ["#c8b080", "#f0d8a0", "#fff0c8"],
	stone: ["#6a5a50", "#9a8070", "#c8a890"],
	glass: ["#c8e4f0", "#ffffff", "#ffffff"],
	frost: ["#c8ecff", "#ffffff", "#ffffff"],
};

export const OUTLINE = "#050208";
