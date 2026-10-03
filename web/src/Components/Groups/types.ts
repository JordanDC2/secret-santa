export type IGroup = {
	id: number;
	name: string;
	description: string | null;
	joinCode: string;
	isOwner: boolean;
	membersCount: number;
	isDrawn: boolean;
	/** True once the group has started a new draw at least once (offers "avoid last draw's matches"). */
	hasPreviousDraw: boolean;
	/** Only present for the owner. */
	exclusionsCount?: number;
	members: { id: number; name: string }[];
	myAssignment: { recipientId: number; recipientName: string } | null;
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
