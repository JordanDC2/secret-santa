export type IGroup = {
	id: number;
	name: string;
	description: string | null;
	/** The gift exchange's day, "YYYY-MM-DD". */
	exchangeDate: string | null;
	/** Whole dollars: a single amount has only max; a range has both. */
	budget: IBudget | null;
	joinCode: string;
	isOwner: boolean;
	membersCount: number;
	isDrawn: boolean;
	/** True once the group has started a new draw at least once (offers "avoid last draw's matches"). */
	hasPreviousDraw: boolean;
	/** Only present for the owner. */
	exclusionsCount?: number;
	members: { id: number; name: string }[];
	/** Who you're the Secret Santa for, and unread messages from them. */
	myAssignment: { recipientId: number; recipientName: string; unreadMessages: number } | null;
	/** Set once someone has drawn you; never says who. */
	mySanta: { unreadMessages: number } | null;
};

export type IBudget = { min: number | null; max: number };

export type IGroupExclusion = {
	id: number;
	giver: { id: number; name: string };
	receiver: { id: number; name: string };
	/** Two-way: the receiver can't draw the giver either. */
	mutual: boolean;
};

export type IDrawCheck = {
	verified: boolean;
	checks: { label: string; passed: boolean; problems: string[] }[];
};

export type IDrawPair = {
	giver: { id: number; name: string };
	receiver: { id: number; name: string };
};
