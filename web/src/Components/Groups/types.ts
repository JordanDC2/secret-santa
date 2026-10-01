export type IGroup = {
	id: number;
	name: string;
	joinCode: string;
	isOwner: boolean;
	membersCount: number;
	isDrawn: boolean;
	myAssignment: { recipientName: string } | null;
};
