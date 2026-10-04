import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { GROUPS_QUERY_KEY } from "Components/Groups/hooks";
import type { ISantaChatSide, ISantaThread } from "Components/SantaChat/types";
import { apiClient } from "Data/Api/Client";

export const SANTA_CHAT_QUERY_KEY = ["santa-chat"];

const threadQueryKey = (groupId: number, side: ISantaChatSide) => [...SANTA_CHAT_QUERY_KEY, groupId, side];

const threadPath = (groupId: number, side: ISantaChatSide) => `/groups/${groupId}/santa-chat/${side}`;

type IRawThread = {
	with: ISantaThread["with"];
	messages: { id: number; mine: boolean; body: string; sent_at: string }[];
};

export function useSantaChatQuery(groupId: number, side: ISantaChatSide, enabled: boolean) {
	return useQuery({
		queryKey: threadQueryKey(groupId, side),
		queryFn: async (): Promise<ISantaThread> => {
			const thread = await apiClient.get<IRawThread>(threadPath(groupId, side));

			return {
				with: thread.with,
				messages: thread.messages.map((message) => ({
					id: message.id,
					mine: message.mine,
					body: message.body,
					sentAt: message.sent_at,
				})),
			};
		},
		enabled,
	});
}

export function useSendSantaMessageMutation(groupId: number, side: ISantaChatSide) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: string) => apiClient.post<void>(threadPath(groupId, side), { body }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: threadQueryKey(groupId, side) }),
	});
}

/** Clears the unread badge; also lets the other side's next message email the viewer again. */
export function useMarkSantaChatReadMutation(groupId: number, side: ISantaChatSide) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => apiClient.post<void>(`${threadPath(groupId, side)}/read`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

/**
 * The chat an email's "Open the Conversation" link asks for (`/?group=5&chat=my-santa`),
 * if it's this group's, plus a way to drop it from the address once it's been opened.
 */
export function useLinkedSantaChat(groupId: number) {
	const [searchParams, setSearchParams] = useSearchParams();
	const side = searchParams.get("chat");
	const linked =
		Number(searchParams.get("group")) === groupId && (side === "my-person" || side === "my-santa") ? side : null;

	function clear() {
		setSearchParams(
			(current) => {
				current.delete("group");
				current.delete("chat");

				return current;
			},
			{ replace: true },
		);
	}

	return { linkedSide: linked as ISantaChatSide | null, clearLink: clear };
}
