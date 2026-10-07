export type IUser = {
	id: number;
	firstName: string;
	/** Null for older one-word accounts until they add one. */
	lastName: string | null;
	fullName: string;
	email: string;
	/** The site's owner, who gets the admin page. */
	isAdmin: boolean;
	/** Whether they've clicked the link in the "confirm your email" email (a nudge; nothing waits on it). */
	emailVerified: boolean;
};

/** The signed-in user as the API sends it. */
export type IUserResponse = {
	id: number;
	first_name: string;
	last_name: string | null;
	full_name: string;
	email: string;
	is_admin: boolean;
	email_verified_at: string | null;
};
