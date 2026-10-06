import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	IDrawCheck,
	IDrawPair,
	IGroup,
	IGroupExclusion,
	IGroupMember,
	IManagedAssignment,
} from "Components/Groups/types";
import { apiClient } from "Data/Api/Client";

export const GROUPS_QUERY_KEY = ["groups"];

function mapGroup(raw: Record<string, unknown>): IGroup {
	const myAssignment = raw.my_assignment as Record<string, unknown> | null;
	const mySanta = raw.my_santa as Record<string, unknown> | null;

	return {
		id: raw.id as number,
		name: raw.name as string,
		description: raw.description as string | null,
		exchangeDate: raw.exchange_date as string | null,
		budget: raw.budget as IGroup["budget"],
		joinCode: raw.join_code as string,
		isOwner: raw.is_owner as boolean,
		membersCount: raw.members_count as number,
		isDrawn: raw.is_drawn as boolean,
		hasPreviousDraw: raw.has_previous_draw as boolean,
		...(raw.exclusions_count !== undefined && { exclusionsCount: raw.exclusions_count as number }),
		members: (raw.members as Record<string, unknown>[]).map((member) => ({
			id: member.id as number,
			name: member.name as string,
			kind: (member.kind as IGroupMember["kind"]) ?? null,
			managedByMe: Boolean(member.managed_by_me),
			inDraw: member.in_draw !== false,
		})),
		managedAssignments: ((raw.managed_assignments as Record<string, unknown>[] | undefined) ?? []).map((managed) => {
			const recipient = managed.recipient as Record<string, unknown> | null;
			const santa = managed.santa as Record<string, unknown> | null;

			return {
				profile: managed.profile as IManagedAssignment["profile"],
				recipient: recipient
					? {
							id: recipient.id as number,
							name: recipient.name as string,
							unreadMessages: recipient.unread_messages as number,
						}
					: null,
				santa: santa ? { unreadMessages: santa.unread_messages as number } : null,
			};
		}),
		myAssignment: myAssignment
			? {
					recipientId: myAssignment.recipient_id as number,
					recipientName: myAssignment.recipient_name as string,
					unreadMessages: myAssignment.unread_messages as number,
				}
			: null,
		mySanta: mySanta ? { unreadMessages: mySanta.unread_messages as number } : null,
	};
}

export function useGroupsQuery() {
	return useQuery({
		queryKey: GROUPS_QUERY_KEY,
		queryFn: async () => {
			const groups = await apiClient.get<Record<string, unknown>[]>("/groups");

			return groups.map(mapGroup);
		},
	});
}

export function useCreateGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (details: { name: string }) => {
			const group = await apiClient.post<Record<string, unknown>>("/groups", details);

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

export function useJoinGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (details: { joinCode: string }) => {
			const group = await apiClient.post<Record<string, unknown>>("/groups/join", {
				join_code: details.joinCode,
			});

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

export function useDrawNamesMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ groupId, avoidPreviousMatches }: { groupId: number; avoidPreviousMatches: boolean }) => {
			const group = await apiClient.post<Record<string, unknown>>(`/groups/${groupId}/draw`, {
				avoid_previous_matches: avoidPreviousMatches,
			});

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

export function useDeleteGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (groupId: number) => apiClient.delete<void>(`/groups/${groupId}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

export function useLeaveGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (groupId: number) => apiClient.post<void>(`/groups/${groupId}/leave`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

/** Owner edits to a group's name and/or description. */
export function useUpdateGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			groupId,
			changes,
		}: {
			groupId: number;
			changes: {
				name?: string;
				description?: string | null;
				exchange_date?: string | null;
				budget_min?: number | null;
				budget_max?: number | null;
			};
		}) => {
			const group = await apiClient.patch<Record<string, unknown>>(`/groups/${groupId}`, changes);

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

const exclusionsQueryKey = (groupId: number) => ["groups", groupId, "exclusions"];

export function useExclusionsQuery(groupId: number, enabled: boolean) {
	return useQuery({
		queryKey: exclusionsQueryKey(groupId),
		queryFn: () => apiClient.get<IGroupExclusion[]>(`/groups/${groupId}/exclusions`),
		enabled,
	});
}

export function useAddExclusionMutation(groupId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (details: { giverId: number; receiverId: number; mutual: boolean }) =>
			apiClient.post<IGroupExclusion>(`/groups/${groupId}/exclusions`, {
				giver_id: details.giverId,
				receiver_id: details.receiverId,
				mutual: details.mutual,
			}),
		// ["groups"] is a prefix of the exclusions key, so this refreshes the list and the card's count.
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

export function useRemoveExclusionMutation(groupId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (exclusionId: number) => apiClient.delete<void>(`/groups/${groupId}/exclusions/${exclusionId}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

export function useDrawCheckQuery(groupId: number, enabled: boolean) {
	return useQuery({
		queryKey: ["groups", groupId, "draw", "check"],
		queryFn: () => apiClient.get<IDrawCheck>(`/groups/${groupId}/draw/check`),
		enabled,
	});
}

export function useDrawPairsQuery(groupId: number, enabled: boolean) {
	return useQuery({
		queryKey: ["groups", groupId, "draw", "pairs"],
		queryFn: () => apiClient.get<IDrawPair[]>(`/groups/${groupId}/draw/assignments`),
		enabled,
	});
}

export function useStartNewDrawMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (groupId: number) => {
			const group = await apiClient.post<Record<string, unknown>>(`/groups/${groupId}/new-draw`);

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

/** Puts a kid or pet you look after in this group, or takes them out (before the draw). */
export function useSetProfileInGroupMutation(groupId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ profileId, inGroup }: { profileId: number; inGroup: boolean }) =>
			inGroup
				? apiClient.post<void>(`/groups/${groupId}/profiles`, { profile_id: profileId })
				: apiClient.delete<void>(`/groups/${groupId}/profiles/${profileId}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

/** Owner-only, before the draw: puts a member in the draw or lets them sit it out. */
export function useSetInDrawMutation(groupId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ memberId, inDraw }: { memberId: number; inDraw: boolean }) =>
			apiClient.patch<Record<string, unknown>>(`/groups/${groupId}/members/${memberId}/in-draw`, { in_draw: inDraw }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}
