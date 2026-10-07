export type IAdminCounts = {
	accounts: number;
	kidsAndPets: number;
	groups: number;
	drawnGroups: number;
	wishlistItems: number;
	santaMessages: number;
};

export type ISignUpDay = { date: string; count: number };

export type IQueuedJobs = { queue: string; count: number; oldestDueAt: string | null };

export type IFailedJob = { uuid: string; job: string; queue: string; failedAt: string; error: string };

export type ILoggedError = { loggedAt: string; level: string; message: string };

export type ISystemHealth = {
	/** The commit the live web app was built from; null before the first build. */
	version: string | null;
	queuedJobs: IQueuedJobs[];
	failedJobs: IFailedJob[];
	lastBackup: { finishedAt: string; bytes: number } | null;
	recentErrors: ILoggedError[];
};

export type IAdminOverview = { counts: IAdminCounts; signUps: ISignUpDay[]; health: ISystemHealth };

export type IAdminAccount = {
	id: number;
	firstName: string;
	lastName: string | null;
	fullName: string;
	email: string;
	isAdmin: boolean;
	createdAt: string;
	/** Null once their sessions have expired. */
	lastSeenAt: string | null;
	ownedGroups: { id: number; name: string; membersCount: number; isDrawn: boolean }[];
	memberOf: { id: number; name: string }[];
	/** onlyCarer: nobody else looks after them, so they're deleted along with this account. */
	kidsAndPets: { id: number; name: string; kind: "child" | "pet"; onlyCarer: boolean }[];
};

export type IAdminGroup = {
	id: number;
	name: string;
	owner: { id: number; name: string; email: string };
	membersCount: number;
	isDrawn: boolean;
	drawNumber: number;
	exchangeDate: string | null;
	budget: string | null;
	createdAt: string;
};

export type IAdminLocations = {
	countries: { country: string; count: number }[];
	regions: { country: string; region: string; count: number }[];
	/** Accounts with no location yet (not on since the map was added, or only from home networks). */
	unknown: number;
	/** When the DB-IP file was built, for the credit; null until it's downloaded. */
	dataBuiltAt: string | null;
};
