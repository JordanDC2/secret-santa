export type IGroup = {
	id: number;
	name: string;
	joinCode: string;
	isOwner: boolean;
	membersCount: number;
	isDrawn: boolean;
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
