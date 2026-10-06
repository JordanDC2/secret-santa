/** Someone else's claim on an item you're viewing. */
export type IOtherClaim = {
	id: number;
	/** Null if they aren't in any of your groups. */
	name: string | null;
	quantity: number;
	purchased: boolean;
	claimedAt: string | null;
	/** When someone last nudged them about it; nudges are limited to one every 3 days. */
	nudgedAt: string | null;
};

/**
 * How much of an item is claimed. Only sent to people viewing someone else's list. Claims
 * never lapse; fellow shoppers can nudge an unbought claim's claimer instead.
 */
export type IWishlistClaim = {
	/** Total claimed by everyone, including you. */
	claimed: number;
	/** How many of those are yours. */
	mine: number;
	/** When you marked your claim bought; null if you haven't (or have no claim). */
	minePurchasedAt: string | null;
	others: IOtherClaim[];
};

export type IWishlistItem = {
	id: number;
	name: string;
	url: string | null;
	/** The shop's product image, found from the item's link. */
	imageUrl: string | null;
	price: number | null;
	/** How many the owner wants, e.g. 2 four-packs of socks. */
	quantity: number;
	notes: string | null;
	/** How much the owner wants it, 1-5. Null on suggestions: only the owner could say. */
	rating: number | null;
	/** Absent on your own items: the server never tells owners what's been claimed. */
	claim?: IWishlistClaim | null;
	/** When you marked it "Got it". Only on your own items; received items are hidden from others. */
	receivedAt?: string | null;
	/** Set on gift ideas someone added to another person's list (never sent to that person). */
	suggestion?: IWishlistSuggestion;
};

export type IWishlistSuggestion = {
	/** Who suggested it; null if they aren't in any of your groups or have deleted their account. */
	by: string | null;
	/** Whether you suggested it. */
	mine: boolean;
};

export type IWishlistItemDetails = Pick<
	IWishlistItem,
	"name" | "url" | "imageUrl" | "price" | "quantity" | "notes" | "rating"
>;

/** What the server could read from a product link; any field may be missing. */
export type ILinkPreview = { name: string | null; price: number | null; imageUrl: string | null };

export type IWishlistPerson = { id: number; name: string };

/** One of your current Secret Santa assignments: who you're buying for, and in which group. */
export type IMyRecipient = IWishlistPerson & {
	/** Set when it's a kid or pet you look after who drew them, rather than you. */
	santaName: string | null;
	group: {
		id: number;
		name: string;
		/** "YYYY-MM-DD", if the owner set one. */
		exchangeDate: string | null;
		/** Ready to show, e.g. "$50" or "$30–$50". */
		budget: string | null;
	};
};

export type IMemberWishlist = {
	/** `name` is their full name, for the title; `firstName` reads better in sentences. */
	user: IWishlistPerson & { firstName: string };
	items: IWishlistItem[];
	/** Gift ideas others added to this person's list; they never see these. */
	suggestions: IWishlistItem[];
	/** Who the viewer is buying for as a Secret Santa; empty before any draw. */
	myRecipients: IMyRecipient[];
};
