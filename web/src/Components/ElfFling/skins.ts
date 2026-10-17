/**
 * Cosmetic skins, bought in the shop's "Looks" section: who gets flung (the flyer) and who
 * swings the candy cane (the batter). They change only how things look (and what the result
 * line calls the flyer), never how far it goes.
 */

export type ISkinId = "elf" | "santa" | "mrsClaus" | "snowman";

export type ISkin = {
	id: ISkinId;
	name: string;
	/** How the result line refers to it, mid-sentence: "the elf", "Santa". */
	subject: string;
	description: string;
	/** 0 for the one everyone starts with. */
	price: number;
};

export const SKINS: ISkin[] = [
	{
		id: "elf",
		name: "Little elf",
		subject: "the elf",
		description: "The original: green tunic, pointy red hat.",
		price: 0,
	},
	{
		id: "santa",
		name: "Santa",
		subject: "Santa",
		description: "The big man himself: red suit, white beard, and a belly built for bouncing.",
		price: 150,
	},
	{
		id: "mrsClaus",
		name: "Mrs. Claus",
		subject: "Mrs. Claus",
		description: "In her red dress and white apron, glasses on, ready for take-off.",
		price: 150,
	},
	{
		id: "snowman",
		name: "Little snowman",
		subject: "the snowman",
		description: "A little snowman in a top hat and scarf. Try not to think about the big ones.",
		price: 200,
	},
];

export const DEFAULT_SKIN: ISkinId = "elf";

export function isSkinId(value: unknown): value is ISkinId {
	return SKINS.some((skin) => skin.id === value);
}

export function skinById(id: ISkinId): ISkin {
	return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}

/** "the elf" at the start of a sentence: "The elf". */
export function capitalised(subject: string): string {
	return subject.charAt(0).toUpperCase() + subject.slice(1);
}

/** Who swings: the reindeer, or one of the flyers' characters, drawn big. */
export type IBatterId = "reindeer" | ISkinId;

export type IBatter = {
	id: IBatterId;
	name: string;
	description: string;
	/** 0 for the one everyone starts with. */
	price: number;
};

export const BATTERS: IBatter[] = [
	{
		id: "reindeer",
		name: "Reindeer",
		description: "The original slugger, standing tall on its hind legs.",
		price: 0,
	},
	{
		id: "elf",
		name: "Big elf",
		description: "A great big elf, sleeves rolled up and ready to swing.",
		price: 120,
	},
	{
		id: "santa",
		name: "Santa",
		description: "Santa steps up to the plate in his white gloves.",
		price: 180,
	},
	{
		id: "mrsClaus",
		name: "Mrs. Claus",
		description: "Mrs. Claus takes a swing. She has done this before.",
		price: 180,
	},
	{
		id: "snowman",
		name: "Big snowman",
		description: "One of the big snowmen, on your side for once, swinging with its twig arms.",
		price: 220,
	},
];

export const DEFAULT_BATTER: IBatterId = "reindeer";

export function isBatterId(value: unknown): value is IBatterId {
	return BATTERS.some((batter) => batter.id === value);
}
