/** How much of an item is claimed. Only sent to people viewing someone else's list. */
export type IWishlistClaim = {
	/** Total claimed by everyone, including you. */
	claimed: number;
	/** How many of those are yours. */
	mine: number;
	/** Everyone else's claims; a null name means they aren't in any of your groups. */
	others: { name: string | null; quantity: number }[];
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
	rating: number;
	/** Absent on your own items: the server never tells owners what's been claimed. */
	claim?: IWishlistClaim | null;
};

export type IWishlistItemDetails = Pick<
	IWishlistItem,
	"name" | "url" | "imageUrl" | "price" | "quantity" | "notes" | "rating"
>;

/** What the server could read from a product link; any field may be missing. */
export type ILinkPreview = { name: string | null; price: number | null; imageUrl: string | null };

export type IWishlistPerson = { id: number; name: string };

/** One of your current Secret Santa assignments: who you're buying for, and in which group. */
export type IMyRecipient = IWishlistPerson & { group: { id: number; name: string } };

export type IMemberWishlist = {
	user: IWishlistPerson;
	items: IWishlistItem[];
	/** Who the viewer is buying for as a Secret Santa; empty before any draw. */
	myRecipients: IMyRecipient[];
};
