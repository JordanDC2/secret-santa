export type IWishlistClaim = {
	claimedByMe: boolean;
	/** Null when the claimer isn't in any of your groups. */
	claimedByName: string | null;
};

export type IWishlistItem = {
	id: number;
	name: string;
	url: string | null;
	price: number | null;
	notes: string | null;
	rating: number;
	/** Absent on your own items: the server never tells owners what's been claimed. */
	claim?: IWishlistClaim | null;
};

export type IWishlistItemDetails = Pick<IWishlistItem, "name" | "url" | "price" | "notes" | "rating">;

export type IWishlistPerson = { id: number; name: string };

export type IMemberWishlist = {
	user: IWishlistPerson;
	items: IWishlistItem[];
	/** Who the viewer is buying for as a Secret Santa; empty before any draw. */
	myRecipients: IWishlistPerson[];
};
