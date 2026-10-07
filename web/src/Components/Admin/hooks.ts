import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IAdminAccount, IAdminGroup, IAdminLocations, IAdminOverview } from "Components/Admin/types";
import { apiClient } from "Data/Api/Client";

/* The API's snake_case shapes; the hooks hand the page camelCase. */
type IOverviewResponse = {
	counts: {
		accounts: number;
		kids_and_pets: number;
		groups: number;
		drawn_groups: number;
		wishlist_items: number;
		santa_messages: number;
	};
	sign_ups: { date: string; count: number }[];
	health: {
		version: string | null;
		queued_jobs: { queue: string; count: number; oldest_due_at: string | null }[];
		failed_jobs: { uuid: string; job: string; queue: string; failed_at: string; error: string }[];
		last_backup: { finished_at: string; bytes: number; offsite_finished_at: string | null } | null;
		recent_errors: { logged_at: string; level: string; message: string }[];
	};
};

type IAccountResponse = {
	id: number;
	first_name: string;
	last_name: string | null;
	full_name: string;
	email: string;
	is_admin: boolean;
	email_verified: boolean;
	created_at: string;
	last_seen_at: string | null;
	owned_groups: { id: number; name: string; members_count: number; is_drawn: boolean }[];
	member_of: { id: number; name: string }[];
	kids_and_pets: { id: number; name: string; kind: "child" | "pet"; only_carer: boolean }[];
};

type IGroupResponse = {
	id: number;
	name: string;
	owner: { id: number; name: string; email: string };
	members_count: number;
	is_drawn: boolean;
	draw_number: number;
	exchange_date: string | null;
	budget: string | null;
	created_at: string;
};

const OVERVIEW_KEY = ["admin", "overview"];
const ACCOUNTS_KEY = ["admin", "accounts"];
const GROUPS_KEY = ["admin", "groups"];

function toOverview({ counts, sign_ups, health }: IOverviewResponse): IAdminOverview {
	return {
		counts: {
			accounts: counts.accounts,
			kidsAndPets: counts.kids_and_pets,
			groups: counts.groups,
			drawnGroups: counts.drawn_groups,
			wishlistItems: counts.wishlist_items,
			santaMessages: counts.santa_messages,
		},
		signUps: sign_ups,
		health: {
			version: health.version,
			queuedJobs: health.queued_jobs.map((jobs) => ({
				queue: jobs.queue,
				count: jobs.count,
				oldestDueAt: jobs.oldest_due_at,
			})),
			failedJobs: health.failed_jobs.map((job) => ({ ...job, failedAt: job.failed_at })),
			lastBackup: health.last_backup && {
				finishedAt: health.last_backup.finished_at,
				bytes: health.last_backup.bytes,
				offsiteFinishedAt: health.last_backup.offsite_finished_at,
			},
			recentErrors: health.recent_errors.map((error) => ({ ...error, loggedAt: error.logged_at })),
		},
	};
}

function toAccount(account: IAccountResponse): IAdminAccount {
	return {
		id: account.id,
		firstName: account.first_name,
		lastName: account.last_name,
		fullName: account.full_name,
		email: account.email,
		isAdmin: account.is_admin,
		emailVerified: account.email_verified,
		createdAt: account.created_at,
		lastSeenAt: account.last_seen_at,
		ownedGroups: account.owned_groups.map((group) => ({
			id: group.id,
			name: group.name,
			membersCount: group.members_count,
			isDrawn: group.is_drawn,
		})),
		memberOf: account.member_of,
		kidsAndPets: account.kids_and_pets.map((profile) => ({
			id: profile.id,
			name: profile.name,
			kind: profile.kind,
			onlyCarer: profile.only_carer,
		})),
	};
}

function toGroup(group: IGroupResponse): IAdminGroup {
	return {
		id: group.id,
		name: group.name,
		owner: group.owner,
		membersCount: group.members_count,
		isDrawn: group.is_drawn,
		drawNumber: group.draw_number,
		exchangeDate: group.exchange_date,
		budget: group.budget,
		createdAt: group.created_at,
	};
}

export function useAdminOverviewQuery() {
	return useQuery({
		queryKey: OVERVIEW_KEY,
		queryFn: async () => toOverview(await apiClient.get<IOverviewResponse>("/admin/overview")),
	});
}

export function useAdminAccountsQuery() {
	return useQuery({
		queryKey: ACCOUNTS_KEY,
		queryFn: async () => (await apiClient.get<IAccountResponse[]>("/admin/accounts")).map(toAccount),
	});
}

export function useAdminGroupsQuery() {
	return useQuery({
		queryKey: GROUPS_KEY,
		queryFn: async () => (await apiClient.get<IGroupResponse[]>("/admin/groups")).map(toGroup),
	});
}

export function useAdminLocationsQuery() {
	return useQuery({
		queryKey: ["admin", "locations"],
		queryFn: async () => {
			const data = await apiClient.get<Omit<IAdminLocations, "dataBuiltAt"> & { data_built_at: string | null }>(
				"/admin/locations",
			);

			return {
				countries: data.countries,
				regions: data.regions,
				unknown: data.unknown,
				dataBuiltAt: data.data_built_at,
			};
		},
	});
}

/** Anything that changes accounts or groups can change every admin list and count. */
function useRefreshAdmin() {
	const queryClient = useQueryClient();

	return () => queryClient.invalidateQueries({ queryKey: ["admin"] });
}

export function useUpdateAccountMutation() {
	const refresh = useRefreshAdmin();

	return useMutation({
		mutationFn: (details: { id: number; firstName: string; lastName: string; email: string }) =>
			apiClient.patch<void>(`/admin/accounts/${details.id}`, {
				first_name: details.firstName,
				last_name: details.lastName,
				email: details.email,
			}),
		onSuccess: refresh,
	});
}

export function useSendPasswordResetMutation() {
	return useMutation({
		mutationFn: (accountId: number) =>
			apiClient.post<{ message: string }>(`/admin/accounts/${accountId}/password-reset`),
	});
}

export function useDeleteAccountMutation() {
	const refresh = useRefreshAdmin();

	return useMutation({
		mutationFn: (accountId: number) => apiClient.delete<void>(`/admin/accounts/${accountId}`),
		onSuccess: refresh,
	});
}

export function useDeleteGroupMutation() {
	const refresh = useRefreshAdmin();

	return useMutation({
		mutationFn: (groupId: number) => apiClient.delete<void>(`/admin/groups/${groupId}`),
		onSuccess: refresh,
	});
}

export function useRetryFailedJobMutation() {
	const refresh = useRefreshAdmin();

	return useMutation({
		mutationFn: (uuid: string) => apiClient.post<void>(`/admin/failed-jobs/${uuid}/retry`),
		onSuccess: refresh,
	});
}

export function useDropFailedJobMutation() {
	const refresh = useRefreshAdmin();

	return useMutation({
		mutationFn: (uuid: string) => apiClient.delete<void>(`/admin/failed-jobs/${uuid}`),
		onSuccess: refresh,
	});
}

/** API field names → form field names, for apiFieldErrors. */
export const ADMIN_ACCOUNT_FIELD_NAMES = { first_name: "firstName", last_name: "lastName" };
