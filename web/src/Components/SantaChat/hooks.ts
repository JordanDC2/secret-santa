import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { GROUPS_QUERY_KEY } from "Components/Groups/hooks";
import type { ISantaChatSide, ISantaThread, ISantaThreadRef } from "Components/SantaChat/types";
import { apiClient } from "Data/Api/Client";

export const SANTA_CHAT_QUERY_KEY = ["santa-chat"];

const threadQueryKey = ({ groupId, side, asProfile }: ISantaThreadRef) => [
	...SANTA_CHAT_QUERY_KEY,
	groupId,
	side,
	asProfile?.id ?? "self",
];

/** The thread's address, e.g. /groups/5/santa-chat/my-person/read?as=34. */
const threadPath = ({ groupId, side, asProfile }: ISantaThreadRef, action = "") =>
	`/groups/${groupId}/santa-chat/${side}${action}${asProfile ? `?as=${asProfile.id}` : ""}`;

type IRawThread = {
	with: ISantaThread["with"];
	messages: { id: number; mine: boolean; body: string; sent_at: string }[];
};

export function useSantaChatQuery(thread: ISantaThreadRef, enabled: boolean) {
	return useQuery({
		queryKey: threadQueryKey(thread),
		queryFn: async (): Promise<ISantaThread> => {
			const raw = await apiClient.get<IRawThread>(threadPath(thread));

			return {
				with: raw.with,
				messages: raw.messages.map((message) => ({
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

export function useSendSantaMessageMutation(thread: ISantaThreadRef) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: string) => apiClient.post<void>(threadPath(thread), { body }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: threadQueryKey(thread) }),
	});
}

/** Clears the unread badge; also lets the other side's next message email the viewer again. */
export function useMarkSantaChatReadMutation(thread: ISantaThreadRef) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => apiClient.post<void>(threadPath(thread, "/read")),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY }),
	});
}

/**
 * The chat an email's "Open the Conversation" link asks for (`/?group=5&chat=my-santa`, plus
 * `&as=34` for a kid's or pet's), if it's this group's, plus a way to drop it from the address
 * once it's been opened.
 */
export function useLinkedSantaChat(groupId: number) {
	const [searchParams, setSearchParams] = useSearchParams();
	const side = searchParams.get("chat");
	const linked =
		Number(searchParams.get("group")) === groupId && (side === "my-person" || side === "my-santa") ? side : null;
	const asProfileId = Number(searchParams.get("as")) || null;

	function clear() {
		setSearchParams(
			(current) => {
				current.delete("group");
				current.delete("chat");
				current.delete("as");

				return current;
			},
			{ replace: true },
		);
	}

	return { linkedSide: linked as ISantaChatSide | null, linkedAsProfileId: asProfileId, clearLink: clear };
}
