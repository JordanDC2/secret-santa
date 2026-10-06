/** What an invite link's code points to, shown before joining. */
export type IInvitePreview = {
	groupName: string;
	ownerName: string;
	membersCount: number;
	/** Drawn groups don't take new members. */
	isDrawn: boolean;
	/** Only true when the visitor is signed in and already in the group. */
	alreadyMember: boolean;
};

/** Router state the invite page hands the dashboard: what to tell the person. */
export type IInviteNotice = { inviteNotice: string };
