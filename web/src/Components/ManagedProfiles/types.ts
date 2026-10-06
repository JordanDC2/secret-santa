/** A kid or pet without a login, whose wishlist (and groups) the signed-in user looks after. */
export type IManagedProfile = {
	id: number;
	firstName: string;
	/** Optional: a pet named Biscuit doesn't need one. */
	lastName: string | null;
	/** First and last name together. */
	name: string;
	kind: IManagedKind;
	/** Everyone looking after them, including you. */
	managers: { id: number; name: string }[];
};

export type IManagedKind = "child" | "pet";

/** A kid or pet as the API sends it. */
export type IManagedProfileResponse = Omit<IManagedProfile, "firstName" | "lastName"> & {
	first_name: string;
	last_name: string | null;
};
