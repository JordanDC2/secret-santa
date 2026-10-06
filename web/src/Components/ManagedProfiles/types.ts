/** A kid or pet without a login, whose wishlist (and groups) the signed-in user looks after. */
export type IManagedProfile = {
	id: number;
	name: string;
	kind: IManagedKind;
	/** Everyone looking after them, including you. */
	managers: { id: number; name: string }[];
};

export type IManagedKind = "child" | "pet";
