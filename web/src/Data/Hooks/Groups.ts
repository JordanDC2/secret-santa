import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IGroup } from "Data/Interfaces/IGroup";
import { apiClient } from "Data/Api/Client";

const GROUPS_QUERY_KEY = [ "groups" ];

function mapGroup(raw: Record<string, unknown>): IGroup {
	const myAssignment = raw.my_assignment as Record<string, unknown> | null;

	return {
		id: raw.id as number,
		name: raw.name as string,
		joinCode: raw.join_code as string,
		isOwner: raw.is_owner as boolean,
		membersCount: raw.members_count as number,
		isDrawn: raw.is_drawn as boolean,
		myAssignment: myAssignment ? { recipientName: myAssignment.recipient_name as string } : null
	};
}

export function useGroupsQuery() {
	return useQuery({
		queryKey: GROUPS_QUERY_KEY,
		queryFn: async () => {
			const groups = await apiClient.get<Record<string, unknown>[]>("/groups");

			return groups.map(mapGroup);
		}
	});
}

export function useCreateGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (details: { name: string }) => {
			const group = await apiClient.post<Record<string, unknown>>("/groups", details);

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
	});
}

export function useJoinGroupMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (details: { joinCode: string }) => {
			const group = await apiClient.post<Record<string, unknown>>("/groups/join", {
				join_code: details.joinCode
			});

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
	});
}

export function useDrawNamesMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (groupId: number) => {
			const group = await apiClient.post<Record<string, unknown>>(`/groups/${ groupId }/draw`);

			return mapGroup(group);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })
	});
}
