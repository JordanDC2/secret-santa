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
	members: IGroupMember[];
	/** Who each kid or pet you look after in this group drew, and their chats; empty before the draw. */
	managedAssignments: IManagedAssignment[];
	/** Who you're the Secret Santa for, and unread messages from them. */
	myAssignment: { recipientId: number; recipientName: string; unreadMessages: number } | null;
	/** Set once someone has drawn you; never says who. */
	mySanta: { unreadMessages: number } | null;
};

export type IBudget = { min: number | null; max: number };

export type IGroupMember = {
	id: number;
	name: string;
	/** Set for a kid or pet without a login. */
	kind: "child" | "pet" | null;
	/** A kid or pet you look after. */
	managedByMe: boolean;
};

/** For a parent: who their kid or pet drew, and unread messages in the kid's two Santa chats. */
export type IManagedAssignment = {
	profile: { id: number; name: string; kind: "child" | "pet" | null };
	recipient: { id: number; name: string; unreadMessages: number } | null;
	santa: { unreadMessages: number } | null;
};

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
