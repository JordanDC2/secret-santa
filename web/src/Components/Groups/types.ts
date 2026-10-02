export type IGroup = {
	id: number;
	name: string;
	joinCode: string;
	isOwner: boolean;
	membersCount: number;
	isDrawn: boolean;
	members: { id: number; name: string }[];
	myAssignment: { recipientId: number; recipientName: string } | null;
};
