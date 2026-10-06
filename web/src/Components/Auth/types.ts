export type IUser = {
	id: number;
	firstName: string;
	/** Null for older one-word accounts until they add one. */
	lastName: string | null;
	fullName: string;
	email: string;
};

/** The signed-in user as the API sends it. */
export type IUserResponse = {
	id: number;
	first_name: string;
	last_name: string | null;
	full_name: string;
	email: string;
};
